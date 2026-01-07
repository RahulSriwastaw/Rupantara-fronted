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
import { paymentsApi, subscriptionApi } from "@/services/api";

type Plan = { 
  id: string; 
  name: string; 
  price: string; 
  period: string; 
  points: string; 
  features: string[]; 
  tag: string | null; 
  popular: boolean;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  originalPrice?: string;
};

const formatPlan = (p: any, billingCycle: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Plan => {
  const pricing = p.pricing?.[billingCycle] || p.pricing?.monthly || {};
  const price = pricing.price || 0;
  const originalPrice = pricing.originalPrice;
  const discount = pricing.discount || 0;
  
  const credits = p.features?.creditsPerMonth || 0;
  const generations = p.features?.imageGenerationsPerMonth || 0;
  
  const periodMap = {
    monthly: '/month',
    quarterly: '/quarter',
    yearly: '/year'
  };
  
  return {
    id: p._id || p.id,
    name: p.name,
    price: `₹${price}`,
    originalPrice: originalPrice ? `₹${originalPrice}` : undefined,
    period: periodMap[billingCycle],
    points: `${credits} Credits`,
    features: [
      `${credits.toLocaleString()} Credits per month`,
      `${generations.toLocaleString()} Image Generations/month`,
      p.features?.allStylesAndModels ? "All Styles & Models" : "Limited Styles",
      p.features?.prioritySupport ? "Priority Support" : "Email Support",
      p.features?.queuePriority === 'Highest' ? "Highest Queue Priority" : p.features?.queuePriority === 'High' ? "High Queue Priority" : "Normal Priority",
      p.features?.imageVisibility === 'Public' ? "Public Images" : "Private Images"
    ],
    tag: p.tag || null,
    popular: p.tag === 'MOST POPULAR' || p.tag === 'SPECIAL OFFER',
    billingCycle
  };
};

function ProPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [pricingPlans, setPricingPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

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
    subscriptionApi.getPlans()
      .then((plans) => {
        console.log('Received plans from API:', plans);
        const active = (Array.isArray(plans) ? plans : []).filter((x: any) => x.isActive !== false);
        console.log('Active plans after filter:', active);
        
        // Create plans for each billing cycle
        const allPlans: Plan[] = [];
        active.forEach((plan: any) => {
          ['monthly', 'quarterly', 'yearly'].forEach((cycle: any) => {
            if (plan.pricing?.[cycle]?.price && plan.pricing[cycle].price > 0) {
              allPlans.push(formatPlan(plan, cycle));
            }
          });
        });
        console.log('Formatted plans:', allPlans);
        setPricingPlans(allPlans);
      })
      .catch((error) => {
        console.error('Error fetching subscription plans:', error);
        setPricingPlans([]);
      });

    // Fetch current subscription
    subscriptionApi.getCurrent()
      .then((subscription) => {
        setCurrentSubscription(subscription);
      })
      .catch((error) => {
        console.error('Error fetching current subscription:', error);
        setCurrentSubscription(null);
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
      // Subscribe to plan using subscription API
      const subscribeResponse: any = await subscriptionApi.subscribe({
        planId: plan.id,
        billingCycle: plan.billingCycle,
        gateway: activeGateway as 'razorpay' | 'stripe',
        promoCode: promoCode.trim() || undefined
      });

      // Handle Stripe Redirect
      if (subscribeResponse.url || subscribeResponse.checkoutUrl) {
        window.location.href = subscribeResponse.url || subscribeResponse.checkoutUrl;
        return;
      }

      // Handle Razorpay (using order-based payment)
      const options = {
        key: subscribeResponse.key || subscribeResponse.keyId,
        amount: subscribeResponse.amount, // Already in paise from backend
        currency: subscribeResponse.currency || 'INR',
        name: 'Rupantara AI',
        description: `${plan.name} - ${plan.points} (${plan.billingCycle})`,
        order_id: subscribeResponse.orderId || subscribeResponse.id || subscribeResponse.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment with backend
            const verifyResponse = await subscriptionApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              subscriptionId: subscribeResponse.subscriptionId || subscribeResponse.subscription
            });

            if (verifyResponse.success) {
              toast({
                title: "Subscription Successful! 🎉",
                description: `Your ${plan.name} subscription is now active!`,
              });
              // Refresh wallet data
              await useWalletStore.getState().fetchWalletData();
              router.push('/wallet');
            } else {
              toast({
                title: "Payment Verification Failed",
                description: verifyResponse.error || "Payment verification failed",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Subscription Failed",
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
      console.error('Payment error:', error);
      const errorMessage = error.message || error.msg || "Something went wrong. Please try again.";
      // Show backend error message directly for better clarity
      toast({
        title: "Payment Failed",
        description: errorMessage,
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
        
        {/* Current Subscription Alert */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <div className="max-w-2xl mx-auto mt-4">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      You have an active subscription: <span className="text-blue-700 dark:text-blue-300">{currentSubscription.planName}</span>
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {currentSubscription.nextBillingDate
                        ? `Renews on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}`
                        : `Expires on ${new Date(currentSubscription.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/wallet')}
                    className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Billing Cycle Selector */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'quarterly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBillingCycle('quarterly')}
          >
            Quarterly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {pricingPlans
          .filter((plan) => plan.billingCycle === billingCycle)
          .map((plan) => (
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
                {plan.originalPrice && (
                  <div className="text-sm text-muted-foreground line-through mb-1">
                    {plan.originalPrice}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
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
