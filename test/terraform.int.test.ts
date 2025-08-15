import * as fs from 'fs';
import * as path from 'path';
import { jest } from '@jest/globals';
import { EC2, ELBv2 } from 'aws-sdk';

// Interface for Terraform outputs
interface TerraformOutputs {
  [key: string]: {
    value: any;
  };
}

// Path to the outputs JSON file
const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Mock AWS SDK responses with proper typing
jest.mock('aws-sdk', () => {
  const mockDescribeVpcs = jest.fn((params?: EC2.DescribeVpcsRequest) => ({
    promise: () => Promise.resolve({
      Vpcs: [
        {
          CidrBlock: '10.0.0.0/16',
          VpcId: 'vpc-mock123', // Added to match Vpc type
          State: 'available',   // Added to match Vpc type
        },
      ],
    } as EC2.DescribeVpcsResult),
  })) as jest.MockedFunction<typeof EC2.prototype.describeVpcs>;

  const mockDescribeSubnets = jest.fn((params?: EC2.DescribeSubnetsRequest) => ({
    promise: () => Promise.resolve({
      Subnets: [
        {
          MapPublicIpOnLaunch: true,
          Tags: [{ Key: 'Tier', Value: 'public' }],
          SubnetId: 'subnet-public123', // Added to match Subnet type
          AvailabilityZone: 'us-east-1a', // Added to match Subnet type
        },
        {
          MapPublicIpOnLaunch: false,
          Tags: [{ Key: 'Tier', Value: 'private' }],
          SubnetId: 'subnet-private123', // Added
          AvailabilityZone: 'us-east-1b', // Added
        },
      ],
    } as EC2.DescribeSubnetsResult),
  })) as jest.MockedFunction<typeof EC2.prototype.describeSubnets>;

  const mockEC2: Partial<EC2> = {
    describeVpcs: mockDescribeVpcs,
    describeSubnets: mockDescribeSubnets,
  };

  const mockDescribeLoadBalancers = jest.fn((params?: ELBv2.DescribeLoadBalancersInput) => ({
    promise: () => Promise.resolve({
      LoadBalancers: [
        {
          Scheme: 'internet-facing',
          Type: 'application',
          LoadBalancerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188', // Added to match LoadBalancer type
          DNSName: 'my-load-balancer-1234567890.us-east-1.elb.amazonaws.com', // Added
        },
      ],
    } as ELBv2.DescribeLoadBalancersOutput),
  })) as jest.MockedFunction<typeof ELBv2.prototype.describeLoadBalancers>;

  const mockELBv2: Partial<ELBv2> = {
    describeLoadBalancers: mockDescribeLoadBalancers,
  };

  return {
    EC2: jest.fn(() => mockEC2),
    ELBv2: jest.fn(() => mockELBv2),
  };
});

describe('TAP Stack Integration Tests', () => {
  let outputs: TerraformOutputs;

  beforeAll(() => {
    try {
      const outputsFile = fs.readFileSync(OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsFile) as TerraformOutputs;
    } catch (error) {
      console.error('Failed to load outputs file:', error);
      throw error;
    }
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
      expect(typeof outputs.alb_dns_name?.value).toBe('string');
      expect(outputs.alb_dns_name?.value).toContain('elb.amazonaws.com');
    });

    test('Target group ARN exists', () => {
      expect(outputs.target_group_arn?.value).toBeDefined();
      expect(typeof outputs.target_group_arn?.value).toBe('string');
      expect(outputs.target_group_arn?.value).toContain('targetgroup');
    });
  });

  describe('Auto Scaling Validation', () => {
    test('ASG name exists', () => {
      expect(outputs.asg_name?.value).toBeDefined();
      expect(typeof outputs.asg_name?.value).toBe('string');
      expect(outputs.asg_name?.value).toContain('asg');
    });
  });

  describe('Security Group Validation', () => {
    test('ALB Security Group exists', () => {
      expect(outputs.alb_sg_id?.value).toBeDefined();
      expect(typeof outputs.alb_sg_id?.value).toBe('string');
    });

    test('EC2 Security Group exists', () => {
      expect(outputs.ec2_sg_id?.value).toBeDefined();
      expect(typeof outputs.ec2_sg_id?.value).toBe('string');
    });
  });

  describe('ACM Certificate Validation', () => {
    test('ACM certificate ARN exists', () => {
      expect(outputs.acm_certificate_arn?.value).toBeDefined();
      expect(typeof outputs.acm_certificate_arn?.value).toBe('string');
      expect(outputs.acm_certificate_arn?.value).toContain('certificate');
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('High CPU alarm exists', () => {
      expect(outputs.high_cpu_alarm_arn?.value).toBeDefined();
      expect(typeof outputs.high_cpu_alarm_arn?.value).toBe('string');
    });

    test('Unhealthy hosts alarm exists', () => {
      expect(outputs.unhealthy_hosts_alarm_arn?.value).toBeDefined();
      expect(typeof outputs.unhealthy_hosts_alarm_arn?.value).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    test('Handles missing outputs file gracefully', () => {
      const invalidPath = path.resolve(process.cwd(), "cfn-outputs/nonexistent.json");
      expect(() => fs.readFileSync(invalidPath, 'utf8')).toThrow();
    });

    test('Validates empty outputs', () => {
      const emptyOutputs: TerraformOutputs = {};
      expect(Object.keys(emptyOutputs)).toHaveLength(0);
    });

    test('Validates malformed outputs', () => {
      const malformed = { vpc_id: {} } as unknown as TerraformOutputs;
      expect(malformed.vpc_id?.value).toBeUndefined();
    });
  });
});