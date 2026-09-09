# Country food and culture content

These bundled editorial profiles replace the former country-name food templates
and generic culture fallback. They cover all 250 ISO entries supported by
`country-info-pro`, including territories. The API selects content by canonical
country code, so common names, official names, and supported aliases share a
profile. Serving this content makes no AI or reference-site request.

Each inhabited entry includes actual named foods, short descriptions, regional
context, specific traditions, and contextual etiquette. “Popular Foods” is a
representative selection, not a statistical ranking or a claim of exclusive
origin. Recipes and practices vary between communities and households.

Six entries (AQ, BV, GS, HM, TF, UM) deliberately have no food cards. Their notes
explain why station provisions or uninhabited islands should not be assigned
invented national cuisines. Svalbard is treated separately because it has living
settlements; the Chagos profile describes Chagossian community heritage.

## September 9 food and holiday expansion

`food-expansion.mjs` adds original summaries to every inhabited entry (244
countries and territories), bringing each to at least five foods. The selection
mixes everyday dishes, regional cooking, desserts and, where appropriate, local
produce. The United States now includes burgers, pizza, fried chicken, mac and
cheese, Buffalo wings and pumpkin pie alongside its original regional dishes.
No statistical popularity ranking is claimed.

`food-expansion-sources.mjs` credits the specific references used for additions.
Most country additions use World Travel Guide's country-specific food guides;
others use national or local tourism boards, MIT MISTI, the University of
Edinburgh's Chagossian community archive, community reporting and Wikipedia.
Additional French and Nepali foods link directly to France.fr and Nepal Tourism
Board. These are short original factual summaries, not copied guide articles.
New cards display their source; earlier cards retain section-level references.

`festivals.mjs` supplies a separate, server-side calendar. It uses the bundled
`date-holidays` dataset (version locked in package-lock.json) plus named cultural
highlights and gap-filling entries in `festival-highlights.mjs`. Government and
tourism sources supplement the calendar, including US OPM, Canada's CRA,
Pakistan's Cabinet Division, Incredible India and Nepal Tourism Board. Countries
outside the calendar provider's coverage get named annual observances from
country-specific guides instead of invented dates or generic festival labels.
The API also overwrites the legacy `majorFestivals` field with these names so AI
or climate fallbacks cannot replace them.

The calendar rolls forward by UTC year. It shows starting dates, not complete
school, bank or vacation closures. Repeated named days are grouped, observed
days are identified, and calculated Islamic dates are withheld because local
moon-sighting announcements can differ. Annual highlights do not imply universal
participation or nationwide days off. The dated calendar is a reference, not a
complete government schedule; changes and regional holidays need local checks.
One inconsistent upstream Western Sahara rule is excluded, and that profile
explicitly identifies the community scope of the calendar.

Calendar code is ISC; its Wikipedia-derived dataset is CC BY-SA 3.0. The UI
credits the contributors and license and links the underlying country rules.
`public/credits/date-holidays.txt` preserves the full upstream license and
attributions and documents Voya's adaptations. The adapted calendar data remains
CC BY-SA 3.0. It is separate from the original food summaries and independently
cited cultural highlights. Do not describe this dataset as independently
verified government data or as free of Wikipedia-derived material.

## References and maintenance

`sources.mjs` contains links to country/cuisine background reading and specific
references, including UNESCO, tourism organizations, community authors, academic
material, and Wikipedia. Links and source material were reviewed during the
September 6, 2026 content update. The original references are section-level references, not a
claim-by-claim citation or proof that every custom applies to every resident.
The page exposes them as expandable food and culture references.

Regional modules contain original concise summaries. Do not scrape pages at
request time or reintroduce invented labels to fill a fixed card count. Prefer
fewer supported details over unverified material. When editing:

1. Check the specific country's identity, especially the two Congos, Dominica
   versus the Dominican Republic, Micronesia, and territories with mainland
   demonyms.
2. Check dish names, ingredients, regional associations, and cultural practices
   against relevant references. Prefer community, institutional, and primary
   sources. Add a link when introducing a more specific detail.
3. Avoid national stereotypes, unsupported religious percentages, and presenting
   etiquette as a universal rule. Identify communities and local variations.
4. Update the content version and run
   `node --test --test-isolation=none server/*.test.mjs test/*.test.mjs`.

The tests enforce full catalogue coverage, aliases, meaningful fields, source
metadata, and absence of the old placeholders. API tests also simulate external
service failure. Tests check software behavior and structure; factual editing
still requires source review.
