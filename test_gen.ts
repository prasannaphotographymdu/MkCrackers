import { generateStaticSKUCatalog } from './src/lib/firebase';
generateStaticSKUCatalog().then(() => console.log('Done')).catch(console.error);
