import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration', () => {
  const libPath = path.join(__dirname, '../lib');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('main.tf file exists and is readable', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    expect(fs.existsSync(mainTfPath)).toBe(true);
    
    const content = fs.readFileSync(mainTfPath, 'utf8');
    expect(content).toContain('resource "aws_vpc"');
    expect(content.length).toBeGreaterThan(0);
  });

  test('variables.tf file exists and contains required variables', () => {
    const variablesTfPath = path.join(libPath, 'variables.tf');
    expect(fs.existsSync(variablesTfPath)).toBe(true);
    
    const content = fs.readFileSync(variablesTfPath, 'utf8');
    expect(content).toContain('variable');
    expect(content.length).toBeGreaterThan(0);
  });

  test('outputs.tf file exists and contains outputs', () => {
    const outputsTfPath = path.join(libPath, 'outputs.tf');
    expect(fs.existsSync(outputsTfPath)).toBe(true);
    
    const content = fs.readFileSync(outputsTfPath, 'utf8');
    expect(content).toContain('output');
    expect(content.length).toBeGreaterThan(0);
  });

  test('provider.tf file exists and contains AWS provider', () => {
    const providerTfPath = path.join(libPath, 'provider.tf');
    expect(fs.existsSync(providerTfPath)).toBe(true);
    
    const content = fs.readFileSync(providerTfPath, 'utf8');
    expect(content).toContain('provider "aws"');
    expect(content.length).toBeGreaterThan(0);
  });

  test('terraform.tfvars file exists', () => {
    const tfvarsPath = path.join(libPath, 'terraform.tfvars');
    expect(fs.existsSync(tfvarsPath)).toBe(true);
    
    const content = fs.readFileSync(tfvarsPath, 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });
});

// add more test suites and cases as needed
