import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Quote, Users, Settings, LogOut } from "lucide-react";
import Logo from './Logo';
import { cn } from "@/lib/utils";
const AppSidebar = () => {
  const location = useLocation();
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
  return <Sidebar>
      <SidebarHeader className="flex h-14 items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Logo className="text-white" variant="icon-only" />
          <span className="text-white text-xl font-semibold">Billing</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
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
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>;
};
export default AppSidebar;