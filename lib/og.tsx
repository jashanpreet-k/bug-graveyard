import {readFile} from 'node:fs/promises'
import {join} from 'node:path'

import type {TombstoneLook} from '@/components/Tombstone'

// Shared drawing for the share images (next/og). next/og renders with Satori,
// which only understands flexbox and inline styles, so this can't reuse the
// Tombstone component or its CSS module; it redraws the same look.

export const OG_SIZE = {width: 1200, height: 630}

// Read once per server instance. The Noto subset covers symbols Grenze Gotisch
// lacks (₹ € £ ¥, curly quotes, dashes); Satori falls back to it glyph by glyph.
const fontFiles = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/GrenzeGotisch-Regular.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/GrenzeGotisch-Bold.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/NotoSans-Symbols-subset.ttf')),
])

export async function ogFonts() {
  const [regular, bold, symbols] = await fontFiles
  return [
    {name: 'Grenze Gotisch', data: regular, weight: 400 as const, style: 'normal' as const},
    {name: 'Grenze Gotisch', data: bold, weight: 700 as const, style: 'normal' as const},
    {name: 'Noto Sans', data: symbols, weight: 400 as const, style: 'normal' as const},
  ]
}

const BONE = '#e9e6dc'
const MOSS = '#8dff9f'

export function OgScene({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #060913, #0d1326 60%, #161b29)',
        color: BONE,
        fontFamily: 'Grenze Gotisch',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 44,
          right: 70,
          width: 92,
          height: 92,
          borderRadius: 999,
          background: 'radial-gradient(circle at 38% 38%, #fbf8ec, #e6e0c8 55%, #c9c2a6)',
          boxShadow: '0 0 60px 14px rgba(246, 240, 214, 0.22)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          background: 'linear-gradient(to bottom, #0e1d15, #09140e)',
        }}
      />
      {children}
    </div>
  )
}

export function OgStone({
  look,
  width,
  height,
  children,
}: {
  look: TombstoneLook
  width: number
  height: number
  children?: React.ReactNode
}) {
  const zombie = look === 'zombie'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width,
        height,
        padding: `${Math.round(width * 0.16)}px ${Math.round(width * 0.09)}px ${Math.round(width * 0.08)}px`,
        borderRadius: `${width / 2}px ${width / 2}px 10px 10px`,
        background: zombie
          ? 'linear-gradient(to bottom, #53604f, #394438 55%, #283027)'
          : 'linear-gradient(to bottom, #5b5f67, #3f434a 55%, #2e3137)',
        boxShadow: zombie ? '0 0 60px 12px rgba(94, 255, 128, 0.35)' : '0 30px 40px -18px rgba(0, 0, 0, 0.9)',
        border: zombie ? '2px solid rgba(141, 255, 159, 0.35)' : 'none',
        // Satori's transform parser rejects 'none', so leave the property out instead.
        ...(look === 'disturbed' && {transform: 'rotate(-4deg)'}),
      }}
    >
      {children}
    </div>
  )
}

export function OgKicker({look, size}: {look: TombstoneLook; size: number}) {
  return (
    <div
      style={{
        fontSize: size,
        letterSpacing: size * 0.35,
        color: look === 'zombie' ? MOSS : BONE,
        textDecoration: look === 'disturbed' ? 'line-through' : 'none',
      }}
    >
      {look === 'zombie' ? 'RISEN' : 'R.I.P.'}
    </div>
  )
}

export function OgGrave({
  name,
  epitaph,
  dates,
  look,
  details,
}: {
  name: string
  epitaph: string | null
  dates: string
  look: TombstoneLook
  details: string[]
}) {
  return (
    <OgScene>
      <div style={{position: 'absolute', left: 90, bottom: 44, display: 'flex'}}>
        <OgStone look={look} width={440} height={510}>
          <OgKicker look={look} size={22} />
          <div
            style={{
              marginTop: 18,
              fontSize: name.length > 34 ? 44 : name.length > 22 ? 52 : 60,
              fontWeight: 700,
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            {name}
          </div>
          <div style={{marginTop: 16, fontSize: 24, opacity: 0.9}}>{dates}</div>
          {epitaph && (
            <div style={{marginTop: 28, fontSize: 32, lineHeight: 1.25, textAlign: 'center'}}>{`“${epitaph}”`}</div>
          )}
        </OgStone>
      </div>
      <div style={{position: 'absolute', left: 610, right: 70, top: 190, display: 'flex', flexDirection: 'column'}}>
        <div style={{fontSize: 84, fontWeight: 700, lineHeight: 1}}>Bug Graveyard</div>
        {details.map((line) => (
          <div key={line} style={{marginTop: 18, fontSize: 34, color: 'rgba(233, 230, 220, 0.85)'}}>
            {line}
          </div>
        ))}
        <div style={{marginTop: 40, fontSize: 28, color: MOSS}}>bug-graveyard.vercel.app</div>
      </div>
    </OgScene>
  )
}
