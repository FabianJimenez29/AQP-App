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
  entryTime: string; 
  exitTime?: string;
  userId: string;
  beforePhoto: string; 
  beforePhotoKey?: string; 
  afterPhoto?: string; 
  afterPhotoKey?: string; 
  parametersBefore: Parameters;
  parametersAfter?: Parameters;
  chemicals: Chemicals;
  equipmentCheck: EquipmentCheck;
  materialsDelivered: string;
  observations: string;
  technician: string;
  receivedBy: string;
  signature?: string; 
  signatureKey?: string; 
  createdAt: string; 
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

export interface ProductVariant {
  id: number;
  variant_name: string;
  stock: number;
  unit: string;
  is_available: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  has_variants: boolean;
  stock: number;
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
}

export interface Order {
  id?: number;
  order_number?: string;
  status: string;
  notes?: string;
  delivery_address?: string;
  delivery_date?: string;
  items: CartItem[];
  created_at?: string;
}