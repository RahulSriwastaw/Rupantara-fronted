"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Info, Eye, EyeOff, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/store/walletStore";
import { subscriptionApi } from "@/services/api";

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

type Plan = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  tag?: string;
  tagColor?: string;
  pricing: {
    monthly: { price: number; originalPrice?: number; discount: number };
    quarterly: { price: number; originalPrice?: number; discount: number };
    yearly: { price: number; originalPrice?: number; discount: number };
  };
  features: {
    creditsPerMonth: number;
    imageGenerationsPerMonth: number;
    concurrentImageGenerations: number;
    concurrentVideoGenerations: number;
    allStylesAndModels: boolean;
    commercialTerms: string;
    imageVisibility: string;
    prioritySupport: boolean;
    queuePriority: string;
    unlimitedRealtimeGenerations?: boolean;
  };
};

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeGateway, setActiveGateway] = useState<string>('razorpay');

  useEffect(() => {
    // Load Razorpay script
    const exists = typeof window !== 'undefined' && (window as any).Razorpay;
    if (!exists) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  useEffect(() => {
    // Fetch plans
    subscriptionApi.getPlans()
      .then((plansData) => {
        setPlans(plansData);
      })
      .catch(() => {
        setPlans([]);
      });
  }, []);

  useEffect(() => {
    // Fetch active gateway
    fetch('/api/payment/active-gateway')
      .then(res => res.json())
      .then(data => {
        if (data.provider) setActiveGateway(data.provider);
      })
      .catch(() => {});
  }, []);

  const getPlanColor = (slug: string) => {
    if (slug === 'standard') return 'bg-gray-900 text-white';
    if (slug === 'ultimate') return 'bg-orange-500 text-white';
    if (slug === 'creator') return 'bg-pink-500 text-white';
    return 'bg-gray-100 text-gray-900';
  };

  const getPlanButtonColor = (slug: string) => {
    if (slug === 'standard') return 'bg-white text-gray-900 hover:bg-gray-100';
    if (slug === 'ultimate') return 'bg-white text-orange-500 hover:bg-gray-100';
    if (slug === 'creator') return 'bg-pink-600 text-white hover:bg-pink-700';
    return 'bg-gray-900 text-white';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCredits = (credits: number) => {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(credits % 1000 === 0 ? 0 : 1)}K`;
    }
    return credits.toString();
  };

  const handleSubscribe = async (plan: Plan) => {
    setSelectedPlan(plan.id);
    setIsProcessing(true);

    try {
      const response: any = await subscriptionApi.subscribe({
        planId: plan.id,
        billingCycle,
        gateway: activeGateway as 'razorpay' | 'stripe',
        promoCode: promoCode.trim() || undefined,
      });

      // Handle Stripe redirect
      if (response.url) {
        window.location.href = response.url;
        return;
      }

      // Handle Razorpay
      if (response.razorpaySubscriptionId) {
        const options = {
          subscription_id: response.razorpaySubscriptionId,
          key: response.key,
          name: 'Rupantara AI',
          description: `${plan.name} - ${billingCycle} subscription`,
          handler: async function (response: any) {
            try {
              toast({
                title: "Subscription Successful! 🎉",
                description: `You've subscribed to ${plan.name} plan. Credits will be allocated monthly.`,
              });
              await useWalletStore.getState().fetchWalletData();
              router.push('/wallet');
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message || "Something went wrong",
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

        const RZ = (window as any).Razorpay;
        if (!RZ) {
          throw new Error('Payment SDK not loaded');
        }
        const rzp = new RZ(options);
        rzp.open();
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || error.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getBillingDiscount = (cycle: BillingCycle) => {
    if (cycle === 'monthly') return '-59%';
    if (cycle === 'quarterly') return '-70%';
    if (cycle === 'yearly') return '-86%';
    return '';
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            PICK YOUR PLAN
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Upgrade to get access to pro features and generate more and better
          </p>
        </div>

        {/* Promo Code Section */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPromoCode(!showPromoCode)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showPromoCode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              Enter promo code
            </Button>
            {showPromoCode && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-32 h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromoCode(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly {getBillingDiscount('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'quarterly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Quarterly {getBillingDiscount('quarterly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Yearly {getBillingDiscount('yearly')}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {plans.map((plan) => {
            const pricing = plan.pricing[billingCycle];
            const isPopular = plan.tag === 'MOST POPULAR';
            const isSpecial = plan.tag === 'SPECIAL OFFER';

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${getPlanColor(plan.slug)} ${
                  isPopular ? 'ring-2 ring-orange-300' : ''
                }`}
              >
                {plan.tag && (
                  <div className="absolute top-4 right-4">
                    <Badge
                      className={`${
                        isPopular
                          ? 'bg-orange-600 text-white'
                          : isSpecial
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {plan.tag}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <p className="text-sm opacity-90 mb-4">{plan.tagline}</p>
                  
                  <div className="mt-4">
                    {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                      <div className="text-sm opacity-75 line-through mb-1">
                        {formatPrice(pricing.originalPrice)}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{formatPrice(pricing.price)}</span>
                      <span className="text-sm opacity-90">/month</span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">
                      Billed {billingCycle === 'monthly' ? 'monthly' : billingCycle === 'quarterly' ? 'quarterly' : 'yearly'}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-lg font-semibold">+ {formatCredits(plan.features.creditsPerMonth)} credits per month</span>
                    <Info className="h-4 w-4 opacity-75" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 opacity-90">ADDITIONAL FEATURES</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Up to ~{formatCredits(plan.features.imageGenerationsPerMonth)} Image Generations/month</span>
                      </li>
                      {plan.features.concurrentVideoGenerations > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Up to ~{formatCredits(plan.features.concurrentVideoGenerations * 100)} Video Generations/month</span>
                        </li>
                      )}
                      {plan.features.unlimitedRealtimeGenerations && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Unlimited Realtime Generations</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>All styles and models</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.commercialTerms}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Image Generation Visibility: {plan.features.imageVisibility}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.concurrentImageGenerations} Concurrent Image Generations</span>
                      </li>
                      {plan.features.concurrentVideoGenerations > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{plan.features.concurrentVideoGenerations} concurrent Video Generations</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.prioritySupport ? 'Priority Support' : 'Email Support'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Higher priority in generation queue</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    className={`w-full ${getPlanButtonColor(plan.slug)}`}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={isProcessing && selectedPlan === plan.id}
                  >
                    {isProcessing && selectedPlan === plan.id ? "Processing..." : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>Secure payment via Razorpay & Stripe</p>
          <p className="mt-1">All transactions are encrypted and secure.</p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10">Loading plans...</div>}>
      <PricingPageContent />
    </Suspense>
  );
}

