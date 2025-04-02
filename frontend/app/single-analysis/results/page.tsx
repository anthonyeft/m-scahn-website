"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, AlertTriangle, Info } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion, AnimatePresence } from "framer-motion"

interface ClassificationResult {
  prediction: string
  confidence: number
  description: string
  risk: "low" | "medium" | "high"
  abcde: {
    asymmetry: number
    border: number
    color: number
    diameter: number
    evolution: number
  }
}

// Mock data for demonstration
const mockResults: ClassificationResult = {
  prediction: "Benign Nevus",
  confidence: 87,
  description:
    "This appears to be a common benign nevus (mole). The features suggest a low risk for malignancy, but regular monitoring is always recommended.",
  risk: "low",
  abcde: {
    asymmetry: 15,
    border: 22,
    color: 18,
    diameter: 30,
    evolution: 10,
  },
}

export default function SingleAnalysisResultsPage() {
  const [imageData, setImageData] = useState<string | null>(null)
  const [results, setResults] = useState<ClassificationResult | null>(null)

  useEffect(() => {
    // In a real app, you would fetch results from an API
    // For this demo, we're using mock data and retrieving the image from localStorage
    const storedImage = localStorage.getItem("analysisImage")
    if (storedImage) {
      setImageData(storedImage)
      // Simulate loading results
      setTimeout(() => {
        setResults(mockResults)
      }, 500)
    }
  }, [])

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
                  <CardTitle>Uploaded Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-square rounded-md overflow-hidden border">
                    <Image
                      src={imageData || "/placeholder.svg"}
                      alt="Analyzed skin lesion"
                      fill
                      className="object-contain"
                    />
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
                {results ? (
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
                            <h3 className="text-xl font-bold">{results.prediction}</h3>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                results.risk === "low"
                                  ? "bg-green-100 text-green-800"
                                  : results.risk === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {results.risk === "low"
                                ? "Low Risk"
                                : results.risk === "medium"
                                  ? "Medium Risk"
                                  : "High Risk"}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Confidence</span>
                              <span className="text-sm font-medium">{results.confidence}%</span>
                            </div>
                            <Progress value={results.confidence} className="h-2" />
                          </div>

                          <div className="p-4 bg-slate-50 rounded-md">
                            <p className="text-slate-700">{results.description}</p>
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
                                <span>{results.abcde.asymmetry}%</span>
                              </div>
                              <Progress value={results.abcde.asymmetry} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Measures how asymmetrical the lesion appears.
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Border Irregularity</span>
                                <span>{results.abcde.border}%</span>
                              </div>
                              <Progress value={results.abcde.border} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Indicates how irregular or uneven the borders are.
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Color Variation</span>
                                <span>{results.abcde.color}%</span>
                              </div>
                              <Progress value={results.abcde.color} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Shows the degree of color variation within the lesion.
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Diameter</span>
                                <span>{results.abcde.diameter}%</span>
                              </div>
                              <Progress value={results.abcde.diameter} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Relative size of the lesion (higher values indicate larger diameter).
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Evolution Risk</span>
                                <span>{results.abcde.evolution}%</span>
                              </div>
                              <Progress value={results.abcde.evolution} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                Estimated risk of the lesion changing over time.
                              </p>
                            </div>
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
                        Analyzing image...
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

