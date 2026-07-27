import { SVGProps } from 'react'

/** Inline so the module has no icon-library dependency. */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 12,
  height: 12,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props
})

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

export const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10z" />
  </svg>
)

export const ExternalIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M6 3h7v7M13 3L4 12" />
  </svg>
)

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M8 2v8M5 7.5L8 10.5l3-3M3 13h10" />
  </svg>
)
