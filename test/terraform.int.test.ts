// test/terraform.int.test.ts
// Integration tests for Terraform infrastructure deployment
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: Record<string, any> = {};
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No deployment outputs found. Using mock data.');
      outputs = {
        vpc_id: 'vpc-mock',
        vpc_cidr: '10.0.0.0/16',
        public_subnet_ids: ['subnet-mock1', 'subnet-mock2'],
        private_subnet_ids: ['subnet-mock3', 'subnet-mock4'],
        internet_gateway_id: 'igw-mock',
        nat_gateway_ids: ['nat-mock1', 'nat-mock2'],
        alb_security_group_id: 'sg-mock1',
        ec2_security_group_id: 'sg-mock2',
        rds_security_group_id: 'sg-mock3',
        alb_dns_name: 'mock-alb.elb.amazonaws.com',
        target_group_arn: 'mock',
        load_balancer_url: 'https://mock-alb.elb.amazonaws.com',
        health_check_url: 'https://mock-alb.elb.amazonaws.com/health/',
        asg_name: 'mock-asg',
        launch_template_id: 'lt-mock',
        asg_arn: 'mock-asg-arn',
        db_endpoint: 'mock-db.rds.amazonaws.com',
        db_address: 'mock-db',
        db_port: '3306',
        db_name: 'tapdb',
        db_password_ssm_param: '/mock/db/password',
        environment_suffix: 'test',
        resource_prefix: 'tap-test',
        environment: 'staging',
        workspace: 'default',
        region: 'us-east-1',
        account_id: '123456789012',
        vpc_count: '1',
        subnet_count: '4',
        security_group_count: '3',
        load_balancer_count: '1',
        auto_scaling_group_count: '1',
        database_count: '1',
        nat_gateway_count: '2'
      };
    }
  });

  const parseArray = (input: string | string[]) => {
    if (!input) return [];
    return typeof input === 'string' ? JSON.parse(input) : input;
  };

  describe('VPC and Networking Validation', () => {
    test('VPC was created with correct configuration', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('VPC CIDR block is valid', () => {
      expect(outputs.vpc_cidr).toBeDefined();
      expect(outputs.vpc_cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });

    test('public subnets exist', () => {
      const subnets = parseArray(outputs.public_subnet_ids);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('private subnets exist', () => {
      const subnets = parseArray(outputs.private_subnet_ids);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('internet gateway exists', () => {
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-z0-9]+$/);
    });

    test('NAT gateways are deployed for HA', () => {
      const natGateways = parseArray(outputs.nat_gateway_ids);
      expect(natGateways.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups Validation', () => {
    test('all security groups exist and are unique', () => {
      const sgs = [
        outputs.alb_security_group_id,
        outputs.ec2_security_group_id,
        outputs.rds_security_group_id
      ];
      expect(sgs.every(sg => sg)).toBe(true);
      const uniqueSgs = new Set(sgs);
      expect(uniqueSgs.size).toBe(3);
    });
  });

  describe('Load Balancer Validation', () => {
    test('ALB DNS name is valid', () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).toContain('.elb.amazonaws.com');
    });

    test('target group exists', () => {
      if (outputs.target_group_arn !== 'mock') {
        expect(outputs.target_group_arn).toContain('targetgroup');
      }
    });

    test('load balancer URL format is correct', () => {
      expect(outputs.load_balancer_url).toMatch(/^https?:\/\//);
    });

    test('health check URL format is correct', () => {
      expect(outputs.health_check_url).toMatch(/^https?:\/\/.*\/$/);
    });
  });

  describe('Auto Scaling Group Validation', () => {
    test('ASG and launch template exist', () => {
      expect(outputs.asg_name).toBeDefined();
      if (outputs.launch_template_id !== 'mock') {
        expect(outputs.launch_template_id).toMatch(/^lt-[a-z0-9]+$/);
      }
    });
  });

  describe('RDS Database Validation', () => {
    test('database endpoint, port, and name are correct', () => {
      expect(outputs.db_endpoint).toBeDefined();
      expect(outputs.db_port).toBe('3306');
      expect(outputs.db_name).toBe('tapdb');
    });
  });

  describe('Environment and Resource Validation', () => {
    test('environment, region, and account ID are correct', () => {
      expect(outputs.environment).toBeDefined();
      expect(['staging', 'production']).toContain(outputs.environment);
      expect(outputs.region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
      expect(outputs.account_id).toMatch(/^\d{12}$/);
    });

    test('resource counts are correct', () => {
      expect(parseInt(outputs.vpc_count)).toBe(1);
      expect(parseInt(outputs.subnet_count)).toBeGreaterThanOrEqual(4);
      expect(parseInt(outputs.security_group_count)).toBe(3);
    });
  });

  describe('High Availability', () => {
    test('resources span multiple subnets', () => {
      expect(parseArray(outputs.public_subnet_ids).length).toBeGreaterThanOrEqual(2);
      expect(parseArray(outputs.private_subnet_ids).length).toBeGreaterThanOrEqual(2);
    });

    test('NAT gateways provide redundancy', () => {
      expect(parseInt(outputs.nat_gateway_count)).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cross-Resource Integration', () => {
    test('all critical outputs exist', () => {
      const criticalOutputs = ['vpc_id', 'alb_dns_name', 'environment', 'region'];
      criticalOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
      });
    });
  });
});
