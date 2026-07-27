import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { StageFlowNode } from '../types'

const StageNodeComponent = ({ data }: NodeProps<StageFlowNode>) => (
  <div className={`fc-stage fc-stage--${data.kind}`}>
    <Handle type="target" position={Position.Left} id="in" className="rf-handle-edge" />
    <span>{data.label}</span>
    <Handle type="source" position={Position.Right} id="out" className="rf-handle-edge" />
  </div>
)

export const StageNode = memo(StageNodeComponent)
