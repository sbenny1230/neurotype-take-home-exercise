import { DOMAINS } from '../domains'
import styles from './FilterPanel.module.scss'
import type { FilterFormProps, FilterPanelProps } from './FilterPanel.type'
import useFilterForm from './useFilterForm'
import useFilterPanel from './useFilterPanel'

export default function FilterPanel({ filters, onApply }: FilterPanelProps) {
  const { open, toggle, formId, activeCount } = useFilterPanel(filters)

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        onClick={toggle}
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
  const { clinicianOptions, error, handleSubmit, handleClear } = useFilterForm(filters, onApply)

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
