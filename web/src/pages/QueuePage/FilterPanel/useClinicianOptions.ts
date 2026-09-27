import { useGetCliniciansQuery } from 'services/clinicians/cliniciansApi'

export default function useClinicianOptions(selectedId: string | undefined): string[] {
  const { data: clinicianIds = [] } = useGetCliniciansQuery()
  // Keeps a clinician chosen in the URL selectable while the list is still loading.
  return selectedId && !clinicianIds.includes(selectedId)
    ? [...clinicianIds, selectedId]
    : clinicianIds
}
