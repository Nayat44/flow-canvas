import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'

import type { BandFlowNode } from '../types'

/** Section header for a lane — the band that names the journey. */
const BandNodeComponent = ({ data }: NodeProps<BandFlowNode>) => (
  <div className="fc-band" style={{ width: data.width }}>
    <strong>{data.name}</strong>
    {data.description && <span>{data.description}</span>}
  </div>
)

export const BandNode = memo(BandNodeComponent)
