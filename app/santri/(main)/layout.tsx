import SantriSidebar from "./components/SantriSidebar";

export default function SantriMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 font-sans flex flex-col md:flex-row">
      <SantriSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
