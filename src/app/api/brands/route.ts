import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, apiKey } = body;

        if (!url || !apiKey) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
        }

        const endpoint = `${url}/api/brands/get-brands.php`;

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const text = await response.text();

        // Sendy sometimes returns plain text errors even for JSON endpoints
        if (text.startsWith('Error:')) {
            return NextResponse.json({ error: text }, { status: 400 });
        }

        try {
            const data = JSON.parse(text);

            // Normalize: Sendy returns { key: { id... }, key2: { id... } } sometimes
            const normalized = Array.isArray(data) ? data : Object.values(data);

            return NextResponse.json(normalized);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON response from Sendy', raw: text }, { status: 502 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
