import { CollectionPage, collectionMetadata } from '@/features/posts'

export const metadata = collectionMetadata('writing')

export default function WritingPage() {
  return <CollectionPage collection="writing" />
}
