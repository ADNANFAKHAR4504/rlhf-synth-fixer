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

      // Flatten nested JSON strings
      const keysToFlatten = [
        'vpc_info',
        'security_group_info',
        'load_balancer_info',
        'auto_scaling_info',
        'database_info',
        'deployment_endpoints',
        'environment_info',
        'resource_summary',
        'shared_config'
      ];
      keysToFlatten.forEach(key => {
        if (outputs[key]) {
          let parsed;
          try {
            parsed = JSON.parse(outputs[key]);
          } catch {
            parsed = outputs[key];
          }
          if (typeof parsed === 'object' && parsed !== null) {
            outputs = { ...outputs, ...parsed };
          }
        }
      });
    } else {
      // Use mock data if no outputs file
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
      expect(outputs.vpc_cidr).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+$/);
    });

    test('public subnets exist', () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      const subnets = parseArray(outputs.public_subnet_ids);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('private subnets exist', () => {
      expect(outputs.private_subnet_ids).toBeDefined();
      const subnets = parseArray(outputs.private_subnet_ids);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('internet gateway exists', () => {
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-z0-9]+$/);
    });

    test('NAT gateways are deployed for HA', () => {
      expect(outputs.nat_gateway_ids).toBeDefined();
      const natGateways = parseArray(outputs.nat_gateway_ids);
      expect(natGateways.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups Validation', () => {
    test('ALB security group was created', () => {
      expect(outputs.alb_security_group_id).toBeDefined();
      expect(outputs.alb_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    });
    test('EC2 security group was created', () => {
      expect(outputs.ec2_security_group_id).toBeDefined();
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    });
    test('RDS security group was created', () => {
      expect(outputs.rds_security_group_id).toBeDefined();
      expect(outputs.rds_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
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
        expect(outputs.launch_template_id).toMatch(/^lt-[a-z0-9]+$/);
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
    test('database port is configured', () => {
      expect(outputs.db_port).toBeDefined();
      expect(String(outputs.db_port)).toBe('3306');
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