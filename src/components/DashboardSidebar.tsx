"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Settings, 
  LogOut,
  User,
  BarChart3,
  Bell,
  MessageSquare,
  Tag,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { signOutClient } from "@/lib/sign-out";
import ppLogo from "@/assets/pp logo.png";
import { useState } from "react";

interface DashboardSidebarProps {
  userRole?: 'owner' | 'admin';
}

export const DashboardSidebar = ({ userRole = 'owner' }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ownerLinks = [
    { href: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/owner/venues", label: "My Venues", icon: Building2 },
    { href: "/owner/bookings", label: "Bookings", icon: Calendar },
    { href: "/owner/special-offers", label: "Special Offers", icon: Tag },
    { href: "/owner/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/owner/profile", label: "Profile", icon: User },
    { href: "/owner/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/venues", label: "Manage Venues", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/contacts", label: "Contact Submissions", icon: MessageSquare },
    { href: "/admin/review-reports", label: "Review Reports", icon: AlertTriangle },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const links = userRole === 'admin' ? adminLinks : ownerLinks;

  const handleSignOut = () => {
    signOutClient('/');
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="inline-block" onClick={() => isMobile && setMobileOpen(false)}>
          <img src={ppLogo.src} alt="PakPlay" className="h-10 sm:h-12 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-card border-b border-border flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <SidebarContent isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="ml-4">
          <img src={ppLogo.src} alt="PakPlay" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-screen w-64 bg-card border-r border-border">
        <SidebarContent />
    </div>
    </>
  );
};

