import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url, listId, email, apiKey } = await req.json();

        const formData = new URLSearchParams();
        formData.append('list', listId);
        formData.append('email', email);
        formData.append('boolean', 'true');
        formData.append('api_key', apiKey);

        const response = await fetch(`${url}/unsubscribe`, {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();

        if (text === '1') {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: text });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
