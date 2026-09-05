"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, MapPin, PackageCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { SmoothLink } from "./SmoothLink";

export function ProfileMenu() {
  const { authed, user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = authed
    ? [
        { label: "Your profile", href: "/account", icon: <UserRound size={15} /> },
        { label: "Orders", href: "/account", icon: <PackageCheck size={15} /> },
        { label: "Saved addresses", href: "/account", icon: <MapPin size={15} /> }
      ]
    : [
        { label: "Log in", href: "/login", icon: <UserRound size={15} /> },
        { label: "Create account", href: "/signup", icon: <UserRound size={15} /> }
      ];

  return (
    <div
      className="profile-menu desktop-only"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" className="header-action" aria-label={authed ? "Account" : "Log in"} aria-expanded={open}>
        <UserRound size={18} />
        <ChevronDown size={12} className={`profile-menu__caret ${open ? "is-open" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="profile-menu__dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {authed && user && (
              <div className="profile-menu__head">
                <strong>{user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.email}</strong>
                <span>{user.email}</span>
              </div>
            )}
            {items.map((item) => (
              <SmoothLink key={item.label} href={item.href} className="profile-menu__item" onClick={() => setOpen(false)}>
                {item.icon} {item.label}
              </SmoothLink>
            ))}
            {authed && (
              <button
                type="button"
                className="profile-menu__item profile-menu__logout"
                onClick={async () => { setOpen(false); await signOut(); router.push("/login"); }}
              >
                <LogOut size={15} /> Log out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}