import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Product } from '@/lib/supabase'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload
      const existingItemIndex = state.items.findIndex(item => item.product.product_id === product.product_id)
      
      let newItems: CartItem[]
      
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        newItems = [...state.items, { product, quantity }]
      }
      
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.product_id !== action.payload)
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: productId })
      }
      
      const newItems = state.items.map(item =>
        item.product.product_id === productId
          ? { ...item, quantity }
          : item
      )
      
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    }
    
    case 'LOAD_CART': {
      const items = action.payload
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      
      return {
        items,
        totalItems,
        totalPrice
      }
    }
    
    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('alamer-cart')
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart) as CartItem[]
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('alamer-cart', JSON.stringify(state.items))
  }, [state.items])

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  }

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const isInCart = (productId: string) => {
    return state.items.some(item => item.product.product_id === productId)
  }

  const getItemQuantity = (productId: string) => {
    const item = state.items.find(item => item.product.product_id === productId)
    return item ? item.quantity : 0
  }

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
