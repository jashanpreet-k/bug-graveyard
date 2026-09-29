import Link from 'next/link'

import {formatDate, type TimelineEvent} from '@/lib/graves'

// A vertical timeline of a bug's lives: see timelineOf in lib/graves.ts.
export function LifeTimeline({events}: {events: TimelineEvent[]}) {
  return (
    <ol className="relative mt-8 flex flex-col gap-6 border-l border-bone/20 pl-8">
      {events.map((event) => (
        <li key={event.key} className="relative">
          <span
            aria-hidden
            className={`absolute top-0 -left-[2.95rem] flex h-9 w-9 items-center justify-center rounded-full border text-lg ${
              event.key === 'haunted'
                ? 'border-[#cfe0ff]/50 bg-[#1b2336] shadow-[0_0_18px_rgb(170_200_255/0.35)]'
                : event.current
                  ? 'border-bone/50 bg-[#1a2136]'
                  : 'border-bone/20 bg-night'
            }`}
          >
            {event.icon}
          </span>
          <p className="flex flex-wrap items-baseline gap-x-3 text-bone">
            <span className={event.key === 'haunted' ? 'font-medium text-[#cfe0ff]' : 'font-medium'}>
              {event.href ? (
                <Link href={event.href} className="underline underline-offset-4 hover:text-moss">
                  {event.title}
                </Link>
              ) : (
                event.title
              )}
            </span>
            {event.date && <span className="text-sm text-bone/60">{formatDate(event.date)}</span>}
          </p>
          {event.detail && <p className="mt-1 max-w-2xl text-sm text-bone/70">{event.detail}</p>}
        </li>
      ))}
    </ol>
  )
}
