import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, apiKey, listId, email, name, country, ipaddress, referrer, gdpr, silent, hp, customFields } = body;

        if (!url || !apiKey || !listId || !email) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const endpoint = `${url}/subscribe`;

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('list', listId);
        formData.append('email', email);
        formData.append('boolean', 'true'); // Force plain text response (true/false) per docs

        if (name) formData.append('name', name);
        // Custom Sendy fields (e.g. UTM) – param name = field name, value = value
        if (customFields && typeof customFields === 'object') {
            for (const [fieldName, value] of Object.entries(customFields)) {
                if (value != null && String(value).trim() !== '') {
                    formData.append(fieldName, String(value));
                }
            }
        }
        if (country) formData.append('country', country);
        if (ipaddress) formData.append('ipaddress', ipaddress);
        if (referrer) formData.append('referrer', referrer);
        if (gdpr) formData.append('gdpr', gdpr ? 'true' : 'false');
        if (silent) formData.append('silent', silent ? 'true' : 'false');
        if (hp) formData.append('hp', hp);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
            }
            throw error;
        }

        const text = await response.text();

        // Responses: "1" (true) or "Error: ..." or "true" (if boolean=true maybe?)
        // Docs say: 
        // Success: true
        // Error: ...

        // When boolean='true' passed, docs say "set this to 'true' so that you'll get a plain text response".
        // Wait, by default it returns "1" on success? 
        // Sendy docs say: "Success: true" text.

        if (text === '1' || text === 'true' || text.trim().toLowerCase() === 'true') {
            return NextResponse.json({ success: true, status: 'subscribed' });
        }

        // Check for "Already subscribed" - treat as skip, not error
        if (text.includes('Already subscribed')) {
            return NextResponse.json({ success: true, status: 'skipped', message: 'Already subscribed' });
        }

        if (text.startsWith('Error:')) {
            return NextResponse.json({ success: false, error: text });
        }

        // Fallback
        return NextResponse.json({ success: true, status: 'subscribed', message: text });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
