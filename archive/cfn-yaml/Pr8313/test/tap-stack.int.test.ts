import { spawn } from 'child_process';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

// Helper function to run AWS CLI commands
async function runAwsCommand(command: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('aws', [...command, '--region', region, '--output', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    // Set a timeout for the AWS CLI command
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`AWS CLI command timed out: aws ${command.join(' ')}`));
    }, 20000); // 20 second timeout

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(`AWS CLI command failed: ${stderr}`));
      }
    });
  });
}

describe('Migration Infrastructure - AWS Resource Integration Tests', () => {

  describe('VPC and Network Infrastructure', () => {
    test('should have a functional VPC with correct configuration', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpcs', '--vpc-ids', outputs.VPCId]);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');

      console.log(`VPC ${outputs.VPCId} is active with CIDR 10.0.0.0/16`);
    }, 25000);

    test('should have public and private subnets in different AZs', async () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      const response = await runAwsCommand(['ec2', 'describe-subnets', '--subnet-ids',
        outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]);

      expect(response.Subnets).toHaveLength(4);
      const azs = response.Subnets.map((subnet: any) => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // All subnets in 2 AZs

      console.log(`Subnets deployed across AZs: ${Array.from(new Set(azs)).join(', ')}`);
    }, 25000);
  });

  describe('Application Load Balancer Infrastructure', () => {
    test('should have an operational Application Load Balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      const response = await runAwsCommand(['elbv2', 'describe-load-balancers', '--load-balancer-arns', outputs.ApplicationLoadBalancerArn]);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Type).toBe('application');

      console.log(`ALB ${outputs.ApplicationLoadBalancerArn} is active`);
    }, 25000);

    test('should have configured target groups for load balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();

      const response = await runAwsCommand(['elbv2', 'describe-target-groups', '--load-balancer-arn', outputs.ApplicationLoadBalancerArn]);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups.length).toBeGreaterThan(0);

      response.TargetGroups.forEach((tg: any) => {
        expect(tg.TargetType).toBeDefined();
        console.log(`Target group ${tg.TargetGroupName} configured for ${tg.TargetType} targets`);
      });
    }, 25000);
  });
});
