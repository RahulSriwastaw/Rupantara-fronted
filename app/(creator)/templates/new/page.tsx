"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Upload, X, Sparkles } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTemplateStore } from "@/store/templateStore";
import { templatesApi, categoryApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Template Visuals" },
  { id: 3, name: "AI Prompt Config" },
  { id: 4, name: "Pricing & Settings" },
  { id: 5, name: "Preview & Submit" },
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addTemplate } = useTemplateStore();
  const {
    templateCreationStep: currentStep,
    setTemplateCreationStep,
    nextTemplateCreationStep,
    prevTemplateCreationStep
  } = useUIStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    tags: [] as string[],
    ageGroup: "All Ages",
    isActive: true,
    inputImage: "",  // User's original photo (BEFORE)
    demoImage: "",   // Generated result (AFTER)
    exampleImages: [] as string[],
    hiddenPrompt: "",
    visiblePrompt: "",
    negativePrompt: "",
    templateType: "premium",
    pointsCost: 25,
    quality: "HD",
    aspectRatio: "1:1",
  });

  // Dynamic categories from admin panel
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [tagInput, setTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputImageInputRef = useRef<HTMLInputElement>(null);
  const demoImageInputRef = useRef<HTMLInputElement>(null);
  const exampleImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const addTag = () => {
    if (tagInput && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  // Handle file upload and convert to base64
  const handleFileUpload = useCallback((file: File, type: 'input' | 'demo' | 'example', index?: number) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WEBP files only",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('📸 Image loaded:', result ? 'Success' : 'Failed');
      console.log('📏 Image size:', result?.length, 'bytes');

      if (type === 'input') {
        console.log('✅ Setting input image (BEFORE)');
        setFormData((prev) => ({ ...prev, inputImage: result }));
        toast({ title: "✅ Input Image Uploaded", description: "Original photo uploaded!" });
      } else if (type === 'demo') {
        console.log('✅ Setting demo image (AFTER)');
        setFormData((prev) => ({ ...prev, demoImage: result }));
        toast({ title: "✅ Output Image Uploaded", description: "Generated result uploaded!" });
      } else if (type === 'example' && index !== undefined) {
        console.log('✅ Setting example image', index, 'to formData');
        setFormData((prev) => {
          const newExamples = [...prev.exampleImages];
          newExamples[index] = result;
          return { ...prev, exampleImages: newExamples };
        });
      }
    };
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to read the image file",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Input image handlers
  const handleInputImageClick = () => {
    inputImageInputRef.current?.click();
  };

  const handleInputImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'input');
    }
  };

  const handleInputImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file, 'input');
    }
  }, [handleFileUpload]);

  const handleInputImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleInputImageDragLeave = () => {
    setIsDragging(false);
  };

  const removeInputImage = () => {
    setFormData({ ...formData, inputImage: "" });
    if (inputImageInputRef.current) {
      inputImageInputRef.current.value = "";
    }
  };

  // Demo image handlers
  const handleDemoImageClick = () => {
    demoImageInputRef.current?.click();
  };

  const handleDemoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'demo');
    }
  };

  const handleDemoImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, 'demo');
    }
  }, [handleFileUpload]);

  const handleDemoImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDemoImageDragLeave = () => {
    setIsDragging(false);
  };

  // Example image handlers
  const handleExampleImageClick = (index: number) => {
    exampleImageInputRefs.current[index]?.click();
  };

  const handleExampleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'example', index);
    }
  };

  const removeDemoImage = () => {
    setFormData({ ...formData, demoImage: "" });
    if (demoImageInputRef.current) {
      demoImageInputRef.current.value = "";
    }
  };

  const removeExampleImage = (index: number) => {
    const newExamples = [...formData.exampleImages];
    newExamples[index] = "";
    setFormData({ ...formData, exampleImages: newExamples });
    if (exampleImageInputRefs.current[index]) {
      exampleImageInputRefs.current[index]!.value = "";
    }
  };

  const nextStep = () => {
    nextTemplateCreationStep();
  };

  const prevStep = () => {
    prevTemplateCreationStep();
  };

  const { user } = useAuthStore()

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "❌ Title Required",
        description: "Please enter a template title",
        variant: "destructive"
      });
      setTemplateCreationStep(1);
      return;
    }

    if (!formData.inputImage) {
      toast({
        title: "❌ Input Image Required",
        description: "Please upload the original photo (BEFORE image)",
        variant: "destructive"
      });
      setTemplateCreationStep(2);
      return;
    }

    if (!formData.demoImage) {
      toast({
        title: "❌ Output Image Required",
        description: "Please upload the generated result (AFTER image)",
        variant: "destructive"
      });
      setTemplateCreationStep(2);
      return;
    }

    if (!formData.category) {
      toast({
        title: "❌ Category Required",
        description: "Please select a category",
        variant: "destructive"
      });
      setTemplateCreationStep(1);
      return;
    }

    if (!formData.hiddenPrompt.trim()) {
      toast({
        title: "❌ Prompt Required",
        description: "Please enter the AI prompt",
        variant: "destructive"
      });
      setTemplateCreationStep(3);
      return;
    }

    try {
      console.log('📤 Submitting template...', formData);

      const uploadRes = formData.demoImage ? await templatesApi.adminUploadDemo(formData.demoImage) : null;
      const demoUrl = uploadRes?.url || formData.demoImage;

      const payload = {
        title: formData.title,
        description: formData.description,
        inputImage: formData.inputImage,
        imageUrl: demoUrl,  // Backend expects imageUrl, not demoImage
        category: formData.category,
        subCategory: formData.subCategory,
        tags: formData.tags,
        ageGroup: formData.ageGroup,
        isActive: formData.isActive,
        exampleImages: formData.exampleImages,
        hiddenPrompt: formData.hiddenPrompt,
        prompt: formData.hiddenPrompt,
        visiblePrompt: formData.visiblePrompt,
        negativePrompt: formData.negativePrompt,
        templateType: formData.templateType,
        pointsCost: formData.pointsCost
      };

      // Use creator-specific endpoint
      const created = await templatesApi.creatorSubmitTemplate(payload)

      addTemplate({
        ...created.template,
        additionalImages: created.template.exampleImages || [],
      })

      toast({
        title: "✅ Template Submitted!",
        description: "Your template is now pending review. You'll be notified when it's approved."
      })
      router.push("/templates")
    } catch (e: any) {
      console.error('Template submission error:', e)
      toast({
        title: "❌ Submission failed",
        description: e?.message || e?.response?.data?.message || 'Please try again',
        variant: 'destructive'
      })
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Create New Template</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of 5
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex-1 h-1 rounded-full transition-all ${step.id <= currentStep
              ? "bg-primary"
              : step.id === currentStep + 1
                ? "bg-primary/50"
                : "bg-secondary"
              }`}
          />
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                placeholder="Enter a catchy title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this template does"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value, subCategory: '' }); // Reset sub-category
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCategories ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="none" disabled>No categories available</SelectItem>
                    ) : (
                      categories.map((cat: any) => (
                        <SelectItem key={cat.id || cat._id || cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sub-category</Label>
                <Select
                  value={formData.subCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subCategory: value })
                  }
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.category ? "Select category first" : "Select a sub-category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.category ? (
                      <SelectItem value="none" disabled>Select category first</SelectItem>
                    ) : (
                      (() => {
                        const selectedCategory = categories.find((cat: any) => cat.name === formData.category);
                        const subCategories = selectedCategory?.subCategories || [];

                        if (subCategories.length === 0) {
                          return <SelectItem value="none" disabled>No sub-categories available</SelectItem>;
                        }

                        return subCategories.map((subCat: string) => (
                          <SelectItem key={subCat} value={subCat}>
                            {subCat}
                          </SelectItem>
                        ));
                      })()
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add up to 10 tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button onClick={addTag} disabled={formData.tags.length >= 10}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Age Group</Label>
              <Select
                value={formData.ageGroup}
                onValueChange={(value) =>
                  setFormData({ ...formData, ageGroup: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Ages">All Ages</SelectItem>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="25-35">25-35</SelectItem>
                  <SelectItem value="35-45">35-45</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <Label>Initial State</Label>
                <p className="text-sm text-muted-foreground">
                  Set the template to active on creation
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>

            <Button onClick={nextStep} className="w-full" size="lg">
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Template Visuals */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Template Visuals</h2>

            {/* INPUT IMAGE (BEFORE) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">BEFORE</span>
                Input Image (Original Photo)
              </Label>
              <p className="text-sm text-muted-foreground">
                Upload the user's original photo that will be INPUT for AI generation.
              </p>
              <input
                ref={inputImageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleInputImageChange}
                className="hidden"
              />
              {formData.inputImage ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-green-500">
                  <img
                    src={formData.inputImage}
                    alt="Input image"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={removeInputImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDrop={handleInputImageDrop}
                  onDragOver={handleInputImageDragOver}
                  onDragLeave={handleInputImageDragLeave}
                  onClick={handleInputImageClick}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-green-500 bg-green-50"
                      : "border-green-500 hover:bg-green-50/50"
                  )}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium mb-2">
                    {isDragging ? "Drop your image here" : "Upload Input Image (BEFORE)"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or</p>
                  <Button variant="outline" type="button">Browse Files</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Max 5MB. Formats: JPG, PNG, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* OUTPUT IMAGE (AFTER) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">AFTER</span>
                Output Image (Generated Result)
              </Label>
              <p className="text-sm text-muted-foreground">
                Upload the AI-generated result. This will be your template's thumbnail/demo.
              </p>
              <input
                ref={demoImageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleDemoImageChange}
                className="hidden"
              />
              {formData.demoImage ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-blue-500">
                  <img
                    src={formData.demoImage}
                    alt="Output image"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeDemoImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDrop={handleDemoImageDrop}
                  onDragOver={handleDemoImageDragOver}
                  onDragLeave={handleDemoImageDragLeave}
                  onClick={handleDemoImageClick}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-blue-500 hover:bg-blue-50/50"
                  )}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <p className="font-medium mb-2">
                    {isDragging ? "Drop your image here" : "Upload Output Image (AFTER)"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or</p>
                  <Button variant="outline" type="button">Browse Files</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Max 5MB. Formats: JPG, PNG, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* Example images removed - Only 2 images needed: Input (BEFORE) and Output (AFTER) */}
            {/*
            <div className="space-y-2">
              <Label>Add Example Images</Label>
              <p className="text-sm text-muted-foreground">
                Optional, but highly recommended to showcase the versatility of your template.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => {
                  const hasImage = formData.exampleImages[i];
                  return (
                    <div key={i} className="relative">
                      <input
                        ref={(el) => {
                          exampleImageInputRefs.current[i] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleExampleImageChange(e, i)}
                        className="hidden"
                      />
                      {hasImage ? (
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                          <Image
                            src={hasImage}
                            alt={`Example ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeExampleImage(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleExampleImageClick(i)}
                          className="aspect-square rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            */}

            <div className="flex gap-3">
              <Button onClick={prevStep} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={nextStep} className="flex-1" size="lg">
                Next: Add Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: AI Prompt Configuration */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold">AI Prompt Configuration</h2>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Hidden Prompt (Required)</Label>
                <span className="text-xs text-muted-foreground">ⓘ</span>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="e.g., cinematic photo, epic fantasy landscape, hyperdetailed, 8k..."
                  rows={6}
                  value={formData.hiddenPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, hiddenPrompt: e.target.value })
                  }
                />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-full"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Prompt Quality</span>
                  <span className="text-yellow-400">Good</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-[85%]" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Visible Prompt (Optional)</Label>
                <span className="text-xs text-muted-foreground">ⓘ</span>
              </div>
              <Input
                placeholder="A photo of a [subject] in a [location]"
                value={formData.visiblePrompt}
                onChange={(e) =>
                  setFormData({ ...formData, visiblePrompt: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                This part of the prompt will be shown to users.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Negative Prompt (Optional)</Label>
                <span className="text-xs text-muted-foreground">ⓘ</span>
              </div>
              <Input
                placeholder="e.g., blurry, watermark, text, ugly, deformed"
                value={formData.negativePrompt}
                onChange={(e) =>
                  setFormData({ ...formData, negativePrompt: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={prevStep} variant="outline" className="flex-1">
                Back
              </Button>
              <Button variant="secondary" className="flex-1">
                Test Prompt
              </Button>
              <Button onClick={nextStep} className="flex-1" size="lg">
                Save & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Pricing & Settings */}
      {currentStep === 4 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Pricing & Settings</h2>

            <div className="space-y-4">
              <Label>Select Template Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, templateType: "free" })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.templateType === "free"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/50"
                    }`}
                >
                  <p className="font-bold mb-1">Free</p>
                  <p className="text-xs text-muted-foreground">
                    Maximize reach and allow anyone to use your template.
                  </p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, templateType: "premium" })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.templateType === "premium"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/50"
                    }`}
                >
                  <p className="font-bold mb-1">Premium</p>
                  <p className="text-xs text-muted-foreground">
                    Earn points when other users generate images with it.
                  </p>
                </button>
              </div>
            </div>

            {formData.templateType === "premium" && (
              <div className="space-y-4">
                <Label>Set points cost per generation</Label>
                <Input
                  type="number"
                  placeholder="e.g., 25"
                  value={formData.pointsCost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pointsCost: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-50 points
                </p>
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() =>
                        setFormData({ ...formData, pointsCost: amount })
                      }
                      className={formData.pointsCost === amount ? "border-primary" : ""}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Advanced Settings</Label>
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <p className="text-sm">Advanced settings will be available here</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button onClick={prevStep} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={nextStep} className="flex-1" size="lg">
                Publish Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview & Submit */}
      {currentStep === 5 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Preview & Submit</h2>

            <div className="space-y-4">
              <div>
                <Label>Template Preview</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Card className="p-0 overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-blue-500 to-blue-600" />
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Prompt: geometric abstract, neon glow
                      </p>
                    </div>
                  </Card>
                  <Card className="p-0 overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-blue-400 to-blue-500" />
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Prompt: realistic portrait
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{formData.title || "Cyberpunk Character Creator"}</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.description ||
                    "Generate stunning, high-detail cyberpunk characters. Customize their style from punk to neon-drenched noir."}
                </p>
                <div className="flex gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Template Details</span>
                  <Button variant="ghost" size="sm" onClick={() => setTemplateCreationStep(1)}>
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base AI Model</span>
                  <Button variant="ghost" size="sm" onClick={() => setTemplateCreationStep(3)}>
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Core Prompt</span>
                  <Button variant="ghost" size="sm" onClick={() => setTemplateCreationStep(3)}>
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="terms" className="rounded" />
                <label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <span className="text-primary">Creator Terms & Conditions</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleSubmit} className="w-full" size="lg">
                Submit for Review
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your template will be reviewed within 3-5 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

