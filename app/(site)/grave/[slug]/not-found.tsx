import Link from 'next/link'

export default function GraveNotFound() {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <h1 className="font-display text-5xl text-bone sm:text-6xl">This grave is empty.</h1>
      <p className="mt-4 max-w-md text-bone/75">
        No bug was ever buried here. Either the name is wrong, or it never died.
      </p>
      <Link href="/" className="mt-8 text-moss underline underline-offset-4">
        Back to the graveyard
      </Link>
    </div>
  )
}
