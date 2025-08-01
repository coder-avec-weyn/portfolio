import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  MessageSquare,
  BarChart3,
  Palette,
  FileText,
  LogOut,
  Eye,
  Mail,
  Calendar,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_flow: string;
  status: string;
  created_at: string;
}

interface AnalyticsData {
  id: string;
  user_flow: string;
  page_path: string;
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    employerViews: 0,
    portfolioViews: 0,
    unreadMessages: 0,
  });
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch contact submissions
      const { data: contactData } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch analytics
      const { data: analyticsData } = await supabase
        .from("visitor_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (contactData) setContacts(contactData);
      if (analyticsData) {
        setAnalytics(analyticsData);

        // Calculate stats
        const employerViews = analyticsData.filter(
          (item) => item.user_flow === "employer",
        ).length;
        const portfolioViews = analyticsData.filter(
          (item) => item.user_flow === "viewer",
        ).length;
        const unreadMessages =
          contactData?.filter((item) => item.status === "unread").length || 0;

        setStats({
          totalVisitors: analyticsData.length,
          employerViews,
          portfolioViews,
          unreadMessages,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status: "read" })
        .eq("id", id);

      if (error) throw error;

      setContacts(
        contacts.map((contact) =>
          contact.id === id ? { ...contact, status: "read" } : contact,
        ),
      );

      toast({
        title: "Message marked as read",
        description: "The message status has been updated.",
      });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Portfolio Management System
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8"
      >
        {/* Stats Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Visitors
                  </p>
                  <p className="text-3xl font-bold">{stats.totalVisitors}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Employer Views
                  </p>
                  <p className="text-3xl font-bold">{stats.employerViews}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Portfolio Views
                  </p>
                  <p className="text-3xl font-bold">{stats.portfolioViews}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Unread Messages
                  </p>
                  <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {contact.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {contact.email}
                              </p>
                            </div>
                            <Badge
                              variant={
                                contact.user_flow === "employer"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {contact.user_flow}
                            </Badge>
                            <Badge
                              variant={
                                contact.status === "unread"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {contact.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(
                                contact.created_at,
                              ).toLocaleDateString()}
                            </span>
                            {contact.status === "unread" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(contact.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">
                            {contact.subject}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {contact.message}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Visitor Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.slice(0, 20).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              item.user_flow === "employer"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.user_flow}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {item.page_path}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {analytics.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No analytics data yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Content management features coming soon</p>
                    <p className="text-sm">
                      Manage projects, skills, and experiences
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Theme Studio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Theme customization features coming soon</p>
                    <p className="text-sm">
                      Customize colors, fonts, and animations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
