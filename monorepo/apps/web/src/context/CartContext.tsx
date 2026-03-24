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

    // Load cart from localStorage on mount and sync with server
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setItems(parsedCart);
                
                // Sync with server immediately if cart is not empty
                if (parsedCart.length > 0) {
                    syncCart(parsedCart);
                }
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

    const syncCart = async (currentItems: CartItem[]) => {
        try {
            const productIds = currentItems.map(item => item.id);
            // Fetch validation from our new endpoint
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/products/validate-cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds }),
            });
            
            if (!res.ok) throw new Error('Failed to validate cart');
            
            const data = await res.json();
            const { validProducts, invalidIds } = data;
            
            if (invalidIds && invalidIds.length > 0) {
                // Show warning message
                alert("تم تحديث سلتك: بعض المنتجات لم تعد متوفرة وتم إزالتها");
            }
            
            // Build synced cart
            const syncedItems = currentItems
                .filter(item => !invalidIds.includes(item.id)) // Remove invalid
                .map(item => {
                    const validProduct = validProducts.find((p: any) => p.id === item.id);
                    if (validProduct) {
                        return { 
                            ...item, 
                            price: Number(validProduct.discountPrice) || Number(validProduct.price), // Priority to discount
                            name: validProduct.name,
                            // Optionally update image or max out quantity based on stock
                        };
                    }
                    return item;
                });
                
            setItems(syncedItems);
            
        } catch (error) {
            console.error('Cart sync error:', error);
            // On failure, keep current cart or handle gracefully
        }
    };

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
