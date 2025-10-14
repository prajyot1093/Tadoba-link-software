import { Home, Map, MessageSquare, PawPrint, Calendar, Plus, Bell, Camera, BarChart3, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const { user, isDepartment } = useAuth();
  const [location] = useLocation();

  const departmentItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Surveillance",
      url: "/surveillance",
      icon: Camera,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Animal Tracker",
      url: "/animals",
      icon: PawPrint,
    },
    {
      title: "Live Map",
      url: "/map",
      icon: Map,
    },
    {
      title: "AI Chat",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const localItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Surveillance",
      url: "/surveillance",
      icon: Camera,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Safe Zones",
      url: "/safe-zones",
      icon: Map,
    },
    {
      title: "Tiger Tracker",
      url: "/tigers",
      icon: PawPrint,
    },
    {
      title: "AI Assistant",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      title: "Safari Booking",
      url: "/safari",
      icon: Calendar,
    },
  ];

  const items = isDepartment ? departmentItems : localItems;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">Tadoba</h2>
            <p className="text-xs text-muted-foreground">Smart Conservation</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-3 py-2">
            {isDepartment ? "Department Portal" : "Local Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`sidebar-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url} className="hover-elevate active-elevate-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="user-name-display">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-email-display">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/api/logout'}
            data-testid="button-logout"
            className="shrink-0"
          >
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
