// test/terraform.int.test.ts
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const WORKING_DIR = join(__dirname, '../bin');
const BACKEND_CONF_PATH = join(WORKING_DIR, 'backend.conf');
const TERRAFORM_BINARY = 'terraform';
const TIMEOUT = 300000; // 5 minutes

// Custom backend.conf parser that only extracts bucket and key
const parseBackendConfig = (): { bucket: string; key: string } => {
  if (!existsSync(BACKEND_CONF_PATH)) {
    throw new Error(`Backend config file not found at ${BACKEND_CONF_PATH}`);
  }

  const config: { bucket?: string; key?: string } = {};
  const content = readFileSync(BACKEND_CONF_PATH, 'utf-8');

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (key === 'bucket' || key === 'key') {
          config[key] = value;
        }
      }
    }
  });

  if (!config.bucket || !config.key) {
    throw new Error('backend.conf must contain both bucket and key');
  }

  return { bucket: config.bucket, key: config.key };
};

// Get backend configuration with environment overrides
const getBackendConfig = () => {
  const { bucket, key } = parseBackendConfig();
  
  return {
    bucket: process.env.TF_STATE_BUCKET || bucket,
    key: process.env.TF_STATE_KEY || `${key.replace('.tfstate', '')}-${Date.now()}.tfstate`,
    encrypt: 'true' // Always enable encryption
  };
};

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

const initializeTerraform = () => {
  const backend = getBackendConfig();
  console.log('Initializing Terraform with:', {
    bucket: backend.bucket,
    key: backend.key,
    encrypt: backend.encrypt
  });

  return runTerraformCommand(
    `init -input=false -reconfigure ` +
    `-backend-config="bucket=${backend.bucket}" ` +
    `-backend-config="key=${backend.key}" ` +
    `-backend-config="encrypt=${backend.encrypt}"`
  );
};

const getTerraformState = (): any => {
  const state = JSON.parse(runTerraformCommand('show -json'));
  writeFileSync(join(__dirname, 'state-debug.json'), JSON.stringify(state, null, 2));
  return state;
};

const getAllResources = (state: any): any[] => {
  const resources: any[] = [];

  if (state.values?.root_module?.resources) {
    resources.push(...state.values.root_module.resources);
  }
  if (state.resources) {
    resources.push(...state.resources);
  }
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
    console.log('Setting up test environment...');
    initializeTerraform();
    
    console.log('Applying configuration...');
    runTerraformCommand('apply -auto-approve -input=false');
    
    console.log('Fetching state...');
    terraformState = getTerraformState();
    allResources = getAllResources(terraformState);
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

  describe('VPC Validation', () => {
    let vpc: any;

    beforeAll(() => {
      vpc = allResources.find(r => r.type === 'aws_vpc' && r.name === 'main');
    });

    it('should create exactly one VPC', () => {
      expect(allResources.filter(r => r.type === 'aws_vpc').length).toBe(1);
    });

    it('should have valid CIDR block format', () => {
      expect(vpc.values.cidr_block).toMatch(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}$/);
    });

    it('should have DNS support enabled', () => {
      expect(vpc.values.enable_dns_support).toBe(true);
    });

    it('should have proper environment tag', () => {
      expect(vpc.values.tags.Name).toMatch(/.+-vpc$/);
    });
  });

  describe('Subnet Validation', () => {
    let publicSubnets: any[];
    let privateSubnets: any[];

    beforeAll(() => {
      publicSubnets = allResources.filter(r => r.type === 'aws_subnet' && r.name === 'public');
      privateSubnets = allResources.filter(r => r.type === 'aws_subnet' && r.name === 'private');
    });

    it('should create public and private subnets', () => {
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    it('should have correct public IP mapping', () => {
      publicSubnets.forEach(s => expect(s.values.map_public_ip_on_launch).toBe(true));
      privateSubnets.forEach(s => expect(s.values.map_public_ip_on_launch).toBe(false));
    });

    it('should have valid naming conventions', () => {
      publicSubnets.forEach((s, i) => {
        expect(s.values.tags.Name).toMatch(new RegExp(`^.+public-${i}$`));
      });
      privateSubnets.forEach((s, i) => {
        expect(s.values.tags.Name).toMatch(new RegExp(`^.+private-${i}$`));
      });
    });
  });

  describe('Security Group Validation', () => {
    let webSg: any;
    let dbSg: any;

    beforeAll(() => {
      webSg = allResources.find(r => r.type === 'aws_security_group' && r.name === 'web');
      dbSg = allResources.find(r => r.type === 'aws_security_group' && r.name === 'db');
    });

    it('should have web SG with HTTP access', () => {
      const rule = webSg.values.ingress.find((r: any) => r.from_port === 80 && r.to_port === 80);
      expect(rule).toBeDefined();
      expect(rule.protocol).toBe('tcp');
      expect(rule.cidr_blocks).toContain('0.0.0.0/0');
    });

    it('should have DB SG with restricted access', () => {
      const rule = dbSg.values.ingress.find((r: any) => r.from_port === 3306 && r.to_port === 3306);
      expect(rule).toBeDefined();
      expect(rule.security_groups).toContain(webSg.values.id);
    });
  });

  describe('Edge Cases', () => {
    it('should not have overlapping CIDR blocks', () => {
      const subnets = allResources.filter(r => r.type === 'aws_subnet');
      const cidrs = subnets.map(s => s.values.cidr_block);
      expect(new Set(cidrs).size).toBe(cidrs.length);
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