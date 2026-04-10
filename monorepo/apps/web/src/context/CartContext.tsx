import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import toast from 'react-hot-toast';

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
    validateCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    // Initializer function to load cart from localStorage synchronously
    const [items, setItems] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (error) {
                console.error('Failed to parse cart data:', error);
                localStorage.removeItem('cart');
            }
        }
        return [];
    });
    
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Sync with server immediately if cart is not empty on mount
    useEffect(() => {
        if (items.length > 0) {
            syncCart(items);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const syncCart = async (currentItems: CartItem[]) => {
        if (currentItems.length === 0) return true;
        
        try {
            const productIds = currentItems.map(item => item.id);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const res = await fetch(`${apiUrl}/products/validate-cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds }),
            });
            
            if (!res.ok) throw new Error('Failed to validate cart');
            
            const data = await res.json();
            const { validProducts, invalidIds } = data;
            
            let changesMade = false;
            let removalCount = invalidIds?.length || 0;
            let priceChanges = 0;
            let stockAdjustments = 0;
            
            // Build synced cart
            const syncedItems = currentItems
                .filter(item => !invalidIds.includes(item.id)) // Remove completely invalid
                .map(item => {
                    const validProduct = validProducts.find((p: any) => p.id === item.id);
                    if (!validProduct) return item;

                    const currentPrice = Number(validProduct.discountPrice) || Number(validProduct.price);
                    const hasPriceChanged = currentPrice !== item.price;
                    const stock = validProduct.stock || 0;
                    
                    let finalQuantity = item.quantity;

                    // 1. Availability check (Out of stock)
                    if (stock <= 0) {
                        removalCount++;
                        changesMade = true;
                        return null; // Will be filtered out
                    }

                    // 2. Quantity Cap based on Stock
                    if (finalQuantity > stock) {
                        finalQuantity = stock;
                        stockAdjustments++;
                        changesMade = true;
                    }

                    // 3. Price updates
                    if (hasPriceChanged) {
                        priceChanges++;
                        changesMade = true;
                    }

                    return { 
                        ...item, 
                        price: currentPrice,
                        name: validProduct.name,
                        quantity: finalQuantity,
                        image: validProduct.image || item.image
                    };
                })
                .filter(Boolean) as CartItem[];
            
            // If the cart drastically changed, notify the user
            if (changesMade || removalCount > 0) {
                if (removalCount > 0) {
                    toast.error(`تمت إزالة ${removalCount} منتج من سلتك لعدم توفرها`);
                }
                if (stockAdjustments > 0) {
                    toast.error(`${stockAdjustments} منتج تم تعديل كميته بناءً على المخزون المتاح`);
                }
                if (priceChanges > 0) {
                    toast.success("تم تحديث أسعار المنتجات في سلتك");
                }
                setItems(syncedItems);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Cart sync error:', error);
            return true; // Assume valid on network error to not block user, or handle differently
        }
    };

    const validateCart = async () => {
        return await syncCart(items);
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
                validateCart,
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
