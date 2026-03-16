import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { TransactionType } from '../../types';
import { Camera, Sparkles, AlertTriangle, WifiOff } from 'lucide-react';
import { triggerHapticFeedback } from '../../utils';
import { Button } from '../ui';

const SmartScanModal: React.FC = memo(() => {
    const dispatch = useAppDispatch();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const startCamera = useCallback(async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError("Kamera wird von diesem Browser nicht unterstützt.");
                return;
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch {
            setError("Kamerazugriff verweigert.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, [startCamera]);

    const handleScan = useCallback(async () => {
        if (!videoRef.current) return;
        if (isOffline) { triggerHapticFeedback('error'); setError("KI-Scan erfordert eine Internetverbindung."); return; }

        triggerHapticFeedback('medium');
        setIsLoading(true);
        setError(null);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsLoading(false); return; }
        ctx.drawImage(videoRef.current, 0, 0);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        try {
            const { GoogleGenAI, Type } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [{
                    parts: [
                        { text: "Analysiere diesen Kassenbeleg. Extrahiere den Händlernamen als 'description', den Bruttobetrag als 'amount' (Zahl) und das Datum als 'date' (YYYY-MM-DD). Antworte strikt im JSON Format." },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                    ]
                }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            date: { type: Type.STRING },
                        },
                        required: ["description", "amount", "date"]
                    },
                },
            });
            const result = JSON.parse(response.text);
            triggerHapticFeedback('success');
            dispatch({
                type: 'ADD_TRANSACTION', payload: {
                    description: result.description || 'Beleg-Scan',
                    amount: result.amount || 0,
                    date: result.date || new Date().toISOString().split('T')[0],
                    type: TransactionType.EXPENSE,
                    tags: ['ki-scan']
                }
            });
        } catch {
            triggerHapticFeedback('error');
            setError("Beleg konnte nicht präzise gelesen werden. Bitte manuell erfassen.");
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, isOffline]);

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-xl border border-destructive/20 animate-fade-in flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" /> {error}
                </div>
            )}
            {isOffline && (
                <div className="p-3 bg-warning/10 text-warning text-xs font-medium rounded-xl border border-warning/20 flex items-center">
                    <WifiOff className="mr-2 h-4 w-4" /> Du bist offline. KI-Features sind deaktiviert.
                </div>
            )}
            <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/20">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40" />
                <div className="absolute inset-x-[30px] inset-y-[30px] border-2 border-primary/40 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.2)]" />
                {!isLoading && !isOffline && (
                    <div className="absolute inset-x-[30px] h-0.5 bg-primary/60 shadow-[0_0_15px_hsl(var(--primary))] animate-scan-line z-10" />
                )}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                            <div className="relative bg-primary/20 p-5 rounded-full">
                                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                            </div>
                        </div>
                        <p className="font-bold text-white text-lg">KI wird schlau...</p>
                        <p className="text-white/60 text-sm mt-1">Beleg wird analysiert</p>
                    </div>
                )}
            </div>
            <div className="flex flex-col items-center gap-3">
                <Button onClick={handleScan} disabled={isLoading || !stream || isOffline} variant="primary" className="w-full py-6 rounded-2xl text-lg shadow-xl">
                    <Camera className="mr-3 h-6 w-6" /> {isOffline ? 'Offline' : 'Jetzt scannen'}
                </Button>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Gute Beleuchtung verbessert die Genauigkeit</p>
            </div>
        </div>
    );
});

export default SmartScanModal;
