import { motion } from 'framer-motion';
import { Map, Utensils, MessageCircle, DollarSign, Calendar, ShieldCheck, Luggage, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: "Geography & Culture",
    description: "Dive into detailed country profiles — history, climate, local customs, and everything you need before you land.",
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: Utensils,
    title: "Food & Cuisine",
    description: "Discover must-try dishes, street food gems, dining etiquette, and local food culture for every destination.",
    color: "from-orange-500/20 to-orange-600/10",
    iconColor: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    icon: MessageCircle,
    title: "Local Phrases",
    description: "Learn essential phrases with pronunciation guides. Break the language barrier and connect with locals.",
    color: "from-green-500/20 to-green-600/10",
    iconColor: "text-green-400",
    border: "border-green-500/20",
  },
  {
    icon: DollarSign,
    title: "Travel Costs",
    description: "Get realistic budget breakdowns — accommodation, food, transport, and activities across all budget levels.",
    color: "from-yellow-500/20 to-yellow-600/10",
    iconColor: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  {
    icon: Calendar,
    title: "Day-by-Day Itinerary",
    description: "Generate a personalized trip plan based on your duration, travel style, and budget. Ready to go.",
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-400",
    border: "border-purple-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Safety Advice",
    description: "Stay informed with up-to-date safety tips, health advice, emergency contacts, and travel warnings.",
    color: "from-red-500/20 to-red-600/10",
    iconColor: "text-red-400",
    border: "border-red-500/20",
  },
  {
    icon: Luggage,
    title: "Packing Lists",
    description: "Smart packing recommendations tailored to your destination's climate, culture, and activities.",
    color: "from-cyan-500/20 to-cyan-600/10",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    icon: TrendingUp,
    title: "Fun Facts",
    description: "Uncover surprising facts and hidden gems that turn good trips into unforgettable adventures.",
    color: "from-pink-500/20 to-pink-600/10",
    iconColor: "text-pink-400",
    border: "border-pink-500/20",
  },
];

const stats = [
  { value: "195+", label: "Countries covered" },
  { value: "100%", label: "AI-powered" },
  { value: "8", label: "Insight categories" },
  { value: "Free", label: "No account needed" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function LandingFeatures() {
  return (
    <section className="bg-slate-950 text-white">
      {/* Stats bar */}
      <div className="border-b border-white/5 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-400 mb-1">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to plan the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              perfect trip
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Type a country name and get instant, AI-curated insights across every dimension of travel.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              variants={cardVariants}
              className={`relative rounded-2xl border ${feat.border} bg-gradient-to-br ${feat.color} p-6 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200 cursor-default`}
            >
              <div className={`inline-flex p-2.5 rounded-xl bg-white/5 mb-4 ${feat.iconColor}`}>
                <feat.icon size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* How it works */}
      <div className="border-t border-white/5 bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-10">
              How Voya works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Type a country", desc: "Enter any country name in the search bar above." },
                { step: "02", title: "Get instant insights", desc: "AI generates a full country profile in seconds." },
                { step: "03", title: "Plan your trip", desc: "Generate a personalized itinerary and pack your bags." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className="text-4xl font-black text-blue-500/30 mb-2">{item.step}</div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
