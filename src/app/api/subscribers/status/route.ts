import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url, listId, email, apiKey } = await req.json();

        const formData = new URLSearchParams();
        formData.append('list_id', listId);
        formData.append('email', email);
        formData.append('api_key', apiKey);

        const response = await fetch(`${url}/api/subscribers/subscription-status.php`, {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();
        // Returns: Subscribed, Unsubscribed, Unconfirmed, Bounced, Soft Bounced, Complained
        // Or error message

        return NextResponse.json({ status: text });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
