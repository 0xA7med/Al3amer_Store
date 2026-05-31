import { MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function FloatingWhatsApp() {
  const { settings } = useSettings();
  const phone = settings.supportPhone || '201012345678';
  const waNumber = phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-105 active:scale-95 group"
      aria-label="تواصل عبر واتساب"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="text-sm font-bold max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 whitespace-nowrap">
        تواصل واتساب
      </span>
    </a>
  );
}
