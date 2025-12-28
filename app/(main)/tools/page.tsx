"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Scissors, Maximize2, Palette, Smile, ArrowLeft, Upload, Download, Loader2, Image as ImageIcon, X, Palette as PaletteIcon } from "lucide-react"
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
    const newImageUrl = await applyBackgroundColor(originalResultUrl, color)
    setResultUrl(newImageUrl)
  }

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
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
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
                
                {!image ? (
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
                ) : (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Uploaded"
                      className="w-full h-64 object-contain rounded-xl bg-gray-900"
                    />
                    <button
                      onClick={handleClear}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

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

                {points !== null && (
                  <div className="mt-4 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                    Remaining Points: {points}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output Section */}
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
                        style={selectedTool === 'remove-bg' ? { backgroundColor: backgroundColor } : {}}
                      />
                    </div>

                    {/* Background Color Picker for BG Remove */}
                    {selectedTool === 'remove-bg' && resultUrl && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <PaletteIcon className="w-4 h-4" />
                          Background Color
                        </label>
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
                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="#FFFFFF"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {['#FFFFFF', '#000000', '#F0F0F0', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map((color) => (
                            <button
                              key={color}
                              onClick={() => handleBackgroundColorChange(color)}
                              className="w-10 h-10 rounded border-2 border-gray-600 hover:border-indigo-500 transition-colors"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}

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
