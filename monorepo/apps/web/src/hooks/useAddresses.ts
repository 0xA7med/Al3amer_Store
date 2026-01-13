import { useState, useCallback } from 'react';
import api from '../lib/api';

export interface Address {
    id: string;
    title: string;
    fullName: string;
    phone: string;
    phone2?: string;
    governorate: string;
    city: string;
    address: string;
    isDefault: boolean;
}

export function useAddresses() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAddresses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/addresses');
            setAddresses(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch addresses');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addAddress = async (data: Omit<Address, 'id'>) => {
        setIsLoading(true);
        try {
            const response = await api.post('/addresses', data);
            setAddresses((prev) => {
                const newAddress = response.data;
                if (newAddress.isDefault) {
                    return [...prev.map(a => ({ ...a, isDefault: false })), newAddress];
                }
                return [...prev, newAddress];
            });
            return response.data;
        } catch (err) {
            setError('Failed to add address');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateAddress = async (id: string, data: Partial<Address>) => {
        setIsLoading(true);
        try {
            const response = await api.put(`/addresses/${id}`, data);
            setAddresses((prev) => {
                const updated = response.data;
                if (updated.isDefault) {
                    return prev.map(a =>
                        a.id === id ? updated : { ...a, isDefault: false }
                    );
                }
                return prev.map(a => a.id === id ? updated : a);
            });
            return response.data;
        } catch (err) {
            setError('Failed to update address');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAddress = async (id: string) => {
        setIsLoading(true);
        try {
            await api.delete(`/addresses/${id}`);
            setAddresses((prev) => prev.filter(a => a.id !== id));
        } catch (err) {
            setError('Failed to delete address');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const setDefaultAddress = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await api.patch(`/addresses/${id}/default`);
            setAddresses((prev) =>
                prev.map(a =>
                    a.id === id
                        ? { ...a, isDefault: true }
                        : { ...a, isDefault: false }
                )
            );
            return response.data;
        } catch (err) {
            setError('Failed to set default address');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        addresses,
        isLoading,
        error,
        fetchAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
    };
}
