import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../services/api';

// Tipos
export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  items: {
    product_id: number;
    product_name: string;
    variant_id?: number;
    variant_name?: string;
    quantity: number;
    unit_price: number;
  }[];
  notes?: string;
  delivery_address?: string;
  user_id?: string; // ✅ ID del usuario que crea la orden
  technician_name?: string; // ✅ Nombre del técnico para guardar en la base de datos
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isSubmitting: boolean;
  lastOrderNumber: string | null;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isSubmitting: false,
  lastOrderNumber: null,
  error: null,
};

// Async thunk para crear pedido
export const createOrder = createAsyncThunk(
  'cart/createOrder',
  async (orderData: CreateOrderRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const userId = state.auth.user?.id; // ✅ Obtener el ID del usuario
      const technicianName = state.auth.user?.name; // ✅ Obtener el nombre del técnico
      
      // Incluir user_id y technician_name en los datos de la orden
      const orderDataWithUser = {
        ...orderData,
        user_id: userId, // ✅ Agregar el ID del usuario
        technician_name: technicianName, // ✅ Agregar el nombre del técnico
      };
      
      const response = await ApiService.createOrder(orderDataWithUser, token || undefined);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al crear el pedido');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{
      productId: number;
      productName: string;
      variantId?: number;
      variantName?: string;
      quantity?: number;
      unitPrice?: number;
    }>) => {
      const { productId, productName, variantId, variantName, quantity = 1, unitPrice = 0 } = action.payload;
      
      // Crear ID único para el item (producto + variante)
      const itemId = variantId ? `${productId}-${variantId}` : `${productId}`;
      
      // Buscar si el item ya existe
      const existingItem = state.items.find(item => item.id === itemId);
      
      if (existingItem) {
        // Si existe, incrementar cantidad
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      } else {
        // Si no existe, agregar nuevo item
        const newItem: CartItem = {
          id: itemId,
          productId,
          productName,
          variantId,
          variantName,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        };
        state.items.push(newItem);
      }
      
      // Recalcular totales
      cartSlice.caseReducers.calculateTotals(state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      cartSlice.caseReducers.calculateTotals(state);
    },

    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          // Si cantidad es 0 o menor, remover item
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
          // Actualizar cantidad y total
          item.quantity = quantity;
          item.totalPrice = item.quantity * item.unitPrice;
        }
        cartSlice.caseReducers.calculateTotals(state);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      state.error = null;
    },

    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.lastOrderNumber = action.payload.order_number;
        // Limpiar carrito después de crear pedido exitosamente
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  calculateTotals,
  clearError,
} = cartSlice.actions;

export default cartSlice.reducer;