import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { detectionApi } from '../../api/detection'
import type { DetectionResult } from '../../types/index'
import { capitalize, scoreToPercent } from '../../utils/index'

export function CameraPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [results, setResults] = useState<DetectionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults([])
    setError('')
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const res = await detectionApi.analyze(file)
      setResults(res.data.data.items)
    } catch {
      setError('Detection failed. Please try a different image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="AI Item Detection"
          subtitle="Upload a photo to automatically detect donation items"
          actions={<Button variant="ghost" onClick={() => navigate('/donor/donate')}>← Back to Donation</Button>}
        />

        <div className="mt-6 flex flex-col gap-6">
          <Card className="flex flex-col items-center gap-4">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 w-full rounded-lg object-contain" />
            ) : (
              <div
                className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500 dark:border-gray-700"
                onClick={() => inputRef.current?.click()}
              >
                <span className="text-4xl">📷</span>
                <p className="mt-2 text-sm">Click to upload or take a photo</p>
                <p className="text-xs text-gray-400">JPEG, PNG or WebP — max 10MB</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={() => inputRef.current?.click()}>
                {preview ? 'Change Image' : 'Select Image'}
              </Button>
              {preview && (
                <Button className="flex-1" onClick={handleAnalyze} loading={loading} disabled={!file}>
                  {loading ? 'Detecting...' : 'Detect Items'}
                </Button>
              )}
            </div>
          </Card>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</p>}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-gray-500">Analysing image with AI...</p>
            </div>
          )}

          {results.length > 0 && (
            <Card>
              <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
                Detected {results.length} item{results.length !== 1 ? 's' : ''}
              </h2>
              <div className="flex flex-col gap-3">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="info">{capitalize(r.category)}</Badge>
                        <Badge variant={r.confidence > 0.7 ? 'success' : 'warning'}>
                          {scoreToPercent(r.confidence)} confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.round(r.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => navigate('/donor/donate')}>Use These Items</Button>
                <Button variant="ghost" onClick={() => { setResults([]); setPreview(null); setFile(null) }}>Scan Again</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
