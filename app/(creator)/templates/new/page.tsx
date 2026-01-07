"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { templatesApi, categoryApi, creatorApi } from "@/services/api";
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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addTemplate, getTemplateById } = useTemplateStore();
  const {
    templateCreationStep: currentStep,
    setTemplateCreationStep,
    nextTemplateCreationStep,
    prevTemplateCreationStep
  } = useUIStore();

  // Check if editing existing template
  const editTemplateId = searchParams.get('edit') || '';
  const isEditMode = !!editTemplateId;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    tags: [] as string[],
    ageGroup: "All Ages",
    isActive: true,
    inputImage: "",  // User's original photo (BEFORE)
    inputImagePosition: "center center" as string, // Position for input image
    demoImage: "",   // Generated result (AFTER)
    demoImagePosition: "center center" as string, // Position for demo image
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

  // Load template data if editing
  useEffect(() => {
    const loadTemplateForEdit = async () => {
      if (!isEditMode || !editTemplateId) return;

      try {
        // Try to get from store first
        let templateData = getTemplateById(editTemplateId);

        // If not in store, fetch from API
        if (!templateData) {
          const templates = await creatorApi.getTemplates();
          templateData = templates.templates?.find((t: any) => t.id === editTemplateId || t._id === editTemplateId);
        }

        if (templateData) {
          // Pre-fill form with template data
          const template = templateData as any; // Type assertion for edit mode

          console.log('📦 Loading template for edit:', {
            id: template.id || template._id,
            inputImage: template.inputImage,
            image: template.image,
            demoImage: template.demoImage,
            imageUrl: template.imageUrl,
            allKeys: Object.keys(template)
          });

          // Determine inputImage - try multiple possible field names
          const inputImageValue = template.inputImage ||
            template.inputImageUrl ||
            template.beforeImage ||
            template.originalImage ||
            template.before ||
            "";

          // Determine demoImage - try multiple possible field names  
          const demoImageValue = template.image ||
            template.imageUrl ||
            template.demoImage ||
            template.afterImage ||
            template.outputImage ||
            template.after ||
            "";

          const newFormData = {
            title: template.title || "",
            description: template.description || "",
            category: template.category || "",
            subCategory: template.subCategory || "",
            tags: template.tags || [],
            ageGroup: template.ageGroup || "All Ages",
            isActive: template.status === 'active',
            inputImage: inputImageValue,
            inputImagePosition: (template as any).inputImagePosition || "center center",
            demoImage: demoImageValue,
            demoImagePosition: (template as any).demoImagePosition || "center center",
            exampleImages: template.additionalImages || template.exampleImages || [],
            hiddenPrompt: template.hiddenPrompt || template.prompt || template.visiblePrompt || "",
            visiblePrompt: template.visiblePrompt || template.title || "",
            negativePrompt: template.negativePrompt || "",
            templateType: template.isFree ? "free" : "premium",
            pointsCost: template.pointsCost || 25,
            quality: "HD",
            aspectRatio: "1:1",
          };

          console.log('✅ Form data prepared:', {
            hasInputImage: !!newFormData.inputImage,
            inputImageLength: newFormData.inputImage?.length || 0,
            hasDemoImage: !!newFormData.demoImage,
            demoImageLength: newFormData.demoImage?.length || 0,
            inputImagePreview: newFormData.inputImage?.substring(0, 50) + '...',
            demoImagePreview: newFormData.demoImage?.substring(0, 50) + '...'
          });

          setFormData(newFormData);
        } else {
          toast({
            title: "Error",
            description: "Template not found",
            variant: "destructive",
          });
          router.push("/templates");
        }
      } catch (error: any) {
        console.error('Failed to load template for edit:', error);
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
      }
    };

    loadTemplateForEdit();
  }, [isEditMode, editTemplateId, getTemplateById, router, toast]);

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
      console.log('📤 Submitting template...', {
        hasInputImage: !!formData.inputImage,
        inputImageType: formData.inputImage?.substring(0, 20),
        hasDemoImage: !!formData.demoImage,
        demoImageType: formData.demoImage?.substring(0, 20)
      });

      // Upload inputImage if it's base64 (data URL)
      let inputImageUrl = formData.inputImage;
      if (formData.inputImage && formData.inputImage.startsWith('data:image')) {
        console.log('📤 Uploading inputImage to server...');
        try {
          const inputUploadRes = await templatesApi.adminUploadDemo(formData.inputImage);
          inputImageUrl = inputUploadRes?.url || formData.inputImage;
          console.log('✅ Input image uploaded:', inputImageUrl?.substring(0, 50));
        } catch (uploadError: any) {
          console.error('❌ Failed to upload inputImage:', uploadError);
          // Continue with base64 if upload fails
          inputImageUrl = formData.inputImage;
        }
      }

      // Upload demoImage if it's base64 (data URL)
      const uploadRes = formData.demoImage && formData.demoImage.startsWith('data:image')
        ? await templatesApi.adminUploadDemo(formData.demoImage)
        : null;
      const demoUrl = uploadRes?.url || formData.demoImage;

      const payload = {
        title: formData.title,
        description: formData.description,
        inputImage: inputImageUrl,  // Use uploaded URL or existing URL
        inputImagePosition: formData.inputImagePosition, // Image positioning
        imageUrl: demoUrl,  // Backend expects imageUrl, not demoImage
        demoImagePosition: formData.demoImagePosition, // Image positioning
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

      console.log('📦 Final payload:', {
        hasInputImage: !!payload.inputImage,
        inputImageLength: payload.inputImage?.length || 0,
        hasImageUrl: !!payload.imageUrl,
        imageUrlLength: payload.imageUrl?.length || 0
      });

      // Check if editing or creating
      if (isEditMode && editTemplateId) {
        // Update existing template - include inputImage
        await creatorApi.updateTemplate(editTemplateId, {
          title: payload.title,
          description: payload.description,
          inputImage: payload.inputImage,  // ✅ Include inputImage
          imageUrl: payload.imageUrl,
          category: payload.category,
          subCategory: payload.subCategory,
          prompt: payload.hiddenPrompt,
          negativePrompt: payload.negativePrompt,
          tags: payload.tags,
          isPremium: payload.templateType === 'premium',
        });

        toast({
          title: "✅ Template Updated!",
          description: "Your template has been updated. It will be reviewed again if it was previously approved."
        });
      } else {
        // Create new template
        const created = await templatesApi.creatorSubmitTemplate(payload);

        console.log('📦 Template creation response:', created);

        // Handle different response structures
        const templateData = created?.template || created?.data || created;
        const exampleImages = templateData?.exampleImages || templateData?.additionalImages || formData.exampleImages || [];

        if (templateData) {
          addTemplate({
            ...templateData,
            additionalImages: exampleImages,
          });
        }

        toast({
          title: "✅ Template Submitted!",
          description: "Your template is now pending review. You'll be notified when it's approved."
        });
      }

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
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Template" : "Create New Template"}
          </h1>
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
                    style={{ objectPosition: formData.inputImagePosition }}
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

              {/* Position Control - Only show when image is uploaded */}
              {formData.inputImage && (
                <div className="space-y-2 mt-3">
                  <Label>Image Position</Label>
                  <Select
                    value={formData.inputImagePosition}
                    onValueChange={(value) => setFormData({ ...formData, inputImagePosition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center center">Center</SelectItem>
                      <SelectItem value="top center">Top</SelectItem>
                      <SelectItem value="bottom center">Bottom</SelectItem>
                      <SelectItem value="center left">Left</SelectItem>
                      <SelectItem value="center right">Right</SelectItem>
                      <SelectItem value="top left">Top Left</SelectItem>
                      <SelectItem value="top right">Top Right</SelectItem>
                      <SelectItem value="bottom left">Bottom Left</SelectItem>
                      <SelectItem value="bottom right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Adjust how your image is displayed
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
                    style={{ objectPosition: formData.demoImagePosition }}
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

              {/* Position Control - Only show when image is uploaded */}
              {formData.demoImage && (
                <div className="space-y-4 mt-3">
                  <div className="space-y-2">
                    <Label>Image Position</Label>
                    <Select
                      value={formData.demoImagePosition}
                      onValueChange={(value) => setFormData({ ...formData, demoImagePosition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center center">Center</SelectItem>
                        <SelectItem value="top center">Top</SelectItem>
                        <SelectItem value="bottom center">Bottom</SelectItem>
                        <SelectItem value="center left">Left</SelectItem>
                        <SelectItem value="center right">Right</SelectItem>
                        <SelectItem value="top left">Top Left</SelectItem>
                        <SelectItem value="top right">Top Right</SelectItem>
                        <SelectItem value="bottom left">Bottom Left</SelectItem>
                        <SelectItem value="bottom right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Adjust how your image is displayed in template cards
                    </p>
                  </div>

                  {/* Template Card Preview */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>Card Preview</span>
                      <span className="text-xs text-muted-foreground font-normal">(How it will appear)</span>
                    </Label>
                    <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-secondary/20">
                      {/* Template Card Preview - Mimics actual TemplateCard component */}
                      <div className="overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border border-border/60 rounded-2xl shadow-lg max-w-sm mx-auto">
                        {/* Image Section */}
                        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-muted via-muted/50 to-muted">
                          <img
                            src={formData.demoImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: formData.demoImagePosition }}
                          />
                          {/* Premium Badge */}
                          {formData.templateType === 'premium' && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 w-8 h-8 rounded-full flex items-center justify-center shadow-xl">
                                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Content Section */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-sm line-clamp-1">
                            {formData.title || "Template Title"}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {formData.description || "Template description will appear here"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      ✨ This is how your template will appear in the gallery
                    </p>
                  </div>
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
                  {/* BEFORE Image Preview */}
                  <Card className="p-0 overflow-hidden">
                    {formData.inputImage && formData.inputImage.trim() ? (
                      <div className="relative aspect-square">
                        <img
                          src={formData.inputImage}
                          alt="Input (BEFORE)"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Failed to load input image:', formData.inputImage?.substring(0, 50));
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="aspect-square bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                                  <p class="text-xs text-muted-foreground text-center px-2">
                                    Image failed to load
                                  </p>
                                </div>
                              `;
                            }
                          }}
                          onLoad={() => {
                            console.log('✅ Input image loaded successfully');
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          BEFORE
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center px-2">
                          No input image
                        </p>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Input Image (Original Photo)
                      </p>
                      {isEditMode && !formData.inputImage && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ Input image not found in template data
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* AFTER Image Preview */}
                  <Card className="p-0 overflow-hidden">
                    {formData.demoImage ? (
                      <div className="relative aspect-square">
                        <img
                          src={formData.demoImage}
                          alt="Output (AFTER)"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          AFTER
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center px-2">
                          No output image
                        </p>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Output Image (Generated Result)
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
                {isEditMode ? "Update Template" : "Submit for Review"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {isEditMode
                  ? "Your template will be reviewed again if it was previously approved."
                  : "Your template will be reviewed within 3-5 business days."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

