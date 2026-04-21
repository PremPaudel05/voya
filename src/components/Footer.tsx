import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-[#1a1208]/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        {/* Panel */}
        <motion.div
          className="relative bg-[#F7F3EE] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e8dfd2]">
            <h2 className="font-black text-lg text-[#1a1208]">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#e8dfd2] transition-colors">
              <X size={16} className="text-[#6b5740]" />
            </button>
          </div>
          <div className="px-6 py-5 text-sm text-[#4a3828] leading-relaxed space-y-4">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type ModalKey = 'privacy' | 'accuracy' | 'terms' | 'contact' | null;

export function Footer() {
  const [open, setOpen] = useState<ModalKey>(null);

  return (
    <>
      <footer className="bg-[#1f1509] text-[#a08060]">

        {/* Main footer body */}
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black text-white tracking-tight">Voya</span>
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#c49050] border border-[#c49050]/30 px-2 py-0.5 rounded-full">Travel</span>
            </div>
            <p className="text-[14px] leading-relaxed text-[#c8a878] max-w-[210px]">
              Instant travel intelligence for explorers who move with intention.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c49050] animate-pulse shrink-0" />
              <span className="text-[13px] text-[#a08060]">195+ countries · Always free</span>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#c49050] mb-1">Resources</span>
            {[
              { label: 'Privacy Policy',     key: 'privacy'  as ModalKey },
              { label: 'Terms of Use',       key: 'terms'    as ModalKey },
              { label: 'AI Accuracy Notice', key: 'accuracy' as ModalKey },
              { label: 'Help & Contact',     key: 'contact'  as ModalKey },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setOpen(item.key)}
                className="text-[14px] text-[#c8a878] hover:text-white transition-colors text-left w-fit"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#c49050]">Get in touch</span>
            <p className="text-[14px] text-[#c8a878] leading-relaxed">
              Ideas, suggestions, or feedback? I'd genuinely love to hear them — every message is read and appreciated.
            </p>
            <a
              href="mailto:Prempaudel5b@gmail.com"
              className="text-[14px] font-semibold text-white hover:text-[#c49050] transition-colors"
            >
              Prempaudel5b@gmail.com →
            </a>
            {/* LinkedIn — single instance */}
            <a
              href="https://www.linkedin.com/in/prem-paudel-81a366364/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-fit text-[13px] font-semibold text-[#c8a878] hover:text-white transition-colors group"
            >
              <span className="w-7 h-7 rounded-full bg-[#0A66C2]/20 group-hover:bg-[#0A66C2] flex items-center justify-center transition-colors shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#5b9bd5] group-hover:text-white transition-colors">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </span>
              Connect with me on LinkedIn
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[13px] text-[#a08060]">
            © {new Date().getFullYear()} Voya by Prem Paudel. All rights reserved.
          </span>
        </div>
      </footer>

      {/* Modals */}
      {open === 'privacy' && (
        <Modal title="Privacy Policy" onClose={() => setOpen(null)}>
          <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Voya does not collect, store, or sell any personal data. No account creation is required and no tracking cookies are used.</p>
          <p><strong>Search queries:</strong> Country names you type are sent to an AI provider to generate travel content. They are not linked to your identity and are not retained after the response is delivered.</p>
          <p><strong>Analytics:</strong> I may use privacy-respecting, anonymous analytics (page views only) to improve the product. No personal identifiers are collected.</p>
          <p><strong>Third-party services:</strong> Voya uses an AI language model to generate travel insights. Please review the AI provider's own privacy policy for details on how prompts are handled on their end.</p>
          <p>For any privacy concerns, reach me at <a href="mailto:Prempaudel5b@gmail.com" className="text-[#b07a3a] underline">Prempaudel5b@gmail.com</a>.</p>
        </Modal>
      )}

      {open === 'terms' && (
        <Modal title="Terms of Use" onClose={() => setOpen(null)}>
          <p>By using Voya, you agree to the following terms.</p>
          <p><strong>Use of content:</strong> All travel insights generated by Voya are for personal, informational use only. Content may not be republished or sold without permission.</p>
          <p><strong>No guarantees:</strong> Voya provides AI-generated travel information. While I strive for accuracy, I cannot guarantee that all content is current or error-free. Always verify critical information (e.g. visa requirements, health advice, safety conditions) with official government or embassy sources before travelling.</p>
          <p><strong>Acceptable use:</strong> You agree not to use Voya for any unlawful purpose, to attempt to reverse-engineer the service, or to overload the system with automated requests.</p>
          <p><strong>Changes:</strong> I reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>
          <p>Questions? <a href="mailto:Prempaudel5b@gmail.com" className="text-[#b07a3a] underline">Prempaudel5b@gmail.com</a></p>
        </Modal>
      )}

      {open === 'accuracy' && (
        <Modal title="AI Accuracy Notice" onClose={() => setOpen(null)}>
          <p>Voya uses a large language model to generate travel insights. This technology is powerful, but it is not infallible.</p>
          <p><strong>What this means for you:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Information such as visa requirements, entry rules, currency exchange rates, and safety advisories can change rapidly. Always cross-check with official government or embassy sources.</li>
            <li>Local phrases and translations are generally reliable, but regional dialects and nuances may vary.</li>
            <li>Cost estimates are approximate and based on general knowledge. Actual prices may differ depending on season, location, and market conditions.</li>
            <li>Historical or cultural facts are sourced from the model's training data, which has a knowledge cutoff and may not reflect very recent events.</li>
          </ul>
          <p>I'm continuously working to improve the quality and accuracy of the content. If you notice an error, please let me know at <a href="mailto:Prempaudel5b@gmail.com" className="text-[#b07a3a] underline">Prempaudel5b@gmail.com</a>.</p>
        </Modal>
      )}

      {open === 'contact' && (
        <Modal title="Help & Contact" onClose={() => setOpen(null)}>
          <p>I'm building Voya to make travel more accessible and informed. I'd love to hear from you.</p>
          <div className="bg-[#e8dfd2] rounded-xl p-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#b07a3a]">Email me</div>
            <a href="mailto:Prempaudel5b@gmail.com" className="text-[#1a1208] font-semibold hover:text-[#b07a3a] transition-colors">
              Prempaudel5b@gmail.com
            </a>
          </div>
          <p><strong>Common questions:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Is Voya free?</strong> Yes, always. No subscription, no account required.</li>
            <li><strong>How accurate is the information?</strong> Generally reliable, but AI can make mistakes. See the AI Accuracy Notice for details.</li>
            <li><strong>Can I suggest a feature?</strong> Absolutely. Email me with your idea.</li>
            <li><strong>I found incorrect information.</strong> Please report it via email so I can investigate and improve.</li>
          </ul>
          <p className="text-[#6b5740]">I aim to respond within 48 hours.</p>
        </Modal>
      )}
    </>
  );
}
