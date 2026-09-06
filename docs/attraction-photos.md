# Attraction photos

Every country uses the same `AttractionCard` → `/api/attraction-photo` → `/api/image` path. The card ignores the older, unverified `imageUrl` fields in the country data.

The resolver tries exact Wikipedia titles and redirects before searching. It accepts an alias or matching landmark title only after checking the Wikidata country (including administrative parents). It retrieves raster images and credits from Wikimedia Commons. Generic city search results, disambiguation pages, flags, maps, icons, and unrelated external hosts are rejected. Country-specific aliases handle names such as Sensō-ji and the Acropolis of Athens.

`server/attractionPhotoManifest.json` contains pre-resolved, country-checked metadata, not downloaded images. A cache miss uses the live resolver for any valid country. The server delivers image bytes through Voya and caches successful responses at the CDN. It follows redirects only between the approved Wikimedia image hosts, enforces the response size limit, rejects HTML/error bodies, and can recover from a broken thumbnail using the original of that same file. Photo revisions keep attribution consistent across server instances. Failed responses are not cached.

Cards load near the viewport, try another verified image of the same attraction if needed, refresh stale metadata, and offer a manual retry after bounded automatic retries. Successful photos include source, author, and license credits. External-source outages and landmarks without a usable licensed photograph cannot be guaranteed away; a missing photo must never be replaced with a random destination image.

When an original exceeds the 4 MB delivery limit, the server resizes that same photograph to fit within 1600 × 1600 pixels using [Sharp](https://sharp.pixelplumbing.com/api-resize/). Originals are capped at 32 MB and decoded images at 40 megapixels. The resized JPEG retains the same visible source and license credits and stays below Vercel's response limit.

Some previous attraction names described broad categories or a different country. `attractionCorrections.mjs` gives these cards identifiable places and correct locations. Country aliases use ISO country codes, including Türkiye, São Tomé and Príncipe, the two Congos, and Eswatini. The server no longer invents a national museum or nature reserve name when it has no attraction data.

Refresh the metadata catalogue manually with Node 24:

```sh
node scripts/refresh-attraction-photos.mjs
# Resolve only entries that are not already cached:
node scripts/refresh-attraction-photos.mjs --missing
```

This is an optional maintenance task, never a build dependency. It batches requests across the complete country catalogue and keeps known metadata when providers are unavailable. `photo-audit-pending.json` is a local report of entries that still need live lookup or editorial verification. Review ambiguous place names instead of weakening country checks to increase the match count.

Run regression checks with:

```sh
node --test --test-isolation=none server/*.test.mjs test/*.test.mjs
npm run build
```

Provider documentation: [PageImages](https://www.mediawiki.org/wiki/Extension:PageImages#API), [MediaWiki query and redirects](https://www.mediawiki.org/wiki/API:Query), [Wikidata country](https://www.wikidata.org/wiki/Property:P17), [Wikidata image](https://www.wikidata.org/wiki/Property:P18), [Commons image information and attribution](https://www.mediawiki.org/wiki/API:Imageinfo).
