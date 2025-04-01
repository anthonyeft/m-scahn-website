"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface FileUploaderProps {
  onFileChange: (file: File | null) => void
  acceptedFileTypes?: string[]
  maxSizeMB?: number
}

export function FileUploader({
  onFileChange,
  acceptedFileTypes = ["image/jpeg", "image/png"],
  maxSizeMB = 5,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // Check file type
    if (acceptedFileTypes && !acceptedFileTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(", ")}`)
      return false
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return false
    }

    setError(null)
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (validateFile(file)) {
        setFileName(file.name)
        onFileChange(file)
      } else {
        // Clear input if validation fails
        if (inputRef.current) inputRef.current.value = ""
        setFileName(null)
        onFileChange(null)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]

      if (validateFile(file)) {
        setFileName(file.name)
        onFileChange(file)
      } else {
        // Don't need to clear anything for drag and drop
        setFileName(null)
        onFileChange(null)
      }
    }
  }

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = ""
    setFileName(null)
    onFileChange(null)
    setError(null)
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragActive ? "border-primary bg-primary/5" : "border-slate-300"
        } ${error ? "border-red-300" : ""} hover:shadow-md`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={acceptedFileTypes?.join(",")}
        />

        {!fileName ? (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary/10 transition-colors duration-200">
              <Upload className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag & drop your file or{" "}
                <span className="text-primary cursor-pointer hover:underline" onClick={handleButtonClick}>
                  browse
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Accepted formats: {acceptedFileTypes?.join(", ")}</p>
              <p className="text-xs text-slate-500">Max file size: {maxSizeMB}MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded transition-all duration-200">
            <span className="text-sm truncate max-w-[80%]">{fileName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600 transition-all duration-200">{error}</p>}
    </div>
  )
}

