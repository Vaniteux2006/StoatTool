import fs from 'node:fs';
import path from 'node:path';

export async function loadLibs() {

    const libPath = path.join(process.cwd(), 'lib');

    const files = fs.readdirSync(libPath)
        .filter(file => file.endsWith('.js'));

    for (const file of files) {

        await import(`../lib/${file}`);

        console.log(`📚 Lib carregada: ${file}`);
    }
}