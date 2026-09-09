// Original short summaries checked against the country-specific references in
// food-expansion-sources.mjs. These are examples, not a popularity ranking.
import sources from './food-expansion-sources.mjs';

const rows = `
AD|Coca|Flatbread with savoury toppings, or a sweet version eaten as dessert.|Breads and baking
AD|Truites de carreroles|An omelette cooked with mushrooms.|Egg dishes
AE|Ghuzi|Roasted lamb accompanied by rice and nuts.|Shared meals
AE|Chebab|Emirati pancakes often eaten at breakfast.|Breakfast cooking
AE|Shawarma|Spit-roasted meat tucked into bread with sauces.|Popular across the region
AF|Qorma|A seasoned stew whose meat and vegetable ingredients vary by recipe.|Home cooking
AF|Kofta|Meatballs flavoured with spices.|Meat dishes
AG|Tamarind balls|Small sweets combining tart tamarind pulp with sugar.|Sweet snacks
AG|Antigua black pineapple|A locally celebrated variety of sweet pineapple.|Island-grown fruit
AI|Saltfish breakfast|Salted fish combined with onions and peppers.|Breakfast cooking
AI|Tamarind balls|Tamarind sweets balancing sour fruit and sugar.|Sweet snacks
AL|Qofte|Seasoned minced-meat patties or meatballs, often grilled.|Meat dishes
AL|Petulla|Pieces of fried dough served with sweet or savoury accompaniments.|Fried snacks
AM|Lavash|Thin flatbread traditionally baked against the wall of a clay oven.|Bread traditions
AM|Dolma|Vine leaves or vegetables enclosing rice, herbs and often minced meat.|Shared regional tradition
AO|Mufete de cacusso|A tilapia preparation seasoned with ingredients such as lemon and pepper.|Fish dishes
AO|Feijão de óleo de palma|Beans simmered with palm oil.|Beans and accompaniments
AR|Milanesa|A meat cutlet coated in breadcrumbs and fried.|Everyday meals
AR|Alfajores|Sandwich biscuits with a sweet filling, commonly dulce de leche.|Bakery sweets
AR|Provoleta|Provolone cheese grilled until soft, often with oregano.|Barbecue accompaniment
AT|Apfelstrudel|Thin pastry rolled around an apple filling, often with raisins.|Pastry traditions
AT|Sachertorte|Chocolate cake layered with apricot preserve.|Viennese baking
AU|Barramundi|A fish widely served grilled or fried, especially associated with northern Australia.|Fish and seafood
AU|Dagwood dog|A sausage on a stick coated in batter and deep-fried.|Fairground food
AW|Stobá|A slow-cooked stew, including goat and lamb versions.|Home cooking
AW|Cala|Small fritters made from beans.|Savoury snacks
AZ|Piti|A mutton-and-chickpea soup associated with Sheki.|Regional soups
AZ|Lule kebab|Seasoned minced lamb shaped around skewers and grilled.|Grilled meats
BA|Bosanski lonac|Meat and vegetables cooked slowly together in a pot.|Slow-cooked meals
BA|Baklava|Layers of thin pastry enclosing nuts and soaked with syrup.|Shared regional sweet
BB|Cutters|Filled bread-roll sandwiches, including fish and ham versions.|Everyday sandwiches
BB|Conkies|Cornmeal parcels with pumpkin, coconut and spices, steamed in leaves.|Steamed sweets
BD|Biryani|Seasoned rice cooked with meat; styles differ between cities and households.|Celebration meals
BD|Chotpoti|A spicy pulse-and-potato snack with toppings such as egg.|Street food
BD|Mishti doi|Sweetened fermented yoghurt, served as a dessert.|Bengali sweets
BE|Stoemp|Mashed potatoes combined with vegetables such as leeks or carrots.|Comfort food
BE|Waterzooi|A vegetable-rich stew with chicken or fish.|Regional stews
BF|Brochettes|Seasoned meat pieces grilled on skewers.|Street grills
BF|Sauce gombo|An okra-based sauce served alongside a starch or other meal components.|Sauces and accompaniments
BG|Kavarma|Meat and vegetables slowly cooked together, with regional variations.|Stews and casseroles
BG|Kebapche|Seasoned minced meat shaped into rolls and grilled.|Grilled meats
BI|Boko boko harees|Wheat cooked down with chicken and seasonings.|Wheat dishes
BI|Ndagala|Small Lake Tanganyika fish, commonly cooked and eaten whole.|Lake fishing traditions
BJ|Yovo doko|Small fried dough balls eaten as a snack.|Street sweets
BJ|Akkara|Fritters made from black-eyed peas.|Savoury snacks
BM|Hoppin’ John|Rice cooked with black-eyed peas.|Rice and legumes
BM|Sweet potato pudding|A sweet baked preparation using sweet potato.|Island desserts
BN|Daging masak lada hitam|Beef cooked with black pepper and other seasonings.|Peppery meat dishes
BN|Udang sambal serai bersantan|Prawns prepared with chilli, lemongrass and coconut milk.|Seafood cooking
BO|Cuñapé|Small baked cheese breads made with cassava starch.|Bakery snacks
BO|Charquekán|Dried meat served with accompaniments such as potatoes, cheese and llajwa.|Andean food traditions
BR|Brigadeiro|Condensed-milk and chocolate sweets commonly rolled in sprinkles.|Celebration sweets
BR|Acarajé|Black-eyed-pea fritters with savoury fillings, closely associated with Bahia.|Afro-Brazilian cooking
BR|Churrasco|Meats grilled over fire, with many regional styles.|Barbecue traditions
BS|Souse|A tangy meat broth seasoned with citrus and vegetables.|Soups and broths
BS|Broiled rock lobster|Spiny lobster cooked under high heat and served as a seafood dish.|Island seafood
BT|Shamu datshi|Mushrooms cooked in a cheese sauce.|Cheese dishes
BT|Hoentay|Buckwheat dumplings with fillings such as greens and cheese.|Haa Valley tradition
BW|Dikgobe|A mixture of beans and cracked maize cooked together.|Grains and legumes
BW|Vetkoek|Fried dough served plain or with sweet or savoury fillings.|Shared southern African snack
BY|Hribnoy sup|A mushroom soup that may include barley.|Soups and broths
BY|Kotleta pokrestyansky|Pork served with a mushroom sauce.|Home-style meals
BZ|Garnaches|Fried tortillas topped with beans, vegetables and cheese.|Mestizo food traditions
BZ|Conch fritters|Conch pieces mixed into batter and fried.|Coastal snacks
CA|Montreal smoked meat|Seasoned, cured beef sliced for sandwiches, often with mustard.|Montréal deli tradition
CA|BC roll|A sushi roll featuring barbecued salmon and cucumber.|British Columbia cooking
CD|Fufu|A dense cassava-flour preparation eaten with soups or sauces.|Everyday staple
CD|Maboké|Freshwater fish seasoned and cooked in leaf parcels.|River food traditions
CF|Makara|A cassava-based bread or fried preparation.|Cassava cooking
CF|Chikwangue|Cassava processed into a firm starch, commonly wrapped in leaves.|Shared central African staple
CG|Safou|A local fruit cooked until its flesh softens.|Seasonal produce
CG|Goat stew|Goat cooked in a sauce and served with a starch such as fufu.|Home-style meals
CH|Älplermagronen|An Alpine pasta dish combining ingredients such as potatoes, cream and cheese.|Mountain cooking
CH|Basler Läckerli|Spiced honey biscuits associated with Basel.|Regional baking
CI|N’voufou|Mashed plantain or yam mixed with palm oil and served with sauce.|Starchy accompaniments
CI|Maafe|Meat or vegetables cooked in a groundnut-based sauce.|Shared West African tradition
CK|Umukai feast|Foods cooked together in an earth oven for a shared meal.|Communal cooking tradition
CK|Matu rori|Sea cucumber served with ingredients such as citrus and cooked banana.|Island seafood
CL|Completo|A hot dog with generous toppings, often tomato, avocado and mayonnaise.|Street food
CL|Ceviche|Fish dressed with citrus, onion and herbs; recipes vary along the coast.|Shared coastal tradition
CM|Zom|Leafy greens cooked with meat and other seasonings.|Home cooking
CM|Fried plantains|Plantain pieces fried and served as a snack or accompaniment.|Everyday accompaniments
CN|Hot pot|Diners cook vegetables, meat or seafood in a shared pot of broth.|Communal dining
CN|Chow mein|Wheat noodles stir-fried with vegetables and optional meat or seafood.|Noodle dishes
CN|Dim sum|Small dishes including dumplings, buns and rolls, commonly eaten with tea.|Cantonese food traditions
CO|Tamales|Filled maize-dough parcels wrapped in leaves and steamed.|Regional family cooking
CO|Sancocho|A hearty soup with meat, roots and plantain, varying by region.|Soups and stews
CR|Arroz con pollo|Rice cooked with chicken, vegetables and seasonings.|Family meals
CR|Chifrijo|A layered snack combining rice, beans, fried pork and fresh salsa.|Bar snacks
CU|Picadillo|Minced meat simmered with vegetables and seasonings, often including olives.|Home cooking
CU|Ajiaco criollo|A stew combining assorted vegetables and meats.|Creole cooking
CV|Canja|A thick rice soup with chicken.|Soups and broths
CV|Queijo de cabra com doce de papaia|Goat cheese served with papaya preserve.|Cheese and sweets
CY|Koupepia|Vine leaves wrapped around a filling of rice, herbs and often meat.|Shared regional tradition
CY|Loukoumades|Small fried dough balls finished with syrup or honey.|Sweet snacks
CZ|Vepřo-knedlo-zelo|Roasted pork served with dumplings and cabbage or sauerkraut.|Traditional main dishes
CZ|Smažený sýr|Breaded cheese fried until crisp outside and soft inside.|Comfort food
DE|Butterbrezel|A soft pretzel split and filled with butter.|Bakery snacks
DE|Maultaschen|Large filled pasta parcels associated with Swabia.|Regional cooking
DE|Schwarzwälder Kirschtorte|A layered chocolate cake with cherries and cream.|Black Forest baking
DK|Stegt flæsk|Crisp pork slices with potatoes and parsley sauce.|Traditional main dishes
DK|Medisterpølse|A seasoned pork sausage served with accompaniments.|Sausage traditions
DM|Crab backs|Crab shells filled with seasoned crab meat.|Island seafood
DM|Lambi|Conch prepared in local seafood dishes.|Caribbean seafood
DO|Asopao de pollo|A thick chicken-and-rice soup.|Home cooking
DO|Chimichurri sandwich|A street-food sandwich with seasoned meat, cabbage and sauces.|Street food
DZ|Mechoui|Lamb roasted slowly, often for a shared celebration.|Celebration meals
DZ|Makroud|Semolina pastries with a filling such as dates and a sweet syrup coating.|Pastry traditions
EC|Hornado|Slow-roasted pork served with starchy accompaniments and sauce.|Highland market food
EC|Fanesca|A seasonal soup combining grains, pulses and salted fish.|Easter-season cooking
EE|Pirukad|Small pastries with meat, vegetables or other fillings.|Bakery snacks
EE|Leib|Dense rye bread commonly served alongside meals.|Bread traditions
EG|Molokhia|A leafy soup seasoned with garlic and coriander.|Home cooking
EG|Hawawshi|Bread filled with seasoned minced meat and baked.|Street food
ER|Kitcha fitfit|Torn flatbread mixed with ingredients such as butter and yoghurt.|Breakfast cooking
ER|Alicha birsen|Lentils cooked into a mildly seasoned stew.|Pulse dishes
ES|Jamón|Cured ham served in thin slices.|Cured-meat traditions
ES|Cocido madrileño|A chickpea-and-meat stew associated with Madrid.|Regional stews
ET|Tibs|Meat pieces sautéed with seasonings.|Meat dishes
ET|Kolo|Roasted grains, commonly barley, eaten as a snack.|Everyday snacks
FI|Leipäjuusto|A firm, browned cheese often eaten with cloudberry jam.|Cheese traditions
FI|Lihapullat|Meatballs commonly served with potatoes and berry accompaniments.|Home cooking
FJ|Tavioka|Cassava prepared by boiling, baking or cooking with coconut.|Root-crop cooking
FJ|Duruka|Tender seasonal shoots used as a vegetable.|Seasonal produce
FR|Cassoulet|White beans slowly cooked with meats such as sausage or duck.|Southwestern French cooking
FR|Bœuf bourguignon|Beef stewed with red wine and vegetables.|Burgundian cooking
GA|Brochettes|Meat skewers cooked over a fire.|Street grills
GA|Bouillon de poisson|A seasoned fish broth or stew.|Fish dishes
GB|Full breakfast|A cooked breakfast with components such as eggs, bacon, toast and tomatoes.|Breakfast traditions vary by region
GB|Scones|Small baked rounds commonly served with tea and sweet accompaniments.|Afternoon tea
GD|Roti|Bread wrapped around a spiced meat or vegetable filling.|Shared Caribbean tradition
GD|Lambi|Conch used in island seafood preparations.|Coastal cooking
GE|Pkhali|Finely chopped vegetables mixed with walnuts, herbs and garlic.|Vegetable dishes
GE|Churchkhela|Nuts threaded together and coated in thickened grape juice.|Traditional sweets
GF|Couac|Processed, toasted cassava granules served as an accompaniment.|Cassava traditions
GF|Doku|A sweet corn preparation flavoured with ingredients such as cinnamon.|Home-style desserts
GG|Guernsey ice cream|Ice cream made with rich local dairy milk.|Island dairy tradition
GG|Spider crab|Locally caught crab, often served simply with bread and butter.|Island seafood
GH|Kenkey|Fermented maize dough cooked in leaf parcels and served with accompaniments.|Everyday staple
GH|Red red|Beans cooked in palm oil, commonly served with fried plantain.|Home cooking
GI|Panissa|A chickpea-flour preparation served as a savoury snack.|Shared Mediterranean tradition
GI|Spinach tortilla|An egg-based dish incorporating spinach.|Home cooking
GL|Reindeer meat|Caribou prepared in dishes that vary with the household and season.|Arctic food traditions
GL|Greenland shrimp|Cold-water shrimp served in varied seafood preparations.|Coastal food traditions
GM|Superkanja|An okra stew with ingredients such as fish or meat.|Soups and stews
GM|Afra|Seasoned meat grilled over charcoal.|Street grills
GN|Fried plantains|Plantain pieces fried and served with meals.|Everyday accompaniments
GN|Cassava-leaf sauce|Chopped cassava leaves cooked into a sauce, sometimes with fish or meat.|Leafy sauces
GP|Matété de crabe|Crab cooked in a seasoned sauce.|Island crab dishes
GP|Bébélé|A substantial soup with offal and other ingredients.|Guadeloupe cooking
GQ|Chicken in groundnut sauce|Chicken cooked in a peanut-based sauce and served with rice or plantain.|Home cooking
GQ|Grilled fish with pumpkin seeds|Fish seasoned with crushed seeds and cooked in a leaf parcel.|Fish and seed sauces
GR|Gemista|Vegetables such as tomatoes or peppers baked around a rice filling.|Vegetable dishes
GR|Horiatiki|A salad of tomatoes, cucumber, olives and feta, dressed with olive oil.|Everyday salads
GT|Tamales|Maize dough parcels with varied fillings, wrapped in leaves and cooked.|Family cooking
GT|Fiambre|A composed dish of vegetables and cured meats associated with All Saints' Day.|Seasonal celebrations
GU|Apigigi|Coconut-and-cassava parcels grilled in banana leaves.|CHamoru sweets
GU|Guyuria|Small fried biscuits with a sugar coating.|CHamoru baking traditions
GW|Ravias|Small biscuits flavoured with cinnamon.|Portuguese-influenced baking
GW|Fried cassava|Cassava pieces fried until crisp.|Savoury snacks
GY|Split-pea soup|A thick pulse soup that may contain meat and root vegetables.|Home cooking
GY|Guyanese fried rice|Seasoned rice stir-fried with vegetables and optional meat.|Chinese-Guyanese food traditions
HK|Roast goose|Roasted goose served in sliced portions, often with sauce.|Cantonese roast meats
HK|Salt-baked chicken|Chicken cooked with salt using methods associated with Hakka cuisine.|Hakka food traditions
HN|Pastelitos|Small filled pastry parcels, commonly fried.|Street snacks
HN|Pescado de Yojoa|Whole fish fried with seasonings near Lake Yojoa.|Lakeside cooking
HR|Pršut and Paški sir|Air-dried ham served with sheep's-milk cheese from Pag.|Regional cured foods
HR|Rožata|A baked custard dessert with caramel.|Dubrovnik baking
HT|Banan peze|Green plantain flattened and fried.|Everyday accompaniments
HT|Akra|Fritters made with grated malanga and seasonings.|Street snacks
HU|Halászlé|A paprika-seasoned soup made with freshwater fish.|River food traditions
HU|Paprikás csirke|Chicken cooked in a paprika-flavoured sauce.|Home cooking
ID|Sate|Skewered meat cooked over coals, with sauces that vary by region.|Street grills
ID|Bakso|Meatballs, commonly served with noodles and broth.|Everyday meals
IE|Colcannon|Mashed potato mixed with cabbage or other greens.|Home cooking
IE|Dublin coddle|Sausages, bacon, onions and potatoes cooked together.|Dublin food traditions
IL|Bourekas|Small pastries enclosing cheese, potato, spinach or other fillings.|Shared regional baking
IL|Cholent|A slow-cooked stew traditionally prepared for Shabbat.|Ashkenazi Jewish tradition
IM|Manx kippers|Herring preserved by smoking.|Island fishing traditions
IM|Chips, cheese and gravy|Fried potatoes topped with cheese and gravy.|Takeaway comfort food
IN|Butter chicken|Chicken cooked in a tomato-based sauce enriched with dairy.|Delhi-associated cooking
IN|Thali|A platter bringing together several small dishes; contents vary greatly by region.|A way of serving a meal
IQ|Quzi|Lamb served with rice and accompaniments such as nuts and raisins.|Shared meals
IQ|Bamieh|Okra simmered in a tomato-based stew, sometimes with lamb.|Home cooking
IR|Adas polo|Rice cooked with lentils and optional meat or other accompaniments.|Rice dishes
IR|Abgoosht|A slow-cooked meat, chickpea and vegetable stew.|Home cooking
IS|Pylsur|A hot dog served with a choice of sauces and onions.|Everyday street food
IS|Harðfiskur|Dried fish eaten as a snack, commonly with butter.|Fish-preserving traditions
IT|Lasagne alla bolognese|Layered pasta baked with meat ragù and béchamel.|Emilia-Romagna cooking
IT|Arancini|Filled rice snacks coated in crumbs and fried.|Sicilian street food
IT|Gelato|A frozen dessert made in many milk-based and fruit flavours.|Everyday sweets
JE|Fiottes|Small dough balls cooked in milk.|Island home cooking
JE|La soupe d’anguilles|A soup made with conger eel.|Island fishing traditions
JM|Jamaican patties|Baked pastry turnovers enclosing spiced meat or other fillings.|Street food
JM|Curry goat|Goat slowly cooked with curry spices.|Celebration meals
JO|Falafel|Seasoned chickpea fritters, often served in bread with accompaniments.|Shared regional street food
JO|Knafeh|A syrup-sweetened pastry dessert, with cheese-filled versions widely enjoyed.|Shared Levantine tradition
JP|Soba|Buckwheat noodles served chilled with dipping sauce or in hot broth.|Noodle traditions
JP|Yakitori|Small chicken pieces threaded onto skewers and grilled.|Japanese grill cooking
JP|Sashimi|Thinly sliced fish or seafood served without sushi rice.|Seafood dishes
KE|Sukuma wiki|Leafy greens sautéed with ingredients such as onion and tomato.|Everyday accompaniments
KE|Pilau|Rice cooked with spices and often meat.|Coastal and celebration cooking
KG|Manty|Large steamed dumplings commonly filled with meat and onion.|Shared Central Asian tradition
KG|Plov|Rice cooked with meat, carrots and seasonings.|Shared regional rice dish
KI|Palu sami|Leaf parcels enclosing coconut cream, onion and seasonings.|Pacific cooking traditions
KI|Pandanus with coconut cream|Cooked pandanus fruit served with coconut cream.|Southern island food traditions
KM|Pilaou|Rice cooked with meat and aromatic spices.|Rice dishes
KM|M’tsolola|Fish and green banana or plantain cooked in coconut milk.|Island home cooking
KN|Pelau|Rice cooked with pigeon peas and meat.|One-pot meals
KN|Roti|Bread enclosing a curried meat or vegetable filling.|Shared Caribbean tradition
KP|Bindaetteok|Savoury pancakes made from ground mung beans.|Shared Korean tradition
KP|Tteok|Rice cakes made in different shapes and fillings.|Shared Korean food traditions
KR|Bulgogi|Thin meat slices marinated and grilled or pan-cooked.|Popular meat dishes
KR|Galbi|Marinated ribs cooked over a grill.|Korean barbecue
KW|Marag|A seasoned stew combining meat or fish with other ingredients.|Home cooking
KW|Falafel|Fried chickpea patties served with bread and accompaniments.|Shared regional street food
KY|Conch fritters|Conch mixed into seasoned batter and fried.|Island seafood
KY|Fried plantains|Plantain slices fried and served alongside meals.|Everyday accompaniments
KZ|Samsa|Baked pastry parcels with fillings such as meat and onion.|Shared Central Asian baking
KZ|Kurt|Small portions of salted, dried dairy curds.|Dairy-preserving traditions
LA|Khao niao|Sticky rice steamed and eaten alongside other dishes.|Everyday Lao staple
LA|Mok pa|Fish seasoned with herbs and cooked in banana-leaf parcels.|Fish dishes
LB|Mutabbal|A dip made with roasted aubergine and seasonings.|Mezze dishes
LB|Baklava|Thin pastry layers with nuts and a sweet syrup.|Shared regional sweet
LC|Callaloo soup|A soup made with dasheen or similar edible greens.|Caribbean leafy dishes
LC|Float bakes|Fried dough served with savoury accompaniments or cocoa tea.|Breakfast cooking
LI|Rösti|Grated potatoes fried into a crisp cake.|Shared Alpine tradition
LI|Müesli|Oats mixed with fruit, nuts and a liquid such as milk or juice.|Breakfast dishes
LK|String hoppers|Steamed rice-flour noodles formed into small nests.|Breakfast and main meals
LK|Lamprais|Rice and several accompaniments wrapped in banana leaf and cooked.|Burgher food traditions
LR|Kanyah|A sweet mixture of ground peanuts, toasted rice flour and sugar.|Traditional snacks
LR|Liberian rice bread|A baked bread or cake using rice in the batter.|Home baking
LT|Vėdarai|A sausage casing filled with grated potato and cooked.|Potato dishes
LT|Bulviniai blynai|Grated-potato pancakes fried until browned.|Everyday potato cooking
LU|Paschtéitchen|Puff-pastry cases with a creamy chicken-and-mushroom filling.|Traditional main dishes
LU|Quetschentaart|An open tart made with plums.|Seasonal baking
LV|Rupjmaize|A dark rye loaf served with meals and toppings.|Bread traditions
LV|Aukstā zupa|Chilled beetroot soup with kefir, vegetables and herbs.|Summer cooking
LY|Shorba Libiya|A seasoned tomato-based soup, often containing lamb.|Soups and broths
LY|Rishda|Pasta served with a sauce containing ingredients such as chickpeas and onions.|Pasta traditions
MA|Pastilla|A filled, layered pastry pie, with chicken among the common versions.|Celebration dishes
MA|Mechoui|Lamb roasted slowly for a shared meal.|Roasting traditions
MC|Socca|A thin chickpea-flour pancake cooked at high heat.|Shared Riviera tradition
MD|Sarmale|Cabbage or vine-leaf parcels with rice and often meat.|Shared regional tradition
MD|Mititei|Seasoned minced-meat rolls cooked on a grill.|Grilled meats
ME|Raštan|Collard greens slowly cooked with smoked meat.|Winter cooking
ME|Priganice|Small pieces of fried dough with sweet or savoury accompaniments.|Home-style snacks
MG|Varanga|Beef cooked until tender and shredded or fried.|Meat dishes
MG|Kabaro|Lima beans cooked with curry seasonings or coconut.|Morondava-area cooking
MK|Burek|Layered pastry with a savoury filling such as cheese or meat.|Shared Balkan baking
MK|Shopska salad|Chopped vegetables topped with grated white cheese.|Shared Balkan salad
ML|Alabadja|Rice and minced meat combined with butter.|Tuareg food traditions
ML|Tô|A firm grain-based staple served with sauces.|Everyday meals
MM|Ohn no khao swè|Noodles served in a coconut-and-chicken broth.|Noodle soups
MM|Htanyet|Palm sugar eaten as a sweet or used in cooking.|Traditional sweets
MN|Khorkhog|Meat and vegetables cooked in a container with heated stones.|Communal cooking tradition
MN|Boodog|Meat cooked using hot stones placed inside the prepared animal.|Special-occasion cooking
MO|Galinha à portuguesa|Macanese chicken baked with potatoes and a coconut-based sauce.|Macanese fusion cooking
MO|Caldo verde|A potato-and-greens soup from Portuguese culinary tradition.|Portuguese-influenced cooking
MQ|Stuffed crab|Crab shells filled with seasoned crab meat.|Island seafood
MQ|Stewed conch|Conch simmered in a seasoned sauce.|Caribbean seafood
MR|Mahfe|Meat cooked in a sauce with groundnuts and vegetables.|Shared West African tradition
MR|Dates|Date-palm fruit eaten fresh or dried and offered with refreshments.|Oasis food traditions
MS|Pumpkin soup|Pumpkin cooked into a seasoned soup.|Home cooking
MS|Aubergine patties|Savoury patties incorporating aubergine.|Vegetable snacks
MT|Timpana|Pasta and meat sauce baked inside a pastry crust.|Traditional baked dishes
MT|Lampuki pie|A pastry pie filled with lampuki fish and vegetables.|Seasonal fish cooking
MU|Gateaux piments|Small chilli-seasoned pulse fritters.|Street snacks
MU|Bol renversé|Rice, vegetables and a main ingredient served with egg and turned out from a bowl.|Chinese-Mauritian cooking
MV|Roshi|Thin flatbread served with other dishes, including breakfast foods.|Everyday bread
MV|Dhon riha|Tuna cooked in a coconut-based curry with aromatic spices.|Fish curries
MW|Kondowole|A thick cassava-flour staple served with relishes.|Northern Malawian cooking
MW|Mandasi|Fried dough snacks, often eaten with tea.|Breakfast and snacks
MX|Tamales|Maize-dough parcels with savoury or sweet fillings, steamed in leaves or husks.|Regional food traditions
MX|Enchiladas|Filled tortillas served with a chilli-based sauce.|Everyday main dishes
MX|Chiles en nogada|Stuffed peppers topped with walnut sauce and pomegranate.|Seasonal Puebla tradition
MY|Nasi kandar|Rice served with a selection of curries and accompaniments.|Malaysian Indian-Muslim cooking
MY|Rendang daging|Beef slowly cooked with coconut and spices until the sauce reduces.|Shared Malay-world tradition
MZ|Piri-piri prawns|Prawns grilled with a hot piri-piri chilli seasoning.|Coastal seafood
MZ|Chamussas|Small triangular pastries with savoury fillings.|Everyday snacks
NA|Biltong|Meat seasoned and air-dried, then sliced for eating.|Shared southern African food
NA|Boerewors|A seasoned sausage, often coiled and cooked on a grill.|Southern African barbecue traditions
NC|Mangrove oysters|Locally gathered oysters served as seafood.|Coastal produce
NC|Marinated fish salad|Raw fish dressed with citrus and served as a salad.|Pacific island food traditions
NE|Deguidegui|A tomato-based stew prepared with pasta.|Everyday cooking
NE|Foura|Millet preparations served with milk and seasonings.|Shared Sahelian food tradition
NG|Dodo|Ripe plantain sliced and fried until golden.|Everyday side dish
NG|Boli and epa|Roasted plantain served with groundnuts.|Street food
NG|Kilishi|Thin dried meat coated with a spiced groundnut mixture.|Northern Nigerian traditions
NI|Sopa de mondongo|A seasoned soup made with tripe and vegetables.|Hearty home cooking
NI|Tres leches cake|Sponge cake soaked in a mixture of milks.|Dessert shared across Latin America
NL|Erwtensoep|A thick split-pea soup, often served with sausage.|Cold-weather cooking
NL|Poffertjes|Small, soft pancakes commonly served with butter and sugar.|Sweet snacks
NO|Brunost|A brown, sweet-tasting whey cheese, usually sliced thinly.|Breakfast and open sandwiches
NO|Lutefisk|Dried fish rehydrated through a traditional alkaline treatment and cooked before serving.|Seasonal food tradition
NP|Gundruk|Fermented leafy greens used in soups, side dishes and pickles.|Preserved vegetable traditions
NP|Thukpa|A warming noodle soup with vegetables and sometimes meat.|Shared Himalayan food
NU|Luku|Edible fern shoots cooked with coconut cream and other ingredients.|Island vegetable cooking
NU|Kumara|Sweet potato eaten as a starchy accompaniment.|Pacific staple crop
NZ|Fish and chips|Battered fish served with fried potato chips.|Everyday takeaway food
NZ|Green-lipped mussels|Large green-shelled mussels prepared in a variety of seafood dishes.|New Zealand coastal produce
OM|Majboos|Spiced rice cooked with meat or fish.|Shared Gulf cooking
OM|Harees|Wheat and meat cooked together into a thick, smooth preparation.|Ramadan and family meals
PA|Patacones|Green plantain flattened and fried in two stages.|Everyday side dish
PA|Raspados|Shaved ice topped with flavoured syrup and sometimes milk.|Panamanian frozen desserts
PE|Causa limeña|Seasoned mashed potato layered with fillings such as chicken or tuna.|Lima food traditions
PE|Anticuchos|Seasoned meat grilled on skewers, often made with beef heart.|Street food
PF|Uru|Breadfruit cooked as a starchy accompaniment to meals.|Polynesian staple crop
PF|Casse-croûte|A filled baguette sandwich with a range of savoury fillings.|Everyday Tahitian food
PG|Taro|A starchy root crop cooked before eating and served with meals.|Garden-grown staple
PG|Yams|Edible tubers prepared as part of meals, with varieties and uses differing by community.|Regional staple crops
PH|Lechon|A whole pig roasted until the skin becomes crisp.|Celebration food
PH|Kare-kare|A rich peanut-based stew with vegetables and often oxtail.|Family meals
PH|Sinangag|Rice fried with garlic, frequently eaten at breakfast.|Everyday cooking
PK|Kheer|A sweet rice pudding cooked with milk and often flavoured with cardamom.|Shared South Asian dessert
PK|Gulab jamun|Fried milk-based sweets soaked in a fragrant sugar syrup.|Celebrations and sweet shops
PL|Gołąbki|Cabbage leaves wrapped around a seasoned filling of meat and rice.|Home cooking
PL|Barszcz|A beetroot-based soup, with clear and more substantial regional versions.|Polish soup traditions
PR|Lechón asado|Pork slowly roasted with seasonings.|Celebrations and roadside food
PR|Quesitos|Small pastries wrapped around a sweet cream-cheese filling.|Bakery favourites
PS|Mutabbal|A smoky aubergine dip blended with tahini and seasonings.|Shared Levantine mezze
PS|Sumaghiyyeh|A tart, sumac-seasoned stew with tahini and meat.|Gazan cooking
PT|Queijadas de Sintra|Small cheese-based sweet tarts.|Sintra bakery tradition
PT|Lulas recheadas|Squid stuffed with a savoury filling and cooked in sauce.|Coastal cooking
PW|Ulkoy|Fritters made with shrimp and squash.|Island snacks
PW|Tinola|A chicken soup with green papaya and seasonings.|Food with Philippine connections
PY|Borí borí|A soup containing small maize-and-cheese dumplings.|Paraguayan home cooking
PY|Soyo|A seasoned soup made with finely ground beef.|Everyday soups
QA|Thareed|Bread softened with a meat-and-vegetable stew.|Shared Gulf food tradition
QA|Umm Ali|A warm dessert of pastry or bread baked with milk, nuts and raisins.|Dessert enjoyed across the region
RE|Civet de zourites|Octopus slowly cooked in a seasoned red-wine sauce.|Réunion Creole cooking
RE|Bouchons|Small steamed dumplings with a savoury meat filling.|Island snacks
RO|Ciorbă|A family of sour soups made with vegetables and sometimes meat.|Everyday soup traditions
RO|Papanași|Cheese-based doughnuts served with sour cream and fruit preserves.|Sweet dishes
RS|Pljeskavica|A seasoned minced-meat patty, usually grilled.|Balkan grill cooking
RS|Ajvar|A relish made from roasted peppers, sometimes with aubergine.|Shared Balkan food tradition
RU|Pirozhki|Small baked or fried buns with savoury or sweet fillings.|Everyday snacks
RU|Kasha|Porridge made from cooked grains, with sweet and savoury versions.|Home cooking
RW|Matoke|Green cooking bananas steamed and mashed or served with sauce.|Shared East African staple
RW|Tilapia|Freshwater fish served in local meals, particularly around the lakes.|Lake-region food
SA|Shakshuka|Eggs cooked in a seasoned tomato sauce.|Breakfast shared across the region
SA|Ma'amoul|Small cookies filled with dates or nuts.|Festive sweets
SB|Taro|Cooked taro roots served as a starchy part of meals.|Island staple crop
SB|Taro leaves|Taro leaves cooked thoroughly and served as a vegetable.|Island garden produce
SC|Octopus curry|Octopus simmered with spices and coconut milk.|Seychellois Creole cooking
SC|Satini|A finely grated fruit or vegetable relish seasoned with chilli, onion and lime.|Creole accompaniments
SD|Tamia|Seasoned bean-based fritters, a Sudanese form of falafel.|Everyday snacks
SD|Basboosa|A sweet semolina cake moistened with syrup.|Dessert shared across the region
SE|Pyttipanna|Diced potatoes, onion and meat fried together, often served with an egg.|Home cooking
SE|Ostkaka|A Swedish baked cheese-based dessert.|Regional baking
SG|Char kway teow|Rice noodles stir-fried with soy sauce, seafood and other ingredients.|Hawker-centre food
SG|Satay|Skewers of seasoned grilled meat served with peanut sauce.|Shared Southeast Asian food
SI|Kranjska klobasa|A smoked pork sausage, often served with mustard or sauerkraut.|Carniolan food tradition
SI|Štruklji|Rolled dumplings with sweet or savoury fillings, including cottage cheese.|Slovenian home cooking
SK|Langoše|Fried dough topped with ingredients such as garlic, cheese or sour cream.|Shared Central European street food
SK|Bryndza|A soft sheep's-milk cheese used in dishes and spreads.|Slovak cheese tradition
SL|Yebe|A thick stew with root vegetables, seasonings and sometimes chicken.|Home cooking
SL|Benny cake|A sweet sesame-seed confection.|Local sweet snacks
SM|Nidi di rondine|Rolled baked pasta with a savoury meat-and-cheese filling.|Sammarinese cooking
SM|Cacciatello|A baked custard dessert similar to crème caramel.|Sweet dishes
SN|Pastels|Small pastries filled with seasoned fish, often served with tomato sauce.|Street food
SN|Thiéré|Millet couscous served with a sauce and vegetables, meat or fish.|Senegalese grain traditions
SO|Muufo|A corn-based flatbread served with meals.|Home baking
SO|Xalwo|A spiced, jelly-like sweet made with sugar, starch and fat.|Celebrations and hospitality
SR|Roti|Flatbread served with curry, often chicken and potatoes.|Surinamese Hindustani food
SR|Bakbana|Fried plantain served with peanut sauce.|Surinamese Javanese food
SS|Ful|Fava beans cooked and served as a substantial dish.|Food shared across the region
SS|Baseema|A sweet cake prepared with yoghurt.|Sweet dishes
ST|Búzios|Large land snails cooked in savoury dishes.|Island food traditions
ST|Cooked bananas|Bananas cooked and served as a starchy part of meals.|Island staple food
SV|Casamiento|Rice and beans cooked together, often served at breakfast.|Everyday food
SV|Curtido|A tangy cabbage relish with other shredded vegetables.|Pupusa accompaniment
SX|Barbecued spare ribs|Pork ribs marinated and cooked with barbecue seasonings.|Island grill cooking
SX|Saltfish fritters|Salted fish and vegetables mixed into batter and fried.|Caribbean snacks
SY|Yabrak|Vine leaves wrapped around a seasoned rice-and-meat filling.|Shared Levantine food
SY|Ouzi|Pastry filled with rice and seasoned meat.|Celebration meals
SZ|Slaai|Avocado salad with lemon, ginger and peanuts.|Fresh side dishes
SZ|Umbidvo wetintsanga|Cooked pumpkin leaves combined with groundnuts.|Vegetable cooking
TC|Hominy|A dish of grits and pigeon peas served with fish, conch or meat.|Turks and Caicos cooking
TC|Conch salad|Chopped conch prepared as a seasoned seafood salad.|Island seafood
TD|Jarret de bœuf|Beef slowly stewed with vegetables until tender.|Home cooking
TD|La bouillie|A warm cereal porridge made with rice or wheat and other ingredients.|Breakfast food
TG|Riz sauce d'arachide|Rice served with a seasoned groundnut sauce.|Everyday meals
TG|Koklo mémé|Grilled chicken served with chilli seasoning.|Grill cooking
TH|Green curry|A coconut-based curry with green chillies, basil and meat or vegetables.|Thai curry traditions
TH|Massaman curry|A gently spiced curry with potatoes, peanuts and meat.|Southern Thai food traditions
TH|Mango sticky rice|Ripe mango served with sweet sticky rice and coconut milk.|Seasonal sweet dish
TJ|Manti|Large steamed dumplings with a meat-and-onion filling.|Shared Central Asian food
TJ|Non|Round flatbread baked in a clay oven.|Everyday bread
TL|Chicken curry|Chicken cooked in a seasoned curry sauce.|Contemporary island meals
TL|Fried fish|Fish fried and served as a main dish.|Coastal food
TM|Manty|Large steamed dumplings filled with minced meat and onion.|Shared Central Asian food
TM|Chorek|Round bread baked in a clay oven and served with meals.|Turkmen bread tradition
TN|Ojja|A spicy tomato-and-pepper dish with eggs, sometimes with sausage or seafood.|Everyday cooking
TN|Mechoui|Lamb slowly roasted, traditionally over an open fire.|Celebration food
TO|Ufi|A large white yam cooked as a starchy part of meals.|Tongan staple crop
TO|Feke|Octopus prepared with coconut sauce.|Island seafood
TR|Pide|Flatbread baked with toppings such as cheese, meat or spinach.|Regional bakery traditions
TR|Menemen|Eggs cooked with tomatoes and peppers.|Breakfast food
TT|Pork souse|Cooked pork served cold with lime, cucumber, onion and pepper.|Trinidadian food traditions
TT|Tum-tum|Green plantain cooked and mashed as a starchy dish.|Traditional accompaniment
TW|Gua bao|A soft steamed bun filled with braised pork, pickled greens and peanuts.|Street food
TW|Xiao long bao|Small steamed dumplings containing a savoury filling and broth.|Shared Chinese culinary traditions
TW|Pineapple cakes|Small pastries with a sweet pineapple-based filling.|Gift and bakery food
TZ|Nyama choma|Meat grilled and served with simple seasonings and accompaniments.|Shared East African cooking
TZ|Samaki wa kupaka|Grilled fish served with a coconut-based sauce.|Coastal food traditions
UA|Pelmeni|Small dumplings with a meat filling, also eaten elsewhere in the region.|Shared regional food
UA|Chicken Kyiv|A breaded chicken preparation filled with butter.|Dish associated internationally with Kyiv
UG|Katogo|A stew combining staples such as cooking bananas or cassava with beans or meat.|Breakfast and home cooking
UG|Kikomando|Chopped chapati served with beans.|Everyday street food
UY|Morcilla|Blood sausage prepared in savoury and sweetened versions.|Grill accompaniments
UY|Dulce de leche|A thick sweet milk spread used on bread and in desserts.|Shared Río de la Plata tradition
UZ|Lagman|Noodles served in a meat-and-vegetable broth or stir-fried.|Shared Central Asian food
UZ|Non|Round flatbread baked in a clay oven.|Everyday bread
VC|Souse|Cooked meat or seafood served in a tangy seasoned preparation.|Caribbean food tradition
VC|Lambi|Conch prepared in seafood dishes.|Island seafood
VE|Cachapas|Sweetcorn pancakes, often folded around white cheese.|Everyday meals and snacks
VE|Hervido|A substantial soup of meat or fish and root vegetables.|Home cooking
VG|Anegada lobster|Locally caught lobster prepared in a range of seafood dishes.|Anegada coastal food
VG|Conch stew|Conch slowly cooked in a seasoned sauce.|Caribbean seafood
VI|Souse|Cooked pork served in a tart, lime-seasoned preparation.|Island food tradition
VI|Mahi-mahi|A locally eaten fish served in seafood meals.|Caribbean coastal food
VN|Cao lầu|Thick noodles with sliced pork, greens and crisp toppings.|Hội An speciality
VN|Cơm tấm|Broken rice served with accompaniments such as grilled pork, egg and pickles.|Southern Vietnamese food
WS|Roast suckling pig|A young pig roasted and shared as part of a feast.|Celebration meals
WS|Octopus dishes|Octopus prepared as part of local seafood meals.|Island seafood
XK|Tavë Prizreni|A baked dish with meat, vegetables and yoghurt.|Prizren cooking
XK|Sarma|Cabbage leaves wrapped around rice and minced meat, then slowly cooked.|Shared Balkan food
YE|Fahsah|A hot meat stew served bubbling in a cooking pot.|Yemeni home cooking
YE|Fassolia|White beans cooked with mild seasonings.|Everyday meals
ZA|Biltong|Seasoned meat cured and air-dried, then sliced as a snack.|Southern African food
ZA|Boerewors|A spiced sausage often cooked over a braai.|South African grill traditions
ZA|Potjiekos|A stew slowly cooked in a cast-iron pot over a fire.|Shared outdoor meals
ZM|Kapenta|Small dried fish fried or cooked in a sauce and served with nshima.|Everyday meals
ZM|Village chicken|Free-range chicken cooked in stews or grilled.|Home cooking
ZW|Kapenta|Small dried fish, often fried and served with sadza.|Everyday meals
ZW|Roadrunner chicken|Free-range chicken slowly cooked in a stew.|Home cooking
AS|Roast suckling pig|Roast pork shared as part of a fia fia feast.|Samoan celebration food
AS|Breadfruit|Breadfruit cooked as a starchy accompaniment.|Island staple crop
AX|Butter-fried perch|Local perch cooked in butter.|Åland summer food
AX|Åland cheese|Cheeses produced on the islands and served with bread or other foods.|Island dairy produce
BH|Harees|Wheat and meat slowly cooked into a thick, smooth dish.|Ramadan and family meals
BH|Jireesh|Crushed wheat cooked with meat and seasonings.|Bahraini home cooking
CW|Pastechi|Crescent-shaped fried pastries with cheese, meat, fish or vegetable fillings.|Breakfast and snacks
CW|Sòpi di banana|Plantain soup, sometimes prepared with salted meat.|Curaçao home cooking
CC|Smoked wahoo|Locally caught wahoo smoked and served as seafood.|Contemporary island food
CC|Chicken parmigiana|Breaded chicken served with tomato sauce and melted cheese.|Australian-style pub food on the islands
DJ|Sambusa|Small triangular pastries with a spiced meat or fish filling.|Ramadan and everyday snacks
DJ|Xalwo|A sweet, spiced starch-based confection.|Celebrations and hospitality
FK|Roast lamb|Island-raised lamb prepared as a roast.|Local farm produce
FK|Sea trout|Locally caught trout served in fish dishes.|Island fishing traditions
FM|Sweet potato|A cooked root crop eaten alongside other foods.|Island staple crops
FM|Crab|Locally caught crab prepared in seafood meals.|Coastal food
FO|Ræst kjøt|Fermented lamb cooked before serving.|Faroese preservation tradition
FO|Atlantic salmon|Salmon from the surrounding cold waters, served in a variety of dishes.|Faroese seafood
KH|Bai sach chrouk|Grilled pork served over rice with pickled vegetables.|Breakfast food
KH|Lok lak|Stir-fried beef with a pepper-and-lime dipping sauce.|Cambodian cooking
LS|Moroho|Cooked leafy greens served with papa and other accompaniments.|Everyday Basotho food
LS|Oxtail stew|Oxtail slowly cooked until tender in a savoury sauce.|Shared southern African cooking
MH|Roasted breadfruit|Breadfruit cooked over a fire and eaten as a starchy food.|Marshallese food traditions
MH|Mashed taro|Cooked taro mashed and served as part of a meal.|Island staple food
NF|Fried reef fish|Freshly caught reef fish prepared in an island fish fry.|Community meals
NF|Norfolk Blue beef|Beef from island-raised cattle, served in local meals.|Local farm produce
NR|Fried rice|Rice stir-fried with vegetables and other available ingredients.|Chinese-influenced everyday food
NR|Sweet and sour pork|Pork cooked with a sweet, tangy sauce.|Island restaurant food
PM|Tarte aux fraises|A French-style pastry tart topped with strawberries.|Archipelago bakery food
PM|French cheeses|Cheeses such as brie, camembert and goat's cheese served with bread.|French culinary connections
SH|Saint Helena curry|A seasoned curry made with ingredients such as beef, goat or tuna.|Saint Helena home cooking
SH|Fried fish|Locally caught fish fried and served as a meal.|Saint Helena coastal food
TK|Puta|Round fried doughnuts eaten as a snack.|Tokelauan food traditions
TK|Vaihalo|A porridge made with coconut.|Coconut-based cooking
TV|Pulaka|Giant swamp taro cooked thoroughly before eating.|Traditional island staple
TV|Breadfruit|A starchy tree crop cooked and served with meals.|Island-grown food
VU|Bunia|Meat, fish and root vegetables wrapped in leaves and cooked with heated stones.|Communal earth-oven meals
VU|Nangai nuts|Local nuts roasted or boiled and eaten as a snack.|Market food
YT|Pwedza ya sossi|Octopus simmered with tomato, onion and basil.|Mahoran coastal cooking
YT|Manioc frit|Cassava cut and fried as an accompaniment.|Market and street food
BL|Grilled lobster|Fresh lobster cooked on a grill.|Island seafood
BL|Pizza|Baked flatbread with savoury toppings, served by island snack restaurants.|Contemporary everyday food
BQ|Rum raisin cake|A sweet cake flavoured with rum and raisins.|Bonaire dessert tradition
BQ|Mango sorbet|A frozen fruit dessert made with mango.|Bonaire frozen desserts
CX|Papaya|Ripe papaya eaten as fresh fruit.|Fruit grown on the island
CX|Mango|A sweet tropical fruit available from island trees in season.|Seasonal island produce
EH|El aych|A cereal preparation served with milk.|Sahrawi food traditions
EH|Tajín|A slow-cooked meat dish, including versions made with camel.|Sahrawi and regional cooking
IO|Mouf|A cake made with coconut and banana.|Chagossian community heritage
IO|Satini koko|A chutney prepared with grated coconut.|Chagossian community heritage
MC|Pissaladière|A savoury pie with onions, tomatoes and olives in the Monégasque version.|Shared Riviera food tradition
MF|Crab and rice|Crab cooked with seasoned rice.|Saint Martin home cooking
MF|Beef patties|Pastry parcels filled with seasoned beef.|Caribbean snacks
MP|Titiyas|Soft flour flatbreads prepared with coconut.|CHamoru food tradition
MP|Tinian beef|Beef raised on Tinian and served in local dishes.|Island farm produce
PN|Fried fish|Freshly caught fish cooked and shared at community fish fries.|Pitcairn community meals
PN|Pitcairn honey|Honey produced by the island's beekeepers.|Local food produce
SJ|Grouse dishes|Grouse prepared on some local restaurant menus.|Seasonal Svalbard food
SJ|Wild mushrooms|Foraged mushrooms used in seasonal dishes.|Svalbard restaurant cooking
VA|Pasta all'amatriciana|Pasta dressed with tomato, cured pork and pecorino cheese.|Roman and Lazio cuisine around the Vatican
VA|Saltimbocca alla romana|Thin veal portions cooked with prosciutto and sage.|Roman cooking around the Vatican
WF|Tuna sashimi|Fresh tuna sliced and served raw.|Contemporary island seafood
WF|Stuffed clams|Clams prepared with a savoury filling.|Lagoon seafood
FR|Baguette|A long, crusty loaf eaten with meals or used for sandwiches.|Everyday French bread|FR_BREAKFAST
FR|Croissant|A buttery, flaky pastry commonly eaten at breakfast.|French bakery food with Austrian influences|FR_BREAKFAST
NP|Chatamari|A rice-flour crepe topped with ingredients such as meat, egg and seasonings.|Newar food tradition|NP_NTB
US|Burgers|A patty served in a bun with toppings; beef, cheese and plant-based versions are widely available.|Everyday American food
US|Pizza|Baked dough with sauce, cheese and toppings; American variations include Chicago deep-dish pizza.|Popular food with Italian roots
US|Fried chicken|Seasoned chicken cooked in a crisp coating, with many regional variations.|Everyday and shared meals
US|Mac and cheese|Macaroni coated in cheese sauce, sometimes finished in the oven.|Comfort food
US|Buffalo wings|Chicken wings tossed in a spicy sauce, associated with Buffalo, New York.|Regional food enjoyed widely
US|Pumpkin pie|A pastry pie with a sweet, spiced pumpkin filling.|Autumn and Thanksgiving baking
`;

export default Object.fromEntries([...new Set(rows.trim().split('\n').map(row => row.split('|')[0]))].map(code => [code,
  rows.trim().split('\n').filter(row => row.startsWith(code + '|')).map(row => {
    const [, name, description, famousFor, sourceKey] = row.split('|');
    return { name, description, famousFor, source: sources[sourceKey || code] };
  }),
]));
