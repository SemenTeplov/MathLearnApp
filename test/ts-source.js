// Читает исходник из js/ и транспилирует .ts для eval в тестах.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');

/**
 * Возвращает исходный код файла относительно корня проекта.
 * Для .ts выполняется transpileModule (ES2020, без модулей),
 * чтобы классический eval понимал код без import/export.
 * @param {string} relPath — путь от корня проекта
 * @returns {string}
 */
function readSource(relPath) {
    const file = path.join(ROOT, relPath);
    const code = fs.readFileSync(file, 'utf8');
    if (!file.endsWith('.ts')) return code;
    return ts.transpileModule(code, {
        fileName: file,
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None }
    }).outputText;
}

module.exports = { readSource };
