const fs = require('fs');
const yamlCfn = require('yaml-cfn');
const path = require('path');

const yamlPath = path.join(__dirname, '../lib/TapStack.yaml');
const jsonPath = path.join(__dirname, '../lib/TapStack.json');

try {
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const jsonContent = yamlCfn.yamlParse(yamlContent);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
  console.log('Successfully converted TapStack.yaml to TapStack.json');
} catch (error) {
  console.error('Error converting YAML to JSON:', error);
  process.exit(1);
}
