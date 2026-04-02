import fs from 'fs';

const file = 'server/index.mjs';
let content = fs.readFileSync(file, 'utf8');

// Find the start and end of knownCultureProfiles
const startIdx = content.indexOf('const knownCultureProfiles = {');
const endIdx = content.indexOf('const knownFoodData = {', startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find knownCultureProfiles or knownFoodData');
  process.exit(1);
}

const newProfiles = `const knownCultureProfiles = {
  nepal: {
    traditions: ['Dashain (major Hindu festival)', 'Tihar (festival of lights)', 'Holi (festival of colors)', 'Teej (women's festival)'],
    socialNorms: ['Greet with Namaste (palms together)', 'Respect elders and take off shoes before entering homes', 'Public displays of affection are usually frowned upon'],
    religionOverview: 'Predominantly Hindu (~80%) with significant Buddhist community, plus Islam and Christianity in smaller numbers',
    etiquetteTips: ['Remove shoes before entering temples, monasteries, and homes', 'Do not touch people's heads (especially children), it is considered sacred', 'Use your right hand for eating and exchanging items', 'Ask permission before taking photographs in religious/cultural sites', 'Respect local dress codes at temples and sacred areas'],
  },
  japan: {
    traditions: ['Cherry blossom festivals (Hanami)', 'Obon (honoring ancestors)', 'Festivals and fireworks', 'New Year celebrations'],
    socialNorms: ['Remove shoes in homes', 'Bowing is a common greeting', 'Respect for elders important'],
    religionOverview: 'Mix of Shintoism and Buddhism',
    etiquetteTips: ['Bow to show respect', 'Do not tip', 'Remove shoes in temples'],
  },
  france: {
    traditions: ['Bastille Day (July 14)', 'Christmas celebrations', 'Wine and gastronomy'],
    socialNorms: ['Value intellectual discussion', 'Formality important', 'Use surnames'],
    religionOverview: 'Predominantly Catholic',
    etiquetteTips: ['Greet with Bonjour', 'Avoid discussing money', 'Table manners important'],
  },
  'united states': {
    traditions: ['Thanksgiving', 'Independence Day', 'Halloween'],
    socialNorms: ['Friendliness common', 'Punctuality valued', 'Direct communication'],
    religionOverview: 'Diverse religious landscape',
    etiquetteTips: ['Handshakes standard', 'Tip 15-20%', 'Make eye contact'],
  },
  brazil: {
    traditions: ['Carnival', 'Festas Juninas', 'Music and dance'],
    socialNorms: ['Warm and expressive', 'Family central', 'Spontaneity valued'],
    religionOverview: 'Predominantly Catholic',
    etiquetteTips: ['Cheek kiss greeting', 'Dress colorfully', 'Embrace celebrations'],
  },
  mexico: {
    traditions: ['Dia de Muertos', 'Las Posadas', 'Quinceañera'],
    socialNorms: ['Family paramount', 'Hospitality valued', 'Respect important'],
    religionOverview: 'Predominantly Catholic',
    etiquetteTips: ['Use formal titles', 'Respect cultures', 'Accept food offerings'],
  },
  india: {
    traditions: ['Diwali', 'Holi', 'Navratri'],
    socialNorms: ['Greet with Namaste', 'Respect elders deeply', 'Family loyalty paramount'],
    religionOverview: 'Diverse: Hindu majority, Islam, Christianity, Sikhism, Buddhism',
    etiquetteTips: ['Use right hand for eating', 'Remove shoes in temples', 'Dress modestly'],
  },
  thailand: {
    traditions: ['Songkran (New Year)', 'Loy Krathong', 'Buddhist celebrations'],
    socialNorms: ['Respect for monarchy paramount', 'Smiling shows respect', 'Avoid confrontation'],
    religionOverview: 'Over 94% Buddhist',
    etiquetteTips: ['Wai greeting (palms together)', 'Respect royal family', 'Remove shoes in temples'],
  },
};`;

const newContent = content.substring(0, startIdx) + newProfiles + '\n\n' + content.substring(endIdx);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Updated knownCultureProfiles successfully');
