import type { MetadataRoute } from 'next';

// Web app manifest — adds <link rel="manifest"> and enables install/PWA basics.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrasilTempo',
    short_name: 'BrasilTempo',
    description:
      'Previsão do tempo brasileira com personalidade — vai chover? rola praia? precisa de casaco? Resposta direta, ancorada em dados NOAA GFS.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f6fb',
    theme_color: '#2E7BD6',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
