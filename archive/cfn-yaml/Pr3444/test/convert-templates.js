#!/usr/bin/env node

/**
 * Convert CloudFormation YAML templates to JSON for testing
 * Handles CloudFormation intrinsic functions
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Define CloudFormation intrinsic function tags
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ Ref: data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data.split('.') }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!Sub', { kind: 'sequence', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!Join', { kind: 'sequence', construct: (data) => ({ 'Fn::Join': data }) }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
  new yaml.Type('!Split', { kind: 'sequence', construct: (data) => ({ 'Fn::Split': data }) }),
  new yaml.Type('!FindInMap', { kind: 'sequence', construct: (data) => ({ 'Fn::FindInMap': data }) }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: (data) => ({ 'Fn::Base64': data }) }),
  new yaml.Type('!Cidr', { kind: 'sequence', construct: (data) => ({ 'Fn::Cidr': data }) }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: (data) => ({ 'Fn::ImportValue': data }) }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => ({ 'Fn::Not': data }) }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => ({ 'Fn::Equals': data }) }),
  new yaml.Type('!And', { kind: 'sequence', construct: (data) => ({ 'Fn::And': data }) }),
  new yaml.Type('!Or', { kind: 'sequence', construct: (data) => ({ 'Fn::Or': data }) }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => ({ 'Fn::If': data }) }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: (data) => ({ Condition: data }) }),
]);

// Convert main template
const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
const jsonPath = path.join(__dirname, '../lib/TapStack.test.json');

try {
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const jsonContent = yaml.load(yamlContent, { schema: CF_SCHEMA });
  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
  console.log('✅ Converted TapStack.yml to TapStack.test.json');
} catch (error) {
  console.error('❌ Error converting template:', error.message);
  process.exit(1);
}
