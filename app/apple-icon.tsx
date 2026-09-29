import {ImageResponse} from 'next/og'

export const size = {width: 180, height: 180}
export const contentType = 'image/png'

// The home-screen icon: the favicon's tombstone on a night sky.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #060913, #161b29)',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 92,
          height: 118,
          marginBottom: 22,
          borderRadius: '46px 46px 6px 6px',
          background: 'linear-gradient(to bottom, #6b7079, #3f434a)',
          boxShadow: '0 16px 20px -10px rgba(0, 0, 0, 0.9)',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: '#0e1d15'}} />
    </div>,
    size,
  )
}
