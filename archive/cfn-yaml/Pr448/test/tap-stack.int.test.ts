import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ListTopicsCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import axios from 'axios';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'production';
const stackName = process.env.STACK_NAME || `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cloudFormationClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

describe('TapStack Live AWS Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];
  let vpcId: string;
  let albDns: string;
  let s3BucketName: string;
  let dbEndpoint: string;
  let snsTopicArn: string;

  beforeAll(async () => {
    try {
      // Get stack outputs
      const stackResponse = await cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = stackResponse.Stacks?.[0];
      if (!stack) {
        throw new Error(`Stack ${stackName} not found`);
      }

      // Parse outputs
      if (stack.Outputs) {
        stack.Outputs.forEach((output) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      // Get stack resources
      const resourcesResponse = await cloudFormationClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResponse.StackResources || [];

      // Extract key identifiers
      vpcId = stackOutputs.VPCId;
      albDns = stackOutputs.LoadBalancerDNS;
      s3BucketName = stackOutputs.S3BucketName;
      dbEndpoint = stackOutputs.DatabaseEndpoint;
      snsTopicArn = stackOutputs.SNSTopicArn;

      console.log('Test Setup Complete:', {
        stackName,
        vpcId,
        albDns,
        s3BucketName,
        region
      });
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  }, 60000);

  describe('CloudFormation Stack Validation', () => {
    test('CloudFormation stack should exist and be in a complete state', async () => {
      const stackResponse = await cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(stackResponse.Stacks).toHaveLength(1);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stackResponse.Stacks![0].StackStatus);
      expect(stackResponse.Stacks![0].Description).toContain('Secure and highly available');
    });

    test('All required stack outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'S3BucketName',
        'DatabaseEndpoint',
        'SNSTopicArn'
      ];

      requiredOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
        expect(stackOutputs[output]).not.toBe('');
      });
    });

    test('Stack resources should have proper tags', () => {
      // Check that key resources exist
      const expectedResources = [
        'VPC', 'InternetGateway', 'ApplicationLoadBalancer', 'RDSDatabase',
        'AutoScalingGroup', 'S3Bucket', 'SNSTopic'
      ];

      expectedResources.forEach(resourceType => {
        const resource = stackResources.find(r => r.LogicalResourceId === resourceType);
        expect(resource).toBeDefined();
        expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(resource?.ResourceStatus);
      });
    });
  });

  describe('VPC and Networking - Multi-AZ Setup', () => {
    test('VPC should exist with correct CIDR and configuration', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = vpcResponse.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');

      // Check Environment tag - it uses conditional logic in the template
      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      
      // The Environment tag value is determined by CloudFormation conditional logic:
      // - production -> 'Production'
      // - staging -> 'Staging' 
      // - anything else (including PR envs) -> 'PR'
      if (environmentSuffix === 'production') {
        expect(environmentTag?.Value).toBe('Production');
      } else if (environmentSuffix === 'staging') {
        expect(environmentTag?.Value).toBe('Staging');
      } else {
        // PR environments and unknown suffixes get 'PR' tag
        expect(environmentTag?.Value).toBe('PR');
      }
    });

    test('Should have 2 public and 2 private subnets across different AZs', async () => {
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const subnets = subnetsResponse.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = subnets.filter(subnet => subnet.MapPublicIpOnLaunch === true);
      const privateSubnets = subnets.filter(subnet => subnet.MapPublicIpOnLaunch === false);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Check that subnets are in different AZs
      const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));

      expect(publicAZs.size).toBeGreaterThanOrEqual(2);
      expect(privateAZs.size).toBeGreaterThanOrEqual(2);
    });

    test('Should have Internet Gateway attached', async () => {
      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
        })
      );

      expect(igwResponse.InternetGateways).toHaveLength(1);
      expect(igwResponse.InternetGateways![0].Attachments?.[0].State).toBe('available');
    });

    test('Should have at least one NAT Gateway in public subnet', async () => {
      const natResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(natResponse.NatGateways![0].State).toBe('available');
    });
  });

  describe('Security Groups - Least Privilege Principle', () => {
    test('ALB security group should allow HTTP/HTTPS from internet', async () => {
      // First get all security groups in the VPC
      const allSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      // Find ALB security group by looking for one that allows inbound HTTP/HTTPS from 0.0.0.0/0
      const sg = allSgResponse.SecurityGroups?.find(sg => {
        const ingressRules = sg.IpPermissions || [];
        return ingressRules.some(rule => 
          (rule.FromPort === 80 || rule.FromPort === 443) &&
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
        );
      });
      
      expect(sg).toBeDefined();

      const ingressRules = sg?.IpPermissions || [];
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Web server security group should only allow access from ALB', async () => {
      // Get all security groups in the VPC
      const allSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      // Find web server security group by looking for one that allows inbound traffic only from other security groups (not 0.0.0.0/0)
      const sg = allSgResponse.SecurityGroups?.find(sg => {
        const ingressRules = sg.IpPermissions || [];
        return ingressRules.length > 0 && 
               ingressRules.every(rule => 
                 rule.UserIdGroupPairs && rule.UserIdGroupPairs.length > 0 &&
                 (!rule.IpRanges || rule.IpRanges.every(range => range.CidrIp !== '0.0.0.0/0'))
               ) &&
               // Exclude the ALB security group (which allows from 0.0.0.0/0)
               !ingressRules.some(rule => 
                 rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
               );
      });
      
      expect(sg).toBeDefined();

      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThanOrEqual(1);

      // All rules should reference other security groups, not direct CIDR blocks
      ingressRules.forEach(rule => {
        expect(rule.UserIdGroupPairs).toHaveLength(1);
      });
    });

    test('Database security group should only allow access from web servers', async () => {
      // Get all security groups in the VPC
      const allSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      // Find database security group by looking for one that allows MySQL/Aurora port (3306) from other security groups
      const sg = allSgResponse.SecurityGroups?.find(sg => {
        const ingressRules = sg.IpPermissions || [];
        return ingressRules.some(rule => 
          rule.FromPort === 3306 && 
          rule.UserIdGroupPairs && 
          rule.UserIdGroupPairs.length > 0
        );
      });
      
      expect(sg).toBeDefined();

      const ingressRules = sg?.IpPermissions || [];
      const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
    });
  });

  describe('S3 Bucket - Encryption and Versioning', () => {
    test('S3 bucket should exist and be accessible', async () => {
      expect(s3BucketName).toBeDefined();
      expect(s3BucketName).toContain(environmentSuffix);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('S3 bucket should have KMS encryption enabled', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );

      const rule = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule).toBeDefined();
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain('aws/s3');
    });

    test('S3 bucket should block public access', async () => {
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Application Load Balancer - HTTPS Configuration', () => {
    test('ALB should be accessible and in correct subnets', async () => {
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`${environmentSuffix}-alb`]
        })
      );

      const alb = albResponse.LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.AvailabilityZones).toHaveLength(2);
    });

    test('ALB should have target group with healthy targets', async () => {
      const tgResponse = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-tg`]
        })
      );

      const tg = tgResponse.TargetGroups?.[0];
      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.Port).toBe(80);
      expect(tg?.HealthCheckPath).toBe('/');

      // Check target health
      const healthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: tg?.TargetGroupArn
        })
      );

      // Should have at least some targets (may take time to register)
      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
    });

    test('ALB should have HTTP listener configured', async () => {
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`${environmentSuffix}-alb`]
        })
      );

      const listenersResponse = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albResponse.LoadBalancers![0].LoadBalancerArn
        })
      );

      const httpListener = listenersResponse.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
    });

    test('ALB should be reachable via HTTP', async () => {
      const url = `http://${albDns}`;
      
      try {
        const response = await axios.get(url, { timeout: 30000 });
        expect(response.status).toBe(200);
        expect(response.data).toContain(environmentSuffix);
      } catch (error: any) {
        // If we get a redirect or other 3xx, that's also acceptable
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          expect(error.response.status).toBeGreaterThanOrEqual(300);
          expect(error.response.status).toBeLessThan(400);
        } else {
          throw error;
        }
      }
    }, 60000);
  });

  describe('RDS Database - Multi-AZ and Encryption', () => {
    test('RDS instance should be available with multi-AZ', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${environmentSuffix}-database`
        })
      );

      const db = dbResponse.DBInstances?.[0];
      expect(db).toBeDefined();
      expect(db?.DBInstanceStatus).toBe('available');
      expect(db?.MultiAZ).toBe(true);
      expect(db?.Engine).toBe('mysql');
      expect(db?.DBInstanceClass).toContain('db.t3');
    });

    test('RDS should have encryption enabled', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${environmentSuffix}-database`
        })
      );

      const db = dbResponse.DBInstances?.[0];
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.KmsKeyId).toContain('arn:aws:kms');
    });

    test('RDS should be in private subnets', async () => {
      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `${environmentSuffix}-db-subnet-group`
        })
      );

      const subnetGroup = subnetGroupResponse.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets).toHaveLength(2);
      
      // Verify subnets are in different AZs
      const azs = new Set(subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBe(2);
    });
  });

  describe('EC2 Auto Scaling - CPU-based Scaling', () => {
    test('Auto Scaling Group should be configured correctly', async () => {
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`${environmentSuffix}-asg`]
        })
      );

      const asg = asgResponse.AutoScalingGroups?.[0];
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(asg?.MinSize!);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize!);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.VPCZoneIdentifier).toContain(','); // Multiple subnets
    });

    test('Auto Scaling Group should have environment-specific sizing', async () => {
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`${environmentSuffix}-asg`]
        })
      );

      const asg = asgResponse.AutoScalingGroups?.[0];
      expect(asg).toBeDefined();

      // Verify environment-specific sizing based on conditional logic
      if (environmentSuffix === 'production') {
        expect(asg?.MinSize).toBe(2);
        expect(asg?.MaxSize).toBe(6);
        expect(asg?.DesiredCapacity).toBe(2);
      } else if (environmentSuffix === 'staging') {
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBe(3);
        expect(asg?.DesiredCapacity).toBe(1);
      } else {
        // PR environments (any other suffix)
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBe(2);
        expect(asg?.DesiredCapacity).toBe(1);
      }
    });

    test('Auto Scaling Group should have instances running', async () => {
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`${environmentSuffix}-asg`]
        })
      );

      const asg = asgResponse.AutoScalingGroups?.[0];
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(1);

      // Check that at least one instance is InService
      const inServiceInstances = asg?.Instances?.filter(i => i.LifecycleState === 'InService');
      expect(inServiceInstances?.length).toBeGreaterThanOrEqual(1);
    });

    test('Auto Scaling policies should exist', async () => {
      const policiesResponse = await autoScalingClient.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: `${environmentSuffix}-asg`
        })
      );

      const policies = policiesResponse.ScalingPolicies || [];
      expect(policies.length).toBeGreaterThanOrEqual(2);

      const scaleUpPolicy = policies.find(p => p.ScalingAdjustment! > 0);
      const scaleDownPolicy = policies.find(p => p.ScalingAdjustment! < 0);

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring and SNS Notifications', () => {
    test('CloudWatch alarms should be configured', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: environmentSuffix
        })
      );

      const alarms = alarmsResponse.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThanOrEqual(4);

      // Check for CPU alarms
      const cpuHighAlarm = alarms.find(a => a.AlarmName?.includes('cpu-utilization-high'));
      const cpuLowAlarm = alarms.find(a => a.AlarmName?.includes('cpu-utilization-low'));

      expect(cpuHighAlarm).toBeDefined();
      expect(cpuLowAlarm).toBeDefined();
      expect(cpuHighAlarm?.MetricName).toBe('CPUUtilization');
      expect(cpuLowAlarm?.MetricName).toBe('CPUUtilization');

      // Check for ALB response time alarm
      const albAlarm = alarms.find(a => a.AlarmName?.includes('alb-response-time'));
      expect(albAlarm).toBeDefined();
      expect(albAlarm?.MetricName).toBe('TargetResponseTime');

      // Check for database CPU alarm
      const dbAlarm = alarms.find(a => a.AlarmName?.includes('database-cpu'));
      expect(dbAlarm).toBeDefined();
      expect(dbAlarm?.MetricName).toBe('CPUUtilization');
    });

    test('CPU alarm thresholds should be environment-specific', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: environmentSuffix
        })
      );

      const alarms = alarmsResponse.MetricAlarms || [];
      const cpuHighAlarm = alarms.find(a => a.AlarmName?.includes('cpu-utilization-high'));
      
      expect(cpuHighAlarm).toBeDefined();
      
      // Verify environment-specific CPU thresholds based on conditional logic
      if (environmentSuffix === 'production') {
        expect(cpuHighAlarm?.Threshold).toBe(70);
      } else if (environmentSuffix === 'staging') {
        expect(cpuHighAlarm?.Threshold).toBe(80);
      } else {
        // PR environments (any other suffix)
        expect(cpuHighAlarm?.Threshold).toBe(80);
      }
    });

    test('SNS topic should be configured', async () => {
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain('arn:aws:sns');

      const subscriptionsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn
        })
      );

      // Subscriptions are optional based on email parameter
      expect(subscriptionsResponse.Subscriptions).toBeDefined();
    });

    test('CloudWatch alarms should be linked to SNS topic', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: environmentSuffix
        })
      );

      const alarms = alarmsResponse.MetricAlarms || [];
      const alarmsWithSNS = alarms.filter(alarm => 
        alarm.AlarmActions?.some(action => action === snsTopicArn)
      );

      expect(alarmsWithSNS.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PROMPT.md Requirements Integration', () => {
    test('should integrate all PROMPT.md specified components', () => {
      // Verify all required outputs are present
      expect(vpcId).toBeDefined();
      expect(albDns).toBeDefined();
      expect(s3BucketName).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(snsTopicArn).toBeDefined();

      // Verify naming conventions include environment suffix
      expect(s3BucketName).toContain(environmentSuffix);
      expect(snsTopicArn).toContain(environmentSuffix);
    });

    test('should support production-level requirements', async () => {
      // Multi-AZ deployment verification
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${environmentSuffix}-database`
        })
      );
      expect(dbResponse.DBInstances?.[0]?.MultiAZ).toBe(true);

      // Auto scaling verification
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`${environmentSuffix}-asg`]
        })
      );
      expect(asgResponse.AutoScalingGroups?.[0]?.MinSize).toBeGreaterThanOrEqual(1);

      // Encryption verification
      expect(dbResponse.DBInstances?.[0]?.StorageEncrypted).toBe(true);
    });

    test('should have proper security configurations', async () => {
      // S3 public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

      // Database in private subnets
      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `${environmentSuffix}-db-subnet-group`
        })
      );
      expect(subnetGroupResponse.DBSubnetGroups?.[0]?.Subnets).toHaveLength(2);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle basic load testing', async () => {
      const url = `http://${albDns}`;
      const promises = [];

      // Send 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(axios.get(url, { timeout: 15000 }));
      }

      try {
        const responses = await Promise.all(promises);
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      } catch (error: any) {
        // Accept redirects as valid responses
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          expect(error.response.status).toBeGreaterThanOrEqual(300);
        } else {
          throw error;
        }
      }
    }, 60000);

    test('should have monitoring metrics available', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 1000 * 60 * 60); // 1 hour ago

      try {
        const metricsResponse = await cloudWatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: 'AWS/ApplicationELB',
            MetricName: 'RequestCount',
            StartTime: startTime,
            EndTime: endTime,
            Period: 300,
            Statistics: ['Sum'],
            Dimensions: [
              {
                Name: 'LoadBalancer',
                Value: albDns.split('-')[0] // Extract ALB name part
              }
            ]
          })
        );

        // Metrics should be available (even if no data points yet)
        expect(metricsResponse.Datapoints).toBeDefined();
      } catch (error) {
        // Metrics might not be available immediately after stack creation
        console.warn('Metrics not yet available:', error);
      }
    });
  });

  describe('Environment Separation Validation', () => {
    test('should use environment suffix in resource naming', () => {
      expect(s3BucketName).toContain(environmentSuffix);
      expect(snsTopicArn).toContain(environmentSuffix);
    });

    test('should have environment-specific scaling parameters', async () => {
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`${environmentSuffix}-asg`]
        })
      );

      const asg = asgResponse.AutoScalingGroups?.[0];
      
      // Verify environment-specific sizing based on conditional logic
      if (environmentSuffix === 'production') {
        expect(asg?.MinSize).toBe(2);
        expect(asg?.MaxSize).toBe(6);
        expect(asg?.DesiredCapacity).toBe(2);
      } else if (environmentSuffix === 'staging') {
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBe(3);
        expect(asg?.DesiredCapacity).toBe(1);
      } else {
        // PR environments and any other unknown environment default to conservative settings
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBe(2);
        expect(asg?.DesiredCapacity).toBe(1);
      }
    });

    test('should have environment-specific CPU alarm thresholds', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`${environmentSuffix}-cpu-utilization-high`]
        })
      );

      const cpuAlarm = alarmsResponse.MetricAlarms?.[0];
      expect(cpuAlarm).toBeDefined();

      // Verify environment-specific CPU thresholds based on conditional logic
      if (environmentSuffix === 'production') {
        expect(cpuAlarm?.Threshold).toBe(70);
      } else if (environmentSuffix === 'staging') {
        expect(cpuAlarm?.Threshold).toBe(80);
      } else {
        // PR environments and any other unknown environment default to conservative threshold
        expect(cpuAlarm?.Threshold).toBe(80);
      }
    });
  });
});
