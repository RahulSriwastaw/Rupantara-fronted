"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Scissors, Maximize2, Palette, Smile, ArrowLeft, Upload, Download, Loader2, Image as ImageIcon, X, Palette as PaletteIcon, Sparkles, Search, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toolsApi } from "@/services/api"
import { useWalletStore } from "@/store/walletStore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const tools = [
  {
    id: "remove-bg",
    name: "BG Remove",
    icon: Scissors,
    cost: 0,
    description: "Remove background instantly",
    color: "from-red-500 to-red-600"
  },
  {
    id: "upscale",
    name: "Upscale",
    icon: Maximize2,
    cost: 10,
    description: "Increase resolution",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "face-enhance",
    name: "Face Enhance",
    icon: Smile,
    cost: 10,
    description: "Enhance facial features",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "colorize",
    name: "Colorize",
    icon: Palette,
    cost: 10,
    description: "B&W to color",
    color: "from-yellow-500 to-yellow-600"
  }
]

function ToolsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { balance } = useWalletStore()
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  // Get tool from URL params
  useEffect(() => {
    const toolParam = searchParams?.get('tool')
    if (toolParam && tools.find(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    }
  }, [searchParams])
  
  const [image, setImage] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')
  const [originalResultUrl, setOriginalResultUrl] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'magic' | 'photo' | 'color'>('color')
  const [backgroundImages, setBackgroundImages] = useState<string[]>([])
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [customBackground, setCustomBackground] = useState<string>('')

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    
    if (!f.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    if (f.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB')
      return
    }
    
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(f)
  }

  const runTool = async () => {
    if (!image) {
      setError('Please upload an image first')
      return
    }
    
    if (!selectedTool) {
      setError('Please select a tool first')
      return
    }
    
    setError(null)
    setLoading(true)
    setResultUrl('')
    setPoints(null)
    
    try {
      // Use toolsApi service for consistent API calls
      let response;
      if (selectedTool === 'remove-bg') {
        response = await toolsApi.removeBg(image);
      } else {
        // For other tools, use generic API call
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://new-backend-g2gw.onrender.com'
        const res = await fetch(`${API_URL}/api/tools/${selectedTool}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ imageUrl: image })
        })
        
        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            const errorText = await res.text();
            errorData = { error: errorText };
          }
          throw new Error(errorData.error || errorData.message || `Request failed: ${res.status}`)
        }
        response = await res.json()
      }
      
      const processedUrl = response.result || response.imageUrl || response
      setResultUrl(processedUrl)
      setOriginalResultUrl(processedUrl)
      setPoints(response.points)
      
      toast({
        title: "Success!",
        description: "Image processed successfully",
      })
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to process image'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = `processed-${selectedTool}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = () => {
    setImage('')
    setResultUrl('')
    setOriginalResultUrl('')
    setError(null)
    setPoints(null)
    setBackgroundColor('#FFFFFF')
    setSelectedTool(null)
  }

  const applyBackgroundColor = async (imageUrl: string, color: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = color
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } else {
          resolve(imageUrl)
        }
      }
      img.onerror = () => resolve(imageUrl)
      img.src = imageUrl
    })
  }

  const handleBackgroundColorChange = async (color: string) => {
    if (!originalResultUrl) return
    setBackgroundColor(color)
    setSelectedBackgroundImage(null)
    setCustomBackground('')
    const newImageUrl = await applyBackgroundColor(originalResultUrl, color)
    setResultUrl(newImageUrl)
  }

  const applyBackgroundImage = async (foregroundUrl: string, backgroundUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const foregroundImg = new Image()
      foregroundImg.crossOrigin = 'anonymous'
      const backgroundImg = new Image()
      backgroundImg.crossOrigin = 'anonymous'
      
      let foregroundLoaded = false
      let backgroundLoaded = false
      
      const tryCompose = () => {
        if (!foregroundLoaded || !backgroundLoaded) return
        
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(foregroundImg.width, backgroundImg.width)
        canvas.height = Math.max(foregroundImg.height, backgroundImg.height)
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          const bgAspect = backgroundImg.width / backgroundImg.height
          const canvasAspect = canvas.width / canvas.height
          
          if (bgAspect > canvasAspect) {
            const bgHeight = canvas.height
            const bgWidth = bgHeight * bgAspect
            ctx.drawImage(backgroundImg, (canvas.width - bgWidth) / 2, 0, bgWidth, bgHeight)
          } else {
            const bgWidth = canvas.width
            const bgHeight = bgWidth / bgAspect
            ctx.drawImage(backgroundImg, 0, (canvas.height - bgHeight) / 2, bgWidth, bgHeight)
          }
          
          const fgX = (canvas.width - foregroundImg.width) / 2
          const fgY = (canvas.height - foregroundImg.height) / 2
          ctx.drawImage(foregroundImg, fgX, fgY)
          
          resolve(canvas.toDataURL('image/png'))
        } else {
          resolve(foregroundUrl)
        }
      }
      
      foregroundImg.onload = () => {
        foregroundLoaded = true
        tryCompose()
      }
      backgroundImg.onload = () => {
        backgroundLoaded = true
        tryCompose()
      }
      
      foregroundImg.onerror = () => resolve(foregroundUrl)
      backgroundImg.onerror = () => resolve(foregroundUrl)
      
      foregroundImg.src = foregroundUrl
      backgroundImg.src = backgroundUrl
    })
  }

  const handleBackgroundImageSelect = async (imageUrl: string) => {
    if (!originalResultUrl) return
    setSelectedBackgroundImage(imageUrl)
    setBackgroundColor('#FFFFFF')
    setCustomBackground('')
    const newImageUrl = await applyBackgroundImage(originalResultUrl, imageUrl)
    setResultUrl(newImageUrl)
  }

  const handleCustomBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !originalResultUrl) return
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }
    
    const reader = new FileReader()
    reader.onload = async () => {
      const bgUrl = String(reader.result)
      setCustomBackground(bgUrl)
      setSelectedBackgroundImage(null)
      setBackgroundColor('#FFFFFF')
      const newImageUrl = await applyBackgroundImage(originalResultUrl, bgUrl)
      setResultUrl(newImageUrl)
    }
    reader.readAsDataURL(file)
  }

  const fetchBackgroundImages = async (query: string = 'background') => {
    try {
      const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || ''
      if (!UNSPLASH_ACCESS_KEY) {
        const placeholderImages = [
          'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
          'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400',
          'https://images.unsplash.com/photo-1557683311-eac922147aa6?w=400',
          'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400',
          'https://images.unsplash.com/photo-1557682257-2f9c37a3a5a3?w=400',
        ]
        setBackgroundImages(placeholderImages)
        return
      }
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&client_id=${UNSPLASH_ACCESS_KEY}`
      )
      const data = await response.json()
      if (data.results) {
        setBackgroundImages(data.results.map((img: any) => img.urls.regular))
      }
    } catch (error) {
      console.error('Failed to fetch backgrounds:', error)
      const fallbackImages = [
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
        'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400',
        'https://images.unsplash.com/photo-1557683311-eac922147aa6?w=400',
      ]
      setBackgroundImages(fallbackImages)
    }
  }

  useEffect(() => {
    if (activeTab === 'photo' && selectedTool === 'remove-bg') {
      fetchBackgroundImages(searchQuery || 'background')
    }
  }, [activeTab, searchQuery, selectedTool])

  const selectedToolData = tools.find(t => t.id === selectedTool)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Quick AI Tools</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Process your images instantly with AI-powered tools</p>
          </div>
        </div>
      </div>

      {/* Tool Selection */}
      {!selectedTool && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card
                key={tool.id}
                className="cursor-pointer hover:border-primary/50 transition-all bg-card border-border"
                onClick={() => setSelectedTool(tool.id)}
              >
                <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                    tool.color
                  )}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {tool.cost === 0 ? (
                        <>
                          <Sparkles className="h-3 w-3" />
                          FREE
                        </>
                      ) : (
                        `${tool.cost} pts`
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tool Interface */}
      {selectedTool && (
        <div className="space-y-4 sm:space-y-6">
          {/* Upload Section */}
          {!image && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                    {selectedToolData && <selectedToolData.icon className="w-5 h-5" />}
                    {selectedToolData?.name}
                  </h2>
                </div>
                
                <label className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFile}
                    className="hidden"
                  />
                </label>

                <Button
                  onClick={runTool}
                  disabled={!image || loading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Process Image {selectedToolData && selectedToolData.cost > 0 && `(${selectedToolData.cost} pts)`}
                    </>
                  )}
                </Button>

                {error && (
                  <div className="mt-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Interface - BG Remove */}
          {(image || resultUrl) && selectedTool === 'remove-bg' && (
            <div className="grid lg:grid-cols-[1fr_350px] gap-4 sm:gap-6">
              {/* Left: Image Display */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Preview</h2>
                    <div className="flex gap-2">
                      {image && !resultUrl && (
                        <Button
                          onClick={runTool}
                          disabled={loading}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Remove Background'
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Display with Checkerboard */}
                  <div 
                    className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden relative flex items-center justify-center bg-muted/30"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  >
                    {loading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Removing background...</p>
                      </div>
                    ) : resultUrl ? (
                      <img
                        src={resultUrl}
                        alt="Processed"
                        className="max-w-full max-h-[500px] sm:max-h-[600px] object-contain"
                      />
                    ) : image ? (
                      <img
                        src={image}
                        alt="Original"
                        className="max-w-full max-h-[500px] sm:max-h-[600px] object-contain"
                      />
                    ) : null}
                  </div>

                  {resultUrl && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {points !== null && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                      Remaining Points: {points}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Background Controls */}
              {resultUrl && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Change Background</h3>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-border">
                      <button
                        onClick={() => setActiveTab('magic')}
                        className={cn(
                          "px-3 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2",
                          activeTab === 'magic'
                            ? 'text-primary border-primary'
                            : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                      >
                        <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        Magic
                      </button>
                      <button
                        onClick={() => setActiveTab('photo')}
                        className={cn(
                          "px-3 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2",
                          activeTab === 'photo'
                            ? 'text-primary border-primary'
                            : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                      >
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        Photo
                      </button>
                      <button
                        onClick={() => setActiveTab('color')}
                        className={cn(
                          "px-3 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2",
                          activeTab === 'color'
                            ? 'text-primary border-primary'
                            : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                      >
                        <PaletteIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        Color
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="max-h-[500px] overflow-y-auto">
                      {/* Magic Tab */}
                      {activeTab === 'magic' && (
                        <div className="space-y-4">
                          <p className="text-xs sm:text-sm text-muted-foreground">AI-powered background suggestions coming soon!</p>
                        </div>
                      )}

                      {/* Photo Tab */}
                      {activeTab === 'photo' && (
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  fetchBackgroundImages(searchQuery)
                                }
                              }}
                              placeholder="Search backgrounds..."
                              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Search 30+ million backgrounds</p>

                          <label className="block w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/30 flex items-center justify-center transition-colors">
                            <div className="text-center">
                              <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Upload</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCustomBackgroundUpload}
                              className="hidden"
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-2">
                            {backgroundImages.map((bgUrl, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleBackgroundImageSelect(bgUrl)}
                                className={cn(
                                  "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                  selectedBackgroundImage === bgUrl
                                    ? 'border-primary ring-2 ring-primary/50'
                                    : 'border-border hover:border-primary/50'
                                )}
                              >
                                <img
                                  src={bgUrl}
                                  alt={`Background ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Tab */}
                      {activeTab === 'color' && (
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              setResultUrl(originalResultUrl)
                              setBackgroundColor('#FFFFFF')
                              setSelectedBackgroundImage(null)
                              setCustomBackground('')
                            }}
                            className="w-full aspect-square rounded-lg border-2 border-border hover:border-primary bg-muted flex items-center justify-center transition-colors"
                            style={{
                              backgroundImage: `
                                linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                              `,
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                          >
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                          </button>

                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => handleBackgroundColorChange(e.target.value)}
                              className="w-12 h-10 sm:w-16 sm:h-10 rounded border border-border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={backgroundColor}
                              onChange={(e) => handleBackgroundColorChange(e.target.value)}
                              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                              placeholder="#FFFFFF"
                            />
                          </div>

                          <div className="grid grid-cols-8 gap-2">
                            {[
                              '#FFFFFF', '#000000', '#F0F0F0', '#808080',
                              '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                              '#FF00FF', '#00FFFF', '#FFA500', '#800080',
                              '#FFC0CB', '#A52A2A', '#008000', '#000080',
                              '#FFD700', '#C0C0C0', '#808000', '#800000',
                              '#008080', '#0000FF', '#FF1493', '#00CED1',
                              '#FF4500', '#32CD32', '#1E90FF', '#FF69B4',
                              '#8B4513', '#2E8B57', '#4682B4', '#DDA0DD'
                            ].map((color) => (
                              <button
                                key={color}
                                onClick={() => handleBackgroundColorChange(color)}
                                className={cn(
                                  "aspect-square rounded border-2 transition-all",
                                  backgroundColor === color
                                    ? 'border-primary ring-2 ring-primary/50 scale-110'
                                    : 'border-border hover:border-primary/50'
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Other Tools Interface */}
          {selectedTool !== 'remove-bg' && image && (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                      {selectedToolData && <selectedToolData.icon className="w-5 h-5" />}
                      {selectedToolData?.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <img
                      src={image}
                      alt="Uploaded"
                      className="w-full h-48 sm:h-64 object-contain rounded-lg bg-muted/30"
                    />
                  </div>

                  <Button
                    onClick={runTool}
                    disabled={!image || loading}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Process Image {selectedToolData && selectedToolData.cost > 0 && `(${selectedToolData.cost} pts)`}
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="mt-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Result
                  </h2>

                  {!resultUrl ? (
                    <div className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/30">
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">Processed image will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={resultUrl}
                          alt="Result"
                          className="w-full h-48 sm:h-64 object-contain rounded-lg bg-muted/30"
                        />
                      </div>
                      <Button
                        onClick={handleDownload}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Download Image
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tool Info */}
      {selectedToolData && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-primary mb-2">
              {selectedToolData.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedToolData.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <ToolsPageContent />
    </Suspense>
  )
}
