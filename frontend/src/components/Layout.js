import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, FileText, PlusCircle } from "lucide-react";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header 
        data-testid="app-header" 
        className="sticky top-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--bg-card)/.8] border-b border-[var(--border-light)]"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <a 
            data-testid="brand-home-link" 
            href="/" 
            className="h4 text-[color:var(--text-primary)] hover:text-[color:var(--brand)] transition-colors"
          >
            Talent Fluency
          </a>
          
          <nav data-testid="main-nav" className="ml-auto hidden md:flex items-center gap-2">
            <button
              data-testid="nav-dashboard-link"
              onClick={() => navigate("/dashboard")}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                isActive("/dashboard") || location.pathname === "/"
                  ? "bg-[color:var(--brand-100)] text-[color:var(--brand)]"
                  : "hover:bg-[color:var(--brand-50)] text-[color:var(--text-secondary)]"
              }`}
            >
              <Users size={18} />
              Dashboard
            </button>
            
            <button
              data-testid="nav-reports-link"
              onClick={() => navigate("/reports")}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                isActive("/reports")
                  ? "bg-[color:var(--brand-100)] text-[color:var(--brand)]"
                  : "hover:bg-[color:var(--brand-50)] text-[color:var(--text-secondary)]"
              }`}
            >
              <FileText size={18} />
              Reports
            </button>
          </nav>
          
          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
          
          <Button 
            data-testid="nav-new-eval-button"
            onClick={() => navigate("/dashboard")}
            className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]"
          >
            <PlusCircle size={18} />
            New Evaluation
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;