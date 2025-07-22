# RxTracker

RxTracker is a lightweight Progressive Web App (PWA) for recording daily medications and vitals.
All data is stored in the browser using `localStorage`, so no backend or account
is required.  The application works offline and can be installed on mobile and
desktop devices.

## Features

- **Medication setup** – add medications or vitamins with dose information and
  one or more times per day.
- **Daily log** – shows today's schedule with checkboxes so doses can be marked
  as taken.
- **Vitals recording** – capture systolic and diastolic blood pressure and heart
  rate each day.
- **History tracker** – view past medication logs and simple line charts for
  blood pressure and heart rate.  Charts can be downloaded as PNG images.
- **Offline capable** – a service worker caches the HTML, CSS, JS and icons so
  the app continues to run without a network connection.
- **On-device storage** – choose a folder and the app will keep a JSON file with
  your medications and logs. This folder is the primary location. If it can't be
  used later, the app falls back to browser storage and alerts you.

## Running locally

No build step is required.  Clone the repository and open `index.html` in a
browser or serve the directory with a simple HTTP server, for example:

```bash
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000`.

On mobile devices you can choose "Add to Home Screen" to install the app like a
native application.

### Backup folder

In the **Setup Rx** tab you can press **Choose Backup Folder** to select a
directory on your device. After you pick it, the folder name appears next to the
button so you know it's set. A JSON file named `rxtracker-data.json` will be kept
in that folder with all medications and logs. This folder is treated as the main
storage location. If the folder becomes unavailable or the File System Access
API isn't supported, the app will fall back to browser storage and alert you.

## License

This project is released under the MIT License.  See [LICENSE](LICENSE) for
more information.
