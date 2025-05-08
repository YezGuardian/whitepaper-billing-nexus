
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CompanySettings } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(1, {
    message: "Phone number is required.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  vatNumber: z.string().min(1, {
    message: "VAT number is required.",
  }),
  website: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    branchCode: z.string().min(1, "Branch code is required"),
    accountType: z.string().min(1, "Account type is required"),
  }),
});

const documentFormSchema = z.object({
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  quotePrefix: z.string().min(1, "Quote prefix is required"),
  invoiceTerms: z.string().min(1, "Invoice terms are required"),
  quoteTerms: z.string().min(1, "Quote terms are required"),
});

interface SettingsFormProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const SettingsForm = ({ settings, onSave }: SettingsFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      vatNumber: settings.vatNumber,
      website: settings.website,
      bankDetails: {
        bankName: settings.bankDetails.bankName,
        accountNumber: settings.bankDetails.accountNumber,
        branchCode: settings.bankDetails.branchCode,
        accountType: settings.bankDetails.accountType,
      },
    },
  });

  const documentForm = useForm<z.infer<typeof documentFormSchema>>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      invoicePrefix: settings.invoicePrefix,
      quotePrefix: settings.quotePrefix,
      invoiceTerms: settings.invoiceTerms,
      quoteTerms: settings.quoteTerms,
    },
  });

  function onSubmitCompany(data: z.infer<typeof companyFormSchema>) {
    setIsSubmitting(true);
    
    // Combine with existing settings
    const updatedSettings = {
      ...settings,
      ...data,
    };
    
    // Simulate API call
    setTimeout(() => {
      onSave(updatedSettings);
      setIsSubmitting(false);
      toast({
        title: "Company settings updated",
        description: "Your company information has been updated successfully.",
      });
    }, 500);
  }

  function onSubmitDocument(data: z.infer<typeof documentFormSchema>) {
    setIsSubmitting(true);
    
    // Combine with existing settings
    const updatedSettings = {
      ...settings,
      ...data,
    };
    
    // Simulate API call
    setTimeout(() => {
      onSave(updatedSettings);
      setIsSubmitting(false);
      toast({
        title: "Document settings updated",
        description: "Your document settings have been updated successfully.",
      });
    }, 500);
  }

  return (
    <Tabs defaultValue="company" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="company">Company Information</TabsTrigger>
        <TabsTrigger value="document">Document Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="company">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details that will appear on invoices and quotes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+27 00 000 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="www.yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ZA123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Your company address"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bank Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="bankDetails.bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="bankDetails.accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="bankDetails.branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Branch code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="bankDetails.accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Current, Savings, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="document">
        <Card>
          <CardHeader>
            <CardTitle>Document Settings</CardTitle>
            <CardDescription>
              Customize your invoice and quote settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...documentForm}>
              <form onSubmit={documentForm.handleSubmit(onSubmitDocument)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={documentForm.control}
                    name="invoicePrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Prefix</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={documentForm.control}
                    name="quotePrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Prefix</FormLabel>
                        <FormControl>
                          <Input placeholder="QTE-" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={documentForm.control}
                    name="invoiceTerms"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Default Invoice Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your default invoice terms"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={documentForm.control}
                    name="quoteTerms"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Default Quote Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your default quote terms"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsForm;
