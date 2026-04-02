// Quick test to verify Gemini culture data
const res = await fetch('http://localhost:3001/api/country?name=South+Korea');
const data = await res.json();
console.log('=== CULTURE DATA ===');
console.log('traditions:', JSON.stringify(data.culture?.traditions));
console.log('socialNorms:', JSON.stringify(data.culture?.socialNorms));
console.log('religionOverview:', data.culture?.religionOverview);
console.log('etiquetteTips:', JSON.stringify(data.culture?.etiquetteTips));
console.log('=== FOODS ===');
console.log('foods count:', data.foods?.length);
console.log('first food:', data.foods?.[0]?.name);
