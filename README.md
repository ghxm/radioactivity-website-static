# radioactivity.directory

Static build of the radio directory. Stations are Markdown files with YAML
frontmatter, a Python script renders them with Jinja2 into `_site/`, and GitHub
Actions deploys that folder to GitHub Pages on every push to `main`.

## Adding a station

1. Create `content/_stations/<id>.md` (copy an existing one). The filename is the station id.
2. Put the logo in `assets/images/` and reference it as `logo:`.
3. Push to `main`. The workflow rebuilds and deploys.

Station frontmatter:

```yaml
---
title: "Station Name"
logo: "stationlogo.png"        # file in assets/images/, may be empty
stream_url:
- [station, https://.../stream, online]   # [label, url, status]; the first entry is the main stream
description: "One-line description."
support: https://...           # optional donate link; empty renders a mailto for suggestions
url: "https://station.site/"
location: City, CC
play_time: 24/7
recommended: ["badge"]         # optional badges
hidden: true                   # optional; removes the station from the pages, keeps it in /api
---
```

A station is "online" when its first stream's status is `online`. That drives the
LIVE filter, the random pick and the Ch3 page. Quote values that are not plain
YAML scalars, for example `play_time: "?"`.

## Building locally

```bash
uv sync
uv run build.py            # writes _site/
python3 -m http.server 8000 -d _site
```

Output: `index.html`, `ch3.html` and `ch3/index.html`, `api.html` and
`api/index.html` (the JSON feed, served at both `/api` and `/api/`), and `assets/`.

## Optional features (environment variables)

Both are read at build time and baked into the HTML. In GitHub Actions they come
from repository variables of the same name (Settings > Secrets and variables >
Actions > Variables). Unset means off.

- `SONG_ID_API_URL`: full endpoint URL that receives the Song ID POST
  (`{"url": <stream url>, "history": 5, "requester": "radioactivity.directory", "exclude_not_found": true}`).
  When set, the ID button and result box are rendered.
- `STATUS_API_URL`: URL the browser fetches on page load to refresh the on-air
  dots and the LIVE filter. The response must allow the site's origin via CORS
  and return:

  ```json
  {"checked_at": "2026-10-02T07:00:00Z",
   "streams": {"https://stream-relay-geo.ntslive.net/stream": "online",
               "https://radio80k.out.airtime.pro/radio80k_a": "offline"}}
  ```

  Keys are stream URLs. Streams missing from the response keep the status from
  their station file. The `/api` feed always carries the station-file statuses.

## Pages

- `/` directory with grid and list view (`?display=list`), LIVE filter
  (`?onair=true`) and random station (`?random=true`).
- `/ch3` multi-player: shows the cards named in the query, for example `/ch3?nts=true&wmfu=true`.
- `/api` JSON feed of all stations keyed by id, including hidden ones.

## Deployment

`.github/workflows/deploy.yml` builds with uv and publishes `_site/` through
`actions/deploy-pages`. The custom domain is configured in the repository's
Pages settings, not in the repo.
