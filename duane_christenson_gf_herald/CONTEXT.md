# Duane Christenson — Grand Forks Herald Articles

Source images live in `~/workspace/dc/duane/` and get published here.

## What This Is

A collection of scanned newspaper article images from the **Grand Forks Herald** in which **Duane Christenson** appears. The articles span from 1974 to 2024 and cover theater productions, teaching awards, and memorials.

## Published Location

- Repo: `GIT_CART0113` (`cart0113.github.io`)
- Folder: `duane_christenson_gf_herald/`
- Live URL: `https://cart0113.github.io/duane_christenson_gf_herald/`
- Served as a GitHub Pages static site

## File Naming Convention

All images follow this pattern:

```
{title}_{dayofweek}_{month}_{day}_{year}.jpg
```

- **title**: Underscore-separated words (displayed as Title Case on the page)
- **dayofweek**: 3-letter abbreviation (`sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`)
- **month**: 3-letter name (`jan`, `sep`) or 4-letter (`sept`), or numeric (`9`)
- **day**: 1 or 2 digits
- **year**: 4 digits

Examples:
- `prairie_memory_sat_nov_15_1975.jpg` → "Prairie Memory", November 15, 1975
- `anne_frank_sat_9_30_1995.jpg` → "Anne Frank", September 30, 1995
- `best_little_whorehouse_sat_sept_19_1987.jpg` → "Best Little Whorehouse", September 19, 1987
- `1984_sun_jan_01_1984.jpg` → "1984", January 1, 1984

## Key Files in the Published Folder

| File | Purpose |
|------|---------|
| `index.html` | Dynamic page — parses filenames via JS, sorts by date, card grid with lightbox viewer (zoom/pan/download/copy link) |
| `manifest.js` | Auto-generated list of `.jpg` filenames (loaded by index.html) |
| `notes.yaml` | Per-image annotations keyed by filename stem (without `.jpg`) |
| `update.sh` | Run after adding/removing images to regenerate `manifest.js` |

## Workflow for Adding New Images

1. Add the `.jpg` to `~/workspace/dc/duane/` using the naming convention above
2. Copy images to the published folder: `cp ~/workspace/dc/duane/*.jpg ~/workspace/GIT_CART0113/duane_christenson_gf_herald/`
3. Run `./update.sh` in the published folder to regenerate `manifest.js`
4. Optionally add a note in `notes.yaml`
5. `git add`, `git commit`, `git push` in `GIT_CART0113`

## notes.yaml Format

Simple key-value YAML. Key is the filename without `.jpg`:

```yaml
duane_hired_salary_sat_sep_14_1974: "(Salary listing near clown's feet)"
in_memory_linda_thu_aug_04_2005: "(In lower right corner)"
```

Notes appear on the card below the date and in the lightbox viewer header.

## Page Features

- Newspaper/archival aesthetic (warm parchment tones, Playfair Display serif headings)
- Responsive card grid sorted chronologically by date
- Lightbox viewer: scroll-to-zoom, drag-to-pan, download button, copy link button, left/right arrow navigation
- Touch support (pinch zoom, drag pan) for mobile
- Keyboard shortcuts: arrows to navigate, Esc to close, +/- to zoom, 0 to reset
- Browser back button closes lightbox (History API)
- Fully dynamic — reads `manifest.js` and `notes.yaml`, parses titles/dates from filenames
- No external JS dependencies (Google Fonts only for typography)

## Current Articles (27 images, sorted by date)

1. **Duane Hired Salary** — September 14, 1974
2. **Job Born** — December 24, 1974
3. **Prairie Memory** — November 15, 1975
4. **Prairie Memory 02** — November 16, 1975
5. **The Unfinished Revolution** — January 22, 1977
6. **Prairie Memory Grafton 03** — October 22, 1978
7. **Sound Of Music** — November 3, 1979
8. **Miracle Worker** — March 29, 1980
9. **Grease** — November 13, 1981
10. **Salut A Quebec** — September 23, 1983
11. **1984** — January 1, 1984
12. **Baby** — September 12, 1986
13. **Taming Of The Shrew** — January 9, 1987
14. **Taming Of The Shrew** — January 16, 1987
15. **Best Little Whorehouse** — September 19, 1987
16. **15 Year Employee** — May 25, 1989
17. **Nutcracker** — December 6, 1992
18. **Anne Frank** — September 30, 1995
19. **Not Grease Mystery Of Edwin Drood** — January 3, 1997
20. **Working** — November 6, 1998
21. **Grease** — March 12, 1999
22. **Night Off Broadway** — September 15, 2000
23. **Retire Most Happy Fella** — March 8, 2002
24. **Jesus Christ Superstar** — May 3, 2002
25. **In Memory Linda** — August 4, 2005
26. **She Loves Me** — December 12, 2005
27. **Teacher Hall Of Fame** — October 9, 2024

## Known Quirks

- Month can be `sep` or `sept` (both supported in parser)
- Month can be numeric (`9` for September) as in `anne_frank_sat_9_30_1995.jpg`
- Day can be single digit (`9`) or zero-padded (`09`)
- Title "02", "03" suffixes indicate multiple articles for the same production
- GitHub Pages may cache aggressively — use Cmd+Shift+R to see updates
