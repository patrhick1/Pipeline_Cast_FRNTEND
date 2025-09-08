// client/src/components/Sidebar.tsx
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Search, 
  FolderOpen, 
  Lightbulb, 
  CheckCircle, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Mic, 
  Shield, 
  User,
  ClipboardList, 
  // BookOpen, // Icon for Media Kit if it becomes a top-level item again
  Users as ClientsIcon, 
  LayoutGrid,
  // Sparkles, // Icon for AI Content Tools if it becomes a top-level item
  Send,
  FileText as PitchTemplateIcon,
  Inbox as InboxIcon,
  X,
  CreditCard,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the type for a navigation item
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType; // Lucide icons are components
  roles?: Array<'client' | 'staff' | 'admin'>; // Specify which roles can see this
  // adminOnly?: boolean; // This can be removed if 'roles' covers it comprehensively
}

// --- CLIENT NAVIGATION ---
const clientNavigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ['client'] },
  { name: "Guest Profile Setup", href: "/profile-setup", icon: ClipboardList, roles: ['client'] },
  { name: "My Campaigns", href: "/my-campaigns", icon: FolderOpen, roles: ['client'] },
  { name: "Approve Matches", href: "/approvals", icon: CheckCircle, roles: ['client'] }, // Approvals page will filter for clients
  { name: "Pitch Outreach", href: "/pitch-outreach", icon: Send, roles: ['client'] }, // New pitch outreach for clients
  { name: "Inbox", href: "/inbox", icon: InboxIcon, roles: ['client'] }, // Nylas inbox
  { name: "Placements & Analytics", href: "/placement-tracking", icon: TrendingUp, roles: ['client'] },
];

// --- INTERNAL STAFF/ADMIN NAVIGATION ---
const internalNavigationItems: NavigationItem[] = [
  { name: "Team Dashboard", href: "/", icon: LayoutGrid, roles: ['staff', 'admin'] },
  { name: "Inbox", href: "/inbox", icon: InboxIcon, roles: ['staff', 'admin'] }, // Nylas inbox
  { name: "Client & Campaigns", href: "/campaign-management", icon: ClientsIcon, roles: ['staff', 'admin'] },
  { name: "Podcast Discovery", href: "/discover", icon: Search, roles: ['staff', 'admin'] },
  { name: "Pitch Outreach Hub", href: "/pitch-outreach", icon: Send, roles: ['staff', 'admin'] },
  { name: "Approval Queue", href: "/approvals", icon: CheckCircle, roles: ['staff', 'admin'] }, // Staff sees all relevant approvals
  { name: "Placements & Analytics", href: "/placement-tracking", icon: TrendingUp, roles: ['staff', 'admin'] },
  // { name: "Reporting", href: "/reports", icon: BarChart3, roles: ['staff', 'admin'] }, // Future
  { name: "Pitch Templates", href: "/pitch-templates", icon: PitchTemplateIcon, roles: ['staff', 'admin'] }, 
  { name: "Admin Panel", href: "/admin", icon: Shield, roles: ['admin'] },
];

const accountNavigationItems: NavigationItem[] = [
  { name: "My Settings", href: "/settings", icon: Settings, roles: ['client', 'staff', 'admin'] },
  { name: "Billing", href: "/billing", icon: CreditCard, roles: ['client'] },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // user contains role and person_id
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/auth/logout", {}),
    onSuccess: () => {
      queryClient.setQueryData(["/auth/me"], null);
      queryClient.clear(); // Clear all other query cache on logout
      setLocation("/login", { replace: true });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (authLoading) {
    // Optional: Add a slim loading state for the sidebar itself or rely on App.tsx's global loading
    return (
        <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="pt-6 space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded"></div>)}
                </div>
            </div>
        </aside>
    );
  }

  if (!isAuthenticated || !user) {
    return null; 
  }

  const userRoleLower = user.role?.toLowerCase(); // Convert to lowercase for comparisons

  let currentNavigation: NavigationItem[];
  if (userRoleLower === 'client') {
    currentNavigation = clientNavigationItems;
  } else if (userRoleLower === 'staff' || userRoleLower === 'admin') {
    // Filter items based on the specific staff/admin role
    currentNavigation = internalNavigationItems.filter(item => 
        !item.roles || item.roles.includes(userRoleLower as 'staff' | 'admin')
    );
  } else {
    currentNavigation = []; // Should not happen for authenticated users with known roles
  }
  
  // Filter account navigation based on role (though currently "Settings" is for all)
  const currentAccountNavigation = accountNavigationItems.filter(item => 
    !item.roles || item.roles.includes(userRoleLower as 'client' | 'staff' | 'admin')
  );

  return (
    <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Mic className="text-primary-foreground h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground group-hover:text-primary transition-colors">PGL</h1>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="px-3 py-4">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {userRoleLower === 'client' ? 'Client Menu' : 'Team Menu'}
          </p>
          <ul className="space-y-1.5">
            {currentNavigation.map((item) => {
              // For query params in href, we need to check base path
              const baseHref = item.href.split('?')[0];
              const isActive = location === baseHref || location.startsWith(baseHref + '/');
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-gray-500 group-hover:text-sidebar-accent-foreground'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-auto p-3 border-t border-sidebar-border">
           <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</p>
          <ul className="space-y-1.5">
            {currentAccountNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-gray-500 group-hover:text-sidebar-accent-foreground'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3 py-2.5 text-sm font-medium"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-sidebar-accent-foreground" />
                {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}