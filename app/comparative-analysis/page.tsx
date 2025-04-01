"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileUploader } from "@/components/file-uploader"
import { ArrowLeft } from "lucide-react"

export default function ComparativeAnalysisPage() {
  const router = useRouter()
  const [imageFile1, setImageFile1] = useState<File | null>(null)
  const [imageFile2, setImageFile2] = useState<File | null>(null)
  const [imagePreview1, setImagePreview1] = useState<string | null>(null)
  const [imagePreview2, setImagePreview2] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange1 = (file: File | null) => {
    setImageFile1(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview1(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview1(null)
    }
  }

  const handleFileChange2 = (file: File | null) => {
    setImageFile2(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview2(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview2(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageFile1 || !imageFile2) return

    setIsLoading(true)

    // In a real application, you would upload the images to your server
    // For this demo, we'll simulate processing with a timeout
    setTimeout(() => {
      // Store image data in localStorage to retrieve on the results page
      // In a real app, you would store the results in a database or state management
      localStorage.setItem("compareImage1", imagePreview1 as string)
      localStorage.setItem("compareImage2", imagePreview2 as string)
      router.push("/comparative-analysis/results")
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-primary hover:underline group transition-all duration-200">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1" />
            <span className="relative">
              Back to Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"></span>
            </span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6 animate-fade-in">Comparative Analysis</h1>
        <p className="text-slate-600 mb-8 animate-fade-in animation-delay-200">
          Upload two images of the same skin lesion taken at different times to track changes.
        </p>

        <div className="animate-fade-in animation-delay-300">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Earlier Image (Before)</h2>
                  <p className="text-sm text-slate-500">Upload the first image of the skin lesion.</p>

                  <FileUploader
                    onFileChange={handleFileChange1}
                    acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                  />

                  {imagePreview1 && (
                    <div className="mt-2 border rounded-md p-3 transition-all duration-300">
                      <h3 className="text-sm font-medium mb-2">Image 1 Preview</h3>
                      <div className="relative h-48 rounded-md overflow-hidden">
                        <Image
                          src={imagePreview1 || "/placeholder.svg"}
                          alt="Earlier skin lesion"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Recent Image (After)</h2>
                  <p className="text-sm text-slate-500">Upload a more recent image of the same skin lesion.</p>

                  <FileUploader
                    onFileChange={handleFileChange2}
                    acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                  />

                  {imagePreview2 && (
                    <div className="mt-2 border rounded-md p-3 transition-all duration-300">
                      <h3 className="text-sm font-medium mb-2">Image 2 Preview</h3>
                      <div className="relative h-48 rounded-md overflow-hidden">
                        <Image
                          src={imagePreview2 || "/placeholder.svg"}
                          alt="Recent skin lesion"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    disabled={!imageFile1 || !imageFile2 || isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        Analyzing...
                      </span>
                    ) : (
                      "Compare Images"
                    )}
                  </Button>
                  <p className="text-xs text-center text-slate-500 mt-2">
                    By submitting, you acknowledge this is for educational purposes only and not a medical diagnosis.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

