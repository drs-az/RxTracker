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

## Running locally

No build step is required.  Clone the repository and open `index.html` in a
browser or serve the directory with a simple HTTP server, for example:

```bash
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000`.

On mobile devices you can choose "Add to Home Screen" to install the app like a
native application.

## License

This project is released under the MIT License.  See [LICENSE](LICENSE) for
more information.
