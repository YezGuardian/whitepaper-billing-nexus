
import MainLayout from '@/layouts/MainLayout';
import SettingsForm from '@/components/SettingsForm';
import { companySettings as defaultSettings } from '@/data/mockData';
import { useState } from 'react';
import { CompanySettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

const SettingsPage = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultSettings);

  const handleSaveSettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
  };

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
          <SettingsForm settings={companySettings} onSave={handleSaveSettings} />
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default SettingsPage;
