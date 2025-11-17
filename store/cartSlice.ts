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
  user_id?: string;
  technician_name?: string; 
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

export const createOrder = createAsyncThunk(
  'cart/createOrder',
  async (orderData: CreateOrderRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const userId = state.auth.user?.id; 
      const technicianName = state.auth.user?.name; 
      
      const orderDataWithUser = {
        ...orderData,
        user_id: userId, 
        technician_name: technicianName, 
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
      
      const itemId = variantId ? `${productId}-${variantId}` : `${productId}`;
      
      const existingItem = state.items.find(item => item.id === itemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      } else {
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
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
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