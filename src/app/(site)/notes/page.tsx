import { CollectionPage, collectionMetadata } from '@/features/posts'

export const metadata = collectionMetadata('notes')

export default function NotesPage() {
  return <CollectionPage collection="notes" />
}
