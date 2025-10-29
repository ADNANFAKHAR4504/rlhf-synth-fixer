import fs from 'fs';
import path from 'path';
import dns from 'dns/promises';
import axios from 'axios';
import crypto from 'crypto';
import { S3Client, GetBucketVersioningCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { EC2Client, DescribeAddressesCommand, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, StartInstanceRefreshCommand, DescribeInstanceRefreshesCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// Read flattened CloudFormation outputs produced post-deploy
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error('Missing cfn-outputs/flat-outputs.json. Ensure the stack is deployed and outputs are exported.');
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) as Record<string, string>;

// Expected output keys
const WEBSITE_URL = outputs['WebsiteURL'];
const EIP = outputs['InstancePublicIP'];
const S3_BUCKET = outputs['S3BucketName'];
const ASG_NAME = outputs['AutoScalingGroupName'];

// Environment label used in logs path (defaults to template default)
const ENVIRONMENT = process.env.ENVIRONMENT || 'Production';

// AWS region
const REGION = process.env.AWS_REGION;

// AWS SDK clients
const s3 = new S3Client({ region: REGION });
const logs = new CloudWatchLogsClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });
const asg = new AutoScalingClient({ region: REGION });
const cloudwatch = new CloudWatchClient({ region: REGION });

// Cleanup function to close all clients
afterAll(async () => {
  await Promise.all([
    s3.destroy(),
    logs.destroy(),
    ec2.destroy(),
    asg.destroy(),
    cloudwatch.destroy()
  ]);
});



