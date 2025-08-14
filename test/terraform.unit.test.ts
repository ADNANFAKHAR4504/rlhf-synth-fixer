import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const TAP_STACK_PATH = path.join(__dirname, '../lib/tap_stack.tf');
const REQUIRED_VARIABLES = ['aws_region', 'project_name', 'env', 'domain_name', 'hosted_zone_id'];
const REQUIRED_OUTPUTS = [
  'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
  'alb_dns_name', 'target_group_arn', 'asg_name', 'alb_sg_id', 'ec2_sg_id',
  'acm_certificate_arn'
];

// Simple Terraform config parser
const parseTerraformConfig = (content: string): any => {
  // This is a simplified parser that looks for basic patterns
  // For production use, consider a proper HCL parser if needed
  const blocks: Record<string, any> = {};
  const blockRegex = /(variable|resource|output|data|provider|module)\s+"([^"]+)"\s+"([^"]+)"\s+{([^}]+)}/g;
  
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const [_, type, name, identifier, body] = match;
    if (!blocks[type]) blocks[type] = {};
    blocks[type][name] = parseBlockBody(body);
  }
  return blocks;
};

const parseBlockBody = (body: string): any => {
  const result: Record<string, any> = {};
  const lines = body.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    const propMatch = line.match(/(\w+)\s*=\s*(.+)/);
    if (propMatch) {
      const [_, key, value] = propMatch;
      result[key.trim()] = parseValue(value.trim());
    }
  });
  
  return result;
};

const parseValue = (value: string): any => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  if (value.startsWith('[')) {
    return value.slice(1, -1).split(',').map(v => parseValue(v.trim()));
  }
  if (value.startsWith('{')) {
    const obj: Record<string, any> = {};
    value.slice(1, -1).split(',').forEach(pair => {
      const [k, v] = pair.split('=').map(s => s.trim());
      obj[k] = parseValue(v);
    });
    return obj;
  }
  return value;
};

describe('TAP Stack Terraform Configuration', () => {
  let tfConfig: any;

  beforeAll(() => {
    const fileContent = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    tfConfig = parseTerraformConfig(fileContent);
  });

  test('Configuration file exists', () => {
    expect(fs.existsSync(TAP_STACK_PATH)).toBeTruthy();
  });

  describe('Variable Validation', () => {
    test('All required variables are defined', () => {
      const definedVariables = Object.keys(tfConfig.variable || {});
      REQUIRED_VARIABLES.forEach(varName => {
        expect(definedVariables).toContain(varName);
      });
    });

    test('Variables have descriptions and defaults', () => {
      Object.entries(tfConfig.variable || {}).forEach(([name, config]: [string, any]) => {
        expect(config.description).toBeDefined();
        expect(config.default).toBeDefined();
      });
    });
  });

  describe('Resource Validation', () => {
    test('VPC is configured correctly', () => {
      const vpc = tfConfig.resource?.aws_vpc?.main;
      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.enable_dns_hostnames).toBe(true);
    });

    test('Subnets are properly configured', () => {
      const publicSubnets = tfConfig.resource?.aws_subnet?.public || {};
      const privateSubnets = tfConfig.resource?.aws_subnet?.private || {};
      
      expect(Object.keys(publicSubnets).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(privateSubnets).length).toBeGreaterThanOrEqual(2);
      
      // Check public subnet configuration
      Object.values(publicSubnets).forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
        expect(subnet.tags?.Tier).toBe('public');
      });
      
      // Check private subnet configuration
      Object.values(privateSubnets).forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBeUndefined();
        expect(subnet.tags?.Tier).toBe('private');
      });
    });

    test('NAT Gateway and routing are configured', () => {
      expect(tfConfig.resource?.aws_nat_gateway?.main).toBeDefined();
      expect(tfConfig.resource?.aws_route_table?.public).toBeDefined();
      expect(tfConfig.resource?.aws_route_table?.private).toBeDefined();
    });
  });

  describe('Security Group Validation', () => {
    test('ALB Security Group has correct rules', () => {
      const albSg = tfConfig.resource?.aws_security_group?.alb;
      expect(albSg).toBeDefined();
      
      expect(albSg.ingress).toBeDefined();
      expect(albSg.egress).toBeDefined();
    });

    test('EC2 Security Group has correct rules', () => {
      const ec2Sg = tfConfig.resource?.aws_security_group?.ec2;
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg.ingress).toBeDefined();
      expect(ec2Sg.egress).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    test('All required outputs are defined', () => {
      const definedOutputs = Object.keys(tfConfig.output || {});
      REQUIRED_OUTPUTS.forEach(outputName => {
        expect(definedOutputs).toContain(outputName);
      });
    });

    test('Outputs have descriptions', () => {
      Object.values(tfConfig.output || {}).forEach((output: any) => {
        expect(output.description).toBeDefined();
      });
    });
  });
});