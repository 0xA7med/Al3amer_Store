import axios from 'axios';

async function testApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/categories');
        const categories = res.data;
        const printers = categories.find((c: any) => c.slug === 'printers');
        console.log('Printers Category from API:', JSON.stringify(printers, null, 2));
    } catch (e: any) {
        console.error('API Error:', e.message);
    }
}
testApi();
