'use client';

import React, { useState } from 'react';
import { useSendy } from '@/context/SendyContext';
import { sendyService } from '@/services/sendy';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CSVUploader } from '../Upload/CSVUploader';
import { HistoryList } from '../Sendy/HistoryList';

export default function SubscribersPage() {
    const { config, brands, selectedBrand, setSelectedBrand, selectedList, setSelectedList } = useSendy();
    const [lists, setLists] = useState<any[]>([]);
    const [selectedListId, setSelectedListId] = useState<string>('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Sync selectedList from context to local state
    React.useEffect(() => {
        if (selectedList) {
            setSelectedListId(selectedList.id);
        }
    }, [selectedList]);

    // Update context when local state changes (optional, but good for bidirectional sync if needed)
    // Actually, primarily we want to set local state from context on mount/update. 
    // And if user changes dropdown, update context too?
    const handleListChange = (val: string) => {
        setSelectedListId(val);
        const list = lists.find(l => l.id === val);
        if (list) setSelectedList(list);
    };

    // Fetch lists when brand changes
    React.useEffect(() => {
        if (selectedBrand && config) {
            sendyService.getLists(config, selectedBrand.id)
                .then(setLists)
                .catch(console.error);
        } else {
            setLists([]);
        }
    }, [selectedBrand, config]);

    const handleAction = async (action: 'subscribe' | 'unsubscribe' | 'delete' | 'status') => {
        if (!config || !selectedListId || !email) return;
        if (action === 'subscribe' && !name) {
            setResult('Error: Name is required.');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            let res;
            if (action === 'subscribe') {
                res = await sendyService.subscribe(config, selectedListId, email, name);
                setResult(res.status === 'subscribed' ? 'Successfully subscribed!' : `Status: ${res.status}`);
            } else if (action === 'unsubscribe') {
                await sendyService.unsubscribe(config, selectedListId, email);
                setResult('Successfully unsubscribed.');
            } else if (action === 'delete') {
                await sendyService.deleteSubscriber(config, selectedListId, email);
                setResult('Subscriber deleted.');
            } else if (action === 'status') {
                const status = await sendyService.getSubscriptionStatus(config, selectedListId, email);
                setResult(`Subscription Status: ${status}`);
            }
        } catch (err: any) {
            setResult(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!config) return <div>Please connect to Sendy first.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Select Context</CardTitle>
                        <CardDescription>Choose a brand and list to manage subscribers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                            <Label>List</Label>
                            <Select
                                value={selectedListId}
                                onValueChange={handleListChange}
                                disabled={!lists.length}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select List" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lists.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                        <CardDescription>Operation output will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </div>
                        ) : result ? (
                            <div className={`p-3 rounded-md font-medium ${result.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                                {result}
                            </div>
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                Ready for action.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="subscribe" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
                    <TabsTrigger value="import">Import CSV</TabsTrigger>
                    <TabsTrigger value="unsubscribe">Unsubscribe</TabsTrigger>
                    <TabsTrigger value="delete">Delete</TabsTrigger>
                    <TabsTrigger value="status">Check Status</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="subscribe">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Subscriber</CardTitle>
                                <CardDescription>Add a new subscriber to the selected list.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            placeholder="john@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button onClick={() => handleAction('subscribe')} disabled={!selectedListId || !email || !name || loading}>
                                    Subscribe User
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="import">
                        {lists.find(l => l.id === selectedListId) ? (
                            <div className="space-y-8">
                                <CSVUploader
                                    list={lists.find(l => l.id === selectedListId)}
                                    brandName={selectedBrand?.name || 'Unknown Brand'}
                                />
                                <HistoryList />
                            </div>
                        ) : (
                            <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
                                Please select a list to import subscribers.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="unsubscribe">
                        <Card>
                            <CardHeader>
                                <CardTitle>Unsubscribe User</CardTitle>
                                <CardDescription>Remove a user from the selected list.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => handleAction('unsubscribe')} variant="secondary" disabled={!selectedListId || !email || loading}>
                                    Unsubscribe User
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="delete">
                        <Card>
                            <CardHeader>
                                <CardTitle>Delete Subscriber</CardTitle>
                                <CardDescription className="text-destructive">
                                    Permanently delete a subscriber from the list. This cannot be undone.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => handleAction('delete')} variant="destructive" disabled={!selectedListId || !email || loading}>
                                    Delete Permanently
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="status">
                        <Card>
                            <CardHeader>
                                <CardTitle>Check Status</CardTitle>
                                <CardDescription>Check if an email is subscribed, unsubscribed, or bounced.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => handleAction('status')} variant="outline" disabled={!selectedListId || !email || loading}>
                                    Check Status
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
