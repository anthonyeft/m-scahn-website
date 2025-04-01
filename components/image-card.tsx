"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ZoomIn, ZoomOut } from "lucide-react"

interface ImageCardProps {
  title: string
  imageSrc: string
  altText: string
}

export function ImageCard({ title, imageSrc, altText }: ImageCardProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        <motion.div
          className="relative aspect-square overflow-hidden cursor-pointer"
          whileHover={{ scale: isZoomed ? 1 : 1.02 }}
          onClick={toggleZoom}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`image-${isZoomed}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
            >
              <Image
                src={imageSrc || "/placeholder.svg"}
                alt={altText}
                fill
                className={`object-contain transition-all duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
              />
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="absolute bottom-2 right-2 bg-white/80 rounded-full p-2 shadow-md"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isZoomed ? <ZoomOut className="h-5 w-5 text-slate-700" /> : <ZoomIn className="h-5 w-5 text-slate-700" />}
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

