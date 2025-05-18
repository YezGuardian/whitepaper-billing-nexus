
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/layouts/MainLayout';
import SettingsForm from '@/components/SettingsForm';
import { CompanySettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Loader } from 'lucide-react';
import { getCompanySettings, updateCompanySettings } from '@/services/supabaseService';

const SettingsPage = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error fetching company settings:', error);
        toast({
          title: 'Failed to load settings',
          description: 'There was an error loading your company settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (settings: CompanySettings) => {
    try {
      await updateCompanySettings(settings);
      setCompanySettings(settings);
      toast({
        title: 'Settings updated',
        description: 'Your company settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'There was an error saving your company settings.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 mr-2" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your company information and document settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companySettings && (
            <SettingsForm settings={companySettings} onSave={handleSaveSettings} />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default SettingsPage;
