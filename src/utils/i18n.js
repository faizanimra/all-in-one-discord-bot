import i18next from 'i18next';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupLocalization() {
    try {
        const localesPath = join(__dirname, '..', 'locales');
        const languages = {};

        // Read all language files
        readdirSync(localesPath).forEach(file => {
            if (file.endsWith('.json')) {
                const languageCode = file.split('.')[0];
                const content = readFileSync(join(localesPath, file), 'utf-8');
                languages[languageCode] = JSON.parse(content);
            }
        });

        // Initialize i18next
        await i18next.init({
            resources: languages,
            fallbackLng: 'en',
            defaultNS: 'common',
            interpolation: {
                escapeValue: false
            }
        });

        console.log('Localization system initialized successfully!');
    } catch (error) {
        console.error('Error setting up localization:', error);
    }
}

export function translate(key, options = {}) {
    const { lng = 'en', ...rest } = options;
    return i18next.t(key, { lng, ...rest });
}
