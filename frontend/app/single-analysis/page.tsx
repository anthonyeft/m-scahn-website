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

export default function SingleAnalysisPage() {
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (file: File | null) => {
    setImageFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageFile) return

    setIsLoading(true)

    try {
      // Create form data to send the image
      const formData = new FormData()
      formData.append('image', imageFile)

      // Send to your Render/Uvicorn server
      const response = await fetch(`${process.env.NEXT_PUBLIC_ANALYZE_API_URL}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Server error: ' + response.status)
      }

      // Get analysis results
      const result = await response.json()
      
      // Store results in localStorage
      localStorage.setItem("analysisImage", imagePreview as string)
      localStorage.setItem("analysisResult", JSON.stringify(result))
      
      // Navigate to results page
      router.push("/single-analysis/results")
    } catch (error) {
      console.error('Error analyzing image:', error)
      // Handle error (show message to user)
      alert('Failed to analyze image. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

        <h1 className="text-3xl font-bold mb-6 animate-fade-in">Single Image Analysis</h1>

        <p className="text-slate-600 mb-8 animate-fade-in animation-delay-200">
          Upload a clear image of a skin lesion to receive an AI-powered analysis and assessment.
        </p>

        <div className="animate-fade-in animation-delay-300">
          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Upload Image</h2>
                  <p className="text-sm text-slate-500">
                    For best results, use a well-lit, in-focus image of the skin lesion.
                  </p>

                  <FileUploader
                    onFileChange={handleFileChange}
                    acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                  />

                  {imagePreview && (
                    <div className="mt-4 border rounded-md p-4 transition-all duration-300">
                      <h3 className="text-sm font-medium mb-2">Image Preview</h3>
                      <div className="relative aspect-square max-w-sm mx-auto rounded-md overflow-hidden">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Uploaded skin lesion"
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
                    className="w-full relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    disabled={!imageFile || isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze Image"
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

