import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, apiKey, brandId } = body;

        if (!url || !apiKey || !brandId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const endpoint = `${url}/api/lists/get-lists.php`;

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('brand_id', brandId);

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

        let cleanText = text;
        try {
            // Attempt to clean the response
            cleanText = text.trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            // AGGRESSIVE: Remove ALL control characters (0x00-0x1F) including newlines/tabs
            // This is safe because JSON structure uses {} : , "" which don't need these
            cleanText = cleanText.replace(/[\x00-\x1f]/g, ' ');

            const data = JSON.parse(cleanText);

            // Normalize: Sendy returns { list1: { id... } }
            const normalized = Array.isArray(data) ? data : Object.values(data);

            return NextResponse.json(normalized);
        } catch (e: any) {
            const snippetStart = cleanText.substring(0, 100);
            const snippetEnd = cleanText.slice(-100);
            return NextResponse.json({
                error: `JSON Parse Fail: ${e.message}. Start: ${snippetStart} End: ${snippetEnd}`
            }, { status: 502 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
