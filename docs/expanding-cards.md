# Homepage expanding cards

The gallery sits between the country topics and the final search link in
`src/components/LandingFeatures.tsx`. Edit the seven places in
`src/components/ui/demo.tsx`; the reusable component and its styles are in
`src/components/ui/expanding-cards.tsx` and `expanding-cards.css`.

This project already includes React, TypeScript, Tailwind CSS 4, Lucide, and
the `cn` helper. No additional dependencies or providers are needed.
`components.json` maps shadcn's UI alias to `src/components/ui`, since `@/`
resolves to `src/`. Keeping reusable components here preserves the existing
import convention; a second root-level `components/ui` folder would not.
Global styles live in `src/index.css`.

Cards stay portrait at every screen size. Below 1024px the gallery scrolls
sideways; larger screens show all seven columns. Hover, tap, or focus opens
a card. Arrow keys, Home, and End move between cards; Tab reaches the active
country link. Animation respects the site's reduced-motion settings.

## Photo credits

Images are from Unsplash and are loaded lazily from its image CDN.

| Place | Photographer | Source |
| --- | --- | --- |
| Pyramids of Giza | Dmitrii Zhodzishskii | https://unsplash.com/photos/aQ7cuVC1VmQ |
| Great Wall of China | Andrew Scarborough | https://unsplash.com/photos/ykBrcEgXYQc |
| Machu Picchu | Curioso Photography | https://unsplash.com/photos/dZgMUPACJzQ |
| Eiffel Tower | Hannah Reding | https://unsplash.com/photos/Z1j90nEPWK4 |
| Burj Khalifa | RKTKN | https://unsplash.com/photos/J7clI8qJ0xA |
| Taj Mahal | AussieActive | https://unsplash.com/photos/Thr_TUYPtAk |
| Colosseum | Craig Zdanowicz | https://unsplash.com/photos/DjbrQ9fUfXI |
