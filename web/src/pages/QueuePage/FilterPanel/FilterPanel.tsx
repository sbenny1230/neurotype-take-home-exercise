import { useId, useState, type FormEvent } from 'react'
import { useGetCliniciansQuery } from 'services/clinicians/cliniciansApi'
import type { QueueFilters } from 'types/queueFilters.type'
import { DOMAINS } from '../domains'
import styles from './FilterPanel.module.scss'
import type { FilterFormProps, FilterPanelProps } from './FilterPanel.type'

export default function FilterPanel({ filters, onApply }: FilterPanelProps) {
  const activeCount = Object.keys(filters).length
  const [open, setOpen] = useState(activeCount > 0)
  const formId = useId()

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        onClick={() => setOpen(!open)}
      >
        Filters{activeCount > 0 && ` (${activeCount} active)`}
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {open && (
        <FilterForm key={JSON.stringify(filters)} id={formId} filters={filters} onApply={onApply} />
      )}
    </div>
  )
}

function FilterForm({ id, filters, onApply }: FilterFormProps) {
  const { data: clinicianIds = [] } = useGetCliniciansQuery()
  const [error, setError] = useState<string | null>(null)
  const clinicianOptions =
    filters.clinician_id && !clinicianIds.includes(filters.clinician_id)
      ? [...clinicianIds, filters.clinician_id]
      : clinicianIds

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = filtersFromForm(new FormData(event.currentTarget))
    const problem = filterError(next)
    setError(problem)
    if (!problem) onApply(next)
  }

  function handleClear() {
    setError(null)
    onApply({})
  }

  return (
    <form id={id} aria-label="Queue filters" className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Assessment ID
          <input type="search" name="search" defaultValue={filters.search} />
        </label>
        <label className={styles.field}>
          Review status
          <select name="review_flag" defaultValue={filters.review_flag ?? ''}>
            <option value="">Any</option>
            <option value="true">Needs review</option>
            <option value="false">No review needed</option>
          </select>
        </label>
        <label className={styles.field}>
          Clinician
          <select name="clinician_id" defaultValue={filters.clinician_id ?? ''}>
            <option value="">Any clinician</option>
            {clinicianOptions.map((clinicianId) => (
              <option key={clinicianId} value={clinicianId}>
                {clinicianId}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Assessed from
          <input type="date" name="assessed_from" defaultValue={filters.assessed_from} />
        </label>
        <label className={styles.field}>
          Assessed to
          <input type="date" name="assessed_to" defaultValue={filters.assessed_to} />
        </label>
        <label className={styles.field}>
          Score domain
          <select name="score_domain" defaultValue={filters.score_domain ?? ''}>
            <option value="">Any domain</option>
            {DOMAINS.map(({ domain, fullName }) => (
              <option key={domain} value={domain}>
                {fullName}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Score from (%)
          <input
            type="number"
            name="score_min"
            min={0}
            max={100}
            step="any"
            defaultValue={filters.score_min}
          />
        </label>
        <label className={styles.field}>
          Score to (%)
          <input
            type="number"
            name="score_max"
            min={0}
            max={100}
            step="any"
            defaultValue={filters.score_max}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.clear} onClick={handleClear}>
          Clear filters
        </button>
        <button type="submit" className={styles.apply}>
          Apply filters
        </button>
      </div>
    </form>
  )
}

function filtersFromForm(formData: FormData): QueueFilters {
  return Object.fromEntries(
    [...formData.entries()].flatMap(([name, value]) => {
      const text = String(value).trim()
      return text ? [[name, text]] : []
    }),
  )
}

function filterError(filters: QueueFilters): string | null {
  const { score_domain, score_min, score_max, assessed_from, assessed_to } = filters
  if ((score_min || score_max) && !score_domain) {
    return 'Choose a score domain to filter by score.'
  }
  if (score_min && score_max && Number(score_min) > Number(score_max)) {
    return 'The score "from" must not be higher than the score "to".'
  }
  if (assessed_from && assessed_to && assessed_from > assessed_to) {
    return 'The "from" date must not be after the "to" date.'
  }
  return null
}
