#!/usr/bin/env python3
"""Build the static radioactivity.directory site into _site/.

Reads station frontmatter from content/_stations/*.md, renders the Jinja2
templates in templates/, writes the /api JSON feed and copies assets/.

Environment variables (both optional, baked into the HTML at build time):
  SONG_ID_API_URL  full endpoint URL for the Song ID POST; empty disables the feature
  STATUS_API_URL   URL returning stream status JSON fetched by the browser; empty disables it
"""

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote, urlencode

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

ROOT = Path(__file__).resolve().parent
SITE_TITLE = "Radio Activity"
SITE_URL = "https://radioactivity.directory"
CONTACT = "mail@radioactivity.directory"
# Pico's registered meta headers: an empty value became "" and missing ones were appended
# in this order. The /api feed keeps that behavior for compatibility.
PICO_META_HEADERS = ("title", "description", "author", "date", "date_formatted", "time", "robots", "template", "hidden")
PICO_DEFAULT_META = PICO_META_HEADERS[2:]

FRONTMATTER_RE = re.compile(r"\A\s*---[ \t]*\n(.*?)\n---[ \t]*(?:\n|\Z)", re.DOTALL)


def read_frontmatter(path: Path) -> dict:
    """Return the YAML frontmatter of a frontmatter-only Markdown file as a dict."""
    match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
    if not match:
        raise ValueError(f"{path}: no frontmatter block")
    try:
        meta = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        raise ValueError(f"{path}: invalid YAML: {exc}") from exc
    if not isinstance(meta, dict):
        raise ValueError(f"{path}: frontmatter is not a mapping")
    return meta


def load_stations(content_dir: Path) -> list[tuple[str, dict]]:
    """Return (slug, meta) pairs sorted by slug, the order Pico used."""
    stations = [(path.stem, read_frontmatter(path)) for path in content_dir.glob("*.md")]
    return sorted(stations, key=lambda item: item[0])


def prepare(slug: str, meta: dict) -> dict:
    """Normalize one station's frontmatter into the view-model the templates use."""
    streams = []
    raw_streams = meta.get("stream_url")
    for entry in raw_streams if isinstance(raw_streams, list) else []:
        if not isinstance(entry, list) or len(entry) < 2:
            continue
        status = entry[2] if len(entry) > 2 and entry[2] else ""
        streams.append({"label": str(entry[0]), "url": str(entry[1]), "status": str(status)})

    title = str(meta.get("title") or slug)
    url = str(meta.get("url") or "")
    support = str(meta.get("support") or "")
    mailto = "mailto:" + CONTACT + "?" + urlencode(
        {"subject": f"{title} information", "body": f"Hi, here's some additional information on {title}: "},
        quote_via=quote,
    )
    return {
        "slug": slug,
        "title": title,
        "logo": str(meta["logo"]) if meta.get("logo") else None,
        "streams": streams,
        "online": bool(streams) and streams[0]["status"] == "online",
        "description": str(meta.get("description") or ""),
        "location": str(meta.get("location") or ""),
        "play_time": str(meta.get("play_time") or ""),
        "url": url,
        "url_display": re.sub(r"^https?://(www\.)?", "", url).rstrip("/") + "/",
        "support_href": support or mailto,
        "has_support": bool(support),
        "recommended": [str(rec) for rec in (meta.get("recommended") or [])],
        "hidden": bool(meta.get("hidden")),
    }


def api_payload(stations: list[tuple[str, dict]]) -> dict:
    """The /api feed: every station's frontmatter plus Pico's default meta keys."""
    payload = {}
    for slug, meta in stations:
        entry = dict(meta)
        for key in PICO_META_HEADERS:
            if key in entry and entry[key] is None:
                entry[key] = ""
        for key in PICO_DEFAULT_META:
            entry.setdefault(key, "")
        payload[slug] = entry
    return payload


def jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render(env: Environment, name: str, out_path: Path, **context) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(env.get_template(name).render(**context), encoding="utf-8")


def write_json(payload: dict, *paths: Path) -> None:
    text = json.dumps(payload, ensure_ascii=True, indent=2) + "\n"
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--content", type=Path, default=ROOT / "content" / "_stations")
    parser.add_argument("--out", type=Path, default=ROOT / "_site")
    args = parser.parse_args(argv)

    out = args.out.resolve()
    if out == ROOT or out in ROOT.parents:
        sys.exit(f"refusing to build into {out}: it contains the source tree")

    song_id_api_url = os.environ.get("SONG_ID_API_URL", "").strip()
    status_api_url = os.environ.get("STATUS_API_URL", "").strip()

    raw = load_stations(args.content)
    if not raw:
        sys.exit(f"no stations found in {args.content}")
    prepared = [prepare(slug, meta) for slug, meta in raw]
    listed = [s for s in prepared if not s["hidden"]]
    ch3 = [s for s in listed if s["online"]]

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    env = jinja_env()
    common = {
        "site_title": SITE_TITLE,
        "contact": CONTACT,
        "song_id_api_url": song_id_api_url,
        "status_api_url": status_api_url,
    }
    # root: relative prefix from the page to the site root; home: link target for the front page
    render(env, "index.html", out / "index.html", root="", home="./", page_title="radioactivity.directory",
           canonical=SITE_URL + "/", stations=listed, **common)
    render(env, "ch3.html", out / "ch3.html", root="", home="./", page_title="ch3",
           canonical=SITE_URL + "/ch3", stations=ch3, **common)
    render(env, "ch3.html", out / "ch3" / "index.html", root="../", home="../", page_title="ch3",
           canonical=SITE_URL + "/ch3", stations=ch3, **common)
    write_json(api_payload(raw), out / "api.html", out / "api" / "index.html")
    shutil.copytree(ROOT / "assets", out / "assets")

    print(f"built {out}")
    print(f"  stations: {len(listed)} listed, {len(ch3)} online, {len(raw)} in /api")
    print(f"  song id: {'on' if song_id_api_url else 'off'}, status api: {'on' if status_api_url else 'off'}")


if __name__ == "__main__":
    main()
