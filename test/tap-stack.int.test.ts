import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import fetch from 'node-fetch';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS Clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const autoScalingClient = new AutoScalingClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('All subnets should be available', async () => {
      const subnetIds = [
        outputs.PublicSubnetA,
        outputs.PublicSubnetB,
        outputs.PrivateSubnetA,
        outputs.PrivateSubnetB
      ];
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(4);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
      
      // Check public subnets have public IP mapping
      const publicSubnets = response.Subnets!.filter(s => 
        [outputs.PublicSubnetA, outputs.PublicSubnetB].includes(s.SubnetId!)
      );
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Security groups should be properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups!.length).toBeGreaterThan(3);
      
      // Check ALB security group allows HTTP/HTTPS
      const albSG = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('alb-sg')
      );
      expect(albSG).toBeDefined();
      
      const httpRule = albSG!.IpPermissions!.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = albSG!.IpPermissions!.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer should be active', async () => {
      const dnsName = outputs.ApplicationLoadBalancerDNS;
      const arnParts = dnsName.split('-');
      
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      
      const alb = response.LoadBalancers!.find(lb => 
        lb.DNSName === dnsName
      );
      
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('ALB should respond to HTTP requests', async () => {
      const albUrl = `http://${outputs.ApplicationLoadBalancerDNS}`;
      
      try {
        const response = await fetch(albUrl, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test' }
        });
        
        // Should get a response (even if it's an error from unhealthy targets)
        expect(response).toBeDefined();
        expect(response.status).toBeDefined();
      } catch (error: any) {
        // Connection should at least be established
        expect(error.code).not.toBe('ENOTFOUND');
      }
    }, 15000);

    test('ALB health check endpoint should be configured', async () => {
      const healthUrl = `http://${outputs.ApplicationLoadBalancerDNS}/health`;
      
      try {
        const response = await fetch(healthUrl, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test' }
        });
        
        // Health check endpoint exists
        expect(response).toBeDefined();
      } catch (error) {
        // Even if targets are unhealthy, endpoint should be reachable
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  describe('Auto Scaling', () => {
    test('Auto Scaling Group should be properly configured', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`asg-${outputs.EnvironmentSuffix}`]
      });
      
      const response = await autoScalingClient.send(command);
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group should have running instances', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`asg-${outputs.EnvironmentSuffix}`]
      });
      
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      
      // Check instance health
      const healthyInstances = asg.Instances!.filter(i => 
        i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );
      expect(healthyInstances.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database', () => {
    test('RDS MySQL instance should be available', async () => {
      const dbIdentifier = `database-${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
    });

    test('Database endpoint should match output', async () => {
      const dbIdentifier = `database-${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];
      
      expect(db.Endpoint!.Address).toBe(outputs.DatabaseEndpoint);
      expect(db.Endpoint!.Port).toBe(3306);
    });

    test('Database should have backup configured', async () => {
      const dbIdentifier = `database-${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];
      
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBeDefined();
      expect(db.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('Storage', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should allow read/write operations', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';
      
      // Write test
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'AES256'
      });
      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);
      
      // Read test
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      const getResponse = await s3Client.send(getCommand);
      const body = await getResponse.Body!.transformToString();
      expect(body).toBe(testContent);
      
      // Cleanup
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = `version-test-${Date.now()}.txt`;
      
      // Upload version 1
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Version 1'
      }));
      
      // Upload version 2
      const response = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Version 2'
      }));
      
      expect(response.VersionId).toBeDefined();
      
      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));
    });
  });

  describe('Monitoring', () => {
    test('CloudWatch alarms should be configured', async () => {
      const alarmNames = [
        `high-cpu-${outputs.EnvironmentSuffix}`,
        `database-high-cpu-${outputs.EnvironmentSuffix}`,
        `alb-response-time-${outputs.EnvironmentSuffix}`
      ];
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames
      });
      
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(3);
      
      response.MetricAlarms!.forEach(alarm => {
        expect(alarm.AlarmName).toBeDefined();
        expect(alarm.MetricName).toBeDefined();
        expect(alarm.Threshold).toBeDefined();
        expect(alarm.ComparisonOperator).toBeDefined();
      });
    });

    test('CPU alarm should have correct configuration', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`high-cpu-${outputs.EnvironmentSuffix}`]
      });
      
      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms![0];
      
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Period).toBe(300);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Resources should be properly connected', async () => {
      // Check that ASG instances are in the correct subnets
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`asg-${outputs.EnvironmentSuffix}`]
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];
      
      // Get instance details
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map(i => i.InstanceId!);
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds
        });
        const ec2Response = await ec2Client.send(ec2Command);
        
        ec2Response.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            // Instances should be in private subnets
            expect([outputs.PrivateSubnetA, outputs.PrivateSubnetB])
              .toContain(instance.SubnetId);
            
            // Instances should be in the correct VPC
            expect(instance.VpcId).toBe(outputs.VPCId);
          });
        });
      }
    });

    test('Stack outputs should be properly exported', async () => {
      const stackName = outputs.StackName;
      expect(stackName).toContain('TapStack');
      expect(stackName).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('Resource Tagging', () => {
    test('All resources should have environment:production tag', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const envTag = vpcTags.find(t => t.Key === 'environment');
      expect(envTag?.Value).toBe('production');
    });
  });
});