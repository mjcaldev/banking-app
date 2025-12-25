"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { createTransfer } from "@/lib/actions/dwolla.actions";
import { createTransaction } from "@/lib/actions/transaction.actions";
import { getBank, getBankByAccountId } from "@/lib/actions/user.actions";
import { decryptId } from "@/lib/utils";

import { BankDropdown } from "./BankDropdown";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Transfer note is required").max(100, "Transfer note is too long"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0.01;
    }, "Amount must be at least $0.01")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 1000000;
    }, "Amount cannot exceed $1,000,000")
    .refine((val) => {
      // Check for valid decimal format (max 2 decimal places)
      const decimalParts = val.split('.');
      return decimalParts.length <= 2 && (decimalParts[1]?.length || 0) <= 2;
    }, "Amount can have at most 2 decimal places"),
  senderBank: z.string().min(1, "Please select a source bank account"),
  sharableId: z.string().min(1, "Please enter a valid shareable ID"),
});

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: "",
      senderBank: "",
      sharableId: "",
    },
  });

  const submit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Validate amount is a valid number
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        form.setError("amount", { message: "Please enter a valid amount" });
        setIsLoading(false);
        return;
      }

      // Decode and validate receiver account
      let receiverAccountId: string;
      try {
        receiverAccountId = decryptId(data.sharableId);
      } catch (error) {
        form.setError("sharableId", { message: "Invalid shareable ID format" });
        setIsLoading(false);
        return;
      }

      const receiverBank = await getBankByAccountId({
        accountId: receiverAccountId,
      });

      if (!receiverBank) {
        form.setError("sharableId", { message: "Receiver account not found" });
        setIsLoading(false);
        return;
      }

      const senderBank = await getBank({ documentId: data.senderBank });

      if (!senderBank) {
        form.setError("senderBank", { message: "Sender bank account not found" });
        setIsLoading(false);
        return;
      }

      // Prevent transferring to the same account
      if (senderBank.accountId === receiverAccountId) {
        form.setError("sharableId", { message: "Cannot transfer to the same account" });
        setIsLoading(false);
        return;
      }

      const transferParams = {
        sourceFundingSourceUrl: senderBank.fundingSourceUrl,
        destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
        amount: data.amount,
      };

      // create transfer
      const transfer = await createTransfer(transferParams);

      if (!transfer) {
        form.setError("root", { message: "Transfer failed. Please try again." });
        setIsLoading(false);
        return;
      }

      // create transfer transaction
      const transaction = {
        name: data.name,
        amount: data.amount,
        senderId: typeof senderBank.userId === 'string' ? senderBank.userId : senderBank.userId?.$id || '',
        senderBankId: senderBank.$id,
        receiverId: typeof receiverBank.userId === 'string' ? receiverBank.userId : receiverBank.userId?.$id || '',
        receiverBankId: receiverBank.$id,
        email: data.email,
      };

      const newTransaction = await createTransaction(transaction);

      if (newTransaction) {
        form.reset();
        router.push("/");
      } else {
        form.setError("root", { message: "Transaction recorded but transfer may have failed. Please verify." });
      }
    } catch (error) {
      console.error("Submitting create transfer request failed: ", error);
      form.setError("root", { 
        message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
        <FormField
          control={form.control}
          name="senderBank"
          render={() => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Select Source Bank
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Select the bank account you want to transfer funds from
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <BankDropdown
                      accounts={accounts}
                      setValue={form.setValue}
                      otherStyles="!w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Transfer Note (Optional)
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Please provide any additional information or instructions
                    related to the transfer
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Textarea
                      placeholder="Write a short note here"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_form-details">
          <h2 className="text-18 font-semibold text-gray-900">
            Bank account details
          </h2>
          <p className="text-16 font-normal text-gray-600">
            Enter the bank account details of the recipient
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Recipient&apos;s Email Address
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="ex: johndoe@gmail.com"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sharableId"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-5 pt-6">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Receiver&apos;s Plaid Sharable Id
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="Enter the public account number"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="border-y border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Amount
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="ex: 5.00"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-14 text-red-500 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="payment-transfer_btn-box">
          <Button type="submit" className="payment-transfer_btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> &nbsp; Sending...
              </>
            ) : (
              "Transfer Funds"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;