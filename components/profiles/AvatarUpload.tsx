'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AvatarComponent from '../pages/Avatar'

export function AvatarUpload({
  src,
  fallback,
}: {
  src: string
  fallback: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // When the component is unmounted, release the URL
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <AvatarComponent
        className="mx-auto mb-5 flex size-40"
        src={preview || src}
        fallback={fallback}
      />
      <Label htmlFor="avatarFile">Avatar</Label>

      <Input
        id="avatarFile"
        name="avatarFile"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}
