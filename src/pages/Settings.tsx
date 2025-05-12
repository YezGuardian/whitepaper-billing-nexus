
import MainLayout from '@/layouts/MainLayout';
import SettingsForm from '@/components/SettingsForm';
import { useState, useEffect } from 'react';
import { CompanySettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanySettings, updateCompanySettings } from '@/services/supabaseService';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company settings from Supabase
  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      toast({
        title: 'Settings updated',
        description: 'Your settings have been updated successfully.',
      });
      
      // Invalidate queries that depend on settings data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSaveSettings = (settings: CompanySettings) => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <Skeleton className="h-[600px] w-full" />
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
            <SettingsForm 
              settings={companySettings} 
              onSave={handleSaveSettings} 
              isSaving={updateMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default SettingsPage;
