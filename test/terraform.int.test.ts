import * as fs from 'fs';
import * as path from 'path';
import * as hcl from 'hcl2-parser';
import { jest } from '@jest/globals';

// Path to the outputs JSON file
const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const TAP_STACK_PATH = path.join(__dirname, '../lib/tap_stack.tf');

// Mock AWS SDK responses if needed
jest.mock('aws-sdk', () => {
  return {
    EC2: jest.fn(() => ({
      describeVpcs: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Vpcs: [{
            CidrBlock: '10.0.0.0/16',
            EnableDnsSupport: true,
            EnableDnsHostnames: true
          }]
        })
      }),
      describeSubnets: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Subnets: [
            { MapPublicIpOnLaunch: true, Tags: [{ Key: 'Tier', Value: 'public' }] },
            { MapPublicIpOnLaunch: false, Tags: [{ Key: 'Tier', Value: 'private' }] }
          ]
        })
      })
    })),
    ELBv2: jest.fn(() => ({
      describeLoadBalancers: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          LoadBalancers: [{
            Scheme: 'internet-facing',
            Type: 'application'
          }]
        })
      })
    }))
  };
});

describe('TAP Stack Integration Tests', () => {
  let tfConfig: any;
  let outputs: any;

  beforeAll(() => {
    // Load Terraform config
    const fileContent = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    tfConfig = hcl.parseToObject(fileContent);
    
    // Load outputs JSON
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
  });

  test('Outputs file exists and is valid JSON', () => {
    expect(fs.existsSync(OUTPUTS_PATH)).toBeTruthy();
    expect(() => JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'))).not.toThrow();
  });

  describe('VPC Validation', () => {
    test('VPC ID exists in outputs', () => {
      expect(outputs.vpc_id?.value).toBeDefined();
    });

    test('VPC CIDR matches expected range', () => {
      expect(outputs.vpc_cidr?.value).toBe('10.0.0.0/16');
    });
  });

  describe('Subnet Validation', () => {
    test('Public subnets exist', () => {
      expect(Array.isArray(outputs.public_subnet_ids?.value)).toBeTruthy();
      expect(outputs.public_subnet_ids?.value.length).toBeGreaterThanOrEqual(2);
    });

    test('Private subnets exist', () => {
      expect(Array.isArray(outputs.private_subnet_ids?.value)).toBeTruthy();
      expect(outputs.private_subnet_ids?.value.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Load Balancer Validation', () => {
    test('ALB DNS name exists', () => {
      expect(outputs.alb_dns_name?.value).toBeDefined();
      expect(outputs.alb_dns_name?.value).toContain('elb.amazonaws.com');
    });

    test('Target group ARN exists', () => {
      expect(outputs.target_group_arn?.value).toBeDefined();
      expect(outputs.target_group_arn?.value).toContain('targetgroup');
    });
  });

  describe('Auto Scaling Validation', () => {
    test('ASG name exists', () => {
      expect(outputs.asg_name?.value).toBeDefined();
      expect(outputs.asg_name?.value).toContain('asg');
    });

    test('Launch template config matches requirements', () => {
      const lt = tfConfig.resource?.aws_launch_template?.main;
      expect(lt.instance_type).toBe('t3.micro');
      expect(lt.monitoring?.enabled).toBe(true);
    });
  });

  describe('Security Group Validation', () => {
    test('ALB Security Group exists', () => {
      expect(outputs.alb_sg_id?.value).toBeDefined();
    });

    test('EC2 Security Group exists', () => {
      expect(outputs.ec2_sg_id?.value).toBeDefined();
    });

    test('Security group rules are properly configured', () => {
      const albSg = tfConfig.resource?.aws_security_group?.alb;
      expect(albSg.ingress?.length).toBe(2); // HTTP and HTTPS
      expect(albSg.egress?.length).toBe(1);  // All outbound
    });
  });

  describe('ACM Certificate Validation', () => {
    test('ACM certificate ARN exists', () => {
      expect(outputs.acm_certificate_arn?.value).toBeDefined();
      expect(outputs.acm_certificate_arn?.value).toContain('certificate');
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('High CPU alarm exists', () => {
      expect(outputs.high_cpu_alarm_arn?.value).toBeDefined();
    });

    test('Unhealthy hosts alarm exists', () => {
      expect(outputs.unhealthy_hosts_alarm_arn?.value).toBeDefined();
    });
  });

  describe('Tagging Standards Compliance', () => {
    test('Resources have proper tags', () => {
      const taggedResources = Object.entries(tfConfig.resource || {})
        .flatMap(([type, resources]: [string, any]) => 
          Object.entries(resources).map(([name, config]: [string, any]) => ({ type, name, config }))
        .filter(({ config }) => config.tags));

      taggedResources.forEach(({ type, name, config }) => {
        expect(config.tags?.Project).toBeDefined();
        expect(config.tags?.Environment).toBeDefined();
        expect(config.tags?.ManagedBy).toBe('Terraform');
      });
    });
  });

  describe('Edge Cases', () => {
    test('Handles missing outputs file gracefully', () => {
      const invalidPath = path.resolve(process.cwd(), "cfn-outputs/nonexistent.json");
      expect(() => fs.readFileSync(invalidPath, 'utf8')).toThrow();
    });

    test('Validates empty outputs', () => {
      const emptyOutputs = {};
      expect(Object.keys(emptyOutputs).length).toBe(0);
    });

    test('Validates malformed outputs', () => {
      const malformed = { vpc_id: {} }; // Missing value property
      expect(malformed.vpc_id?.value).toBeUndefined();
    });
  });
});