import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url, apiKey, ...campaignData } = await req.json();

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);

        // Map camelCase to snake_case for Sendy
        Object.entries(campaignData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // specific mapping if needed, otherwise pass through
                // Sendy Create Campaign API params:
                // from_name, from_email, reply_to, title, subject, plain_text, html_text, list_ids (separate by ,), brand_id, query_string, send_campaign (1 to send)

                // We will rely on the service to pass correct keys or map them here?
                // Let's expect the client/service to send snake_case or we map here.
                // Better to map here for clean frontend code.

                // Mapping:
                const keyMap: Record<string, string> = {
                    fromName: 'from_name',
                    fromEmail: 'from_email',
                    replyTo: 'reply_to',
                    plainText: 'plain_text',
                    htmlText: 'html_text',
                    listIds: 'list_ids',
                    brandId: 'brand_id',
                    sendCampaign: 'send_campaign'
                };

                const apiKeyName = keyMap[key] || key;
                formData.append(apiKeyName, String(value));
            }
        });

        const response = await fetch(`${url}/api/campaigns/create.php`, {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();

        // Success: "Campaign created" or "Campaign created and now sending"
        if (text.includes('Campaign created')) {
            return NextResponse.json({ success: true, message: text });
        } else {
            return NextResponse.json({ success: false, error: text });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
