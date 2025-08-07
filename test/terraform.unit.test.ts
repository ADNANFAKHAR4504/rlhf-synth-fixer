import fs from 'fs';
import path from 'path';

describe('Terraform VPC Module Unit Tests', () => {
  const vpcModulePath = path.resolve(__dirname, '../lib/modules/vpc');
  const mainTF = path.join(vpcModulePath, 'main.tf');
  const variablesTF = path.join(vpcModulePath, 'variables.tf');
  const outputsTF = path.join(vpcModulePath, 'outputs.tf');

  it('should have a main.tf file in VPC module', () => {
    expect(fs.existsSync(mainTF)).toBe(true);
  });

  it('should have a variables.tf file in VPC module', () => {
    expect(fs.existsSync(variablesTF)).toBe(true);
  });

  it('should have an outputs.tf file in VPC module', () => {
    expect(fs.existsSync(outputsTF)).toBe(true);
  });

  it('main.tf should contain aws_vpc resource', () => {
    const content = fs.readFileSync(mainTF, 'utf8');
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"/);
  });

  it('main.tf should contain aws_subnet resources', () => {
    const content = fs.readFileSync(mainTF, 'utf8');
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"/);
  });

  it('main.tf should contain aws_security_group resources', () => {
    const content = fs.readFileSync(mainTF, 'utf8');
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"/);
  });

  it('subnets should define cidr_block', () => {
    const content = fs.readFileSync(mainTF, 'utf8');
    const subnetBlocks = content.match(/resource\s+"aws_subnet"[\s\S]*?\}/g) || [];
    const allHaveCIDR = subnetBlocks.every(block => /cidr_block\s+=\s+/.test(block));
    expect(allHaveCIDR).toBe(true);
  });

  it('subnets should include tags with Name key', () => {
    const content = fs.readFileSync(mainTF, 'utf8');
    const subnetBlocks = content.match(/resource\s+"aws_subnet"[\s\S]*?\}/g) || [];
    const allTagged = subnetBlocks.every(block => /tags\s+=\s+\{[\s\S]*?Name/.test(block));
    expect(allTagged).toBe(true);
  });

  it('variables.tf should define at least one variable', () => {
    const content = fs.readFileSync(variablesTF, 'utf8');
    expect(content).toMatch(/variable\s+"/);
  });

  it('outputs.tf should contain output block', () => {
    const content = fs.readFileSync(outputsTF, 'utf8');
    expect(content).toMatch(/output\s+"/);
  });
});
