import type { Band } from 'types/domainScore.type'
import styles from './QueuePage.module.scss'
import { DOMAINS } from './domains'
import FilterPanel from './FilterPanel'
import type { BandCellProps, QueueTableProps } from './QueuePage.type'
import Tooltip from './Tooltip'
import useQueuePage from './useQueuePage'

const SKELETON_ROW_COUNT = 8

const COLUMN_COUNT = 4 + DOMAINS.length

const BAND_LABELS: Record<Band, string> = {
  minimal: 'Minimal',
  mild: 'Mild',
  moderate: 'Moderate',
  substantial: 'Substantial',
}

const percentage = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

const assessedDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/London',
})

export default function QueuePage() {
  const {
    filters,
    applyFilters,
    queue,
    isLoading,
    isFetching,
    isRefreshing,
    isError,
    summary,
    retry,
  } = useQueuePage()

  return (
    <main className={styles.page}>
      <p className={styles.overline}>
        <span className={styles.dot} aria-hidden="true" />
        Review queue
      </p>
      <h1 className={styles.heading}>
        Assessments awaiting <span className={styles.gradient}>review</span>
      </h1>
      <FilterPanel filters={filters} onApply={applyFilters} />
      {summary && <p className={styles.summary}>{summary}</p>}
      <div
        className={isRefreshing ? `${styles.card} ${styles.busy}` : styles.card}
        aria-busy={isFetching}
      >
        {isLoading && <LoadingTable />}
        {isError && (
          <div role="alert" className={styles.message}>
            Couldn&apos;t load the queue.
            <button type="button" className={styles.retry} onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {!isError && queue?.length === 0 && <p className={styles.message}>No assessments</p>}
        {!isError && queue && queue.length > 0 && <QueueTable queue={queue} />}
      </div>
    </main>
  )
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th scope="col">Assessment</th>
        <th scope="col">Assessed</th>
        <th scope="col">Clinician</th>
        <th scope="col">Status</th>
        {DOMAINS.map(({ domain, label, fullName }) => (
          <th key={domain} scope="col">
            <Tooltip label={fullName}>{label}</Tooltip>
          </th>
        ))}
      </tr>
    </thead>
  )
}

function LoadingTable() {
  return (
    <>
      <p role="status" className={styles.visuallyHidden}>
        Loading assessments…
      </p>
      <table className={styles.table} aria-hidden="true">
        <TableHead />
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
                <td key={cell}>
                  <span className={styles.skeleton} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function QueueTable({ queue }: QueueTableProps) {
  return (
    <table className={styles.table}>
      <TableHead />
      <tbody>
        {queue.map((item) => (
          <tr key={item.assessment_id}>
            <td className={styles.id}>{item.assessment_id}</td>
            <td>{assessedDate.format(new Date(item.assessed_at))}</td>
            <td>{item.clinician_id}</td>
            <td>{item.review_flag && <span className={styles.flag}>Needs review</span>}</td>
            {DOMAINS.map(({ domain }) => (
              <BandCell key={domain} score={item.domain_scores[domain]} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BandCell({ score }: BandCellProps) {
  if (!score?.band || score.percentage === null) {
    return (
      <td>
        <span className={styles.notAssessed}>Not assessed</span>
      </td>
    )
  }
  const percent = `${percentage.format(score.percentage)}%`
  return (
    <td>
      <Tooltip label={percent}>
        <span className={`${styles.band} ${styles[score.band]}`}>{BAND_LABELS[score.band]}</span>
      </Tooltip>
      <span className={styles.visuallyHidden}>, {percent}</span>
    </td>
  )
}
