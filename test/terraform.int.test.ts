// test/terraform.int.test.ts
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const WORKING_DIR = join(__dirname, '../bin');
const TERRAFORM_BINARY = 'terraform';
const TIMEOUT = 300000; // 5 minutes

const runTerraformCommand = (command: string): string => {
  try {
    console.log(`Running: terraform ${command}`);
    return execSync(`${TERRAFORM_BINARY} ${command}`, {
      cwd: WORKING_DIR,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } catch (error: any) {
    console.error(`Command failed: terraform ${command}`);
    console.error('Error:', error.message);
    console.error('stdout:', error.stdout);
    console.error('stderr:', error.stderr);
    throw error;
  }
};

const getTerraformState = (): any => {
  const state = JSON.parse(runTerraformCommand('show -json'));
  writeFileSync(join(__dirname, 'state-debug.json'), JSON.stringify(state, null, 2));
  console.log('Full Terraform state saved to state-debug.json');
  return state;
};

const findAllResources = (state: any): any[] => {
  const resources: any[] = [];

  // Check standard resource locations
  if (state.values?.root_module?.resources) {
    resources.push(...state.values.root_module.resources);
  }
  if (state.resources) {
    resources.push(...state.resources);
  }

  // Check child modules if they exist
  if (state.values?.root_module?.child_modules) {
    state.values.root_module.child_modules.forEach((module: any) => {
      if (module.resources) {
        resources.push(...module.resources);
      }
    });
  }

  return resources;
};

describe('VPC Module Integration Tests', () => {
  let terraformState: any;
  let allResources: any[];

  beforeAll(async () => {
    console.log('Initializing Terraform...');
    runTerraformCommand('init -input=false');
    
    console.log('Applying configuration...');
    runTerraformCommand('apply -auto-approve -input=false');
    
    console.log('Getting Terraform state...');
    terraformState = getTerraformState();
    allResources = findAllResources(terraformState);
    
    console.log(`Found ${allResources.length} resources`);
  }, TIMEOUT);

  afterAll(async () => {
    console.log('Cleaning up...');
    try {
      runTerraformCommand('destroy -auto-approve -input=false');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, TIMEOUT);

  describe('VPC Configuration', () => {
    let vpc: any;

    beforeAll(() => {
      vpc = allResources.find(r => r.type === 'aws_vpc' && r.name === 'main');
    });

    it('should initialize successfully', () => {
      expect(true).toBeTruthy();
    });

    it('should create exactly one VPC', () => {
      const vpcs = allResources.filter(r => r.type === 'aws_vpc');
      expect(vpcs.length).toBe(1);
    });

    it('should have valid CIDR block format', () => {
      expect(vpc.values.cidr_block).toMatch(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}$/);
    });

    it('should have DNS support enabled', () => {
      expect(vpc.values.enable_dns_support).toBe(true);
    });

    it('should have proper environment tag', () => {
      expect(vpc.values.tags.Name).toMatch(/^.+-vpc$/);
    });
  });

  describe('Subnet Configuration', () => {
    let publicSubnets: any[];
    let privateSubnets: any[];

    beforeAll(() => {
      publicSubnets = allResources.filter(r => r.type === 'aws_subnet' && r.name === 'public');
      privateSubnets = allResources.filter(r => r.type === 'aws_subnet' && r.name === 'private');
    });

    it('should create at least one public subnet', () => {
      expect(publicSubnets.length).toBeGreaterThan(0);
    });

    it('should create at least one private subnet', () => {
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    it('should have public subnets with map_public_ip_on_launch enabled', () => {
      publicSubnets.forEach(subnet => {
        expect(subnet.values.map_public_ip_on_launch).toBe(true);
      });
    });

    it('should have private subnets with map_public_ip_on_launch disabled', () => {
      privateSubnets.forEach(subnet => {
        expect(subnet.values.map_public_ip_on_launch).toBe(false);
      });
    });

    it('should have valid CIDR blocks for all subnets', () => {
      [...publicSubnets, ...privateSubnets].forEach(subnet => {
        expect(subnet.values.cidr_block).toMatch(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}$/);
      });
    });

    it('should have proper naming tags for subnets', () => {
      publicSubnets.forEach((subnet, index) => {
        expect(subnet.values.tags.Name).toMatch(new RegExp(`^.+public-${index}$`));
      });
      
      privateSubnets.forEach((subnet, index) => {
        expect(subnet.values.tags.Name).toMatch(new RegExp(`^.+private-${index}$`));
      });
    });
  });

  describe('Security Group Configuration', () => {
    let webSg: any;
    let dbSg: any;

    beforeAll(() => {
      webSg = allResources.find(r => r.type === 'aws_security_group' && r.name === 'web');
      dbSg = allResources.find(r => r.type === 'aws_security_group' && r.name === 'db');
    });

    describe('Web Security Group', () => {
      it('should exist', () => {
        expect(webSg).toBeDefined();
      });

      it('should have HTTP ingress rule', () => {
        const httpRule = webSg.values.ingress.find((r: any) => r.from_port === 80 && r.to_port === 80);
        expect(httpRule).toBeDefined();
        expect(httpRule.protocol).toBe('tcp');
        expect(httpRule.cidr_blocks).toContain('0.0.0.0/0');
      });

      it('should have unrestricted egress', () => {
        const egressRule = webSg.values.egress[0];
        expect(egressRule.from_port).toBe(0);
        expect(egressRule.to_port).toBe(0);
        expect(egressRule.protocol).toBe('-1');
        expect(egressRule.cidr_blocks).toContain('0.0.0.0/0');
      });

      it('should have proper naming', () => {
        expect(webSg.values.name).toMatch(/^.+-web-sg$/);
      });
    });

    describe('Database Security Group', () => {
      it('should exist', () => {
        expect(dbSg).toBeDefined();
      });

      it('should only allow MySQL access from web SG', () => {
        const mysqlRule = dbSg.values.ingress.find((r: any) => r.from_port === 3306 && r.to_port === 3306);
        expect(mysqlRule).toBeDefined();
        expect(mysqlRule.protocol).toBe('tcp');
        expect(mysqlRule.security_groups).toContain(webSg.values.id);
      });

      it('should have unrestricted egress', () => {
        const egressRule = dbSg.values.egress[0];
        expect(egressRule.from_port).toBe(0);
        expect(egressRule.to_port).toBe(0);
        expect(egressRule.protocol).toBe('-1');
        expect(egressRule.cidr_blocks).toContain('0.0.0.0/0');
      });

      it('should have proper naming', () => {
        expect(dbSg.values.name).toMatch(/^.+-db-sg$/);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not have overlapping CIDR blocks in subnets', () => {
      const subnets = allResources.filter(r => r.type === 'aws_subnet');
      const allCidrs = subnets.map(s => s.values.cidr_block);
      const uniqueCidrs = new Set(allCidrs);
      expect(uniqueCidrs.size).toBe(allCidrs.length);
    });

    it('should not have any security groups with overly permissive ingress rules', () => {
    const allSgs = allResources.filter(r => r.type === 'aws_security_group');
    const allowedOpenPorts = [80, 443]; // Ports we explicitly allow to be open
    
    allSgs.forEach(sg => {
      sg.values.ingress.forEach((rule: any) => {
        if (rule.cidr_blocks && rule.cidr_blocks.includes('0.0.0.0/0')) {
          // Check if this is one of our allowed open ports
          const isAllowedOpenPort = allowedOpenPorts.includes(rule.from_port) && 
                                  allowedOpenPorts.includes(rule.to_port);
          
          if (!isAllowedOpenPort) {
            console.error(`Overly permissive rule found in ${sg.values.name}:`, rule);
          }
          
          expect(isAllowedOpenPort).toBe(true);
        }
      });
    });
  });

    it('should have all subnets associated with the VPC', () => {
      const vpc = allResources.find(r => r.type === 'aws_vpc');
      const subnets = allResources.filter(r => r.type === 'aws_subnet');
      
      subnets.forEach(subnet => {
        expect(subnet.values.vpc_id).toBe(vpc.values.id);
      });
    });
  });
});