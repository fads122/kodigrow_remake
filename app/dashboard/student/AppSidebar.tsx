"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Home,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  Calendar,
  Brain,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/app/components/ThemeToggle"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const menuItems = [
    { href: "/dashboard/student", icon: Home, label: "Dashboard" },
    { href: "/dashboard/student/courses", icon: BookOpen, label: "My Courses" },
    { href: "/dashboard/student/flashcards", icon: Brain, label: "Flashcards" },
    { href: "/dashboard/student/assignments", icon: FileText, label: "Assignments" },
    { href: "/dashboard/student/schedule", icon: Calendar, label: "Schedule" },
  ]

  const settingsItems = [
    { href: "/dashboard/student/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <GraduationCap className="h-6 w-6 text-sidebar-primary shrink-0" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">KodiGrow</span>
        </div>
        <p className="text-sm text-sidebar-foreground/70 mt-1 group-data-[collapsible=icon]:hidden">Student Dashboard</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
                  <span className="text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Theme</span>
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

