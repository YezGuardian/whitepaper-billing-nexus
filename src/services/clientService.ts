
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types";

export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform data to match the frontend model
    return data.map(client => ({
      id: client.id,
      name: client.name,
      contactPerson: client.contact_person || undefined,
      email: client.email,
      phone: client.phone || undefined,
      address: client.address,
      vatNumber: client.vat_number || undefined
    }));
  } catch (error) {
    console.error('Error in getClients:', error);
    return [];
  }
};

export const createClient = async (client: Client): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        id: client.id,
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        vat_number: client.vatNumber
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address,
      vatNumber: data.vat_number || undefined
    };
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
};

export const updateClient = async (id: string, client: Client): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        vat_number: client.vatNumber
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address,
      vatNumber: data.vat_number || undefined
    };
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteClient:', error);
    throw error;
  }
};
