export interface User {
  id: string;
  name: string;
  email: string;
  role: 'technician' | 'admin';
}

export interface Parameters {
  cl: number;
  ph: number;
  alk: number;
  stabilizer: number;
  hardness: number;
  salt: number;
  temperature: number;
}

export interface Chemicals {
  tricloro: number;
  tabletas: number;
  acido: number;
  soda: number;
  bicarbonato: number;
  sal: number;
  alguicida: number;
  clarificador: number;
  cloro_liquido: number;
}

export interface EquipmentCheck {
  bomba_filtro: boolean;
  bomba_reposadero: boolean;
  bomba_espejo: boolean;
  bomba_jets: boolean;
  blower: boolean;
  luces_piscina: boolean;
  luces_spa: boolean;
  luces_espejo: boolean;
  filtro_piscina: boolean;
  filtro_spa: boolean;
  filtro_espejo: boolean;
  clorinador_piscina: boolean;
  clorinador_spa: boolean;
  clorinador_espejo: boolean;
}

export interface Report {
  id?: string;
  reportNumber: string;
  clientName: string;
  location: string;
  entryTime: string; // ISO string format
  exitTime?: string; // ISO string format
  userId: string;
  beforePhoto: string; // S3 URL
  beforePhotoKey?: string; // S3 object key for deletion/management
  afterPhoto?: string; // S3 URL  
  afterPhotoKey?: string; // S3 object key for deletion/management
  parametersBefore: Parameters;
  parametersAfter?: Parameters;
  chemicals: Chemicals;
  equipmentCheck: EquipmentCheck;
  materialsDelivered: string;
  observations: string;
  technician: string;
  receivedBy: string;
  signature?: string; // Can also be stored in S3 if needed
  signatureKey?: string; // S3 object key for signature
  createdAt: string; // ISO string format
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ReportState {
  currentReport: Partial<Report> | null;
  reports: Report[];
  isLoading: boolean;
  error: string | null;
}