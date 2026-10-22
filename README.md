# DS4 Skeleton

A browser-based, real-time 3D visualizer and diagnostics panel for the **DualShock 4 (PS4) controller**.

The controller is rendered as a wireframe-style 3D model. Buttons, sticks, triggers, touchpad input, gyro movement, rumble, and sound feedback are visualized where the browser and controller support them.

## Features

- Interactive 3D controller model with orbit and zoom controls
- Live buttons, D-pad, analog sticks, and trigger visualization
- Gamepad API support for standard controller input
- Optional WebHID connection for gyro/accelerometer data and additional diagnostics
- Stick drift, stick range, trigger, button, and touchpad diagnostics
- Recenter and gyro recalibration controls
- X-ray mode, rumble feedback, sound feedback, and axis flipping
- Responsive overlay for desktop and smaller screens

## Run locally

No build step or package manager is required.

1. Download or clone this repository.
2. Open a terminal in the project directory.
3. Start a local static server, for example:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000` in a supported browser.
5. Connect or pair your controller and press a button.

> **Important:** WebHID requires a secure context. `localhost` is supported for local development; a deployed site should use HTTPS. For the gyro connection, use a desktop Chromium-based browser such as Chrome or Edge and click **Connect gyro (WebHID)**. The ordinary Gamepad API features may work in other browsers, depending on device and browser support.

## Deploy to GitHub Pages

This is a static website, so GitHub Pages can host it directly.

1. Create a GitHub repository.
2. Upload the contents of this project, keeping the folder structure intact.
3. In the repository, open **Settings → Pages**.
4. Under the build/deployment settings, choose **Deploy from a branch**.
5. Select your default branch (usually `main`) and the `/(root)` folder, then save.
6. Wait for GitHub Pages to publish the site. Open the published HTTPS URL.

The site loads Three.js from cdnjs, so the browser needs an internet connection. Keep `index.html`, `assets/css/style.css`, and `assets/js/app.js` at these paths unless you update the references.

## Controls

- **Drag:** orbit the camera
- **Mouse wheel / trackpad scroll:** zoom
- **Connect gyro (WebHID):** request access to a supported controller and enable gyro diagnostics
- **Recenter:** reset the current orientation reference
- **Recalibrate:** measure the gyro's resting bias again
- **X-ray:** toggle the model's solid surfaces
- **flip X / Y / Z:** invert gyro axes
- **rumble / sound:** enable or disable supported feedback

## Browser and hardware notes

- A DualShock 4 is recommended; behavior can vary with controller revisions, connection method, operating system, and browser.
- Standard button/stick visualization uses the browser Gamepad API.
- Gyro, touch-surface diagnostics, and controller rumble depend on WebHID support and the particular device/browser combination.
- Grant device permission when prompted. If a feature is unavailable, the page should still be usable for the supported Gamepad API inputs.
- Three.js is loaded from cdnjs, so first load requires internet access.

## Project structure

```text
ds4-skeleton/
├── index.html
├── README.md
├── .gitignore
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── LICENSE (optional; add one if you want to specify reuse terms)
```

## Credits and licensing

This project uses [Three.js](https://threejs.org/) via cdnjs. Review the relevant project and library terms before redistributing. No license is included by default; add one if you want to explicitly grant others permission to reuse or modify this project.
