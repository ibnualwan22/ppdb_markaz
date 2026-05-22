import SantriSidebar from "./components/SantriSidebar";
import SantriFooter from "./components/SantriFooter";
import SantriBottomNav from "./components/SantriBottomNav";

export default function SantriMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 font-sans flex flex-col md:flex-row pb-[72px] md:pb-0">
      <SantriSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1 space-y-6">
          {children}
        </div>
        <SantriFooter />
      </div>
      <SantriBottomNav />
    </div>
  );
}
