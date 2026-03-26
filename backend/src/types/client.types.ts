export interface ClientProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  aum: number | null;
  riskTolerance: string | null;
  goals: string[];
  familyMembers: FamilyMember[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientProfileRequest {
  aum?: number;
  riskTolerance?: string;
  goals?: string[];
  familyMembers?: FamilyMember[];
}

export interface ClientListQuery {
  search?: string;
  page?: number;
  limit?: number;
}
