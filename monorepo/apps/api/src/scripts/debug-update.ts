


const API_URL = 'http://localhost:3001/api';
const TARGET_ID = '676414eb-2d41-4c2b-bae0-4dfd45c2656a'; // From user logs

async function run() {
    try {
        console.log(`1. Fetching product from ${API_URL}/products/${TARGET_ID}...`);
        const res1 = await fetch(`${API_URL}/products/${TARGET_ID}`);
        if (!res1.ok) {
            const text = await res1.text();
            throw new Error(`Fetch failed: ${res1.status} ${res1.statusText} - ${text}`);
        }
        const product = await res1.json();
        console.log('Product found:', product.id);

        console.log('2. Preparing Payload...');
        // Simulate the payload from AddProduct.tsx
        const payload = {
            name: product.name,
            description: product.description,
            price: String(product.price),
            stock: Number(product.stock),
            // Ensure we send nulls for IDs if they are missing
            categoryId: product.categoryId || null,
            brandId: product.brandId || null,
            specifications: product.specifications || [],
            tags: product.tags || [],
            status: product.status || 'active',
            images: [],
        };

        console.log('3. Sending PUT request...');
        const res2 = await fetch(`${API_URL}/products/${TARGET_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res2.ok) {
            const errorText = await res2.text();
            console.error('FAILED! Status:', res2.status);
            console.error('Error Body:', errorText);
        } else {
            const updated = await res2.json();
            console.log('SUCCESS! Updated:', updated);
        }

    } catch (error: any) {
        console.error('Script Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

run();


