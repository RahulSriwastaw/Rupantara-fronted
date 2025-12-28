"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Scissors, Maximize2, Palette, Smile, ArrowLeft, Upload, Download, Loader2, Image as ImageIcon, X, Palette as PaletteIcon, Sparkles, Search, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toolsApi } from "@/services/api"
import { useWalletStore } from "@/store/walletStore"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const tools = [
  {
    id: "remove-bg",
    name: "BG Remove",
    icon: Scissors,
    cost: 0,
    description: "Remove background instantly",
    color: "bg-red-500"
  },
  {
    id: "upscale",
    name: "Upscale",
    icon: Maximize2,
    cost: 10,
    description: "Increase resolution",
    color: "bg-blue-500"
  },
  {
    id: "face-enhance",
    name: "Face Enhance",
    icon: Smile,
    cost: 10,
    description: "Enhance facial features",
    color: "bg-purple-500"
  },
  {
    id: "colorize",
    name: "Colorize",
    icon: Palette,
    cost: 10,
    description: "B&W to color",
    color: "bg-yellow-500"
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
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF') // For BG Remove background color change
  const [originalResultUrl, setOriginalResultUrl] = useState<string>('') // Store original processed image
  const [activeTab, setActiveTab] = useState<'magic' | 'photo' | 'color'>('color') // Background selection tabs
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]) // For Photo tab backgrounds
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState<string | null>(null) // Selected background image
  const [searchQuery, setSearchQuery] = useState<string>('') // For background search
  const [customBackground, setCustomBackground] = useState<string>('') // Custom uploaded background

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
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
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
      
      const data = await res.json()
      const processedUrl = data.result || data.imageUrl
      setResultUrl(processedUrl)
      setOriginalResultUrl(processedUrl) // Store original for background color changes
      setPoints(data.points)
      
      toast({
        title: "Success!",
        description: "Image processed successfully",
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to process image')
      toast({
        title: "Error",
        description: err?.message || "Failed to process image",
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

  // Apply background color to transparent PNG (for BG Remove)
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
          // Fill with background color
          ctx.fillStyle = color
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          // Draw image on top (transparent PNG will show background color)
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

  // Apply background image to transparent PNG
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
          // Draw background image (scaled to cover)
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
          
          // Draw foreground (transparent PNG) centered
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

  // Fetch background images from Unsplash
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quick AI Tools</h1>
            <p className="text-gray-400">Process your images instantly with AI-powered tools</p>
          </div>
        </div>

        {/* Tool Selection */}
        {!selectedTool && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Card
                  key={tool.id}
                  className="cursor-pointer hover:border-indigo-500 transition-all bg-gray-800/50 border-gray-700"
                  onClick={() => setSelectedTool(tool.id)}
                >
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${tool.color} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-1">{tool.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{tool.description}</p>
                      <span className="text-xs text-indigo-400">
                        {tool.cost === 0 ? "FREE" : `${tool.cost} pts`}
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
          <div className="space-y-6">
            {/* Upload Section - Only show when no image uploaded */}
            {!image && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      {selectedToolData && <selectedToolData.icon className="w-5 h-5" />}
                      {selectedToolData?.name}
                    </h2>
                  </div>
                  
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors bg-gray-900/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-4 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 10MB)</p>
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
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Process Image {selectedToolData && selectedToolData.cost > 0 && `(${selectedToolData.cost} pts)`}
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main Interface - Show when image is uploaded or processed */}
            {(image || resultUrl) && selectedTool === 'remove-bg' && (
              <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                {/* Left: Image Display */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Preview</h2>
                      <div className="flex gap-2">
                        {image && !resultUrl && (
                          <Button
                            onClick={runTool}
                            disabled={loading}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
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
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Display with Checkerboard Background */}
                    <div 
                      className="w-full min-h-[500px] rounded-xl overflow-hidden relative flex items-center justify-center"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {loading ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                          <p className="text-gray-400">Removing background...</p>
                        </div>
                      ) : resultUrl ? (
                        <img
                          src={resultUrl}
                          alt="Processed"
                          className="max-w-full max-h-[600px] object-contain"
                        />
                      ) : image ? (
                        <img
                          src={image}
                          alt="Original"
                          className="max-w-full max-h-[600px] object-contain"
                        />
                      ) : null}
                    </div>

                    {resultUrl && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={handleDownload}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    {points !== null && (
                      <div className="mt-4 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                        Remaining Points: {points}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right: Background Controls */}
                {resultUrl && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Change Background</h3>
                      
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4 border-b border-gray-700">
                        <button
                          onClick={() => setActiveTab('magic')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'magic'
                              ? 'text-indigo-400 border-b-2 border-indigo-400'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <Wand2 className="w-4 h-4 inline mr-1" />
                          Magic
                        </button>
                        <button
                          onClick={() => setActiveTab('photo')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'photo'
                              ? 'text-indigo-400 border-b-2 border-indigo-400'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4 inline mr-1" />
                          Photo
                        </button>
                        <button
                          onClick={() => setActiveTab('color')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'color'
                              ? 'text-indigo-400 border-b-2 border-indigo-400'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <PaletteIcon className="w-4 h-4 inline mr-1" />
                          Color
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="max-h-[600px] overflow-y-auto">
                        {/* Magic Tab */}
                        {activeTab === 'magic' && (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-400">AI-powered background suggestions coming soon!</p>
                          </div>
                        )}

                        {/* Photo Tab */}
                        {activeTab === 'photo' && (
                          <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <p className="text-xs text-gray-500">Search 30+ million backgrounds</p>

                            {/* Upload Custom Background */}
                            <label className="block w-full aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 cursor-pointer bg-gray-900/50 flex items-center justify-center transition-colors">
                              <div className="text-center">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-xs text-gray-400">Upload</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCustomBackgroundUpload}
                                className="hidden"
                              />
                            </label>

                            {/* Background Images Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {backgroundImages.map((bgUrl, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleBackgroundImageSelect(bgUrl)}
                                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedBackgroundImage === bgUrl
                                      ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                                      : 'border-gray-700 hover:border-gray-600'
                                  }`}
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
                            {/* Transparent Option */}
                            <button
                              onClick={() => {
                                setResultUrl(originalResultUrl)
                                setBackgroundColor('#FFFFFF')
                                setSelectedBackgroundImage(null)
                                setCustomBackground('')
                              }}
                              className="w-full aspect-square rounded-lg border-2 border-gray-700 hover:border-indigo-500 bg-gray-900 flex items-center justify-center transition-colors"
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
                              <X className="w-6 h-6 text-gray-400" />
                            </button>

                            {/* Color Picker */}
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                                className="w-16 h-10 rounded border border-gray-600 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="#FFFFFF"
                              />
                            </div>

                            {/* Preset Colors */}
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
                                  className={`aspect-square rounded border-2 transition-all ${
                                    backgroundColor === color
                                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-110'
                                      : 'border-gray-700 hover:border-gray-600'
                                  }`}
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

            {/* Other Tools Interface (Non-BG Remove) */}
            {selectedTool !== 'remove-bg' && image && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        {selectedToolData && <selectedToolData.icon className="w-5 h-5" />}
                        {selectedToolData?.name}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <img
                        src={image}
                        alt="Uploaded"
                        className="w-full h-64 object-contain rounded-xl bg-gray-900"
                      />
                    </div>

                    <Button
                      onClick={runTool}
                      disabled={!image || loading}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Process Image {selectedToolData && selectedToolData.cost > 0 && `(${selectedToolData.cost} pts)`}
                        </>
                      )}
                    </Button>

                    {error && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Result
                    </h2>

                    {!resultUrl ? (
                      <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl bg-gray-900/50">
                        <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-gray-500">Processed image will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={resultUrl}
                            alt="Result"
                            className="w-full h-64 object-contain rounded-xl bg-gray-900"
                          />
                        </div>
                        <Button
                          onClick={handleDownload}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-5 h-5 mr-2" />
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
          <Card className="mt-6 bg-indigo-500/10 border-indigo-500/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-indigo-400 mb-2">
                {selectedToolData.name}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedToolData.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ToolsPageContent />
    </Suspense>
  )
}
