"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/store/walletStore";
import { paymentsApi, packagesApi } from "@/services/api";

type Plan = { id: string; name: string; price: string; period: string; points: string; features: string[]; tag: string | null; popular: boolean };
const formatPlan = (p: any): Plan => ({
  id: p.id || p._id,
  name: p.name,
  price: `₹${p.price}`,
  period: "/month",
  points: `${p.points + (p.bonusPoints || 0)} Points`,
  features: [
    `${p.points + (p.bonusPoints || 0)} AI Generation Points`,
    p.isPopular ? "Priority Support" : "Email Support",
    "Access to Premium Templates",
    "Basic Analytics"
  ],
  tag: p.tag || (p.isPopular ? "Most Popular" : null),
  popular: !!p.isPopular
});

function ProPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [pricingPlans, setPricingPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const exists = typeof window !== 'undefined' && (window as any).Razorpay;
    if (!exists) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => { };
      script.onerror = () => {
        toast({
          title: "Payment SDK load failed",
          description: "Unable to load Razorpay checkout. Please check your connection.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [toast]);

  useEffect(() => {
    packagesApi.list()
      .then((list) => {
        const active = (Array.isArray(list) ? list : []).filter((x: any) => x.isActive);
        setPricingPlans(active.map(formatPlan));
      })
      .catch(() => {
        setPricingPlans([]);
      });
  }, []);

  // Fetch active gateway and handle Stripe success
  const [activeGateway, setActiveGateway] = useState<string>('razorpay');
  useEffect(() => {
    paymentsApi.getActiveGateway().then((g: string) => { if (g) setActiveGateway(g) }).catch(() => { });

    const success = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    if (success === 'true' && sessionId) {
      setIsProcessing(true);
      paymentsApi.verifyStripe({ sessionId }).then(async (res: any) => {
        if (res.success) {
          toast({ title: "Purchase Successful!", description: `New Balance: ${res.newBalance}` });
          await useWalletStore.getState().fetchWalletData();
          router.replace('/pro'); // Clean URL
        } else {
          toast({ title: "Verification Failed", description: res.msg, variant: "destructive" });
        }
      }).catch((e: any) => {
        toast({ title: "Error", description: "Payment verification failed", variant: "destructive" });
      }).finally(() => setIsProcessing(false));
    }
  }, [searchParams, router, toast]);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      toast({
        title: "Promo code applied!",
        description: `Promo code "${promoCode}" has been applied`,
      });
    }
  };

  const handleBuyNow = async (plan: Plan) => {
    setSelectedPlan(plan.id);
    setIsProcessing(true);

    try {
      // Create Order with active gateway
      const orderResponse: any = await paymentsApi.createOrder(plan.id, activeGateway as 'razorpay' | 'stripe');

      // Handle Stripe Redirect
      if (orderResponse.url) {
        window.location.href = orderResponse.url;
        return;
      }

      // Handle Razorpay
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
      const RZ = (window as any).Razorpay;
      if (!RZ) {
        throw new Error('Payment SDK not loaded');
      }
      const rzp = new RZ(options);
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

export default function ProPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10">Loading plans...</div>}>
      <ProPageContent />
    </Suspense>
  );
}
