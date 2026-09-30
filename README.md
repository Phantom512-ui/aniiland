# Aniiland

Aniiland is an unofficial, community-made **Aniimo Homeland planner**. It helps plan sustained production, RV upgrades, Aniimo staffing, climate placement, order completion, automatic floor layouts, and Harvest Moon event production.

- **Live site:** https://aniiland.wintira.win/
- **GitHub repository:** https://github.com/Phantom512-ui/aniiland

## Highlights

- Whole-facility production planning with a HiGHS mixed-integer solver.
- Normal profit, RV upgrade, Aniimo EXP, and Aniipod planning goals.
- Harvest Moon mode with two reserved event Farmlands, Moonray Wheat tracking, event orders/tasks, recipe/furniture unlock tracking, and demand-capped event seeds costs.
- Farmland and Woodland use the verified watering behavior: two waterings per grow cycle, each removing 1/8 of the displayed growth time (75% effective grow time).
- Order Solver borrows only the facilities needed for an order and returns them to the permanent plan afterward.
- Automatic Floor Planner with climate coverage and optional in-game facility artwork.
- Custom facility/module setup for players whose Homeland does not match the simple RV defaults.

## Running locally

No build step is required for running the site locally. Just download the repo, start is as a server:

```bash
python -m http.server 8080
```

And connect to `http://localhost:8080` in your browser.

Opening `index.html` may work in some browsers, but may lack parts of functionality.

I was jumping between bundling the code or splitting it between functions so some of the files are outdated and won't be updated, i will clear the unused files... later when I'm less sleep deprived, for now if anyone wants to run it locally it will work but any modifications have to be to the correct used files.

## Data and methodology

Aniiland’s recipe, item, and facility data comes from in-game screenshots and confirmed game data. Directly verified in-game values take priority when sources disagree.

- **Game data** — recipe/item records, facility counts and unlocks, Aniimo traits, and official game localization.
- **In-game screenshots** — verification of recipes, prices, workloads, energy values, event mechanics, and facility/item artwork.
- **Aniimax** — a secondary reference used to cross-check Homeland data and production calculations and partly used as a base of the Aniiland solver: https://github.com/ae-bii/aniimax
- **HiGHS / highs-js** — the mixed-integer optimization engine bundled with Aniiland.

Aniiland combines these inputs with its own planning logic, interface, event tools, order handling, custom Aniimo roster, and floor planner.

The app’s **Data Sources & Assumptions** page documents verification status and remaining assumptions. The production model includes two waterings per Farmland or Woodland growth cycle, each reducing the full growth timer by 1/8.

Aniimax-derived climate coverage candidates remain credited separately, and the applicable license notice is included with the project.

## Licensing

Original Aniiland source code is available under the **MIT License**; see `LICENSE`. You are free to use, copy, fork, adapt, and redistribute the code under that license.

Aniimax is MIT-licensed and Aniiland retains its license notice in `ANIIMAX-LICENSE`. The bundled HiGHS files retain their own license in `vendor/highs/LICENSE`. See `THIRD_PARTY_NOTICES.md` for details.

**Important:** the MIT license for Aniiland's code does **not** grant rights to third-party trademarks, game artwork, screenshots, characters, icons, or other game-derived assets. Those remain the property of their respective owners.

## Disclaimer

Aniiland is an unofficial fan/community project. It is **not affiliated with, endorsed by, sponsored by, or officially connected to Aniimo or its developers/publishers**. Game names, trademarks, and game-derived artwork belong to their respective owners.



Issues, feedback and pull requests are welcome. When correcting gameplay data, I prefer in-game screenshots/evidence/clips. For Harvest Moon data, I would appreciate any information about Harvest moon points as that's the least explained/explored thing currently. 
