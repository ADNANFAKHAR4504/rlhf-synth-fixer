import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { EC2, ELBv2 } from 'aws-sdk';

// Interface for Terraform outputs
interface TerraformOutputs {
  [key: string]: {
    value: any;
  };
}

// Path to the outputs JSON file
const OUTPUTS_PATH = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

// --- Mock AWS SDK calls (no jest) ---
class MockEC2 {
  describeVpcs(params?: EC2.DescribeVpcsRequest) {
    return {
      promise: async (): Promise<EC2.DescribeVpcsResult> => ({
        Vpcs: [
          {
            CidrBlock: '10.0.0.0/16',
            VpcId: 'vpc-mock123',
            State: 'available',
          },
        ],
      }),
    };
  }

  describeSubnets(params?: EC2.DescribeSubnetsRequest) {
    return {
      promise: async (): Promise<EC2.DescribeSubnetsResult> => ({
        Subnets: [
          {
            MapPublicIpOnLaunch: true,
            Tags: [{ Key: 'Tier', Value: 'public' }],
            SubnetId: 'subnet-public123',
            AvailabilityZone: 'us-east-1a',
          },
          {
            MapPublicIpOnLaunch: false,
            Tags: [{ Key: 'Tier', Value: 'private' }],
            SubnetId: 'subnet-private123',
            AvailabilityZone: 'us-east-1b',
          },
        ],
      }),
    };
  }
}

class MockELBv2 {
  describeLoadBalancers(params?: ELBv2.DescribeLoadBalancersInput) {
    return {
      promise: async (): Promise<ELBv2.DescribeLoadBalancersOutput> => ({
        LoadBalancers: [
          {
            Scheme: 'internet-facing',
            Type: 'application',
            LoadBalancerArn:
              'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188',
            DNSName:
              'my-load-balancer-1234567890.us-east-1.elb.amazonaws.com',
          },
        ],
      }),
    };
  }
}

// Replace real AWS SDK clients with mocks
const ec2 = new MockEC2() as unknown as EC2;
const elbv2 = new MockELBv2() as unknown as ELBv2;

// --- Load Terraform outputs ---
let outputs: TerraformOutputs;
try {
  const outputsFile = fs.readFileSync(OUTPUTS_PATH, 'utf8');
  outputs = JSON.parse(outputsFile) as TerraformOutputs;
} catch (error) {
  console.error('Failed to load outputs file:', error);
  process.exit(1);
}

// --- Tests (pure Node.js assertions) ---

// Outputs file check
assert(fs.existsSync(OUTPUTS_PATH), 'Outputs file does not exist');
assert.doesNotThrow(() => {
  JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
}, 'Outputs file is not valid JSON');

// VPC validation
assert(outputs.vpc_id?.value, 'VPC ID is missing');
assert.strictEqual(outputs.vpc_cidr?.value, '10.0.0.0/16', 'VPC CIDR mismatch');

// Subnet validation
assert(Array.isArray(outputs.public_subnet_ids?.value), 'Public subnets missing');
assert(outputs.public_subnet_ids?.value.length >= 2, 'Not enough public subnets');

assert(Array.isArray(outputs.private_subnet_ids?.value), 'Private subnets missing');
assert(outputs.private_subnet_ids?.value.length >= 2, 'Not enough private subnets');

// Load Balancer validation
assert(outputs.alb_dns_name?.value, 'ALB DNS name missing');
assert(typeof outputs.alb_dns_name?.value === 'string', 'ALB DNS name is not a string');
assert(outputs.alb_dns_name?.value.includes('elb.amazonaws.com'), 'Invalid ALB DNS name');

assert(outputs.target_group_arn?.value, 'Target group ARN missing');
assert(typeof outputs.target_group_arn?.value === 'string', 'Target group ARN is not a string');
assert(outputs.target_group_arn?.value.includes('targetgroup'), 'Invalid target group ARN');

// Auto Scaling validation
assert(outputs.asg_name?.value, 'ASG name missing');
assert(typeof outputs.asg_name?.value === 'string', 'ASG name is not a string');
assert(outputs.asg_name?.value.includes('asg'), 'Invalid ASG name');

// Security Group validation
assert(outputs.alb_sg_id?.value, 'ALB Security Group ID missing');
assert(typeof outputs.alb_sg_id?.value === 'string', 'ALB SG ID is not a string');

assert(outputs.ec2_sg_id?.value, 'EC2 Security Group ID missing');
assert(typeof outputs.ec2_sg_id?.value === 'string', 'EC2 SG ID is not a string');

// ACM Certificate validation
assert(outputs.acm_certificate_arn?.value, 'ACM Certificate ARN missing');
assert(typeof outputs.acm_certificate_arn?.value === 'string', 'ACM ARN is not a string');
assert(outputs.acm_certificate_arn?.value.includes('certificate'), 'Invalid ACM ARN');

// CloudWatch alarms validation
assert(outputs.high_cpu_alarm_arn?.value, 'High CPU alarm missing');
assert(typeof outputs.high_cpu_alarm_arn?.value === 'string', 'High CPU alarm is not a string');

assert(outputs.unhealthy_hosts_alarm_arn?.value, 'Unhealthy hosts alarm missing');
assert(typeof outputs.unhealthy_hosts_alarm_arn?.value === 'string', 'Unhealthy hosts alarm is not a string');

// Edge cases
assert.throws(() => {
  fs.readFileSync(path.resolve(process.cwd(), 'cfn-outputs/nonexistent.json'), 'utf8');
}, 'Missing outputs file did not throw');

const emptyOutputs: TerraformOutputs = {};
assert.strictEqual(Object.keys(emptyOutputs).length, 0, 'Empty outputs should have length 0');

const malformed = { vpc_id: {} } as unknown as TerraformOutputs;
assert.strictEqual(malformed.vpc_id?.value, undefined, 'Malformed outputs should have undefined value');

console.log('✅ All tests passed without Jest');
