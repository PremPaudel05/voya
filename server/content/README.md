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

## References and maintenance

`sources.mjs` contains links to country/cuisine background reading and specific
references, including UNESCO, tourism organizations, community authors, academic
material, and Wikipedia. Links and source material were reviewed during the
September 6, 2026 content update. These are section-level references, not a
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
