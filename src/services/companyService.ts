
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "@/types";

// Company Settings
export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
    
    if (!data) {
      // Return default settings if no data found
      return {
        name: '',
        email: '',
        phone: '',
        address: '',
        vatNumber: '',
        website: '',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          branchCode: '',
          accountType: '',
        },
        invoicePrefix: 'INV',
        quotePrefix: 'QT',
        invoiceTerms: '',
        quoteTerms: ''
      };
    }
    
    return {
      name: data.company_name,
      email: data.company_email,
      phone: data.company_phone || '',
      address: data.company_address,
      vatNumber: data.company_vat_number || '',
      website: data.company_website || '',
      bankDetails: {
        bankName: data.bank_name || '',
        accountNumber: data.bank_account_number || '',
        branchCode: data.bank_branch_code || '',
        accountType: data.bank_account_type || '',
      },
      invoicePrefix: data.invoice_prefix,
      quotePrefix: data.quote_prefix,
      invoiceTerms: data.invoice_terms || '',
      quoteTerms: data.quote_terms || ''
    };
  } catch (error) {
    console.error('Error in getCompanySettings:', error);
    throw error;
  }
};

export const updateCompanySettings = async (settings: CompanySettings): Promise<CompanySettings> => {
  try {
    const { data: existingData } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    const dbData = {
      company_name: settings.name,
      company_email: settings.email,
      company_phone: settings.phone,
      company_address: settings.address,
      company_vat_number: settings.vatNumber,
      company_website: settings.website,
      bank_name: settings.bankDetails?.bankName,
      bank_account_number: settings.bankDetails?.accountNumber,
      bank_branch_code: settings.bankDetails?.branchCode,
      bank_account_type: settings.bankDetails?.accountType,
      invoice_prefix: settings.invoicePrefix,
      quote_prefix: settings.quotePrefix,
      invoice_terms: settings.invoiceTerms,
      quote_terms: settings.quoteTerms
    };

    let result;
    
    if (existingData) {
      // Update existing settings
      const { data, error } = await supabase
        .from('company_settings')
        .update(dbData)
        .eq('id', existingData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating company settings:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('company_settings')
        .insert([dbData])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting company settings:', error);
        throw error;
      }
      
      result = data;
    }
    
    return settings;
  } catch (error) {
    console.error('Error in updateCompanySettings:', error);
    throw error;
  }
};
