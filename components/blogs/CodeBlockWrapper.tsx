'use client'

import React, { useState, useRef } from 'react'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'

interface CodeBlockWrapperProps extends React.HTMLAttributes<HTMLPreElement> {}

export function CodeBlockWrapper({
  children,
  ...props
}: CodeBlockWrapperProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    const textContent = preRef.current?.textContent
    if (textContent && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textContent)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy text: ', err)
      }
    }
  }

  return (
    <div className="group relative my-4">
      <pre
        ref={preRef}
        {...props}
        className={`rounded-md border p-4 font-mono text-sm ${props.className || ''}`}
      >
        {children}
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7 opacity-100 transition-opacity"
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
      >
        {isCopied ? (
          <CheckIcon className="size-4 text-green-600" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </Button>
    </div>
  )
}
