'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, QrCode as QrCodeLucideIcon } from 'lucide-react';
import Image from 'next/image';

// Custom placeholder icon for a more detailed QR code representation
function QrCodePlaceholderIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="5" height="5" x="3" y="3" rx="1" />
            <rect width="5" height="5" x="16" y="3" rx="1" />
            <rect width="5" height="5" x="3" y="16" rx="1" />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            <path d="M21 11h-1" />
            <path d="M11 21v-1" />
            <path d="M16 11h-1" />
            <path d="M11 16v-1.5" />
            <path d="M16 21v-3a2 2 0 0 0-2-2h-1.5" />
            <path d="M3 11h1.5" />
            <path d="M11 3v1.5" />
            <path d="M3 8h3m-3 0v3m15-3v3" />
        </svg>
    );
}


export default function Home() {
    const [urlInput, setUrlInput] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateQrCode = async () => {
        setIsLoading(true);
        setError(null);
        setQrCodeUrl(null);

        try {
            let urlToEncode = urlInput;
            if (!/^(https?:\/\/)/i.test(urlToEncode)) {
                urlToEncode = 'https://' + urlToEncode;
            }
            new URL(urlToEncode);

            const response = await fetch('/api/backend/qrcode/path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: urlToEncode }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Falha na resposta da API. Tente novamente.');
            }

            const data = await response.json();
            if (data.url) {
                setQrCodeUrl(data.url);
            } else {
                throw new Error('URL do QR Code não encontrada na resposta da API.');
            }
        } catch (err) {
            console.error(err);
            if (err instanceof TypeError && err.message.includes('URL')) {
                setError('Por favor, insira uma URL válida.');
            } else if (err instanceof Error) {
                if (err.message.includes('Failed to fetch')) {
                    setError('Não foi possível conectar à API. Verifique se o serviço de backend está em execução.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Ocorreu um erro desconhecido.');
            }
        } finally {
            setIsLoading(false);
        }
    };

const handleDownload = () => { 
    if (!qrCodeUrl) return;

    try {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = qrCodeUrl; 
        a.download = 'qrcode.png'; 
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        
    } catch (downloadError) {
        console.error('Erro ao tentar baixar o QR Code:', downloadError);
        setError('Não foi possível iniciar o download do QR Code.');
    }
};

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 antialiased">
            <Card className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border-2">
                <CardHeader className="text-center p-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Gerador de QR Code
                    </h1>
                    <CardDescription className="pt-2 text-base">
                        Transforme qualquer URL em um QR Code em segundos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                    <div className="space-y-4">
                        <Input
                            aria-label="URL Input"
                            type="text"
                            placeholder="Digite a URL aqui..."
                            value={urlInput}
                            onChange={(e) => {
                                setUrlInput(e.target.value);
                                if (error) setError(null);
                            }}
                            disabled={isLoading}
                            className="h-12 text-center text-base"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && urlInput.trim() && !isLoading) {
                                    handleGenerateQrCode();
                                }
                            }}
                        />
                        <Button
                            onClick={handleGenerateQrCode}
                            disabled={!urlInput.trim() || isLoading}
                            className="w-full h-12 text-md font-semibold"
                            size="lg"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <QrCodeLucideIcon className="mr-2 h-5 w-5" />
                            )}
                            {isLoading ? 'Gerando...' : 'Gerar QR Code'}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription className="text-center">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="w-[300px] h-[300px] mx-auto p-2 rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">Processando...</p>
                            </div>
                        ) : qrCodeUrl ? (
                            <Image
                                src={qrCodeUrl}
                                alt="Generated QR Code"
                                fill
                                className="object-contain p-2 transition-opacity duration-500 opacity-0"
                                unoptimized
                                onLoad={(event) => { 
                                    const img = event.target as HTMLImageElement; 
                                    img.classList.remove('opacity-0');
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <QrCodePlaceholderIcon className="h-12 w-12 opacity-70" />
                                <p className="text-sm font-medium text-center">Seu QR Code aparecerá aqui</p>
                            </div>
                        )}
                    </div>

                    {qrCodeUrl && !isLoading && (
                        <Button
                            onClick={handleDownload}
                            className="w-full h-12 text-md font-semibold bg-green-500 hover:bg-green-600 text-white"
                            size="lg"
                            aria-label="Baixar QR Code"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Baixar QR Code
                        </Button>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
