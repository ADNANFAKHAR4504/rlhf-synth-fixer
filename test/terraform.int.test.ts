// tests/integration/vpc.test.ts
import { execSync } from 'child_process';
import { join } from 'path';

// Configuration
const WORKING_DIR = join(__dirname, '../../bin');
const TERRAFORM_BINARY = 'terraform';
const TIMEOUT = 300000; // 5 minutes

// Terraform execution functions
const runTerraformCommand = (command: string): string => {
  try {
    return execSync(`${TERRAFORM_BINARY} ${command}`, {
      cwd: WORKING_DIR,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).toString();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.stdout}\n${error.stderr}`);
  }
};

const getTerraformOutputs = (): Record<string, any> => {
  const output = runTerraformCommand('output -json');
  return JSON.parse(output);
};

const getTerraformState = (): any => {
  const output = runTerraformCommand('show -json');
  return JSON.parse(output);
};

describe('VPC Module Integration Tests', () => {
  let outputs: Record<string, any>;
  let state: any;

  beforeAll(async () => {
    // Initialize and apply Terraform
    runTerraformCommand('init');
    runTerraformCommand('apply -auto-approve');
    
    // Get outputs and state
    outputs = getTerraformOutputs();
    state = getTerraformState();
  }, TIMEOUT);

  afterAll(async () => {
    // Destroy resources
    runTerraformCommand('destroy -auto-approve');
  }, TIMEOUT);

  describe('Core VPC Configuration', () => {
    it('should create a VPC with expected CIDR block', () => {
      const vpc = state.values.root_module.resources.find(
        (r: any) => r.type === 'aws_vpc'
      );
      
      expect(vpc).toBeDefined();
      expect(vpc.values.cidr_block).toMatch(/^10\.0\.0\.0\/\d{2}$/);
      expect(vpc.values.enable_dns_support).toBe(true);
      expect(vpc.values.enable_dns_hostnames).toBe(true);
    });
  });

  describe('Subnet Validation', () => {
    it('should create public subnets with correct configuration', () => {
      const publicSubnets = state.values.root_module.resources.filter(
        (r: any) => r.type === 'aws_subnet' && 
                 r.values.tags?.Name?.includes('public')
      );
      
      expect(publicSubnets.length).toBeGreaterThan(0);
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.values.cidr_block).toMatch(/^10\.0\.\d+\.0\/24$/);
        expect(subnet.values.map_public_ip_on_launch).toBe(true);
        expect(subnet.values.vpc_id).toBeDefined();
      });
    });

    it('should create private subnets with correct configuration', () => {
      const privateSubnets = state.values.root_module.resources.filter(
        (r: any) => r.type === 'aws_subnet' && 
                 r.values.tags?.Name?.includes('private')
      );
      
      expect(privateSubnets.length).toBeGreaterThan(0);
      
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.values.cidr_block).toMatch(/^10\.0\.\d+\.0\/24$/);
        expect(subnet.values.map_public_ip_on_launch).toBe(false);
        expect(subnet.values.vpc_id).toBeDefined();
      });
    });
  });


  describe('Security Group Validation', () => {
    it('should create security groups with proper rules', () => {
      const securityGroups = state.values.root_module.resources.filter(
        (r: any) => r.type === 'aws_security_group'
      );
      
      expect(securityGroups.length).toBeGreaterThan(0);
      
      // Example: Test for a web security group
      const webSg = securityGroups.find(
        (sg: any) => sg.values.tags?.Name?.includes('web')
      );
      
      if (webSg) {
        // Test inbound HTTP rule
        expect(webSg.values.ingress.some((rule: any) => 
          rule.from_port === 80 && 
          rule.to_port === 80 && 
          rule.protocol === 'tcp' &&
          rule.cidr_blocks?.includes('0.0.0.0/0')
        )).toBe(true);
        
        // Test inbound HTTPS rule
        expect(webSg.values.ingress.some((rule: any) => 
          rule.from_port === 443 && 
          rule.to_port === 443 && 
          rule.protocol === 'tcp' &&
          rule.cidr_blocks?.includes('0.0.0.0/0')
        )).toBe(true);
        
        // Test outbound rule
        expect(webSg.values.egress.some((rule: any) => 
          rule.from_port === 0 && 
          rule.to_port === 0 && 
          rule.protocol === '-1' &&
          rule.cidr_blocks?.includes('0.0.0.0/0')
        )).toBe(true);
      }
    });
  });

  describe('Output Validation', () => {
    it('should expose required output values', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.security_group_ids).toBeDefined();
      
      if (outputs.public_subnet_ids) {
        expect(Array.isArray(outputs.public_subnet_ids.value)).toBe(true);
        expect(outputs.public_subnet_ids.value.length).toBeGreaterThan(0);
      }
      
      if (outputs.private_subnet_ids) {
        expect(Array.isArray(outputs.private_subnet_ids.value)).toBe(true);
        expect(outputs.private_subnet_ids.value.length).toBeGreaterThan(0);
      }
    });
  });
});