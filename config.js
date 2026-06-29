// ─── Configuração ─────────────────────────────────────────────────────────────
// Lê o arquivo .env usando o suporte NATIVO do Node (20.12+ / 24).
// Não precisa instalar o pacote "dotenv".
try {
    process.loadEnvFile();
} catch {
    // .env é opcional aqui — se não existir, usamos as variáveis de ambiente
    // que já estiverem definidas no sistema/hospedagem (ex: Discloud).
}

export const config = {
    // Token do bot (NUNCA deixe isso hardcoded no código — fica só no .env).
    token: process.env.TOKEN,

    // Prefixo dos comandos. Troque no .env (PREFIX=...) sem mexer no código.
    prefix: process.env.PREFIX || 'rp!',
};
