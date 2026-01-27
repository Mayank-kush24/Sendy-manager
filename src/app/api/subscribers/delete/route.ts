import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url, listId, email, apiKey } = await req.json();

        const formData = new URLSearchParams();
        formData.append('list_id', listId); // API doc says list_id for delete? Checking Sendy docs usually 'list' or 'list_id'.
        // Sendy API for delete: api/subscribers/delete.php
        // POST parameters: api_key, list_id, email

        formData.append('list_id', listId);
        formData.append('email', email);
        formData.append('api_key', apiKey);

        const response = await fetch(`${url}/api/subscribers/delete.php`, {
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
