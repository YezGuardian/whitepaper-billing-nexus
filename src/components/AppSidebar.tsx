
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Quote, Users, Settings, LogOut, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { signOut } from '@/services/authService';
import Logo from './Logo';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const menuItems = [{
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  }, {
    title: "Invoices",
    path: "/invoices",
    icon: FileText
  }, {
    title: "Quotes",
    path: "/quotes",
    icon: Quote
  }, {
    title: "Clients",
    path: "/clients",
    icon: Users
  }, {
    title: "Settings",
    path: "/settings",
    icon: Settings
  }];
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully"
      });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return <Sidebar>
      <SidebarHeader className="flex h-14 items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Logo className="text-white" variant="icon-only" />
          <span className="text-white text-xl font-semibold">Billing</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {user && (
            <div className="px-3 py-2 mb-4">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-sidebar-accent bg-opacity-20">
                <User className="h-5 w-5 text-sidebar-accent-foreground" />
                <div className="text-sm">
                  <div className="font-medium text-sidebar-accent-foreground">{user.user_metadata.full_name || user.email}</div>
                  <div className="text-xs text-sidebar-foreground opacity-70">
                    {user.user_metadata.username || user.email}
                  </div>
                </div>
              </div>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className={cn("w-full flex items-center gap-3 px-3", location.pathname === item.path ? "bg-sidebar-accent text-sidebar-accent-foreground" : "")}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-2">
        <button 
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>;
};

export default AppSidebar;
