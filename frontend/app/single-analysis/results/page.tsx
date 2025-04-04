"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, AlertTriangle, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion, AnimatePresence } from "framer-motion"

// Update the interface to match your backend response
// Update the interface to match your backend response
interface ABCResult {
  asymmetry_score: number;
  border_score: number;
  color_score: number;
  traits: string[];
  classification: string;
  confidence_score: number;
  processed_image: string;
  contour_image: string;
}

export default function SingleAnalysisResultsPage() {
  const [imageData, setImageData] = useState<string | null>(null)
  const [results, setResults] = useState<ABCResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Labels for the images in the carousel
  const imageLabels = [
    "Original Image",
    "Processed Image",
    "Detected Lesion"
  ]

  useEffect(() => {
    // Retrieve data from localStorage
    const storedImage = localStorage.getItem("analysisImage")
    const storedResult = localStorage.getItem("analysisResult")
    
    if (storedImage) {
      setImageData(storedImage)
    }
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult) as ABCResult
        setResults(parsedResult)
      } catch (error) {
        console.error("Error parsing analysis results:", error)
      }
    }
    
    setIsLoading(false)
  }, [])

  // Function to get the current image to display based on index
  // Function to get the current image to display based on index
  const getCurrentImage = () => {
    if (!results) return imageData || "/placeholder.svg"
    
    switch (currentImageIndex) {
      case 0: return imageData || "/placeholder.svg"  // Original
      case 1: return results.processed_image || imageData  // Processed
      case 2: return results.contour_image || results.processed_image  // Contour image
      default: return imageData || "/placeholder.svg"
    }
  }

  // Navigation handlers for carousel
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % 3)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + 3) % 3)
  }

  if (!imageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No image data found</h1>
          <p className="mb-6 text-slate-600">Please upload an image for analysis first.</p>
          <Button asChild>
            <Link href="/single-analysis">Go to Analysis</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <PageTransition>
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}>
              <Link href="/single-analysis" className="flex items-center text-primary hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Analysis
              </Link>
            </motion.div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
          <p className="text-slate-600 mb-8">AI-powered assessment of your skin lesion image</p>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{imageLabels[currentImageIndex]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-square rounded-md overflow-hidden border">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full"
                      >
                        <Image
                          src={getCurrentImage()}
                          alt={imageLabels[currentImageIndex]}
                          fill
                          className="object-contain"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  {/* Image carousel controls */}
                  <div className="flex items-center justify-between mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={prevImage}
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-500">
                      {currentImageIndex + 1} of 3
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={nextImage}
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <Button variant="outline" className="mt-4 w-full" onClick={() => window.print()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {!isLoading && results ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    key="results"
                  >
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Classification Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">{results.classification}</h3>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Confidence</span>
                              <span className="text-sm font-medium">{Math.round(results.confidence_score * 100)}%</span>
                            </div>
                            <Progress value={results.confidence_score * 100} className="h-2" />
                          </div>

                          <div className="p-4 bg-slate-50 rounded-md">
                            <p className="text-slate-700">
                              {results.classification === "Melanoma" 
                                ? "This lesion shows characteristics that may be concerning. Please consult with a dermatologist promptly."
                                : "This appears to be a benign lesion. The features suggest a low risk for malignancy, but regular monitoring is always recommended."}
                            </p>
                          </div>

                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                              This is not a medical diagnosis. Please consult with a healthcare professional for proper
                              evaluation.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center">
                            ABCDE Metrics
                            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                              <Info className="ml-2 h-4 w-4 text-slate-400" />
                            </motion.div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Asymmetry</span>
                                <span>{Math.round(results.asymmetry_score * 100)}%</span>
                              </div>
                              <Progress value={results.asymmetry_score * 100} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Measures how asymmetrical the lesion appears.
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Border Irregularity</span>
                                <span>{Math.round(results.border_score * 100)}%</span>
                              </div>
                              <Progress value={results.border_score * 100} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Indicates how irregular or uneven the borders are.
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Color Variation</span>
                                <span>{Math.round(results.color_score * 100)}%</span>
                              </div>
                              <Progress value={results.color_score * 100} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Shows the degree of color variation within the lesion.
                              </p>
                            </div>
                            
                            {/* Traits section */}
                            {results.traits && results.traits.length > 0 && (
                              <div className="mt-5 pt-4 border-t border-slate-200">
                                <h4 className="font-medium mb-2">Detected Traits:</h4>
                                <ul className="space-y-1">
                                  {results.traits.map((trait, index) => (
                                    <li key={index} className="text-sm flex items-center">
                                      <span className="h-2 w-2 bg-primary rounded-full mr-2 flex-shrink-0" />
                                      {trait}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center justify-center h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="loading"
                  >
                    <div className="text-center">
                      <motion.div
                        className="rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      ></motion.div>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        Loading analysis results...
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}