"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Upload as UploadIcon, X, Sparkles, Loader2, Image as ImageIcon,
  LayoutTemplate, CheckCircle, UploadCloud, Save, RefreshCw, FolderTree, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTemplateStore } from "@/store/templateStore";
import { templatesApi, categoryApi, creatorApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addTemplate, getTemplateById } = useTemplateStore();

  // Check if editing existing template
  const editTemplateId = searchParams.get('edit') || '';
  const isEditMode = !!editTemplateId;

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    tags: [] as string[],
    ageGroup: "All Ages",
    gender: "Any",
    state: "All India",
    isActive: true,
    inputImage: "",  // User's original photo (BEFORE)
    inputImagePosition: "center center",
    demoImage: "",   // Generated result (AFTER)
    demoImagePosition: "center center",
    exampleImages: [] as string[],
    hiddenPrompt: "",
    visiblePrompt: "",
    negativePrompt: "",
    templateType: "premium",
    pointsCost: 25,
    quality: "HD",
    aspectRatio: "1:1",
  });

  // UI State
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const inputImageInputRef = useRef<HTMLInputElement>(null);
  const demoImageInputRef = useRef<HTMLInputElement>(null);

  // AI Quick Fill Logic
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isGeneratingDemoImage, setIsGeneratingDemoImage] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAll();
        setCategories(response.categories || response || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast({
          title: "Warning",
          description: "Failed to load categories from admin panel.",
          variant: "destructive"
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Load template data if editing
  useEffect(() => {
    const loadTemplateForEdit = async () => {
      if (!isEditMode || !editTemplateId) return;

      try {
        let templateData = getTemplateById(editTemplateId);
        if (!templateData) {
          const templates = await creatorApi.getTemplates();
          templateData = templates.templates?.find((t: any) => t.id === editTemplateId || t._id === editTemplateId);
        }

        if (templateData) {
          const template = templateData as any;
          // Determine inputImage & matches
          const inputImageValue = template.inputImage || template.inputImageUrl || template.beforeImage || "";
          const demoImageValue = template.image || template.imageUrl || template.demoImage || "";

          setFormData({
            title: template.title || "",
            description: template.description || "",
            category: template.category || "",
            subCategory: template.subCategory || "",
            tags: template.tags || [],
            ageGroup: template.ageGroup || "All Ages",
            gender: template.gender || "Any",
            state: template.state || "All India",
            isActive: template.status === 'active',
            inputImage: inputImageValue,
            inputImagePosition: (template as any).inputImagePosition || "center center",
            demoImage: demoImageValue,
            demoImagePosition: (template as any).demoImagePosition || "center center",
            exampleImages: template.additionalImages || template.exampleImages || [],
            hiddenPrompt: template.hiddenPrompt || template.prompt || "",
            visiblePrompt: template.visiblePrompt || template.title || "",
            negativePrompt: template.negativePrompt || "",
            templateType: template.isFree ? "free" : "premium",
            pointsCost: template.pointsCost || 25,
            quality: "HD",
            aspectRatio: "1:1",
          });
        } else {
          toast({ title: "Error", description: "Template not found", variant: "destructive" });
          router.push("/templates");
        }
      } catch (error: any) {
        console.error('Failed to load template:', error);
        toast({ title: "Error", description: "Failed to load template", variant: "destructive" });
      }
    };
    loadTemplateForEdit();
  }, [isEditMode, editTemplateId]);

  // Derived sub-categories
  const selectedCategoryObj = categories.find(c => c.name === formData.category);
  const availableSubCategories = selectedCategoryObj?.subCategories || [];

  // Handlers
  const handleFileUpload = useCallback((file: File, type: 'input' | 'demo') => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'input') setFormData((prev) => ({ ...prev, inputImage: result }));
      else if (type === 'demo') setFormData((prev) => ({ ...prev, demoImage: result }));
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleAiQuickFill = async () => {
    if (!aiPromptInput.trim()) return;
    setIsAiFilling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'ai-quick-fill', prompt: aiPromptInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Fill failed');

      const result = data.data;
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        category: result.category || prev.category,
        subCategory: result.subCategory || prev.subCategory,
        tags: result.tags || prev.tags,
        hiddenPrompt: result.hiddenPrompt || prev.hiddenPrompt,
        negativePrompt: result.negativePrompt || prev.negativePrompt,
      }));

      if (data.newBalance !== undefined) {
        useAuthStore.setState(state => ({ user: state.user ? { ...state.user, pointsBalance: data.newBalance } : null }));
      }
      toast({ title: "✨ Form Auto-Filled!", description: `Deducted ${data.pointsDeducted} points.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!aiPromptInput.trim()) return;
    setIsGeneratingDemoImage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'creator-image-gen', prompt: aiPromptInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image Gen failed');

      setFormData(prev => ({ ...prev, demoImage: data.data.imageUrl }));
      if (data.newBalance !== undefined) {
        useAuthStore.setState(state => ({ user: state.user ? { ...state.user, pointsBalance: data.newBalance } : null }));
      }
      toast({ title: "🎨 Image Generated!", description: `Deducted ${data.pointsDeducted} points.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingDemoImage(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) return toast({ title: "Title Required", variant: "destructive" });
    if (!formData.inputImage) return toast({ title: "Input Image Required", variant: "destructive" });
    if (!formData.demoImage) return toast({ title: "Template Image Required", variant: "destructive" });
    if (!formData.category) return toast({ title: "Category Required", variant: "destructive" });
    if (!formData.hiddenPrompt.trim()) return toast({ title: "Prompt Required", variant: "destructive" });

    setIsUploading(true);
    try {
      // Upload Images logic (Assuming adminUploadDemo handles base64)
      let inputImageUrl = formData.inputImage;
      if (formData.inputImage.startsWith('data:image')) {
        const upRes = await templatesApi.adminUploadDemo(formData.inputImage);
        inputImageUrl = upRes?.url || formData.inputImage;
      }

      let demoUrl = formData.demoImage;
      if (formData.demoImage.startsWith('data:image')) {
        const upRes = await templatesApi.adminUploadDemo(formData.demoImage);
        demoUrl = upRes?.url || formData.demoImage;
      }

      const payload = {
        ...formData,
        inputImage: inputImageUrl,
        imageUrl: demoUrl,
        prompt: formData.hiddenPrompt,
        isPremium: formData.templateType === 'premium'
      };

      if (isEditMode && editTemplateId) {
        await creatorApi.updateTemplate(editTemplateId, payload);
        toast({ title: "✅ Template Updated!" });
      } else {
        const created = await templatesApi.creatorSubmitTemplate(payload);
        if (created) addTemplate(created.template || created);
        toast({ title: "✅ Template Submitted!" });
      }
      router.push("/templates");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center pb-24 bg-background">
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full shadow-lg relative">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate size={20} className="text-primary" />
            {isEditMode ? 'Edit Template' : 'Add New Template'}
          </h3>
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* AI Quick Fill */}
        {!isEditMode && (
          <div className="mb-6 p-4 bg-secondary/30 border border-primary/20 rounded-xl relative overflow-hidden">
            {/* Glossy Effect */}
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles size={80} className="text-primary" />
            </div>

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Sparkles size={18} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Quick Fill</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">NEW</span>
            </div>
            <textarea
              value={aiPromptInput}
              onChange={(e) => setAiPromptInput(e.target.value)}
              placeholder="Describe your idea... (e.g. 'Cyberpunk samurai in neon city')"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm resize-none h-20 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none relative z-10"
            />
            <div className="flex gap-2 mt-3 relative z-10">
              <button
                onClick={handleAiQuickFill}
                disabled={isAiFilling || !aiPromptInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              >
                {isAiFilling ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                AI Auto-Fill (2 pts)
              </button>
              <button
                onClick={handleAiGenerateImage}
                disabled={isGeneratingDemoImage || !aiPromptInput.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-input rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              >
                {isGeneratingDemoImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                Generate Image (20 pts)
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. Cyberpunk Warrior"
            />
          </div>

          {/* Image Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Input Image */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase block font-semibold">Input Image (Optional)</label>
              {!formData.inputImage ? (
                <div
                  className="border-2 border-dashed border-input hover:border-primary rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-secondary/20 h-48 group"
                  onClick={() => inputImageInputRef.current?.click()}
                >
                  <div className="p-3 bg-background rounded-full mb-2 group-hover:scale-110 transition-transform shadow-sm">
                    <UploadCloud size={24} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Upload Source/Face</span>
                  <input type="file" ref={inputImageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'input')} />
                </div>
              ) : (
                <div className="relative group rounded-lg overflow-hidden border border-border bg-background h-48 w-full shadow-sm">
                  <img src={formData.inputImage} alt="Input" className="w-full h-full object-cover" style={{ objectPosition: formData.inputImagePosition }} />
                  <button onClick={() => setFormData({ ...formData, inputImage: "" })} className="absolute top-2 right-2 p-1 bg-destructive text-white rounded-full shadow hover:bg-destructive/90 transition-colors"><X size={12} /></button>
                </div>
              )}
              <select
                value={formData.inputImagePosition}
                onChange={(e) => setFormData({ ...formData, inputImagePosition: e.target.value })}
                className="w-full bg-background border border-input rounded px-2 py-1.5 text-foreground text-xs mt-2 focus:outline-none"
              >
                <option value="center center">Center</option>
                <option value="top center">Top</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
              </select>
            </div>

            {/* Template Image */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase block font-semibold">Template/Demo Image</label>
              {!formData.demoImage ? (
                <div
                  className="border-2 border-dashed border-input hover:border-primary rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-secondary/20 h-48 group"
                  onClick={() => demoImageInputRef.current?.click()}
                >
                  <div className="p-3 bg-background rounded-full mb-2 group-hover:scale-110 transition-transform shadow-sm">
                    <ImageIcon size={24} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Upload Result</span>
                  <input type="file" ref={demoImageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'demo')} />
                </div>
              ) : (
                <div className="relative group rounded-lg overflow-hidden border border-border bg-background h-48 w-full shadow-sm">
                  <img src={formData.demoImage} alt="Demo" className="w-full h-full object-cover" style={{ objectPosition: formData.demoImagePosition }} />
                  <button onClick={() => setFormData({ ...formData, demoImage: "" })} className="absolute top-2 right-2 p-1 bg-destructive text-white rounded-full shadow hover:bg-destructive/90 transition-colors"><X size={12} /></button>
                </div>
              )}
              <select
                value={formData.demoImagePosition}
                onChange={(e) => setFormData({ ...formData, demoImagePosition: e.target.value })}
                className="w-full bg-background border border-input rounded px-2 py-1.5 text-foreground text-xs mt-2 focus:outline-none"
              >
                <option value="center center">Center</option>
                <option value="top center">Top</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Sub-Category</label>
              <select
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                disabled={!formData.category}
              >
                <option value="">Select Sub-Category</option>
                {availableSubCategories.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-background border border-input rounded px-2 py-2 text-foreground text-sm focus:outline-none"
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Age Group</label>
              <select
                value={formData.ageGroup}
                onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full bg-background border border-input rounded px-2 py-2 text-foreground text-sm focus:outline-none"
              >
                <option value="All Ages">Any</option>
                <option value="18-25">18-25</option>
                <option value="25-35">25-35</option>
                <option value="35-45">35-45</option>
                <option value="45+">45+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">State (IN)</label>
              <select
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-background border border-input rounded px-2 py-2 text-foreground text-sm focus:outline-none"
              >
                <option value="All India">All India</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Punjab">Punjab</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              placeholder="Template description..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Tags (Comma separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. cinematic, dark, wedding"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Prompt</label>
            <textarea
              rows={3}
              value={formData.hiddenPrompt}
              onChange={e => setFormData({ ...formData, hiddenPrompt: e.target.value })}
              className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
              placeholder="Detailed AI Prompt..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase block mb-1 font-semibold">Negative Prompt (Optional)</label>
            <textarea
              rows={2}
              value={formData.negativePrompt}
              onChange={e => setFormData({ ...formData, negativePrompt: e.target.value })}
              className="w-full bg-background border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
              placeholder="What to avoid..."
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-secondary/50 border border-border rounded-lg">
            <input
              type="checkbox"
              checked={formData.templateType === 'premium'}
              onChange={e => setFormData({ ...formData, templateType: e.target.checked ? 'premium' : 'free' })}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-input"
            />
            <label className="text-sm text-foreground font-medium">Mark as Premium Template</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isUploading ? 'Uploading...' : (isEditMode ? 'Save Changes' : 'Create Template')}
          </button>
          <button
            onClick={() => router.back()}
            className="px-5 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-input py-2.5 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
