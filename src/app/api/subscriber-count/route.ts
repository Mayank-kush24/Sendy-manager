import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, apiKey, listId } = body;

        if (!url || !apiKey || !listId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const endpoint = `${url}/api/subscribers/active-subscriber-count.php`;

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('list_id', listId);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const text = await response.text();

        if (text.startsWith('Error:')) {
            return NextResponse.json({ error: text }, { status: 400 });
        }

        // Response should be a number
        const count = parseInt(text.trim(), 10);
        if (isNaN(count)) {
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
