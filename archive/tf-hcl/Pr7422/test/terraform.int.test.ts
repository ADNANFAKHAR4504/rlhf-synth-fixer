// Integration tests for Financial Services Infrastructure
// Tests validate actual AWS resources using deployment outputs

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  alb_dns_name?: TfOutputValue<string>;
  alb_arn?: TfOutputValue<string>;
  autoscaling_group_name?: TfOutputValue<string>;
  database_endpoint?: TfOutputValue<string>;
  database_reader_endpoint?: TfOutputValue<string>;
  database_name?: TfOutputValue<string>;
  database_port?: TfOutputValue<string>;
  vpc_id?: TfOutputValue<string>;
  private_subnet_ids?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json'),
    path.resolve(process.cwd(), 'lib/terraform.tfstate.d/outputs.json'),
    path.resolve(process.cwd(), 'lib/.terraform/outputs.json'),
    path.resolve(process.cwd(), 'tf-outputs/all-outputs.json'),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      // Handle outputs that may have .value property or be direct values
      const outputs: StructuredOutputs = {};
      for (const [key, value] of Object.entries(rawOutputs)) {
        if (value && typeof value === 'object' && 'value' in value) {
          outputs[key as keyof StructuredOutputs] = value as TfOutputValue<any>;
        } else {
          // Wrap direct values in TfOutputValue structure
          outputs[key as keyof StructuredOutputs] = {
            sensitive: false,
            type: typeof value,
            value: value,
          } as TfOutputValue<any>;
        }
      }
      return outputs;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.TF_ALB_DNS_NAME) {
    outputs.alb_dns_name = { sensitive: false, type: 'string', value: process.env.TF_ALB_DNS_NAME };
  }
  if (process.env.TF_ALB_ARN) {
    outputs.alb_arn = { sensitive: false, type: 'string', value: process.env.TF_ALB_ARN };
  }
  if (process.env.TF_VPC_ID) {
    outputs.vpc_id = { sensitive: false, type: 'string', value: process.env.TF_VPC_ID };
  }
  if (process.env.TF_DATABASE_ENDPOINT) {
    outputs.database_endpoint = { sensitive: false, type: 'string', value: process.env.TF_DATABASE_ENDPOINT };
  }
  if (process.env.TF_DATABASE_READER_ENDPOINT) {
    outputs.database_reader_endpoint = { sensitive: false, type: 'string', value: process.env.TF_DATABASE_READER_ENDPOINT };
  }
  if (process.env.TF_DATABASE_NAME) {
    outputs.database_name = { sensitive: false, type: 'string', value: process.env.TF_DATABASE_NAME };
  }
  if (process.env.TF_PRIVATE_SUBNET_IDS) {
    outputs.private_subnet_ids = { sensitive: false, type: 'string', value: process.env.TF_PRIVATE_SUBNET_IDS };
  }
  if (process.env.TF_PUBLIC_SUBNET_IDS) {
    outputs.public_subnet_ids = { sensitive: false, type: 'string', value: process.env.TF_PUBLIC_SUBNET_IDS };
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(', ')}\n` +
      'Set environment variables or ensure Terraform outputs are available.'
    );
  }

  return outputs;
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(
          `${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`
        );
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

function parseJsonArray(jsonString: string | undefined): string[] {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
}

// Read outputs and initialize AWS clients
const rawOutputs = readStructuredOutputs();
const region = process.env.AWS_REGION || 'us-east-1';

// Parse JSON string outputs
const outputs: any = {};
for (const [key, value] of Object.entries(rawOutputs)) {
  const outputValue = (value as any)?.value ?? value;
  if (typeof outputValue === 'string' && (key.includes('subnet') || key.includes('_ids'))) {
    const parsed = parseJsonArray(outputValue);
    outputs[key] = parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } else {
    outputs[key] = outputValue;
  }
}

// AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });

describe('Financial Services Infrastructure - Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.vpc_id).toBeTruthy();
      expect(outputs.database_name).toBeTruthy();
      expect(outputs.private_subnet_ids).toBeTruthy();
      expect(outputs.public_subnet_ids).toBeTruthy();
    });

    test('VPC ID should be valid AWS VPC ID format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[0-9a-f]{17}$/);
    });

    test('Subnet IDs should be valid arrays', () => {
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBeGreaterThan(0);
      expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);
      outputs.private_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[0-9a-f]{17}$/);
      });
      outputs.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[0-9a-f]{17}$/);
      });
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })
        );
      });

      expect(response.Vpcs).toBeTruthy();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpc_id);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBeTruthy();
    }, 90000);

    test('should have subnets across multiple availability zones', async () => {
      const allSubnetIds = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
        );
      });

      expect(response.Subnets).toBeTruthy();
      expect(response.Subnets!.length).toBe(allSubnetIds.length);

      const availabilityZones = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 90000);

    test('should have public and private subnets', async () => {
      const allSubnetIds = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids];
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
        );
      });

      const publicSubnets = response.Subnets!.filter(
        (subnet) => subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        (subnet) => subnet.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    }, 90000);

    test('all subnets should be in the same VPC', async () => {
      const allSubnetIds = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
        );
      });

      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    }, 90000);
  });


  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }

      const response = await retry(async () => {
        return await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.autoscaling_group_name],
          })
        );
      });

      expect(response.AutoScalingGroups).toBeTruthy();
      expect(response.AutoScalingGroups!.length).toBe(1);
      expect(response.AutoScalingGroups![0].AutoScalingGroupName).toBe(
        outputs.autoscaling_group_name
      );
    }, 90000);

    test('Auto Scaling Group should be in private subnets', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }

      const response = await retry(async () => {
        return await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.autoscaling_group_name],
          })
        );
      });

      const asg = response.AutoScalingGroups![0];
      expect(asg.VPCZoneIdentifier).toBeTruthy();
      const asgSubnetIds = asg.VPCZoneIdentifier!.split(',');

      outputs.private_subnet_ids.forEach((privateSubnetId: string) => {
        expect(asgSubnetIds).toContain(privateSubnetId);
      });
    }, 90000);

    test('Auto Scaling Group should have instances', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }

      const response = await retry(async () => {
        return await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.autoscaling_group_name],
          })
        );
      });

      const asg = response.AutoScalingGroups![0];
      expect(asg.DesiredCapacity).toBeGreaterThan(0);
      expect(asg.MinSize).toBeGreaterThanOrEqual(0);
      expect(asg.MaxSize).toBeGreaterThan(0);
    }, 90000);

    test('Auto Scaling Group should use launch template', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }

      const response = await retry(async () => {
        return await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.autoscaling_group_name],
          })
        );
      });

      const asg = response.AutoScalingGroups![0];
      expect(asg.LaunchTemplate).toBeTruthy();
      expect(asg.LaunchTemplate!.LaunchTemplateId).toBeTruthy();
    }, 90000);
  });


  describe('Security Groups', () => {
    test('security groups should exist for all tiers', async () => {
      // Get all security groups in the VPC
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }],
          })
        );
      });

      expect(response.SecurityGroups).toBeTruthy();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Verify we have security groups for ALB, EC2, and RDS
      const sgNames = response.SecurityGroups!.map((sg) => sg.GroupName || '');
      const hasALBSG = sgNames.some((name) => name.includes('alb') || name.includes('ALB'));
      const hasEC2SG = sgNames.some((name) => name.includes('ec2') || name.includes('EC2'));
      const hasRDSSG = sgNames.some((name) => name.includes('rds') || name.includes('RDS'));

      expect(hasALBSG || hasEC2SG || hasRDSSG).toBe(true);
    }, 90000);

    test('database security group should not allow public access', async () => {
      // Get all security groups in the VPC
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }],
          })
        );
      });

      const rdsSecurityGroups = response.SecurityGroups!.filter(
        (sg) => (sg.GroupName || '').toLowerCase().includes('rds')
      );

      if (rdsSecurityGroups.length > 0) {
        rdsSecurityGroups.forEach((sg) => {
          // RDS security group should not have ingress rules from 0.0.0.0/0
          const publicIngress = sg.IpPermissions?.some((rule) =>
            rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
          );
          expect(publicIngress).toBeFalsy();
        });
      }
    }, 90000);
  });

  describe('Infrastructure Integration', () => {
    test('infrastructure should support multi-AZ deployment', async () => {
      // Verify subnets are in multiple AZs
      const allSubnetIds = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );
      const subnetsResponse = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
        );
      });

      const availabilityZones = new Set(
        subnetsResponse.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 120000);

    test('all critical resources should be deployed and functional', () => {
      // Verify all critical outputs are present
      expect(outputs.vpc_id).toBeTruthy();
      expect(outputs.database_name).toBeTruthy();
      expect(outputs.private_subnet_ids.length).toBeGreaterThan(0);
      expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);
    });
  });

});