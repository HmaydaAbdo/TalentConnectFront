// src/app/shared/enums/CandidatureStatus.ts (or wherever your enum is located)

export enum CandidatureStatus {
  // Accepted for phone interview (new status name)
  ENTRETIEN_TELEPHONIQUE_PLANIFIE = 'ENTRETIEN_TELEPHONIQUE_PLANIFIE',
  // Accepted for first physical interview (new status name)
  ENTRETIEN_PHYSIQUE_1_PLANIFIE = 'ENTRETIEN_PHYSIQUE_1_PLANIFIE',
  // Accepted for second physical interview (new status name)
  ENTRETIEN_PHYSIQUE_2_PLANIFIE = 'ENTRETIEN_PHYSIQUE_2_PLANIFIE',
  // Hired
  EMBAUCHE = 'EMBAUCHE',
  // Rejected
  REJETE = 'REJETE'
}
