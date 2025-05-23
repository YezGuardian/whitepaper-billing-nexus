import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BarChart, Activity, Users, FileText, FileClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/layouts/MainLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import StatCard from "@/components/StatCard";
import { getInvoices, getClients, getQuotes } from '@/services/supabaseService';
import { Invoice, Client, Quote } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DashboardPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesData, clientsData, quotesData] = await Promise.all([
          getInvoices(),
          getClients(),
          getQuotes()
        ]);
        
        setInvoices(invoicesData);
        setClients(clientsData);
        setQuotes(quotesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Calculate statistics from real data
  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((acc, invoice) => acc + invoice.total, 0);
  
  const outstandingAmount = invoices
    .filter(invoice => ['sent', 'overdue'].includes(invoice.status))
    .reduce((acc, invoice) => acc + invoice.total, 0);
  
  const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue').length;
  const pendingQuotes = quotes.filter(quote => quote.status === 'sent').length;

  // Get current month and prepare monthly data
  const currentMonth = new Date().getMonth();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Calculate real monthly revenue for the last 6 months
  const revenueData = Array(6).fill(0).map((_, index) => {
    const monthIndex = (currentMonth - 5 + index + 12) % 12;
    const monthStart = new Date(new Date().getFullYear(), monthIndex, 1);
    const monthEnd = new Date(new Date().getFullYear(), monthIndex + 1, 0);
    
    const monthlyRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoice.status === 'paid' &&
               invoiceDate >= monthStart &&
               invoiceDate <= monthEnd;
      })
      .reduce((acc, invoice) => acc + invoice.total, 0);

    return {
      name: months[monthIndex],
      revenue: monthlyRevenue
    };
  });

  // Count invoices by status
  const invoiceStatusCount = {
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
  };

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  // Upcoming recurring invoices
  const upcomingRecurring = invoices
    .filter(invoice => invoice.recurrence !== 'none' && invoice.nextGenerationDate)
    .sort((a, b) => 
      new Date(a.nextGenerationDate as Date).getTime() - 
      new Date(b.nextGenerationDate as Date).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={`R ${totalRevenue.toFixed(2)}`} 
          icon={<BarChart />}
        />
        <StatCard 
          title="Outstanding Amount" 
          value={`R ${outstandingAmount.toFixed(2)}`} 
          icon={<Activity />}
        />
        <StatCard 
          title="Clients" 
          value={clients.length} 
          icon={<Users />}
        />
        <StatCard 
          title="Overdue Invoices" 
          value={overdueInvoices} 
          description={`${pendingQuotes} pending quotes`}
          icon={<FileText />} 
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue for the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={revenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1037D0" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>
              Overview of invoice statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 space-y-4">
              {Object.entries(invoiceStatusCount).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className="w-1/3 font-medium capitalize">{status}</div>
                  <div className="w-2/3 flex items-center gap-2">
                    <div 
                      className="h-3 rounded-full bg-wps-blue" 
                      style={{ 
                        width: `${(count / invoices.length) * 100}%`,
                        opacity: status === 'paid' ? 1 : 
                                status === 'sent' ? 0.8 : 
                                status === 'draft' ? 0.6 : 
                                status === 'overdue' ? 0.4 : 0.2
                      }}
                    ></div>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                </div>
              ))}

              <div className="pt-4 text-sm text-gray-500">
                Total Invoices: {invoices.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{invoice.client.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R {invoice.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}

              {recentInvoices.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No recent invoices
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Recurring Invoices</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRecurring.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{invoice.client.name}</div>
                    <div className="text-sm text-gray-500">{invoice.recurrence}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R {invoice.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {format(
                        new Date(invoice.nextGenerationDate as Date), 
                        'MMM d, yyyy'
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {upcomingRecurring.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No upcoming recurring invoices
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
