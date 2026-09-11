import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  PlusCircle, 
  Info, 
  User, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenTransparency?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTransparency }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/" && (location.pathname === "/" || location.pathname === "/dashboard")) return true;
    return location.pathname.startsWith(path) && path !== "/";
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5DFD5]" data-testid="app-header">
      {/* Institutional Top Bar */}
      <div className="bg-[#0B132B] text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex items-center justify-between font-mono tracking-wide border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-white font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
            Indian Standards · Procurement research
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            An independent SIH 2026 project
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden sm:inline-flex items-center gap-1 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
            SIH 2026 · Problem SIH 26108
          </span>
          <a
            href="https://www.bis.gov.in/?lang=en"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white flex items-center gap-1 text-slate-400 transition-colors"
            data-testid="bis-official-link"
          >
            bis.gov.in
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-5 shrink-0">
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            data-testid="header-logo-link"
          >
            <div className="flex flex-col border-l-2 border-[#B81D24] pl-3">
              <span className="font-bold text-lg text-[#0B132B] tracking-tight group-hover:text-[#B81D24] transition-colors">
                MANAK <span className="text-[#B81D24]">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 -mt-0.5 font-medium hidden sm:block">
                Standards for better specifications
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium" aria-label="Main navigation">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                isActive("/") || isActive("/dashboard")
                  ? "bg-[#0B132B] text-white font-semibold"
                  : "text-slate-600 hover:text-[#0B132B] hover:bg-[#F3EFEA]"
              }`}
              data-testid="nav-dashboard-link"
            >
              Dashboard
            </Link>
            <Link
              to="/new"
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                isActive("/new")
                  ? "bg-[#0B132B] text-white font-semibold"
                  : "text-slate-600 hover:text-[#0B132B] hover:bg-[#F3EFEA]"
              }`}
              data-testid="nav-new-requirement-link"
            >
              New analysis
            </Link>
            <Link
              to="/standards"
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                isActive("/standards")
                  ? "bg-[#0B132B] text-white font-semibold"
                  : "text-slate-600 hover:text-[#0B132B] hover:bg-[#F3EFEA]"
              }`}
              data-testid="nav-standards-catalog-link"
            >
              IS catalog
            </Link>
            <Link
              to="/compare"
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                isActive("/compare")
                  ? "bg-[#0B132B] text-white font-semibold"
                  : "text-slate-600 hover:text-[#0B132B] hover:bg-[#F3EFEA]"
              }`}
              data-testid="nav-compare-link"
            >
              Compare
            </Link>
            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                isActive("/history")
                  ? "bg-[#0B132B] text-white font-semibold"
                  : "text-slate-600 hover:text-[#0B132B] hover:bg-[#F3EFEA]"
              }`}
              data-testid="nav-history-link"
            >
              History
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {onOpenTransparency && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTransparency}
              className="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-700 bg-white border-[#E5DFD5] hover:bg-[#F3EFEA]"
              data-testid="scope-transparency-button"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Scope and sources</span>
            </Button>
          )}

          <Button
            onClick={() => navigate("/new")}
            size="sm"
            className="bg-[#B81D24] hover:bg-[#991319] text-white font-medium text-xs px-3.5 shadow-sm flex items-center gap-1.5"
            data-testid="header-new-requirement-cta"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New requirement</span>
          </Button>

          {/* User Profile Simulation */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E5DFD5]">
            <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white flex items-center justify-center text-xs font-semibold">
              <User className="w-4 h-4 text-slate-200" />
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#0B132B] leading-none">Demo session</span>
              <button onClick={onOpenTransparency} className="text-[11px] text-slate-500 mt-1 text-left hover:text-[#B81D24]" data-testid="header-demo-scope-button">Scope and sources</button>
            </div>
          </div>
        </div>
      </div>
      <nav className="xl:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto text-sm border-t border-[#E5DFD5] pt-2" aria-label="Compact navigation" data-testid="compact-navigation">
        {[["/dashboard", "Dashboard"], ["/new", "New analysis"], ["/standards", "IS catalog"], ["/compare", "Compare"], ["/history", "History"]].map(([path, label]) => <Link key={path} to={path} aria-current={location.pathname.startsWith(path) ? "page" : undefined} className={`whitespace-nowrap px-3 py-1.5 rounded-sm ${location.pathname.startsWith(path) ? "bg-[#FDF2F2] text-[#B81D24]" : "text-slate-600 hover:bg-[#FAF8F5]"}`} data-testid={`compact-nav-${path.slice(1)}`}>{label}</Link>)}
        {onOpenTransparency && <button onClick={onOpenTransparency} className="whitespace-nowrap px-3 py-1.5 text-slate-600" data-testid="compact-scope-button">Scope</button>}
      </nav>
    </header>
  );
};
