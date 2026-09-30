import { Pyramid, Castle, Mountain, TowerControl, Building, Landmark } from 'lucide-react';
import { ExpandingCards } from '@/components/ui/expanding-cards';
import type { CardItem } from '@/components/ui/expanding-cards';

// Photos and attribution links are documented in docs/expanding-cards.md.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&q=80`;
const countryLink = (country: string) => `/country/${encodeURIComponent(country)}`;

const architecturalWonders: CardItem[] = [
  {
    id: 'pyramids-giza', title: 'Pyramids of Giza',
    description: 'These pyramids have stood for thousands of years. Start here, then get to know more of Egypt.',
    imgSrc: photo('photo-1632836388763-3a52d354cd7e'), icon: <Pyramid size={24} />,
    linkHref: countryLink('Egypt'), linkLabel: 'Explore Egypt',
  },
  {
    id: 'great-wall', title: 'Great Wall of China',
    description: 'Follow the wall across the hills, then discover the food, traditions, and daily life beyond it.',
    imgSrc: photo('photo-1509376159-27f57325a3b6'), icon: <Castle size={24} />,
    linkHref: countryLink('China'), linkLabel: 'Explore China',
  },
  {
    id: 'machu-picchu', title: 'Machu Picchu',
    description: 'High in the Andes, this Inca city is one way into Peru’s history. There’s plenty more to discover.',
    imgSrc: photo('photo-1513193232743-99c890a0e769'), icon: <Mountain size={24} />,
    linkHref: countryLink('Peru'), linkLabel: 'Explore Peru',
  },
  {
    id: 'eiffel-tower', title: 'Eiffel Tower',
    description: 'A familiar view of Paris. Take a closer look at France, from its regional food to everyday customs.',
    imgSrc: photo('photo-1551120599-440aefce5263'), icon: <TowerControl size={24} />,
    linkHref: countryLink('France'), linkLabel: 'Explore France',
  },
  {
    id: 'burj-khalifa', title: 'Burj Khalifa',
    description: 'Dubai’s skyline is just the beginning. Get to know the places and traditions of the United Arab Emirates.',
    imgSrc: photo('photo-1468127225977-85bc4aa3fe0f'), icon: <Building size={24} />,
    linkHref: countryLink('United Arab Emirates'), linkLabel: 'Explore the UAE',
  },
  {
    id: 'taj-mahal', title: 'Taj Mahal',
    description: 'Start with Agra’s marble landmark, then explore India’s many languages, flavours, and celebrations.',
    imgSrc: photo('photo-1508196476590-9511757a5cbf'), icon: <Landmark size={24} />,
    linkHref: countryLink('India'), linkLabel: 'Explore India',
  },
  {
    id: 'colosseum', title: 'The Colosseum',
    description: 'Step into ancient Rome, then discover the local dishes and everyday rituals that make Italy memorable.',
    imgSrc: photo('photo-1515173792234-45cf00e907eb'), icon: <Landmark size={24} />,
    linkHref: countryLink('Italy'), linkLabel: 'Explore Italy',
  },
];

export default function ExpandingCardsDemo() {
  return (
    <section aria-labelledby="places-heading" className="mx-auto w-full max-w-7xl px-6 pb-10 pt-4">
      <div className="mb-8 max-w-2xl">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">A place to start</p>
        <h2 id="places-heading" className="text-3xl font-black tracking-tight text-ink sm:text-4xl">One place can spark a whole journey.</h2>
        <p className="mt-4 text-base leading-relaxed text-muted">Something catch your eye? Open a card, then explore the country behind it.</p>
        <p className="mt-2 text-sm text-muted lg:hidden">Swipe to see more places. Tap a card to take a closer look.</p>
      </div>
      <ExpandingCards items={architecturalWonders} defaultActiveIndex={0} aria-label="Places to start exploring" />
    </section>
  );
}
