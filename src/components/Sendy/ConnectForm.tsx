import React, { useState } from 'react';
import { useSendy } from '@/context/SendyContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { motion } from 'framer-motion';

export const ConnectForm = () => {
    const { connect } = useSendy();
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url && key) {
            connect(url, key);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                    >
                        <span className="text-2xl font-bold text-white">S</span>
                    </motion.div>
                    <CardTitle className="text-2xl font-bold">Connect to Sendy</CardTitle>
                    <CardDescription>Enter your installation URL and API Key to manage your lists.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Installation URL</Label>
                            <Input
                                id="url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://sendy.yourdomain.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Your API Key"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full mt-4">
                            Connect Account
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
