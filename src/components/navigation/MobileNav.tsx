// FinPilot Mobile Bottom Navigation
import React from 'react';
import { useFinPilot } from '../../lib/supabase/context';
import { LayoutDashboard, BarChart3, Receipt, Sparkles, SlidersHorizontal } from 'lucide-react';

interface MobileNavProps {
  onOpenCopilot: () => void;
  onOpenQuickAdd: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCopilot, onOpenQuickAdd }) => {
  const { activeView, setActiveView } = useFinPilot();

  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'whatif', label: 'Simulate', icon: SlidersHorizontal }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 border-t border-neutral-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] min-h-[44px] transition-colors ${
              isActive ? 'text-emerald-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Floating Copilot Trigger */}
      <button
        onClick={onOpenCopilot}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] min-h-[44px] text-emerald-300 font-medium hover:text-emerald-200"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-0.5">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px]">Copilot</span>
      </button>
    </div>
  );
};
