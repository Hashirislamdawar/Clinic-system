import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Activity,
  ScrollText,
  Search,
  Bell,
  Menu,
  LogOut,
} from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout, can } = useAuth();

  const sections = [
    {
      group: "Overview",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      group: "Management",
      items: [
        { to: "/patients", label: "Patients", icon: Users },
        { to: "/doctors", label: "Doctors", icon: Stethoscope },
        { to: "/appointments", label: "Appointments", icon: CalendarDays },
      ],
    },
  ];
  if (can("Admin")) {
    sections.push({ group: "Admin", items: [{ to: "/audit", label: "Audit Log", icon: ScrollText }] });
  }

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Activity size={20} /></span>
          <div>
            <div className="brand-name">CityClinic</div>
            <div className="brand-sub">Care Platform</div>
          </div>
        </div>

        <nav>
          {sections.map((section) => (
            <div key={section.group}>
              <div className="nav-group-label">{section.group}</div>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} className="nav-link" onClick={() => setOpen(false)}>
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <Avatar name={user?.full_name || "User"} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nm">{user?.full_name}</div>
              <div className="rl">{user?.role}</div>
            </div>
            <button className="side-logout" onClick={logout} title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="searchbox">
            <Search size={16} />
            <input placeholder="Search patients, doctors, appointments…" aria-label="Global search" />
            <kbd>⌘K</kbd>
          </div>
          <div className="spacer" />
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <Avatar name={user?.full_name || "User"} size={38} />
        </header>

        <div className="page">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <ErrorBoundary key={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
