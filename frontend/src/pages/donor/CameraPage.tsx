import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { detectionApi } from '../../api/detection'
import { donationsApi } from '../../api/donations'
import { useToast } from '../../store/ToastProvider'
import type { DetectionResult } from '../../types/index'
import { capitalize, scoreToPercent, getApiError } from '../../utils/index'
import { Camera, Upload, X, ZoomIn } from 'lucide-react'

type Mode = 'idle' | 'camera' | 'preview'
type ScanItem = DetectionResult & { description: string }

export function CameraPage() {
  const navigate = useNavigate()

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)

  // State
  const [mode, setMode]         = useState<Mode>('idle')
  const [preview, setPreview]   = useState<string | null>(null)
  const [results, setResults]   = useState<ScanItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [file, setFile]         = useState<File | null>(null)
  const [stream, setStream]     = useState<MediaStream | null>(null)
  const [cart, setCart]         = useState<ScanItem[]>([])
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()
  const detectedTotal = results.reduce((sum, item) => sum + (item.count || 1), 0)

  // ── Camera helpers ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(s)
      setMode('camera')
      // Attach stream to video element after DOM updates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => null)
        }
      }, 50)
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    if (videoRef.current) videoRef.current.srcObject = null
    setMode('idle')
  }, [stream])

  const captureSnapshot = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (!blob) return
      const captured = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setFile(captured)
      setPreview(url)
      setResults([])
      stopCamera()
      setMode('preview')
    }, 'image/jpeg', 0.92)
  }, [stopCamera])

  // ── File upload helper ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults([])
    setError('')
    setMode('preview')
  }

  // ── Detection ───────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const res = await detectionApi.analyze(file)
      setResults(res.data.data.items.map(item => ({ ...item, description: '' })))
      const total = res.data.data.total_detected || res.data.data.items.reduce((sum, item) => sum + (item.count || 1), 0)
      toast.success(`Detected ${total} item(s)`)
    } catch {
      setError('Detection failed. Please try a different image.')
      toast.error('Detection failed')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    stopCamera()
    setPreview(null)
    setFile(null)
    setResults([])
    setError('')
    setMode('idle')
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Scan & Catalog"
          subtitle="Use your camera or upload a photo to detect donation items with AI"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/donor/donate')}>
              ← Back to Donation
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left: Camera / Preview area (takes 2/3 width on lg) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card padding="none" className="overflow-hidden">

              {/* Camera live feed */}
              {mode === 'camera' && (
                <div className="relative aspect-video w-full bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {/* Capture reticle */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-2xl border-2 border-white/40" />
                  </div>
                  {/* Close camera */}
                  <button
                    onClick={stopCamera}
                    className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    aria-label="Close camera"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Image preview */}
              {mode === 'preview' && preview && (
                <div className="relative aspect-video w-full bg-black">
                  <img
                    src={preview}
                    alt="Captured preview"
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={resetAll}
                    className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Idle placeholder */}
              {mode === 'idle' && (
                <div
                  className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 bg-[#0d1118] text-[#6B7280] hover:text-[#A1A8B3] transition-colors"
                  onClick={startCamera}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10">
                    <Camera className="h-7 w-7" />
                  </div>
                  <p className="text-sm">Click to enable camera, or upload a photo below</p>
                </div>
              )}

              {/* Hidden canvas for snapshot */}
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </Card>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {mode === 'camera' ? (
                <>
                  <Button onClick={captureSnapshot} className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    Capture
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                </>
              ) : mode === 'preview' ? (
                <>
                  <Button onClick={handleAnalyze} loading={loading} disabled={!file}>
                    {loading ? 'Detecting...' : 'Detect Items'}
                  </Button>
                  <Button variant="outline" onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Retake
                  </Button>
                  <Button variant="ghost" onClick={resetAll}>Clear</Button>
                </>
              ) : (
                <>
                  <Button onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Enable camera
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload photo
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* ── Right: Detected items panel ── */}
          <div className="flex flex-col gap-4">
            <Card className="flex flex-1 flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-da-text">Detected items</h2>
                <span className="text-xs text-da-muted">{detectedTotal} item{detectedTotal !== 1 ? 's' : ''}</span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Spinner />
                  <p className="text-xs text-da-secondary">Analysing with AI...</p>
                </div>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-xs text-da-muted">
                  No items yet. Capture or upload a photo to get started.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {results.map((r, i) => (
                    <div key={i} className="rounded-lg border border-da-border bg-da-bg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-da-text">{r.name}</p>
                        <Badge variant="info">{capitalize(r.category)} x{r.count}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-da-border">
                          <div
                            className="h-1.5 rounded-full bg-da-primary transition-all"
                            style={{ width: `${Math.round(r.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-da-muted">{scoreToPercent(r.confidence)}</span>
                      </div>
                      <div className="mt-3">
                        <Input
                          label="Description"
                          placeholder="e.g. maths book"
                          value={r.description}
                          onChange={e => setResults(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setCart(prev => {
                      const merged = prev.map(item => ({ ...item }))
                      results.forEach(r => {
                        const existing = merged.find(c => c.name === r.name)
                        if (!existing) {
                          merged.push({ ...r })
                        } else {
                          existing.description = r.description
                          existing.count = r.count
                          existing.category = r.category
                          existing.confidence = r.confidence
                          existing.bbox = r.bbox
                        }
                      })
                      return merged
                    })}
                  >
                    + Add to cart ({cart.length + results.length})
                  </Button>
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-3 border-t border-da-border pt-3 flex flex-col gap-2">
                  <p className="text-xs font-medium text-da-secondary">Cart ({cart.length} items)</p>
                  {cart.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-da-bg px-2 py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs text-da-text">{c.name} x{c.count}</span>
                        {c.description && (
                          <span className="text-[11px] text-da-secondary">Description: {c.description}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <Button
                    loading={confirming}
                    disabled={confirming}
                    className="w-full mt-1"
                    onClick={async () => {
                      setConfirming(true)
                      try {
                        const donation = await donationsApi.create('Scanned donation')
                        const id = donation.data.data.id
                        for (const item of cart) {
                          await donationsApi.addItem(id, {
                            item_name: item.name,
                            description: item.description || undefined,
                            category: item.category,
                            quantity: item.count || 1,
                            condition: 'good',
                            ai_detected: true,
                            confidence_score: item.confidence,
                          })
                        }
                        await donationsApi.submit(id)
                        toast.success('Donation confirmed & submitted!')
                        navigate(`/donor/pickup-schedule?donationId=${id}`)
                      } catch (err: unknown) {
                        setError(getApiError(err))
                        toast.error('Failed to confirm donation')
                      } finally {
                        setConfirming(false)
                      }
                    }}
                  >
                    Confirm & Schedule Pickup →
                  </Button>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
