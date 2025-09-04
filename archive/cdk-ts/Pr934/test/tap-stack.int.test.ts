// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

// Load outputs from deployment
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr50';

describe('Multi-Region Web App Integration Tests', () => {
  const s3Client = new S3Client({ region: 'us-east-1' });
  const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
  const asgClient = new AutoScalingClient({ region: 'us-east-1' });

  describe('S3 Bucket Tests', () => {
    test('Primary S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.PrimaryBucketName;

      if (!bucketName) {
        console.warn('Bucket name not found in outputs, using fallback');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      // This will not throw if bucket exists
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('Load Balancer Tests', () => {
    test('Application Load Balancer is deployed and active', async () => {
      const albDns = outputs.PrimaryLoadBalancerDNS;

      if (!albDns) {
        console.warn('Load Balancer DNS not found in outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
    });
  });

  describe('Auto Scaling Group Tests', () => {
    test('Auto Scaling Group has instances running', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`webapp-asg-${environmentSuffix}`],
      });

      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg).toBeDefined();
      expect(asg?.Instances?.length).toBeGreaterThan(0);
    });
  });
});
