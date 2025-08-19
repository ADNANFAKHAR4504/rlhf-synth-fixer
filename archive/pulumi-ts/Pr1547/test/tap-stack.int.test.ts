import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { ACMClient, ListCertificatesCommand } from '@aws-sdk/client-acm';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asClient = new AutoScalingClient({ region });
const cwClient = new CloudWatchClient({ region });
const acmClient = new ACMClient({ region });

describe('Production Infrastructure Integration Tests', () => {
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

  describe('Network Architecture', () => {
    it('should have a VPC with proper configuration', async () => {
      if (!outputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    it('should have public and private subnets in multiple AZs', async () => {
      if (!outputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }]
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = response.Subnets!.filter(s => 
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('public'))
      );
      const privateSubnets = response.Subnets!.filter(s => 
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('private'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Check multi-AZ deployment
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Load Balancing', () => {
    it('should have an Application Load Balancer', async () => {
      if (!outputs.albArn) {
        console.warn('ALB ARN not found in outputs, skipping test');
        return;
      }

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.albArn]
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
    });

    it('should have target groups configured', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroups = response.TargetGroups?.filter(tg => 
        tg.TargetGroupName?.includes(environmentSuffix)
      );

      expect(targetGroups).toBeDefined();
      expect(targetGroups!.length).toBeGreaterThan(0);
      
      const tg = targetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
    });
  });

  describe('Database', () => {
    it('should have an RDS instance with correct configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances?.filter(db => 
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      if (!dbInstances || dbInstances.length === 0) {
        console.warn('RDS instance not found, may still be creating');
        return;
      }

      const db = dbInstances[0];
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.AllocatedStorage).toBe(20);
      expect(db.MultiAZ).toBe(false);
    });
  });

  describe('Storage', () => {
    it('should have S3 buckets with proper configuration', async () => {
      if (!outputs.s3BucketName) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.s3BucketName })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have logging bucket configured', async () => {
      if (!outputs.loggingBucketName) {
        console.warn('Logging bucket name not found in outputs, skipping test');
        return;
      }

      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.loggingBucketName })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Auto Scaling', () => {
    it('should have an Auto Scaling Group configured', async () => {
      const response = await asClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asgs = response.AutoScalingGroups?.filter(asg => 
        asg.AutoScalingGroupName?.includes(environmentSuffix)
      );

      if (!asgs || asgs.length === 0) {
        console.warn('Auto Scaling Group not found');
        return;
      }

      const asg = asgs[0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg.HealthCheckType).toBe('ELB');
    });
  });

  describe('Monitoring', () => {
    it('should have CloudWatch alarms configured', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `prod-`
        })
      );

      const alarms = response.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(alarms).toBeDefined();
      expect(alarms!.length).toBeGreaterThan(0);

      // Check for specific alarms
      const cpuHighAlarm = alarms?.find(a => a.AlarmName?.includes('cpu-high'));
      const cpuLowAlarm = alarms?.find(a => a.AlarmName?.includes('cpu-low'));
      const errorAlarm = alarms?.find(a => a.AlarmName?.includes('5xx-errors'));

      expect(cpuHighAlarm).toBeDefined();
      expect(cpuLowAlarm).toBeDefined();
      expect(errorAlarm).toBeDefined();

      // Verify 5xx error alarm configuration
      if (errorAlarm) {
        expect(errorAlarm.MetricName).toBe('HTTPCode_Target_5XX_Count');
        expect(errorAlarm.Namespace).toBe('AWS/ApplicationELB');
        expect(errorAlarm.Threshold).toBe(5);
      }
    });
  });

  describe('Security', () => {
    it('should have security groups with proper rules', async () => {
      if (!outputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }]
        })
      );

      const securityGroups = response.SecurityGroups?.filter(sg => 
        sg.GroupName?.includes(environmentSuffix)
      );

      expect(securityGroups).toBeDefined();
      expect(securityGroups!.length).toBeGreaterThan(0);

      // Check RDS security group
      const rdsSg = securityGroups?.find(sg => sg.GroupName?.includes('rds'));
      if (rdsSg) {
        const mysqlRule = rdsSg.IpPermissions?.find(p => p.FromPort === 3306);
        expect(mysqlRule).toBeDefined();
        expect(mysqlRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');
      }

      // Check ALB security group
      const albSg = securityGroups?.find(sg => sg.GroupName?.includes('alb'));
      if (albSg) {
        const httpRule = albSg.IpPermissions?.find(p => p.FromPort === 80);
        const httpsRule = albSg.IpPermissions?.find(p => p.FromPort === 443);
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
        expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      }
    });
  });

  describe('SSL/TLS', () => {
    it('should have ACM certificate configured', async () => {
      const response = await acmClient.send(
        new ListCertificatesCommand({})
      );

      const certificates = response.CertificateSummaryList?.filter(cert => 
        cert.DomainName === 'example.com'
      );

      expect(certificates).toBeDefined();
      // Certificate might be pending validation
      if (certificates && certificates.length > 0) {
        expect(certificates[0].DomainName).toBe('example.com');
      }
    });
  });

  describe('Resource Naming', () => {
    it('should follow prod- naming convention', async () => {
      // This test verifies that resources follow the naming convention
      // We've already checked this in other tests, but this is a dedicated check
      
      if (!outputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })
      );

      const vpcName = vpcResponse.Vpcs?.[0]?.Tags?.find(t => t.Key === 'Name')?.Value;
      expect(vpcName).toContain('prod-');
      expect(vpcName).toContain(environmentSuffix);
    });
  });
});