describe('End-to-End Workflow Integration - NovaFintech Stack', () => {
  describe('DNS → Elastic IP', () => {
    test('Route 53 A record resolves to the stack Elastic IP', async () => {
      const url = new URL(WEBSITE_URL);
      const hostname = url.hostname;

      const addresses = await dns.lookup(hostname, { all: true, family: 4 });
      const resolvedIps = addresses.map(a => a.address);

      expect(resolvedIps.length).toBeGreaterThan(0);
      expect(resolvedIps).toContain(EIP);
    });
  });

  describe('Elastic IP → EC2/Apache (HTTP path)', () => {
    test('HTTP GET to WebsiteURL returns 200 and expected landing content', async () => {
      // Quick retry for Apache startup
      let resp;
      let retries = 0;
      const maxRetries = 6; // 30 seconds max
      
      while (retries < maxRetries) {
        try {
          resp = await axios.get(WEBSITE_URL, { timeout: 10_000, validateStatus: () => true });
          if (resp.status === 200 && resp.data.includes('NovaFintech') && resp.data.includes('Environment:')) {
            break;
          }
        } catch (error) {
          // Continue retrying
        }
        
        if (retries < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        }
        retries++;
      }
      
      expect(resp).toBeDefined();
      expect(resp!.status).toBe(200);
      const body: string = resp!.data;
      expect(body).toContain('NovaFintech');
      expect(body).toContain('Environment:');
    });

    test('Customer POV: unique page request appears in Apache access logs (CloudWatch)', async () => {
      // generate unique path that will produce a 404 but still be logged by Apache
      const token = crypto.randomBytes(8).toString('hex');
      const uniquePath = `/test-customer-journey-${token}.html`;
      const accessLogGroup = `/aws/ec2/novafintech/${ENVIRONMENT}/apache/access`;

      // make the request a few times to ensure log delivery
      const target = new URL(WEBSITE_URL);
      target.pathname = uniquePath;
      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        await axios.get(target.toString(), { timeout: 15_000, validateStatus: () => true }).catch(() => void 0);
      }

      // Wait for CloudWatch agent to ship logs (up to 1 minute)
      let found = false;
      let retries = 0;
      const maxRetries = 12; // 12 * 5 seconds = 1 minute
      
      while (!found && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds between retries
        retries++;
        
        try {
          const streamsResp = await logs.send(new DescribeLogStreamsCommand({ logGroupName: accessLogGroup, orderBy: 'LastEventTime', descending: true, limit: 5 }));
          const streams = streamsResp.logStreams || [];
          
          for (const s of streams) {
            if (!s.logStreamName) continue;
            const eventsResp = await logs.send(new GetLogEventsCommand({ logGroupName: accessLogGroup, logStreamName: s.logStreamName, limit: 200, startFromHead: false }));
            const messages = (eventsResp.events || []).map(e => e.message || '');
            if (messages.some(m => m.includes(token) || m.includes(uniquePath))) {
              found = true;
              break;
            }
          }
        } catch (error: any) {
          // If log group doesn't exist yet, continue retrying
          if (error.name === 'ResourceNotFoundException') {
            continue;
          }
          throw error;
        }
      }

      expect(found).toBe(true);
    });
  });

  describe('CloudWatch Logs and S3 artifacts', () => {
    test('CloudWatch log groups for Apache exist and have streams', async () => {
      const accessGroup = `/aws/ec2/novafintech/${ENVIRONMENT}/apache/access`;
      const errorGroup = `/aws/ec2/novafintech/${ENVIRONMENT}/apache/error`;

      // Quick retry for log groups creation
      let groupNames: string[] = [];
      let retries = 0;
      const maxRetries = 12; // 1 minute max
      
      while (retries < maxRetries) {
        const lgResp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: `/aws/ec2/novafintech/${ENVIRONMENT}/apache/` }));
        groupNames = (lgResp.logGroups || []).map(g => g.logGroupName).filter((name): name is string => !!name);
        
        if (groupNames.includes(accessGroup) && groupNames.includes(errorGroup)) {
          break;
        }
        
        if (retries < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        }
        retries++;
      }
      
      expect(groupNames).toEqual(expect.arrayContaining([accessGroup, errorGroup]));

      // Quick check for streams
      let streamsExist = false;
      let streamRetries = 0;
      const maxStreamRetries = 6; // 30 seconds max
      
      while (!streamsExist && streamRetries < maxStreamRetries) {
        try {
          const streamsResp = await logs.send(new DescribeLogStreamsCommand({ logGroupName: accessGroup, orderBy: 'LastEventTime', descending: true, limit: 1 }));
          if ((streamsResp.logStreams || []).length > 0) {
            streamsExist = true;
            break;
          }
        } catch (error) {
          // Continue retrying
        }
        
        if (streamRetries < maxStreamRetries - 1) {
          await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        }
        streamRetries++;
      }
      
      expect(streamsExist).toBe(true);
    });

    test('S3 bucket has versioning enabled and contains startup logs', async () => {
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: S3_BUCKET }));
      expect(ver.Status).toBe('Enabled');

      const listed = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: 'startup-logs/' }));
      expect((listed.Contents || []).length).toBeGreaterThan(0);
    });
  });

  describe('ASG instance health and EIP association', () => {
    let instanceId: string | undefined;

    test('ASG has exactly 1 InService instance', async () => {
      const asgResp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [ASG_NAME] }));
      const group = (asgResp.AutoScalingGroups || [])[0];
      expect(group).toBeDefined();
      expect((group.Instances || []).length).toBe(1);

      const inst = group.Instances![0];
      expect(inst.LifecycleState).toBe('InService');
      instanceId = inst.InstanceId;
      expect(instanceId).toBeDefined();
    });

    test('Elastic IP is currently associated to the ASG instance', async () => {
      // Quick retry for EIP association
      let eipAssociated = false;
      let retries = 0;
      const maxRetries = 12; // 2 minutes max
      
      while (!eipAssociated && retries < maxRetries) {
        const addrResp = await ec2.send(new DescribeAddressesCommand({ PublicIps: [EIP] }));
        const address = (addrResp.Addresses || [])[0];
        
        if (address?.InstanceId === instanceId) {
          eipAssociated = true;
          
          const instResp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId!] }));
          const state = instResp.Reservations?.[0]?.Instances?.[0]?.State?.Name;
          expect(state).toBe('running');
          break;
        }
        
        if (retries < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
        }
        retries++;
      }
      
      expect(eipAssociated).toBe(true);
      
      // Final verification
      const finalAddrResp = await ec2.send(new DescribeAddressesCommand({ PublicIps: [EIP] }));
      const finalAddress = finalAddrResp.Addresses?.[0];
      expect(finalAddress).toBeDefined();
      expect(finalAddress!.InstanceId).toBe(instanceId);
    });
  });

  describe('SSH Access (Security Group)', () => {
    test('Security Group allows SSH access on port 22', async () => {
      const sgId = outputs['SecurityGroupId'];
      const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      const sg = sgResp.SecurityGroups?.[0];
      
      expect(sg).toBeDefined();
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CPU alarm exists and is configured correctly', async () => {
      const alarmName = `NovaFintech-${ENVIRONMENT}-HighCPU`;
      const alarmsResp = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
      const alarm = alarmsResp.MetricAlarms?.[0];
      
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(alarmName);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Namespace).toBe('AWS/EC2');
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Lifecycle Replacement Flow (EIP Reassociation)', () => {
    let originalInstanceId: string | undefined;
    let refreshId: string | undefined;

    test('Trigger instance refresh and verify EIP reassociation', async () => {
      // Get current instance
      const asgResp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [ASG_NAME] }));
      const group = asgResp.AutoScalingGroups?.[0];
      originalInstanceId = group?.Instances?.[0]?.InstanceId;
      expect(originalInstanceId).toBeDefined();

      // Start instance refresh
      const refreshResp = await asg.send(new StartInstanceRefreshCommand({ 
        AutoScalingGroupName: ASG_NAME,
        Preferences: {
          InstanceWarmup: 300,
          MinHealthyPercentage: 0
        }
      }));
      refreshId = refreshResp.InstanceRefreshId;
      expect(refreshId).toBeDefined();

      // Wait for refresh to complete and verify EIP is still associated
      let refreshComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes max

      while (!refreshComplete && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
        attempts++;

        const refreshStatusResp = await asg.send(new DescribeInstanceRefreshesCommand({ 
          AutoScalingGroupName: ASG_NAME,
          InstanceRefreshIds: [refreshId!]
        }));
        
        const refresh = refreshStatusResp.InstanceRefreshes?.[0];
        if (refresh?.Status === 'Successful') {
          refreshComplete = true;
        } else if (refresh?.Status === 'Failed' || refresh?.Status === 'Cancelled') {
          throw new Error(`Instance refresh failed with status: ${refresh.Status}`);
        }
      }

      expect(refreshComplete).toBe(true);

      // Quick wait for EIP association
      let eipAssociated = false;
      let eipRetries = 0;
      const maxEipRetries = 18; // 3 minutes max
      
      while (!eipAssociated && eipRetries < maxEipRetries) {
        await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
        eipRetries++;
        
        const addrResp = await ec2.send(new DescribeAddressesCommand({ PublicIps: [EIP] }));
        const address = addrResp.Addresses?.[0];
        if (address?.InstanceId && address.InstanceId !== originalInstanceId) {
          eipAssociated = true;
          
          // Verify new instance is running
          const instResp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [address.InstanceId] }));
          const state = instResp.Reservations?.[0]?.Instances?.[0]?.State?.Name;
          expect(state).toBe('running');
        }
      }

      expect(eipAssociated).toBe(true);
      
      // Final verification
      const finalAddrResp = await ec2.send(new DescribeAddressesCommand({ PublicIps: [EIP] }));
      const finalAddress = finalAddrResp.Addresses?.[0];
      expect(finalAddress?.InstanceId).toBeDefined();
      expect(finalAddress?.InstanceId).not.toBe(originalInstanceId);
    });
  });
});
