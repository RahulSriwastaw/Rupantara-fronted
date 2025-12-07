"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/store/walletStore";
import { paymentsApi } from "@/services/api";

const pricingPlans = [
  {
    id: "mini",
    name: "Mini",
    price: "₹800",
    period: "/month",
    points: "500 Points",
    features: [
      "500 AI Generation Points",
      "Access to Premium Templates",
      "Basic Analytics",
      "Email Support",
      "Up to 10 Templates"
    ],
    tag: null,
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,000",
    period: "/month",
    points: "1,500 Points",
    features: [
      "1,500 AI Generation Points",
      "Access to All Templates",
      "Advanced Analytics",
      "Priority Email Support",
      "Up to 50 Templates",
      "Early Access to New Features"
    ],
    tag: "Most Popular",
    popular: true
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: "₹4,000",
    period: "/month",
    points: "5,000 Points",
    features: [
      "5,000 AI Generation Points",
      "Access to All Templates",
      "Advanced Analytics & Insights",
      "24/7 Priority Support",
      "Unlimited Templates",
      "Early Access to New Features",
      "Custom Template Requests",
      "Dedicated Account Manager"
    ],
    tag: "Best Value",
    popular: false
  }
];

export default function ProPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      toast({
        title: "Promo code applied!",
        description: `Promo code "${promoCode}" has been applied`,
      });
    }
  };

  const handleBuyNow = async (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan.id);
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await paymentsApi.createOrder(plan.id, 'razorpay');

      // Initialize Razorpay
      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount * 100,
        currency: orderResponse.currency,
        name: 'Rupantara AI',
        description: `${plan.name} - ${plan.points}`,
        order_id: orderResponse.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await paymentsApi.verifyRazorpay({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: plan.id
            });

            if (verifyResponse.success) {
              toast({
                title: "Purchase Successful! 🎉",
                description: `You've received points. New balance: ${verifyResponse.newBalance}`,
              });
              // Refresh wallet data
              await useWalletStore.getState().fetchWalletData();
              router.push('/wallet');
            }
          } catch (error: any) {
            toast({
              title: "Verification Failed",
              description: error.message || "Payment verification failed",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
            setSelectedPlan(null);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#4EFF9B'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setSelectedPlan(null);
          }
        }
      };

      // @ts-ignore - Razorpay is loaded via script
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="w-full py-2 sm:py-3 md:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full">
          <Crown className="h-5 w-5" />
          <span className="font-medium">Pro</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Unlock Your Full Potential</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Upgrade to a Pro plan and get access to premium features, higher generation limits, and advanced analytics.
        </p>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative overflow-hidden ${plan.popular
                ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                : ""
              }`}
          >
            {plan.tag && (
              <div className="absolute top-4 right-4">
                <Badge
                  className={
                    plan.popular
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }
                >
                  {plan.tag}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.points}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                onClick={() => handleBuyNow(plan)}
                disabled={isProcessing && selectedPlan === plan.id}
              >
                {isProcessing && selectedPlan === plan.id ? "Processing..." : "Buy Now"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promo Code */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <h3 className="font-semibold">Have a Promo Code?</h3>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="promo-code" className="sr-only">Promo Code</Label>
                <Input
                  id="promo-code"
                  placeholder="Enter your promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
              <Button onClick={handleApplyPromo} disabled={!promoCode.trim()}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Secure payment via Razorpay</p>
        <p className="mt-1">All transactions are encrypted and secure.</p>
      </div>
    </div>
  );
}
