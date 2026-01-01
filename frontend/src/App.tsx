import { NavLink, Route, Routes } from "react-router-dom";
import OrganizationsPage from "./pages/OrganizationsPage";
import SendReferralPage from "./pages/SendReferralPage";
import IncomingReferralsPage from "./pages/IncomingReferralsPage";
import CoveragePage from "./pages/CoveragePage";
import { cn } from "./lib/utils";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        <header className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Referral Management System
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage healthcare organizations and referrals
          </p>
        </header>

        <nav className="flex gap-2 border-b">
          <NavLink
            to="/organizations"
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-t-md border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )
            }
          >
            Organizations
          </NavLink>
          <NavLink
            to="/send-referral"
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-t-md border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )
            }
          >
            Send Referral
          </NavLink>
          <NavLink
            to="/incoming-referrals"
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-t-md border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )
            }
          >
            Incoming Referrals
          </NavLink>
          <NavLink
            to="/coverage"
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-t-md border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )
            }
          >
            Coverage
          </NavLink>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<OrganizationsPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/send-referral" element={<SendReferralPage />} />
            <Route
              path="/incoming-referrals"
              element={<IncomingReferralsPage />}
            />
            <Route path="/coverage" element={<CoveragePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
