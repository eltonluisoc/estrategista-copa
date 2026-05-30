const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'version.json');

// Verificar se o arquivo existe
if (!fs.existsSync(versionFile)) {
  const initialData = {
    version: 'v1',
    updated: new Date().toISOString().split('T')[0]
  };
  fs.writeFileSync(versionFile, JSON.stringify(initialData, null, 2));
  console.log('✅ Arquivo version.json criado com v1');
  process.exit(0);
}

// Ler versão atual
const current = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const currentVersion = parseInt(current.version.replace('v', '')) || 0;
const newVersion = currentVersion + 1;

const newData = {
  version: `v${newVersion}`,
  updated: new Date().toISOString().split('T')[0]
};

fs.writeFileSync(versionFile, JSON.stringify(newData, null, 2));
console.log(`✅ Versão atualizada para: v${newVersion}`);