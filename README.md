# Portfolio

A static portfolio website with small, playable project previews.
Open https://sook001.github.io/Portfolio_Sook/

## Run locally

Open this folder in VS Code and use Live Server, or run a local static server from this folder:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`. Serving over HTTP is recommended so the embedded project previews can load their local CSS, JavaScript, and images.

## Project layout

- `index.html`, `styles.css`, `portfolio.js` — portfolio and preview controls
- `Pic/` — profile and project-card images
- `demos/hoshimachi/` — copied Hoshimachi Suisei website and its CSS/JavaScript
- `demos/nanahoshi/` — copied Nanahoshi Nana website and its CSS/JavaScript/images
- `demos/deskbuddy/` — browser simulation of the Windows app's timer and reminder interactions
- `demos/daily-check/` — browser simulation with sample attendance records; it does not connect to Firebase
- `projects/deskbuddy/` — copied Python application source, tests, and setup instructions
- `projects/daily-check/` — original Firebase application source with its private configuration externalized

The DeskBuddy browser preview cannot inspect Windows processes, input activity, or system notifications. Run the Python source separately on Windows for the native application.

The bundled DeskBuddy source excludes per-machine `config.json`, logs, and statistics. Its `games.json` contains generic examples; replace `YOUR_PLAYER_NAME` and configure the games you actually want to monitor.

The Daily Check preview uses fictional sample students and in-memory data. The original Firebase app is included under `projects/daily-check/`, but its `firebase-config.js` is intentionally ignored by Git. Copy `firebase-config.example.js` to `firebase-config.js`, fill in your own Firebase configuration, and check your Firestore Security Rules before using the live app. Never commit your private config.

## GitHub Pages

The portfolio and bundled previews are static files, so they can be published from this folder without a build step. External services used by the original websites, such as Google Fonts or YouTube, require an internet connection.

