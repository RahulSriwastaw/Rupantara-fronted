"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, HelpCircle, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEarningsStore } from "@/store/earningsStore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function CreatorEarningsPage() {
  const [timeframe, setTimeframe] = useState("month");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "upi">("upi");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "savings" as "savings" | "current",
    panNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const {
    totalEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    pendingWithdrawal,
    availableBalance,
    transactions,
    templateEarnings,
    monthlyTrend,
    isLoading,
    fetchEarnings,
    fetchTransactions,
    requestWithdrawal
  } = useEarningsStore();

  useEffect(() => {
    fetchEarnings();
    fetchTransactions();
  }, [fetchEarnings, fetchTransactions]);

  // Calculate percentage change
  const percentageChange = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
    : 0;
  const isPositive = percentageChange >= 0;

  const displayAvailableBalance = availableBalance || (totalEarnings - pendingWithdrawal);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > displayAvailableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can withdraw maximum $${displayAvailableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (withdrawMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        toast({
          title: "Invalid UPI ID",
          description: "Please enter a valid UPI ID (e.g., yourname@paytm)",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        toast({
          title: "Incomplete Details",
          description: "Please fill all bank account details",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    const success = await requestWithdrawal(
      amount,
      withdrawMethod,
      withdrawMethod === "bank" ? bankDetails : undefined,
      withdrawMethod === "upi" ? upiId : undefined
    );

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Withdrawal Request Submitted",
        description: `$${amount.toFixed(2)} withdrawal to ${withdrawMethod === "upi" ? upiId : bankDetails.bankName} is being processed`,
      });

      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      setUpiId("");
      setBankDetails({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountType: "savings",
        panNumber: "",
      });
    } else {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Chart data
  const chartData = monthlyTrend.length > 0
    ? monthlyTrend.map(m => m.amount)
    : [20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 65, 75, 68, 80, 72, 85, 75, 90, 78, 95, 80, 100, 85, 105, 88, 110, 90, 115, 92, 120, 95];

  const maxChartValue = Math.max(...chartData, 1);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Earnings Overview</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        <Button onClick={() => setShowWithdrawDialog(true)} size="sm" className="sm:size-default">
          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Request Withdrawal</span>
          <span className="sm:hidden">Withdraw</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Lifetime Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">${totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">${thisMonthEarnings.toFixed(2)}</div>
            {percentageChange !== 0 && (
              <Badge className={`mt-2 text-xs ${isPositive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">${displayAvailableBalance.toFixed(2)}</div>
            {pendingWithdrawal > 0 && (
              <Badge className="mt-2 text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                ${pendingWithdrawal.toFixed(2)} pending
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Trend */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Earnings Trend</CardTitle>
            <div className="flex gap-0.5 sm:gap-1 bg-secondary rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
              {["Day", "Week", "Month", "Year"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period.toLowerCase())}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all ${timeframe === period.toLowerCase()
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Earnings this month</p>
              <p className="text-xl sm:text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</p>
            </div>
            {percentageChange !== 0 && (
              <Badge className={`text-xs ${isPositive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Graph */}
          <div className="h-32 sm:h-40 md:h-48 w-full rounded-xl bg-gradient-to-t from-primary/20 to-transparent flex items-end justify-between px-1 sm:px-2 pb-1 sm:pb-2 gap-0.5 sm:gap-1">
            {chartData.slice(-31).map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-primary transition-all hover:bg-primary/80"
                style={{ height: `${(height / maxChartValue) * 100}%` }}
                title={`Day ${i + 1}: $${height.toFixed(2)}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown by Template */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg">Earnings Breakdown by Template</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {templateEarnings.length > 0 ? (
              templateEarnings.map((template, index) => (
                <div
                  key={template.templateId}
                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors gap-2 sm:gap-4"
                >
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-${400 + index * 100} to-blue-${500 + index * 100} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{template.templateName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {template.uses} uses
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm sm:text-base md:text-lg">${template.earnings.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No earnings data yet. Start creating templates to earn!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="sm" onClick={() => { fetchTransactions(); setShowTransactionHistory(true); }}>
        View Full Transaction History
      </Button>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw your earnings to UPI ID or Bank Account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Available Balance */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold">${displayAvailableBalance.toFixed(2)}</p>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={displayAvailableBalance}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: $10 | Maximum: ${displayAvailableBalance.toFixed(2)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWithdrawMethod("upi")}
                  className={`p-3 rounded-lg border-2 transition-all ${withdrawMethod === "upi"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <Smartphone className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm font-medium">UPI ID</p>
                </button>
                <button
                  onClick={() => setWithdrawMethod("bank")}
                  className={`p-3 rounded-lg border-2 transition-all ${withdrawMethod === "bank"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <CreditCard className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm font-medium">Bank Account</p>
                </button>
              </div>
            </div>

            {/* UPI ID Form */}
            {withdrawMethod === "upi" && (
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@paytm / yourname@phonepe / yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID (e.g., yourname@paytm)
                </p>
              </div>
            )}

            {/* Bank Account Form */}
            {withdrawMethod === "bank" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Enter account holder name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Enter bank name"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="Enter IFSC code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={bankDetails.accountType}
                    onValueChange={(value: "savings" | "current") =>
                      setBankDetails({ ...bankDetails, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number (Optional)</Label>
                  <Input
                    id="panNumber"
                    placeholder="Enter PAN number"
                    value={bankDetails.panNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Withdrawal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              View all your earnings and withdrawal transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              transaction.amount > 0 ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {transaction.type === "creator_earning"
                              ? "Earning"
                              : transaction.type === "withdrawal"
                                ? "Withdrawal"
                                : transaction.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        {transaction.relatedTemplateId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Template ID: {transaction.relatedTemplateId}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold ${transaction.amount > 0
                              ? "text-green-500"
                              : "text-red-500"
                            }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ${transaction.balanceAfter.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTransactionHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
