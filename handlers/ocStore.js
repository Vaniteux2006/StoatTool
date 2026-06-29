import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Armazenamento de OCs (protótipo) ─────────────────────────────────────────
// Para o protótipo, guardamos os OCs num arquivo JSON local (data/ocs.json).
// No RPTool isso é MongoDB; aqui mantemos simples e sem dependências.
// Migrar pra um banco depois é só trocar as 2 funções readAll/writeAll.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'ocs.json');

function readAll() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return []; // arquivo ainda não existe / vazio
    }
}

function writeAll(list) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/** Todos os OCs de um usuário (dono). */
export function getOCsByAuthor(userId) {
    return readAll().filter(oc => oc.adminId === userId);
}

/** Cria um OC. Retorna o OC criado, ou null se já existir um com esse nome. */
export function createOC({ adminId, name, prefix, suffix, avatar }) {
    const list = readAll();
    const dup = list.some(oc =>
        oc.adminId === adminId && oc.name.toLowerCase() === name.toLowerCase());
    if (dup) return null;

    const oc = { adminId, name, prefix, suffix, avatar, createdAt: new Date().toISOString() };
    list.push(oc);
    writeAll(list);
    return oc;
}

/** Atualiza o avatar de um OC. Retorna true se encontrou e atualizou. */
export function updateOCAvatar(userId, name, avatar) {
    const list = readAll();
    const oc = list.find(o =>
        o.adminId === userId && o.name.toLowerCase() === name.toLowerCase());
    if (!oc) return false;
    oc.avatar = avatar;
    writeAll(list);
    return true;
}

const normPat = (s) => (s || '').trim();

/**
 * Edita campos de um OC (name, prefix, suffix, avatar).
 * Retorna { status: 'ok'|'notfound'|'dupname', oc? }.
 */
export function updateOC(userId, name, changes) {
    const list = readAll();
    const oc = list.find(o =>
        o.adminId === userId && o.name.toLowerCase() === name.toLowerCase());
    if (!oc) return { status: 'notfound' };

    if (changes.name && changes.name.toLowerCase() !== oc.name.toLowerCase()) {
        const taken = list.some(o =>
            o.adminId === userId && o.name.toLowerCase() === changes.name.toLowerCase());
        if (taken) return { status: 'dupname' };
        oc.name = changes.name;
    }
    if (changes.prefix !== undefined) oc.prefix = changes.prefix;
    if (changes.suffix !== undefined) oc.suffix = changes.suffix;
    if (changes.avatar) oc.avatar = changes.avatar;

    writeAll(list);
    return { status: 'ok', oc };
}

/**
 * OCs de OUTROS donos com o MESMO padrão (prefix+suffix) e MAIS ANTIGOS que `oc`.
 * Usado pela regra "mais antigo ganha": se um desses donos estiver no servidor,
 * o OC perde o conflito.
 */
export function getOlderRivals(oc) {
    const myPrefix = normPat(oc.prefix);
    const mySuffix = normPat(oc.suffix);
    const myTime = Date.parse(oc.createdAt) || 0;
    return readAll().filter(o => {
        const sameRecord = o.adminId === oc.adminId
            && o.name.toLowerCase() === oc.name.toLowerCase();
        if (sameRecord) return false;
        if (normPat(o.prefix) !== myPrefix || normPat(o.suffix) !== mySuffix) return false;
        return (Date.parse(o.createdAt) || 0) < myTime;
    });
}

/** Deleta um OC pelo nome. Retorna true se deletou. */
export function deleteOC(userId, name) {
    const list = readAll();
    const idx = list.findIndex(oc =>
        oc.adminId === userId && oc.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) return false;
    list.splice(idx, 1);
    writeAll(list);
    return true;
}
