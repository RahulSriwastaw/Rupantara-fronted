"use client"

import { useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export default function ToolsPage() {
  const [image, setImage] = useState<string>('')
  const [tool, setTool] = useState<'remove-bg'|'upscale'|'face-enhance'|'compress'>('remove-bg')
  const [resultUrl, setResultUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(f)
  }

  const runTool = async () => {
    setError(null)
    setLoading(true)
    setResultUrl('')
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
        const errorData = await res.json().catch(() => ({ error: await res.text() }))
        throw new Error(errorData.error || errorData.message || `Request failed: ${res.status}`)
      }
      
      const data = await res.json()
      // Backend returns { result: imageUrl, points: number }
      setResultUrl(data.result || data.imageUrl)
    } catch (err: any) {
      setError(err?.message || 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Tools</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <label className="block text-sm">Upload Image</label>
          <input type="file" accept="image/*" onChange={onFile} />
          {image && <img src={image} alt="input" className="mt-2 max-h-64 rounded" />}
        </div>
        <div className="card p-4 space-y-2">
          <label className="block text-sm">Select Tool</label>
          <select className="bg-gray-900 border border-gray-700 rounded p-2" value={tool} onChange={e=> setTool(e.target.value as any)}>
            <option value="remove-bg">Remove Background</option>
            <option value="upscale">Upscale</option>
            <option value="face-enhance">Face Enhance</option>
            <option value="compress">Compress</option>
          </select>
          <button className="px-3 py-2 rounded bg-primary" disabled={!image || loading} onClick={runTool}>{loading ? 'Processing...' : 'Run Tool'}</button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
      {resultUrl && (
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Result</h3>
          <img src={resultUrl} alt="result" className="rounded" />
        </div>
      )}
    </div>
  )
}