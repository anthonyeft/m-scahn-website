"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent hydration issues by not rendering theme-dependent content until mounted
  if (!isMounted) {
    return null // Or a simple loading state
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between transition-all duration-500">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200">
              <span className="text-primary-foreground font-bold">SC</span>
            </div>
            <h1 className="text-2xl font-bold">SkinCheck</h1>
          </div>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link href="/" className="font-medium text-primary hover:underline">
                  Home
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-16 transition-all duration-700">
          <h2 className="text-4xl font-bold mb-4">Skin Cancer Detection Made Simple</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload images of skin lesions for instant AI-powered analysis and track changes over time.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="group overflow-hidden border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors duration-300">
                Single Image Analysis
              </CardTitle>
              <CardDescription>Upload a single image of a skin lesion for detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src="/placeholder.svg?height=192&width=384"
                  alt="Single skin lesion analysis illustration"
                  width={384}
                  height={192}
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center">
                  <span className="font-medium text-primary bg-white/80 px-3 py-1 rounded-full shadow-sm transform translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Analyze a single image
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full relative overflow-hidden group-hover:bg-primary/90 transition-colors duration-300"
              >
                <Link href="/single-analysis" className="relative z-10">
                  <span className="absolute inset-0 w-full h-full bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  <span className="relative z-20">Start Analysis</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="group overflow-hidden border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative animate-fade-in animation-delay-200">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors duration-300">
                Comparative Analysis
              </CardTitle>
              <CardDescription>Compare two images of the same lesion taken at different times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src="/placeholder.svg?height=192&width=384"
                  alt="Comparative skin lesion analysis illustration"
                  width={384}
                  height={192}
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center">
                  <span className="font-medium text-primary bg-white/80 px-3 py-1 rounded-full shadow-sm transform translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Track lesion changes over time
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full relative overflow-hidden group-hover:bg-primary/90 transition-colors duration-300"
              >
                <Link href="/comparative-analysis" className="relative z-10">
                  <span className="absolute inset-0 w-full h-full bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  <span className="relative z-20">Start Comparison</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="mt-20 max-w-3xl mx-auto animate-fade-in animation-delay-500">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="size-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center relative overflow-hidden group">
                <span className="text-2xl font-bold text-primary relative z-10 group-hover:text-white transition-colors duration-300">
                  1
                </span>
                <div className="absolute inset-0 bg-primary scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
              </div>
              <h3 className="font-medium mb-2">Upload Image</h3>
              <p className="text-slate-600">Upload a clear image of the skin lesion you want to analyze</p>
            </div>
            <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="size-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center relative overflow-hidden group">
                <span className="text-2xl font-bold text-primary relative z-10 group-hover:text-white transition-colors duration-300">
                  2
                </span>
                <div className="absolute inset-0 bg-primary scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
              </div>
              <h3 className="font-medium mb-2">AI Analysis</h3>
              <p className="text-slate-600">Our advanced AI model analyzes the image for potential concerns</p>
            </div>
            <div className="p-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="size-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center relative overflow-hidden group">
                <span className="text-2xl font-bold text-primary relative z-10 group-hover:text-white transition-colors duration-300">
                  3
                </span>
                <div className="absolute inset-0 bg-primary scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
              </div>
              <h3 className="font-medium mb-2">Get Results</h3>
              <p className="text-slate-600">Receive a detailed report with classification and recommendations</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-800 text-white py-8 mt-20 transition-opacity duration-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-xl">SkinCheck</h3>
              <p className="text-slate-300">AI-powered skin lesion analysis</p>
            </div>
            <div>
              <p className="text-slate-300">© {new Date().getFullYear()} SkinCheck. Educational purpose only.</p>
              <p className="text-slate-400 text-sm mt-1">Not for medical diagnosis. Consult a doctor for concerns.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

