import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    image: string;
    quantity: number;
    sku?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    totalPrice: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Failed to parse cart data:', error);
                localStorage.removeItem('cart');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.id === newItem.id);
            const quantityToAdd = newItem.quantity || 1;

            if (existingItem) {
                return currentItems.map(item =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + quantityToAdd }
                        : item
                );
            }

            return [...currentItems, { ...newItem, quantity: quantityToAdd }];
        });

        // Optional: Open cart or show toast
        // setIsCartOpen(true); 
    };

    const removeFromCart = (id: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }

        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                totalPrice,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
