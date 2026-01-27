'use client';

import React, { useState, useEffect } from 'react';
import { useSendy } from '@/context/SendyContext';
import { sendyService } from '@/services/sendy';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Send } from 'lucide-react';
import { Brand, SendyList } from '@/types';

export default function CampaignsPage() {
    const { config, brands, selectedBrand, setSelectedBrand } = useSendy();
    const [lists, setLists] = useState<SendyList[]>([]);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);

    // Campaign Fields
    const [fromName, setFromName] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [replyTo, setReplyTo] = useState('');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [htmlText, setHtmlText] = useState('');
    const [plainText, setPlainText] = useState('');
    const [sendCampaign, setSendCampaign] = useState(false); // Default draft

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Fetch lists when brand changes
    useEffect(() => {
        if (selectedBrand && config) {
            sendyService.getLists(config, selectedBrand.id)
                .then(setLists)
                .catch(console.error);
        } else {
            setLists([]);
        }
    }, [selectedBrand, config]);

    const handleListToggle = (listId: string) => {
        setSelectedLists(prev =>
            prev.includes(listId)
                ? prev.filter(id => id !== listId)
                : [...prev, listId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config || !selectedBrand) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await sendyService.createCampaign(config, {
                fromName,
                fromEmail,
                replyTo,
                title,
                subject,
                htmlText,
                plainText,
                listIds: selectedLists.join(','),
                brandId: selectedBrand.id,
                sendCampaign: sendCampaign ? 1 : 0
            });

            setResult(res.message || 'Campaign created successfully!');
            // Reset form if needed, or keep for edits
        } catch (err: any) {
            setResult(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!config) return <div>Please connect to Sendy first.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Configure basic campaign settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <Select
                                    value={selectedBrand?.id}
                                    onValueChange={(val) => {
                                        const brand = brands.find(b => b.id === val);
                                        if (brand) setSelectedBrand(brand);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Recipients (Lists)</Label>
                                <div className="border rounded-md p-3 h-32 overflow-y-auto space-y-2 bg-muted/20">
                                    {lists.length > 0 ? lists.map(list => (
                                        <div key={list.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`list-${list.id}`}
                                                checked={selectedLists.includes(list.id)}
                                                onCheckedChange={() => handleListToggle(list.id)}
                                            />
                                            <Label htmlFor={`list-${list.id}`} className="font-normal cursor-pointer">
                                                {list.name}
                                            </Label>
                                        </div>
                                    )) : (
                                        <div className="text-muted-foreground text-sm">Select a brand to view lists</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>From Name</Label>
                                <Input required value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Your Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>From Email</Label>
                                <Input required type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@company.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Reply To</Label>
                                <Input required type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="support@company.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Internal Title</Label>
                                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Newsletter Jan 2026" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Line</Label>
                            <Input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Latest News..." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Content</CardTitle>
                        <CardDescription>Write your email HTML and plain text version.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>HTML Content</Label>
                            <Textarea
                                className="font-mono min-h-[300px]"
                                value={htmlText}
                                onChange={e => setHtmlText(e.target.value)}
                                placeholder="<html><body><h1>Hello!</h1></body></html>"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Plain Text Version (Optional)</Label>
                            <Textarea
                                className="font-mono min-h-[150px]"
                                value={plainText}
                                onChange={e => setPlainText(e.target.value)}
                                placeholder="Hello world..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sending Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="send-campaign"
                                checked={sendCampaign}
                                onCheckedChange={(c) => setSendCampaign(!!c)}
                            />
                            <Label htmlFor="send-campaign" className="font-bold">Send this campaign immediately?</Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 ml-6">
                            If unchecked, the campaign will be saved as a draft in Sendy.
                        </p>
                    </CardContent>
                </Card>

                {result && (
                    <div className={`p-4 rounded-md ${result.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                        {result}
                    </div>
                )}

                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {sendCampaign ? 'Create & Send Campaign' : 'Save as Draft'}
                </Button>
            </form>
        </div>
    );
}
