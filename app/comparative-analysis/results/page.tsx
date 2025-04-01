"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, AlertTriangle } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion, AnimatePresence } from "framer-motion"

interface ComparisonResult {
  changePercentage: number
  growthDetected: boolean
  colorChangeDetected: boolean
  borderChangeDetected: boolean
  summary: string
  recommendations: string
}

// Mock data for demonstration
const mockResults: ComparisonResult = {
  changePercentage: 12,
  growthDetected: true,
  colorChangeDetected: false,
  borderChangeDetected: true,
  summary:
    "Analysis shows a 12% change in the lesion with notable growth and border irregularity changes. The color remains relatively consistent between the two images.",
  recommendations:
    "Given the detected changes in size and border irregularity, we recommend consulting with a dermatologist for a professional evaluation.",
}

export default function ComparativeAnalysisResultsPage() {
  const [image1Data, setImage1Data] = useState<string | null>(null)
  const [image2Data, setImage2Data] = useState<string | null>(null)
  const [results, setResults] = useState<ComparisonResult | null>(null)

  useEffect(() => {
    // In a real app, you would fetch results from an API
    // For this demo, we're using mock data and retrieving images from localStorage
    const storedImage1 = localStorage.getItem("compareImage1")
    const storedImage2 = localStorage.getItem("compareImage2")

    if (storedImage1 && storedImage2) {
      setImage1Data(storedImage1)
      setImage2Data(storedImage2)

      // Simulate loading results
      setTimeout(() => {
        setResults(mockResults)
      }, 1000)
    }
  }, [])

  if (!image1Data || !image2Data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No image data found</h1>
          <p className="mb-6 text-slate-600">Please upload two images for comparison first.</p>
          <Button asChild>
            <Link href="/comparative-analysis">Go to Comparative Analysis</Link>
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
              <Link href="/comparative-analysis" className="flex items-center text-primary hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Comparative Analysis
              </Link>
            </motion.div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Comparison Results</h1>
          <p className="text-slate-600 mb-8">Analysis of changes between the two uploaded images</p>

          <Tabs defaultValue="side-by-side">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                <TabsTrigger value="overlay">Overlay</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="side-by-side">
              <AnimatePresence mode="wait">
                <motion.div
                  className="grid md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  key="side-by-side"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Earlier Image (Before)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-square rounded-md overflow-hidden border">
                        <Image
                          src={image1Data || "/placeholder.svg"}
                          alt="Earlier skin lesion"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Image (After)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-square rounded-md overflow-hidden border">
                        <Image
                          src={image2Data || "/placeholder.svg"}
                          alt="Recent skin lesion"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="overlay">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  key="overlay"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Image Overlay Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-video max-w-2xl mx-auto rounded-md overflow-hidden border">
                        <div className="absolute inset-0 z-10">
                          <Image
                            src={image2Data || "/placeholder.svg"}
                            alt="Recent skin lesion overlay"
                            fill
                            className="object-contain opacity-70"
                          />
                        </div>
                        <div className="absolute inset-0">
                          <Image
                            src={image1Data || "/placeholder.svg"}
                            alt="Earlier skin lesion"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-slate-600">
                        <p>The overlay shows both images superimposed to highlight changes.</p>
                        <p>Areas with differences will appear with color variations.</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="analysis">
              <AnimatePresence mode="wait">
                {results ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    key="analysis-results"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Change Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-md">
                          <h3 className="font-medium mb-2">Summary</h3>
                          <p className="text-slate-700">{results.summary}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium mb-3">Detected Changes</h3>
                            <ul className="space-y-2">
                              <li className="flex items-center">
                                <div
                                  className={`w-4 h-4 rounded-full mr-2 ${results.growthDetected ? "bg-amber-500" : "bg-green-500"}`}
                                ></div>
                                <span>Size Change: {results.changePercentage}%</span>
                              </li>
                              <li className="flex items-center">
                                <div
                                  className={`w-4 h-4 rounded-full mr-2 ${results.colorChangeDetected ? "bg-amber-500" : "bg-green-500"}`}
                                ></div>
                                <span>Color Change: {results.colorChangeDetected ? "Detected" : "Minimal"}</span>
                              </li>
                              <li className="flex items-center">
                                <div
                                  className={`w-4 h-4 rounded-full mr-2 ${results.borderChangeDetected ? "bg-amber-500" : "bg-green-500"}`}
                                ></div>
                                <span>Border Change: {results.borderChangeDetected ? "Detected" : "Minimal"}</span>
                              </li>
                            </ul>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-md">
                            <h3 className="font-medium mb-2">Recommendations</h3>
                            <p className="text-slate-700">{results.recommendations}</p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                          <p className="text-sm text-amber-800">
                            This is not a medical diagnosis. Please consult with a healthcare professional for proper
                            evaluation.
                          </p>
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => window.print()}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Comparison Report
                        </Button>
                      </CardContent>
                    </Card>
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
                        Analyzing images...
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </div>
  )
}

