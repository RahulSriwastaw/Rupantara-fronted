"use client"

import { useState } from "react"
import { Upload, Download, Loader2, Image as ImageIcon, X } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export default function ToolsPage() {
  const [image, setImage] = useState<string>('')
  const [tool, setTool] = useState<'remove-bg'|'upscale'|'face-enhance'|'compress'>('remove-bg')
  const [resultUrl, setResultUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    
    // Validate file type
    if (!f.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    // Validate file size (max 10MB)
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
    
    setError(null)
    setLoading(true)
    setResultUrl('')
    setPoints(null)
    
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch(`${API_URL}/tools/${tool}`, {
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
      // Backend returns { result: imageUrl, points: number, success: boolean }
      setResultUrl(data.result || data.imageUrl)
      setPoints(data.points)
    } catch (err: any) {
      setError(err?.message || 'Failed to process image')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = `processed-${tool}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = () => {
    setImage('')
    setResultUrl('')
    setError(null)
    setPoints(null)
  }

  const toolNames = {
    'remove-bg': 'Remove Background',
    'upscale': 'Upscale Image',
    'face-enhance': 'Face Enhance',
    'compress': 'Compress Image'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quick Tools</h1>
          <p className="text-gray-400">Process your images instantly with AI-powered tools</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image
            </h2>
            
            {!image ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors bg-gray-900/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 mb-4 text-gray-400" />
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

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Tool
                </label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="remove-bg">Remove Background</option>
                  <option value="upscale">Upscale Image</option>
                  <option value="face-enhance">Face Enhance</option>
                  <option value="compress">Compress Image</option>
                </select>
              </div>

              <button
                onClick={runTool}
                disabled={!image || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Process Image</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {points !== null && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                  Remaining Points: {points}
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
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
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tool Info */}
        <div className="mt-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-400 mb-2">
            {toolNames[tool]}
          </h3>
          <p className="text-xs text-gray-400">
            {tool === 'remove-bg' && 'Remove background from your images instantly using AI. Perfect for product photos, portraits, and more.'}
            {tool === 'upscale' && 'Enhance image resolution and quality using advanced AI upscaling technology.'}
            {tool === 'face-enhance' && 'Improve facial features and quality in portrait images with AI enhancement.'}
            {tool === 'compress' && 'Reduce image file size while maintaining quality for faster loading.'}
          </p>
        </div>
      </div>
    </div>
  )
}
