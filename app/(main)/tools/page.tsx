"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eraser, Zap, UserRound, Brush, ArrowLeft, Upload, Download, Loader2, Image as ImageIcon, X, Palette as PaletteIcon, Sparkles, Search, Wand2, Scissors, Maximize2, Palette, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toolsApi } from "@/services/api"
import { useWalletStore } from "@/store/walletStore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import { motion, AnimatePresence } from "framer-motion"

const tools = [
  {
    id: "remove-bg",
    name: "BG Remove",
    icon: Eraser,
    cost: 0,
    description: "Remove background instantly"
  },
  {
    id: "upscale",
    name: "Upscale",
    icon: Zap,
    cost: 10,
    description: "Increase resolution"
  },
  {
    id: "face-enhance",
    name: "Face Enhance",
    icon: UserRound,
    cost: 10,
    description: "Enhance facial features"
  },
  {
    id: "colorize",
    name: "Colorize",
    icon: Brush,
    cost: 10,
    description: "B&W to color"
  }
]

function ToolsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { balance, fetchWalletData } = useWalletStore()

  // Initialize from URL params immediately
  const toolParam = searchParams?.get('tool')
  const initialTool = toolParam && tools.find(t => t.id === toolParam) ? toolParam : null
  const [selectedTool, setSelectedTool] = useState<string | null>(initialTool)
  const [isInitialized, setIsInitialized] = useState(true)

  // Fetch wallet data on mount to ensure balance is available
  useEffect(() => {
    fetchWalletData()
  }, [fetchWalletData])

  // Update tool when URL params change
  useEffect(() => {
    const toolParam = searchParams?.get('tool')
    if (toolParam && tools.find(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    } else if (!toolParam) {
      setSelectedTool(null)
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
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid')
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')
  const [gradientDirection, setGradientDirection] = useState<number>(0) // 0-360 degrees for linear
  const [gradientColor1, setGradientColor1] = useState<string>('#FF0000')
  const [gradientColor2, setGradientColor2] = useState<string>('#0000FF')

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

    try {
      // Use toolsApi service for consistent API calls
      let response: any = null;
      try {
        if (selectedTool === 'remove-bg') {
          response = await toolsApi.removeBg(image);
        } else {
          // For other tools, use generic API call
          const token = localStorage.getItem('token')
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`

          // Use getApiUrl from config to get correct API URL (already includes /api)
          const API_URL = getApiUrl()
          const res = await fetch(`${API_URL}/tools/${selectedTool}`, {
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
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        throw apiError;
      }

      // Safely handle response - check if response exists
      if (!response) {
        throw new Error('No response received from server');
      }

      // Safely extract processed URL
      const processedUrl = response?.result || response?.imageUrl || (typeof response === 'string' ? response : null);
      if (!processedUrl) {
        throw new Error('No image URL in response');
      }

      setResultUrl(processedUrl)
      setOriginalResultUrl(processedUrl)

      // Safely get points from response, fallback to balance from wallet store
      if (response && typeof response === 'object' && typeof response.points === 'number') {
        setPoints(response.points)
      } else if (response && typeof response === 'object' && typeof response.balance === 'number') {
        setPoints(response.balance)
      } else {
        // Use balance from wallet store if response.points is not available
        // Refresh wallet data first to get latest balance
        const { fetchWalletData } = useWalletStore.getState();
        await fetchWalletData();
        const updatedBalance = useWalletStore.getState().balance;
        setPoints(updatedBalance !== null && updatedBalance !== undefined ? updatedBalance : 0)
      }

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

  const applyBackgroundGradient = async (
    imageUrl: string,
    type: 'linear' | 'radial',
    direction: number,
    color1: string,
    color2: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          let gradient: CanvasGradient

          if (type === 'linear') {
            // Convert degrees to radians and calculate gradient coordinates
            const angle = (direction * Math.PI) / 180
            const x1 = canvas.width / 2 - (canvas.width / 2) * Math.cos(angle)
            const y1 = canvas.height / 2 - (canvas.height / 2) * Math.sin(angle)
            const x2 = canvas.width / 2 + (canvas.width / 2) * Math.cos(angle)
            const y2 = canvas.height / 2 + (canvas.height / 2) * Math.sin(angle)
            gradient = ctx.createLinearGradient(x1, y1, x2, y2)
          } else {
            // Radial gradient from center
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const radius = Math.max(canvas.width, canvas.height) / 2
            gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
          }

          gradient.addColorStop(0, color1)
          gradient.addColorStop(1, color2)

          ctx.fillStyle = gradient
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
    setColorMode('solid')
    setSelectedBackgroundImage(null)
    setCustomBackground('')
    const newImageUrl = await applyBackgroundColor(originalResultUrl, color)
    setResultUrl(newImageUrl)
  }

  const handleGradientChange = async () => {
    if (!originalResultUrl) return
    setColorMode('gradient')
    setSelectedBackgroundImage(null)
    setCustomBackground('')
    const newImageUrl = await applyBackgroundGradient(
      originalResultUrl,
      gradientType,
      gradientDirection,
      gradientColor1,
      gradientColor2
    )
    setResultUrl(newImageUrl)
  }

  useEffect(() => {
    if (colorMode === 'gradient' && originalResultUrl) {
      applyBackgroundGradient(
        originalResultUrl,
        gradientType,
        gradientDirection,
        gradientColor1,
        gradientColor2
      ).then((newImageUrl) => {
        setResultUrl(newImageUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradientType, gradientDirection, gradientColor1, gradientColor2, colorMode, originalResultUrl])

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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header with Gradient Background */}
      {!selectedTool && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/5 border border-primary/20 p-6 sm:p-10 shadow-2xl shadow-primary/5"
        >
          <div className="relative z-10">
            <div className="mb-0"></div>
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 bg-gradient-to-r from-primary via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Professional AI Image Tools
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground/80 leading-relaxed">
                Unlock professional-grade image editing in seconds. Our advanced AI models handle the complexity so you can focus on creativity.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        </motion.div>
      )}

      {/* Selected Tool Header */}


      {/* Tool Selection - Professional Cards */}
      {!selectedTool && isInitialized && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => {
                  setSelectedTool(tool.id)
                  router.push(`/tools?tool=${tool.id}`)
                }}
                className="group cursor-pointer"
              >
                <Card className="h-full bg-card/40 backdrop-blur-xl border-white/10 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-primary/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-4 relative z-10">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl group-hover:shadow-primary/40 transition-all duration-500 group-hover:rotate-6">
                      <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/70 leading-relaxed font-medium">
                        {tool.description}
                      </p>
                      <div className="pt-3">
                        {tool.cost === 0 ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                            Free Tier
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] sm:text-xs font-bold">
                            <span className="text-lg">💎</span> {tool.cost} Credits
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Tool Interface */}
      {selectedTool && (
        <div className="space-y-4 sm:space-y-6">
          {/* Upload Section */}
          {!image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl">
                        {selectedToolData && <selectedToolData.icon className="w-8 h-8 text-primary" />}
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                          {selectedToolData?.name}
                        </h2>
                        <p className="text-muted-foreground font-medium">{selectedToolData?.description}</p>
                      </div>
                    </div>
                    {selectedToolData && selectedToolData.cost > 0 && (
                      <div className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md">
                        <span className="text-primary font-bold flex items-center gap-2">
                          <span className="text-xl">💎</span> {selectedToolData.cost} Credits Required
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="group relative flex flex-col items-center justify-center w-full h-72 sm:h-96 border-2 border-dashed border-primary/20 rounded-[2rem] cursor-pointer hover:border-primary/60 transition-all duration-500 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 hover:bg-primary/10">
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        Ready to transform?
                      </h3>
                      <p className="text-muted-foreground/80 max-w-xs mb-6">
                        Select a high-quality image from your device to see the magic happen.
                      </p>
                      <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
                        Select Image
                      </div>
                      <p className="mt-6 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        PNG • JPG • WEBP (MAX 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFile}
                      className="hidden"
                    />
                  </label>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4" />
                      </div>
                      {error}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Interface - BG Remove */}
          {(image || resultUrl) && selectedTool === 'remove-bg' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 sm:gap-6">
              {/* Left: Image Display */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {/* Header with Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-primary/20">
                        <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Image Preview</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Drag to reposition • Pinch to zoom</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {image && !resultUrl && (
                        <Button
                          onClick={runTool}
                          disabled={loading}
                          size="lg"
                          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-800 text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-500 font-bold border-t border-white/20"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-3" />
                              <span className="hidden sm:inline">AI Processing...</span>
                              <span className="sm:hidden">Processing</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                              <span className="hidden sm:inline">Start AI Magic</span>
                              <span className="sm:hidden">Start</span>
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Display with Enhanced Checkerboard */}
                  <div
                    className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] rounded-3xl overflow-hidden relative flex items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] border border-white/10 shadow-2xl"
                  >
                    <div className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px)`,
                        backgroundSize: '24px 24px'
                      }}
                    />
                    {loading ? (
                      <div className="relative z-10 flex flex-col items-center gap-6 p-10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-xl font-extrabold text-foreground mb-2">Enhancing Your Visual</h3>
                          <p className="text-sm text-muted-foreground font-medium">Our neural networks are processing your image...</p>
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={resultUrl || image}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                          className="relative w-full h-full flex items-center justify-center p-6 sm:p-10"
                        >
                          <img
                            src={resultUrl || image}
                            alt="Preview"
                            className="max-w-full max-h-[500px] sm:max-h-[600px] md:max-h-[700px] object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-lg"
                          />
                          {resultUrl && (
                            <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest shadow-xl">
                              Enhanced with AI
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {resultUrl && (
                    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 font-semibold"
                        size="lg"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Download Image
                      </Button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {error && (
                    <div className="mt-4 bg-destructive/10 backdrop-blur-sm border border-destructive/50 text-destructive px-4 py-3 rounded-xl text-sm shadow-lg">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" />
                        <p>{error}</p>
                      </div>
                    </div>
                  )}

                  {(points !== null || balance !== null) && (
                    <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm shadow-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">Remaining Points:</span>
                        <span className="font-bold text-lg">{points !== null ? points : (balance !== null ? balance : 0)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Background Controls */}
              {resultUrl && (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl sticky top-4 self-start">
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-primary/20">
                        <PaletteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">Change Background</h3>
                    </div>

                    {/* Enhanced Tabs */}
                    <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 bg-muted/50 rounded-xl border border-border/50">
                      <button
                        onClick={() => setActiveTab('magic')}
                        className={cn(
                          "flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-lg",
                          activeTab === 'magic'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        <span className="hidden sm:inline">Magic</span>
                        <span className="sm:hidden">AI</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('photo')}
                        className={cn(
                          "flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-lg",
                          activeTab === 'photo'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        <span className="hidden sm:inline">Photo</span>
                        <span className="sm:hidden">Pic</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('color')}
                        className={cn(
                          "flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-lg",
                          activeTab === 'color'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <PaletteIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                        Color
                      </button>
                    </div>

                    {/* Tab Content with Better Scrolling */}
                    <div className="max-h-[calc(100vh-400px)] sm:max-h-[600px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-1">
                      {/* Magic Tab */}
                      {activeTab === 'magic' && (
                        <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                          <div className="text-center">
                            <Wand2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-purple-500 opacity-50" />
                            <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">AI Magic Coming Soon!</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">AI-powered background suggestions will be available soon. For now, try Photo or Color options!</p>
                          </div>
                        </div>
                      )}

                      {/* Photo Tab */}
                      {activeTab === 'photo' && (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground z-10" />
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
                              className="w-full bg-muted/80 backdrop-blur-sm border-2 border-border rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground px-1">Search 30+ million free backgrounds</p>

                          <label className="block w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center transition-all duration-200 hover:shadow-lg group">
                            <div className="text-center">
                              <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Upload Custom</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCustomBackgroundUpload}
                              className="hidden"
                            />
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                            {backgroundImages.map((bgUrl, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleBackgroundImageSelect(bgUrl)}
                                className={cn(
                                  "aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group relative",
                                  selectedBackgroundImage === bgUrl
                                    ? 'border-primary ring-4 ring-primary/30 shadow-xl shadow-primary/20 scale-105'
                                    : 'border-border hover:border-primary/50 hover:shadow-lg hover:scale-102'
                                )}
                              >
                                <img
                                  src={bgUrl}
                                  alt={`Background ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {selectedBackgroundImage === bgUrl && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                      <X className="w-4 h-4 text-white rotate-45" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Tab */}
                      {activeTab === 'color' && (
                        <div className="space-y-4">
                          {/* Transparent Background Button */}
                          <button
                            onClick={() => {
                              setResultUrl(originalResultUrl)
                              setBackgroundColor('#FFFFFF')
                              setColorMode('solid')
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

                          {/* Mode Toggle: Solid vs Gradient */}
                          <div className="flex gap-2 p-1 bg-muted/80 backdrop-blur-sm rounded-xl border border-border/50">
                            <button
                              onClick={() => setColorMode('solid')}
                              className={cn(
                                "flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                colorMode === 'solid'
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                            >
                              Solid
                            </button>
                            <button
                              onClick={() => setColorMode('gradient')}
                              className={cn(
                                "flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                colorMode === 'gradient'
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                            >
                              Gradient
                            </button>
                          </div>

                          {colorMode === 'solid' ? (
                            <>
                              <div className="flex gap-2 sm:gap-3">
                                <input
                                  type="color"
                                  value={backgroundColor}
                                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-border cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-lg"
                                />
                                <input
                                  type="text"
                                  value={backgroundColor}
                                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                                  className="flex-1 bg-muted/80 backdrop-blur-sm border-2 border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                  placeholder="#FFFFFF"
                                />
                              </div>

                              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
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
                                      "aspect-square rounded-lg sm:rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg",
                                      backgroundColor === color && colorMode === 'solid'
                                        ? 'border-primary ring-4 ring-primary/30 shadow-xl shadow-primary/20 scale-110'
                                        : 'border-border hover:border-primary/50 hover:shadow-md'
                                    )}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Gradient Type Toggle */}
                              <div className="flex gap-2 p-1 bg-muted/80 backdrop-blur-sm rounded-xl border border-border/50">
                                <button
                                  onClick={() => setGradientType('linear')}
                                  className={cn(
                                    "flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                    gradientType === 'linear'
                                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  )}
                                >
                                  Linear
                                </button>
                                <button
                                  onClick={() => setGradientType('radial')}
                                  className={cn(
                                    "flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                                    gradientType === 'radial'
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  )}
                                >
                                  Radial
                                </button>
                              </div>

                              {/* Gradient Preview */}
                              <div
                                className="w-full aspect-square rounded-xl border-2 border-border shadow-lg overflow-hidden"
                                style={{
                                  background: gradientType === 'linear'
                                    ? `linear-gradient(${gradientDirection}deg, ${gradientColor1}, ${gradientColor2})`
                                    : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`
                                }}
                              />

                              {/* Gradient Direction (for linear only) */}
                              {gradientType === 'linear' && (
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs sm:text-sm font-medium text-foreground">Direction</label>
                                    <span className="text-xs sm:text-sm font-bold text-primary">{gradientDirection}°</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={gradientDirection}
                                    onChange={(e) => setGradientDirection(Number(e.target.value))}
                                    className="w-full h-2 sm:h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    style={{
                                      background: `linear-gradient(to right, #e5e5e5 0%, #e5e5e5 ${(gradientDirection / 360) * 100}%, #d1d5db ${(gradientDirection / 360) * 100}%, #d1d5db 100%)`
                                    }}
                                  />
                                </div>
                              )}

                              {/* Gradient Color 1 */}
                              <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-foreground">Color 1</label>
                                <div className="flex gap-2 sm:gap-3">
                                  <input
                                    type="color"
                                    value={gradientColor1}
                                    onChange={(e) => setGradientColor1(e.target.value)}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-border cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-lg"
                                  />
                                  <input
                                    type="text"
                                    value={gradientColor1}
                                    onChange={(e) => setGradientColor1(e.target.value)}
                                    className="flex-1 bg-muted/80 backdrop-blur-sm border-2 border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="#FF0000"
                                  />
                                </div>
                              </div>

                              {/* Gradient Color 2 */}
                              <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-foreground">Color 2</label>
                                <div className="flex gap-2 sm:gap-3">
                                  <input
                                    type="color"
                                    value={gradientColor2}
                                    onChange={(e) => setGradientColor2(e.target.value)}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-border cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-lg"
                                  />
                                  <input
                                    type="text"
                                    value={gradientColor2}
                                    onChange={(e) => setGradientColor2(e.target.value)}
                                    className="flex-1 bg-muted/80 backdrop-blur-sm border-2 border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="#0000FF"
                                  />
                                </div>
                              </div>

                              {/* Preset Gradients */}
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-medium text-foreground">Preset Gradients</label>
                                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                                  {[
                                    { c1: '#FF0000', c2: '#FF7F00', name: 'Sunset' },
                                    { c1: '#0000FF', c2: '#00FFFF', name: 'Ocean' },
                                    { c1: '#FF00FF', c2: '#00FFFF', name: 'Neon' },
                                    { c1: '#FFD700', c2: '#FF4500', name: 'Fire' },
                                    { c1: '#8B00FF', c2: '#FF00FF', name: 'Purple' },
                                    { c1: '#00FF00', c2: '#00FFFF', name: 'Green' },
                                    { c1: '#FF1493', c2: '#FF69B4', name: 'Pink' },
                                    { c1: '#000000', c2: '#808080', name: 'Gray' }
                                  ].map((preset, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setGradientColor1(preset.c1)
                                        setGradientColor2(preset.c2)
                                      }}
                                      className="aspect-square rounded-lg sm:rounded-xl border-2 border-border hover:border-primary transition-all duration-200 hover:scale-110 hover:shadow-lg group"
                                      style={{
                                        background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`
                                      }}
                                      title={preset.name}
                                    >
                                      <span className="sr-only">{preset.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
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
