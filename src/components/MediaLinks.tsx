"use client"

import { useState, useRef } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faPlus, faFile } from "@fortawesome/free-solid-svg-icons"
import type { UploadResponse } from "imagekit/dist/libs/interfaces"
import type { Media } from "@prisma/client"
import Uploader from "./Uploader"

interface MediaLinksProps {
  media: Media[]
  setMedia: (media: Media[]) => void
  onMediaChange: (index: number, field: keyof Media, value: any) => void
  onAddMedia: () => void
  onRemoveMedia: (index: number) => void
}

export default function MediaLinks({
  media,
  setMedia,
  onMediaChange,
  onAddMedia,
  onRemoveMedia
}: MediaLinksProps) {
  const [errors, setErrors] = useState<{ [key: number]: { [key: string]: string } }>({})
  const [isUploading, setIsUploading] = useState<number | null>(null)
  const uploaderRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  function handleMediaChange(index: number, field: keyof Media, value: any) {
    onMediaChange(index, field, value)

    // Clear error when input is empty
    if (!value) {
      const newErrors = { ...errors }
      if (newErrors[index]) {
        delete newErrors[index][field]
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index]
        }
      }
      setErrors(newErrors)
      return
    }

    // Validate URL for documentUrl field
    if (field === 'documentUrl') {
      try {
        let urlToValidate = value
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
          urlToValidate = `https://${value}`
        }

        new URL(urlToValidate) // This will throw if the URL is invalid
        const newErrors = { ...errors }
        if (newErrors[index]) {
          delete newErrors[index][field]
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index]
          }
        }
        setErrors(newErrors)
      } catch {
        setErrors(prev => ({
          ...prev,
          [index]: { ...prev[index], [field]: "Please enter a valid URL" }
        }))
      }
    }
  }

  function handleDocumentUpload(index: number, file?: UploadResponse) {
    const newMedia = [...media]
    newMedia[index] = {
      ...newMedia[index],
      documentFile: file as any,
      documentUrl: file?.url || ''
    }
    setMedia(newMedia)
    setIsUploading(null)
  }

  function handleUploadStart(index: number) {
    setIsUploading(index)
  }

  function handleUploadClick(index: number) {
    uploaderRefs.current[index]?.click()
  }

  return (
    <div className="space-y-4">
      {media.map((item, index) => (
        <div key={index} className="border p-4 rounded-lg">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Media Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleMediaChange(index, 'name', e.target.value)}
                placeholder="e.g. Resume"
                required
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  errors[index]?.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors[index]?.name && (
                <p className="text-sm text-red-500 mt-1">{errors[index].name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                File <span className="text-red-500">*</span>
              </label>
              {item.documentFile ? (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faFile} className="text-gray-400 text-2xl" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{(item.documentFile as any).name}</p>
                      <p className="text-xs text-gray-500">{((item.documentFile as any).size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => handleDocumentUpload(index)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      aria-label="Remove file"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleUploadClick(index)}
                    disabled={isUploading === index}
                    className={`px-4 py-2 border rounded-md transition-colors flex items-center gap-2 ${
                      isUploading === index
                        ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                        : 'border-theme-green text-theme-green hover:bg-green-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
                    {isUploading === index ? 'Uploading...' : 'Upload File'}
                  </button>
                  <Uploader
                    ref={(el: HTMLInputElement | null) => uploaderRefs.current[index] = el}
                    accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg"
                    onUploadStart={() => handleUploadStart(index)}
                    onSuccess={(file) => handleDocumentUpload(index, file)}
                    className="hidden"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">Upload a resume or other file (PDF, Word, text, or image, max 5MB)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                File URL (if hosted externally) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={item.documentUrl || ''}
                onChange={(e) => handleMediaChange(index, 'documentUrl', e.target.value)}
                placeholder="https://example.com/resume.pdf"
                required={!item.documentFile}
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  errors[index]?.documentUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors[index]?.documentUrl && (
                <p className="text-sm text-red-500 mt-1">{errors[index].documentUrl}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemoveMedia(index)}
            className="mt-2 p-2 text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Remove media"
          >
            <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAddMedia}
        className="mt-2 px-4 py-2 bg-theme-green text-white rounded-md transition-colors flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
        Add File
      </button>
    </div>
  )
}
