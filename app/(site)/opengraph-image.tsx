import {ImageResponse} from 'next/og'

import {OG_SIZE, OgKicker, OgScene, OgStone, ogFonts} from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Bug Graveyard: three tombstones under a full moon, one of them a glowing zombie'

// The site-wide share image; grave pages have their own.
export default async function Image() {
  return new ImageResponse(
    <OgScene>
      <div style={{position: 'absolute', left: 80, top: 120, display: 'flex', flexDirection: 'column', width: 560}}>
        <div style={{fontSize: 104, fontWeight: 700, lineHeight: 1}}>Bug Graveyard</div>
        <div style={{marginTop: 24, fontSize: 40, color: 'rgba(233, 230, 220, 0.85)', lineHeight: 1.2}}>
          Here lie the bugs we fixed. Most of them stayed dead.
        </div>
        <div style={{marginTop: 36, fontSize: 30, color: '#8dff9f'}}>bug-graveyard.vercel.app</div>
      </div>
      <div style={{position: 'absolute', right: 70, bottom: 40, display: 'flex', alignItems: 'flex-end', gap: 26}}>
        <OgStone look="resting" width={150} height={210}>
          <OgKicker look="resting" size={14} />
        </OgStone>
        <OgStone look="disturbed" width={150} height={240}>
          <OgKicker look="disturbed" size={14} />
        </OgStone>
        <OgStone look="zombie" width={170} height={280}>
          <OgKicker look="zombie" size={16} />
        </OgStone>
      </div>
    </OgScene>,
    {...size, fonts: await ogFonts()},
  )
}
