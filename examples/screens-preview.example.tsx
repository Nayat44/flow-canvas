import { FC, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

// Replace these with your app's real components and contexts. The point of the harness
// is that these are the *real* ones — only the data underneath them is fixture data.
import { AppBar } from '../src/app/components/AppBar'
import { SessionContext } from '../src/core/session'
import { RecordsContext, type RecordsContextValue } from '../src/modules/records/context'
import { RecordsListPage } from '../src/modules/records/pages/RecordsListPage'
import { RecordDetailPage } from '../src/modules/records/pages/RecordDetailPage'
import { CreateRecordFlow } from '../src/modules/records/components/CreateRecordFlow'
import { Modal } from '../src/ui/Modal'
import { MOCK_RECORDS, MOCK_SESSION } from './screens-fixtures'

// Dev-only harness that renders the *real* pages — nav bar included — on top of mocked
// contexts, so full-screen states can be captured without a session. Register it behind
// import.meta.env.DEV so it's tree-shaken from production:
//
//   ...(import.meta.env.DEV
//     ? [{ path: '/dev/screens', lazy: async () => ({ Component: (await import('../dev/ScreensPreview')).ScreensPreview }) },
//        { path: '/dev/screens/records/:id', lazy: ... }]   // pages that read route params
//     : [])
//
//   ?page=list                which entry point to render
//   ?modal=create             open the flow over it
//   ?id=<record>              pre-select a record
//   ?state=loading|empty      forced states
//
// Use the same ids as your mock data layer, so a row on the list and the modal it opens
// describe the same record.

export const ScreensPreview: FC = () => {
  const [searchParams] = useSearchParams()
  const { id: routeId } = useParams<{ id: string }>()
  const page = routeId ? 'detail' : (searchParams.get('page') ?? 'list')
  const modal = searchParams.get('modal')
  const modalId = searchParams.get('id')
  const forcedState = searchParams.get('state')

  const recordsCtx = useMemo<RecordsContextValue>(
    () => ({
      records: forcedState === 'empty' ? [] : MOCK_RECORDS,
      isLoading: forcedState === 'loading',
      error: null,
      refetch: () => Promise.resolve()
    }),
    [forcedState]
  )

  const detailRecord = useMemo(
    () => MOCK_RECORDS.find((record) => record.id === routeId) ?? MOCK_RECORDS[0],
    [routeId]
  )

  return (
    // Casts are fine here: reproducing a deeply-nested query shape exactly is wasted
    // work — only the fields the components read matter.
    <SessionContext.Provider value={MOCK_SESSION as never}>
      <RecordsContext.Provider value={recordsCtx}>
        <div className="app-shell">
          <AppBar />
          <main className="app-main">
            {page === 'detail' ? <RecordDetailPage record={detailRecord} /> : <RecordsListPage />}
          </main>

          {/* Render the flow directly rather than through a permission-gated modal host,
              which would return null without a session. */}
          {modal === 'create' && (
            <Modal open onOpenChange={() => undefined}>
              <CreateRecordFlow recordId={modalId} />
            </Modal>
          )}
        </div>
      </RecordsContext.Provider>
    </SessionContext.Provider>
  )
}
