
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Client, Quote, InvoiceItem } from "@/types";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the schema for item validation
const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative"),
  taxRate: z.coerce.number().nonnegative("Tax rate cannot be negative"),
});

// Define the schema for the form
const quoteFormSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required"),
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.date(),
  expiryDate: z.date(),
  items: z.array(quoteItemSchema).nonempty("At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
});

interface QuoteFormProps {
  quote?: Quote;
  clients: Client[];
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  companySettings: { quotePrefix: string; quoteTerms: string };
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  clients,
  onSave,
  onCancel,
  companySettings,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up the form with the schema and default values
  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: quote
      ? {
          quoteNumber: quote.quoteNumber,
          clientId: quote.client.id,
          issueDate: quote.issueDate,
          expiryDate: quote.expiryDate,
          items: quote.items,
          notes: quote.notes || "",
          terms: quote.terms || "",
          status: quote.status,
        }
      : {
          quoteNumber: `${companySettings.quotePrefix}${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
          clientId: "",
          issueDate: new Date(),
          expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          items: [
            {
              id: uuidv4(),
              description: "",
              quantity: 1,
              unitPrice: 0,
              taxRate: 15, // 15% VAT in South Africa
            },
          ],
          notes: "",
          terms: companySettings.quoteTerms,
          status: "draft" as const,
        },
  });

  // Set up the fields array for quote items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch the items to calculate totals
  const items = form.watch("items");
  
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      return acc + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
  };

  const calculateTaxTotal = () => {
    return items.reduce((acc, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return acc + (itemTotal * (item.taxRate || 0)) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxTotal();
  };

  const onSubmit = (data: z.infer<typeof quoteFormSchema>) => {
    setIsSubmitting(true);

    // Find the selected client
    const selectedClient = clients.find(client => client.id === data.clientId);
    
    if (!selectedClient) {
      console.error("Client not found");
      setIsSubmitting(false);
      return;
    }

    // Prepare the items with calculated values
    const preparedItems = data.items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const taxAmount = (itemTotal * item.taxRate) / 100;
      
      return {
        id: item.id || uuidv4(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount,
        total: itemTotal + taxAmount,
      };
    });

    const subtotal = calculateSubtotal();
    const taxTotal = calculateTaxTotal();
    const total = calculateTotal();

    // Create the quote object
    const quoteData: Quote = {
      id: quote?.id || uuidv4(),
      quoteNumber: data.quoteNumber,
      client: selectedClient,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      items: preparedItems,
      notes: data.notes,
      terms: data.terms,
      subtotal,
      taxTotal,
      total,
      status: data.status,
    };

    // Simulate API call
    setTimeout(() => {
      onSave(quoteData);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quote Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="quoteNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Quote Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items</h3>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                append({
                  id: uuidv4(),
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  taxRate: 15,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="resize-none"
                              rows={1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              step="1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3 md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.taxRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax %</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1 flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quote Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax:</span>
              <span>R {calculateTaxTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>R {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notes to the client"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Terms and conditions"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : quote ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuoteForm;
