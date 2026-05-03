export enum UserRole {
  CLIENT = 'client',
  PRESTATAIRE = 'prestataire',
  ADMIN = 'admin',
}

export enum PrestataireApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DocumentType {
  ID_CARD = 'id_card',
  DIPLOMA = 'diploma',
  CERTIFICATE = 'certificate',
  OTHER = 'other',
}

export enum ServiceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
}

export enum ServiceRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum AdminTargetType {
  REVIEW = 'review',
  SERVICE = 'service',
}

export enum AdminActionType {
  DELETE = 'delete',
  PARDON = 'pardon',
  SUSPEND = 'suspend',
}

export enum EmailTokenType {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
}

export enum ReportStatus {
  UNSEEN = 'unseen',
  SEEN = 'seen',
}
