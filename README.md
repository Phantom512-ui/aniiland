# Aniiland

Aniiland is an unofficial, community-made **Aniimo Homeland planner**. It helps plan sustained production, RV upgrades, Aniimo staffing, climate placement, temporary order overrides, floor layouts, and Harvest Moon event production.

- **Live site:** https://aniiland.wintira.win/
- **GitHub repository:** https://github.com/Phantom512-ui/aniiland

The hosted site is a static application and can be deployed directly to Vercel, GitHub Pages, or any ordinary static host.

## Highlights

- Whole-facility production planning with a HiGHS mixed-integer solver.
- Normal profit, RV upgrade, Aniimo EXP, and Aniipod planning goals.
- Harvest Moon mode with two reserved event Farmlands, Moonray Wheat tracking, event orders/tasks, recipe/furniture unlock tracking, and demand-capped event seeds.
- Event production is used while it remains within a 15% Home Coin loss versus the same-settings control plan with the two event Farmlands reserved.
- Farmland and Woodland use the verified watering behavior: two waterings per grow cycle, each removing 1/8 of the displayed growth time (75% effective grow time).
- Temporary Order Solver borrows only the facilities needed for an order and returns them to the permanent plan afterward.
- Floor Planner with climate coverage and optional in-game facility artwork.
- Custom facility/module setup for players whose Homeland does not match the simple RV defaults.

## Running locally

No build step is required for the packaged site. Serve the repository folder with any static HTTP server, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Opening `index.html` directly may work in some browsers, but serving it over HTTP is recommended.

## Vercel

Aniiland is a static site. Import the repository into Vercel and use the repository root as the site root. No framework or build command is required; the existing `index.html` is the entry point.

## Data and methodology

Aniiland uses multiple sources, with in-game screenshots taking priority where the project has directly verified a value:

- **Aniimax** — post-release Homeland production/facility data and solver methodology: https://github.com/ae-bii/aniimax
- **In-game screenshots supplied by the project owner** — event recipes, prices/workloads, Home Coin/Moonray Wheat artwork, facility/item artwork, energy values, and other direct game checks.
- **Mobalytics Homeland guide** — Aniimo portrait/recommendation reference used by the UI: https://mobalytics.gg/gamebase/guides/aniimo-homeland-ability-best-aniimos
- **HiGHS / highs-js** — mixed-integer optimization engine bundled under `vendor/highs/`.

The embedded Aniimax-derived data snapshot is identified inside the app's Data Sources & Assumptions page. Aniiland additionally uses the newer Aniimax watering model: Farmland and Woodland receive two waterings during a grow cycle, each reducing the full growth timer by 1/8.

## Licensing

Original Aniiland source code is available under the **MIT License**; see `LICENSE`. You are free to use, copy, fork, adapt, and redistribute the code under that license.

Aniimax is MIT-licensed and Aniiland retains its license notice in `ANIIMAX-LICENSE`. The bundled HiGHS files retain their own license in `vendor/highs/LICENSE`. See `THIRD_PARTY_NOTICES.md` for details.

**Important:** the MIT license for Aniiland's code does **not** grant rights to third-party trademarks, game artwork, screenshots, characters, icons, or other game-derived assets. Those remain the property of their respective owners.

## Disclaimer

Aniiland is an unofficial fan/community project. It is **not affiliated with, endorsed by, sponsored by, or officially connected to Aniimo or its developers/publishers**. Game names, trademarks, and game-derived artwork belong to their respective owners.

## Notes

Harvest Moon Event Mode is intended to trade a small amount of Home Coin efficiency for event progress when it remains within the configured 15% loss guardrail.

## Contributing

Issues and pull requests are welcome. When correcting gameplay data, prefer direct post-release in-game evidence. For Harvest Moon data, project-supplied screenshots are treated as the source of truth unless newer direct in-game evidence supersedes them.
