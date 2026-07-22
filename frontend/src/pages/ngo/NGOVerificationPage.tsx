import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { ngosApi } from '../../api/ngos'
import { useToast } from '../../store/ToastProvider'
import type { NGOProfile } from '../../types/index'
import { formatDate } from '../../utils/index'

export function NGOVerificationPage() {
  const [profile, setProfile] = useState<NGOProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const toast = useToast()

  const fetchProfile = useCallback(() => {
    setLoading(true)
    ngosApi.getProfile()
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Failed to load NGO profile verification details'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProfile()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchProfile])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Please select a document file to upload')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await ngosApi.uploadVerificationDocs(formData)
      setProfile(response.data.data)
      setSelectedFile(null)
      toast.success('Verification documents submitted successfully!')
    } catch {
      toast.error('Failed to upload verification documents. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  const status = profile?.verification_status || 'unsubmitted'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <PageHeader
          title="NGO Document Verification"
          subtitle="Submit official registration documents to verify your organisation and unlock full platform capabilities."
        />

        {/* ── Current Verification Status Banner ──────────────────── */}
        <Card className="border border-da-border/60 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-da-border/40 pb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-da-secondary font-semibold">Verification Status</p>
              <h3 className="text-xl font-bold text-da-text mt-1 flex items-center gap-3">
                {profile?.org_name}
                {profile?.is_verified ? (
                  <Badge variant="success">Verified NGO</Badge>
                ) : status === 'pending' ? (
                  <Badge variant="warning">Under Review</Badge>
                ) : status === 'rejected' ? (
                  <Badge variant="danger">Action Required (Rejected)</Badge>
                ) : (
                  <Badge variant="info">Unsubmitted</Badge>
                )}
              </h3>
              <p className="text-xs text-da-secondary mt-1">Registration #: {profile?.registration_number}</p>
            </div>

            {profile?.verification_submitted_at && (
              <div className="text-left sm:text-right">
                <p className="text-xs text-da-secondary">Submitted On</p>
                <p className="text-sm font-medium text-da-text mt-0.5">{formatDate(profile.verification_submitted_at)}</p>
              </div>
            )}
          </div>

          {/* Alert Message Box */}
          <div className="mt-6">
            {profile?.is_verified ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 text-sm flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-semibold">Verification Complete</p>
                  <p className="text-xs text-emerald-300/80 mt-0.5">Your organisation has been fully verified by an administrator. You have unrestricted access to create demands, accept matched donations, and schedule pickups.</p>
                </div>
              </div>
            ) : status === 'pending' ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300 text-sm flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="font-semibold">Documents Under Review</p>
                  <p className="text-xs text-amber-200/80 mt-0.5">An admin is currently reviewing your uploaded verification documents. Once approved, demand creation and matching features will automatically activate.</p>
                </div>
              </div>
            ) : status === 'rejected' ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">❌</span>
                <div>
                  <p className="font-semibold">Application Requires Re-submission</p>
                  <p className="text-xs text-red-300 mt-1">
                    <strong>Admin Reason:</strong> {profile.rejection_reason || 'Please upload updated registration documentation.'}
                  </p>
                  <p className="text-xs text-red-300/80 mt-1">Please review the reason above and upload valid official documents below.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#1D8CF8]/20 bg-[#1D8CF8]/10 p-4 text-[#1D8CF8] text-sm flex items-center gap-3">
                <span className="text-xl">📄</span>
                <div>
                  <p className="font-semibold">Upload Required Documents</p>
                  <p className="text-xs text-[#1D8CF8]/80 mt-0.5">Please upload your official NGO registration certificate or 80G/12A tax exemption proof to begin the verification process.</p>
                </div>
              </div>
            )}
          </div>

          {/* Currently Uploaded File Info */}
          {profile?.verification_doc_path && (
            <div className="mt-6 pt-6 border-t border-da-border/40">
              <p className="text-xs font-semibold text-da-secondary uppercase tracking-wider mb-2">Uploaded Document</p>
              <div className="flex items-center justify-between rounded-xl border border-da-border bg-da-surface/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#1D8CF8]">📎</span>
                  <div>
                    <p className="text-sm font-medium text-da-text">Verification Document</p>
                    <p className="text-xs text-da-secondary">{profile.verification_doc_path}</p>
                  </div>
                </div>
                <a
                  href={`http://localhost:8000${profile.verification_doc_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#1D8CF8]/10 px-3 py-1.5 text-xs font-medium text-[#1D8CF8] hover:bg-[#1D8CF8]/20 transition-colors"
                >
                  View File ↗
                </a>
              </div>
            </div>
          )}
        </Card>

        {/* ── Document Upload Form ────────────────────────────────── */}
        {!profile?.is_verified && (
          <Card className="border border-da-border/60">
            <h3 className="text-lg font-bold text-da-text mb-2">
              {status === 'pending' ? 'Update / Re-upload Document' : 'Upload Verification File'}
            </h3>
            <p className="text-xs text-da-secondary mb-6">
              Supported file formats: <strong>PDF, PNG, JPG, DOC, DOCX</strong> (Max size: 10 MB).
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={[
                  'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer',
                  dragActive
                    ? 'border-[#1D8CF8] bg-[#1D8CF8]/10 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-da-border hover:border-da-text/40 bg-da-surface/30',
                ].join(' ')}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1D8CF8]/10 text-2xl text-[#1D8CF8]">
                    {selectedFile ? '📄' : '☁️'}
                  </div>

                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-semibold text-da-text">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Ready to submit
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-da-text">
                        Click to upload or drag & drop file here
                      </p>
                      <p className="text-xs text-da-secondary mt-1">
                        NGO Registration Certificate, 80G/12A Certificate, or Official ID Proof
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                  >
                    Clear Selection
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  loading={uploading}
                >
                  {status === 'pending' ? 'Re-submit Document' : 'Submit for Verification'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── Guidelines & Benefits ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm" className="border border-da-border/40">
            <span className="text-2xl">🎯</span>
            <h4 className="text-sm font-semibold text-da-text mt-2">Create Demands</h4>
            <p className="text-xs text-da-secondary mt-1">Verified NGOs can post specific resource needs that match donor items automatically.</p>
          </Card>

          <Card padding="sm" className="border border-da-border/40">
            <span className="text-2xl">🤝</span>
            <h4 className="text-sm font-semibold text-da-text mt-2">Intelligent Matching</h4>
            <p className="text-xs text-da-secondary mt-1">Our AI algorithm matches donor contributions directly with your verified organisation.</p>
          </Card>

          <Card padding="sm" className="border border-da-border/40">
            <span className="text-2xl">🛡️</span>
            <h4 className="text-sm font-semibold text-da-text mt-2">Trust & Authenticity</h4>
            <p className="text-xs text-da-secondary mt-1">Verification badges reassure donors that their contributions reach genuine causes.</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
