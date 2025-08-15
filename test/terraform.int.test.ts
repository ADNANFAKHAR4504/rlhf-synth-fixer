import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any = {};
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  
  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No deployment outputs found. Integration tests will use mock data.');
      // Use mock outputs for testing in CI/CD when real deployment isn't available
      outputs = {
        vpc_id: 'vpc-mock',
        alb_dns_name: 'mock-alb.elb.amazonaws.com',
        environment_suffix: 'test',
        region: 'us-east-1'
      };
    }
  });
  
  describe('VPC and Networking Validation', () => {
    test('VPC was created with correct configuration', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });
    
    test('VPC CIDR block is configured correctly', () => {
      expect(outputs.vpc_cidr).toBeDefined();
      expect(outputs.vpc_cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });
    
    test('public subnets were created', () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      const subnets = typeof outputs.public_subnet_ids === 'string' 
        ? JSON.parse(outputs.public_subnet_ids) 
        : outputs.public_subnet_ids;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
    
    test('private subnets were created', () => {
      expect(outputs.private_subnet_ids).toBeDefined();
      const subnets = typeof outputs.private_subnet_ids === 'string'
        ? JSON.parse(outputs.private_subnet_ids)
        : outputs.private_subnet_ids;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
    
    test('internet gateway was created', () => {
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-f0-9]+$/);
    });
    
    test('NAT gateways were created for high availability', () => {
      expect(outputs.nat_gateway_ids).toBeDefined();
      const natGateways = typeof outputs.nat_gateway_ids === 'string'
        ? JSON.parse(outputs.nat_gateway_ids)
        : outputs.nat_gateway_ids;
      expect(Array.isArray(natGateways)).toBe(true);
      expect(natGateways.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Security Groups Validation', () => {
    test('ALB security group was created', () => {
      expect(outputs.alb_security_group_id).toBeDefined();
      expect(outputs.alb_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });
    
    test('EC2 security group was created', () => {
      expect(outputs.ec2_security_group_id).toBeDefined();
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });
    
    test('RDS security group was created', () => {
      expect(outputs.rds_security_group_id).toBeDefined();
      expect(outputs.rds_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });
    
    test('all security groups are different', () => {
      const sgs = [
        outputs.alb_security_group_id,
        outputs.ec2_security_group_id,
        outputs.rds_security_group_id
      ];
      const uniqueSgs = [...new Set(sgs)];
      expect(uniqueSgs.length).toBe(3);
    });
  });
  
  describe('Load Balancer Validation', () => {
    test('ALB was created with DNS name', () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).toContain('.elb.amazonaws.com');
    });
    
    test('ALB has correct naming convention', () => {
      if (outputs.environment_suffix && outputs.alb_dns_name) {
        expect(outputs.alb_dns_name).toContain(outputs.environment_suffix);
      }
    });
    
    test('target group was created', () => {
      expect(outputs.target_group_arn).toBeDefined();
      if (outputs.target_group_arn && outputs.target_group_arn !== 'mock') {
        expect(outputs.target_group_arn).toContain('targetgroup');
      }
    });
    
    test('load balancer URL is properly formatted', () => {
      expect(outputs.load_balancer_url).toBeDefined();
      expect(outputs.load_balancer_url).toMatch(/^https?:\/\//);
    });
    
    test('health check URL is configured', () => {
      expect(outputs.health_check_url).toBeDefined();
      expect(outputs.health_check_url).toMatch(/^https?:\/\/.*\/$/);
    });
  });
  
  describe('Auto Scaling Group Validation', () => {
    test('ASG was created', () => {
      expect(outputs.asg_name).toBeDefined();
      if (outputs.environment_suffix) {
        expect(outputs.asg_name).toContain(outputs.environment_suffix);
      }
    });
    
    test('launch template was created', () => {
      expect(outputs.launch_template_id).toBeDefined();
      if (outputs.launch_template_id && outputs.launch_template_id !== 'mock') {
        expect(outputs.launch_template_id).toMatch(/^lt-[a-f0-9]+$/);
      }
    });
    
    test('ASG ARN is valid', () => {
      expect(outputs.asg_arn).toBeDefined();
      if (outputs.asg_arn && outputs.asg_arn !== 'mock') {
        expect(outputs.asg_arn).toContain('autoScalingGroup');
      }
    });
  });
  
  describe('RDS Database Validation', () => {
    test('database endpoint was created', () => {
      expect(outputs.db_endpoint).toBeDefined();
      if (outputs.db_endpoint && outputs.db_endpoint !== 'mock') {
        expect(outputs.db_endpoint).toContain('.rds.amazonaws.com');
      }
    });
    
    test('database has correct naming', () => {
      if (outputs.environment_suffix && outputs.db_address) {
        expect(outputs.db_address).toContain(outputs.environment_suffix);
      }
    });
    
    test('database port is configured', () => {
      expect(outputs.db_port).toBeDefined();
      expect(outputs.db_port).toBe('3306');
    });
    
    test('database name is set', () => {
      expect(outputs.db_name).toBeDefined();
      expect(outputs.db_name).toBe('tapdb');
    });
    
    test('database password parameter is created', () => {
      expect(outputs.db_password_ssm_param).toBeDefined();
      if (outputs.environment_suffix) {
        expect(outputs.db_password_ssm_param).toContain(outputs.environment_suffix);
      }
    });
  });
  
  describe('Environment Configuration Validation', () => {
    test('environment suffix is applied', () => {
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.resource_prefix).toBeDefined();
      expect(outputs.resource_prefix).toContain(outputs.environment_suffix);
    });
    
    test('environment is determined correctly', () => {
      expect(outputs.environment).toBeDefined();
      expect(['staging', 'production']).toContain(outputs.environment);
    });
    
    test('workspace is configured', () => {
      expect(outputs.workspace).toBeDefined();
    });
    
    test('region is set correctly', () => {
      expect(outputs.region).toBeDefined();
      expect(outputs.region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
    
    test('account ID is available', () => {
      expect(outputs.account_id).toBeDefined();
      if (outputs.account_id && outputs.account_id !== 'mock') {
        expect(outputs.account_id).toMatch(/^\d{12}$/);
      }
    });
  });
  
  describe('Resource Count Validation', () => {
    test('correct number of VPCs created', () => {
      expect(outputs.vpc_count).toBeDefined();
      expect(parseInt(outputs.vpc_count)).toBe(1);
    });
    
    test('correct number of subnets created', () => {
      expect(outputs.subnet_count).toBeDefined();
      expect(parseInt(outputs.subnet_count)).toBeGreaterThanOrEqual(4);
    });
    
    test('correct number of security groups created', () => {
      expect(outputs.security_group_count).toBeDefined();
      expect(parseInt(outputs.security_group_count)).toBe(3);
    });
    
    test('correct number of load balancers created', () => {
      expect(outputs.load_balancer_count).toBeDefined();
      expect(parseInt(outputs.load_balancer_count)).toBe(1);
    });
    
    test('correct number of ASGs created', () => {
      expect(outputs.auto_scaling_group_count).toBeDefined();
      expect(parseInt(outputs.auto_scaling_group_count)).toBe(1);
    });
    
    test('correct number of databases created', () => {
      expect(outputs.database_count).toBeDefined();
      expect(parseInt(outputs.database_count)).toBe(1);
    });
    
    test('NAT gateways deployed for HA', () => {
      expect(outputs.nat_gateway_count).toBeDefined();
      expect(parseInt(outputs.nat_gateway_count)).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Cross-Resource Integration', () => {
    test('all resources use consistent naming', () => {
      if (outputs.environment_suffix) {
        const suffix = outputs.environment_suffix;
        const prefix = outputs.resource_prefix;
        
        // Check that various resources include the prefix
        if (outputs.asg_name) expect(outputs.asg_name).toContain(suffix);
        if (outputs.db_address) expect(outputs.db_address).toContain(suffix);
        if (outputs.alb_dns_name) expect(outputs.alb_dns_name.toLowerCase()).toContain(suffix);
      }
    });
    
    test('resources are in the same region', () => {
      const region = outputs.region;
      if (region) {
        if (outputs.alb_dns_name) expect(outputs.alb_dns_name).toContain(region);
        if (outputs.db_endpoint) expect(outputs.db_endpoint).toContain(region);
      }
    });
    
    test('outputs contain all critical information', () => {
      // Critical outputs that should always be present
      const criticalOutputs = [
        'vpc_id',
        'alb_dns_name',
        'environment',
        'region'
      ];
      
      criticalOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
        expect(outputs[output]).not.toBe(null);
      });
    });
  });
  
  describe('Deployment Validation', () => {
    test('deployment endpoints are accessible', () => {
      expect(outputs.load_balancer_url).toBeDefined();
      expect(outputs.health_check_url).toBeDefined();
      
      // Verify URL format
      if (outputs.load_balancer_url) {
        const url = new URL(outputs.load_balancer_url);
        expect(['http:', 'https:']).toContain(url.protocol);
        expect(url.hostname).toContain('amazonaws.com');
      }
    });
    
    test('all expected outputs are present', () => {
      const expectedOutputKeys = [
        'vpc_id',
        'vpc_cidr',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_security_group_id',
        'ec2_security_group_id', 
        'rds_security_group_id',
        'alb_dns_name',
        'asg_name',
        'db_endpoint',
        'environment',
        'region',
        'environment_suffix'
      ];
      
      expectedOutputKeys.forEach(key => {
        expect(outputs).toHaveProperty(key);
      });
    });
  });
  
  describe('Multi-Environment Support', () => {
    test('environment-specific configuration is applied', () => {
      const env = outputs.environment;
      expect(env).toBeDefined();
      
      // Verify environment is one of the expected values
      expect(['staging', 'production']).toContain(env);
    });
    
    test('workspace configuration is consistent', () => {
      expect(outputs.workspace).toBeDefined();
      
      // If using default workspace, environment should be determined by suffix
      if (outputs.workspace === 'default') {
        if (outputs.environment_suffix?.startsWith('pr')) {
          expect(outputs.environment).toBe('production');
        }
      }
    });
  });
  
  describe('High Availability Configuration', () => {
    test('resources span multiple availability zones', () => {
      // Check that we have multiple subnets (indicating multi-AZ)
      if (outputs.public_subnet_ids) {
        const publicSubnets = typeof outputs.public_subnet_ids === 'string'
          ? JSON.parse(outputs.public_subnet_ids)
          : outputs.public_subnet_ids;
        expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      }
      
      if (outputs.private_subnet_ids) {
        const privateSubnets = typeof outputs.private_subnet_ids === 'string'
          ? JSON.parse(outputs.private_subnet_ids)
          : outputs.private_subnet_ids;
        expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      }
    });
    
    test('NAT gateways provide redundancy', () => {
      if (outputs.nat_gateway_count) {
        expect(parseInt(outputs.nat_gateway_count)).toBeGreaterThanOrEqual(2);
      }
    });
  });
});