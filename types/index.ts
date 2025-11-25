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

export interface EquipmentItem {
  aplica: boolean;
  working: boolean | null;
}

export interface EquipmentCheck {
  bomba_filtro: EquipmentItem;
  bomba_reposadero: EquipmentItem;
  bomba_espejo: EquipmentItem;
  bomba_jets: EquipmentItem;
  blower: EquipmentItem;
  luces_piscina: EquipmentItem;
  luces_spa: EquipmentItem;
  luces_espejo: EquipmentItem;
  filtro_piscina: EquipmentItem;
  filtro_spa: EquipmentItem;
  filtro_espejo: EquipmentItem;
  clorinador_piscina: EquipmentItem;
  clorinador_spa: EquipmentItem;
  clorinador_espejo: EquipmentItem;
}

export interface Report {
  id?: string;
  reportNumber: string;
  projectId?: string;
  projectName?: string;
  projectClientEmail?: string;
  projectClientPhone?: string;
  projectPoolGallons?: number;
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