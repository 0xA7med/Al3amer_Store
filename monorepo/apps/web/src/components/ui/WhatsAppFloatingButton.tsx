import { MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export function WhatsAppFloatingButton() {
  const { settings } = useSettings();
  const whatsappUrl = settings.whatsapp || 'https://wa.me/201012345678';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 size-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] group"
      aria-label="تواصل عبر واتساب"
    >
      <MessageCircle className="size-6 group-hover:rotate-6 transition-transform" />
    </a>
  );
}
