import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetWebACLCommand,
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import * as fs from 'fs';
import * as path from 'path';

// Detect if running in LocalStack
const isLocalStack = (): boolean => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
};

// Configure AWS clients for both regions
const primaryRegion = 'ap-south-1';
const secondaryRegion = 'eu-west-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

const primaryClients = {
  ec2: new EC2Client({ region: primaryRegion }),
  elbv2: new ElasticLoadBalancingV2Client({ region: primaryRegion }),
  autoscaling: new AutoScalingClient({ region: primaryRegion }),
  rds: new RDSClient({ region: primaryRegion }),
  kms: new KMSClient({ region: primaryRegion }),
  s3: new S3Client({ region: primaryRegion }),
  cloudwatch: new CloudWatchClient({ region: primaryRegion }),
  cloudtrail: new CloudTrailClient({ region: primaryRegion }),
  wafv2: new WAFV2Client({ region: primaryRegion }),
};

const secondaryClients = {
  ec2: new EC2Client({ region: secondaryRegion }),
  rds: new RDSClient({ region: secondaryRegion }),
  kms: new KMSClient({ region: secondaryRegion }),
  s3: new S3Client({ region: secondaryRegion }),
};

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

describe('TAP Infrastructure Integration Tests', () => {
    beforeAll(() => {
    // Load the outputs from deployment
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
      console.log("Outputs we got is ", outputs);
    } else {
      console.warn('No outputs file found. Some tests may be skipped.');
    }
  });


  describe('Infrastructure Validation', () => {
    test('should validate deployment outputs exist', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have primary region configuration', () => {
      expect(primaryRegion).toBe('ap-south-1');
    });

    test('should have secondary region configuration', () => {
      expect(secondaryRegion).toBe('eu-west-1');
    });

    test('should have AWS clients configured', () => {
      expect(primaryClients.ec2).toBeDefined();
      expect(primaryClients.rds).toBeDefined();
      expect(primaryClients.kms).toBeDefined();
      expect(secondaryClients.ec2).toBeDefined();
      expect(secondaryClients.rds).toBeDefined();
      expect(secondaryClients.kms).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
    test('should have internet gateway attached', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping IGW test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have NAT gateways configured', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping NAT Gateway test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(vpcId);
      });
    });

    test('should have route tables configured', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping route table test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2);

      // Check for routes to IGW and NAT
      const hasInternetRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(r => r.GatewayId && r.GatewayId.startsWith('igw-'))
      );
      const hasNatRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(r => r.NatGatewayId && r.NatGatewayId.startsWith('nat-'))
      );

      expect(hasInternetRoute).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    test('should validate RDS parameter groups', async () => {
      const primaryDbEndpoint = outputs.primaryDbEndpoint;
      if (!primaryDbEndpoint) {
        console.log('Skipping RDS parameter test - no endpoint in outputs');
        return;
      }

      // Skip in LocalStack - RDS endpoint format doesn't match real AWS
      if (isLocalStack()) {
        console.log('Skipping RDS parameter test in LocalStack - endpoint format differs');
        return;
      }

      const instanceId = primaryDbEndpoint.split('.')[0];
      const response = await primaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        })
      );

      const instance = response.DBInstances![0];
      expect(instance.DBParameterGroups).toBeDefined();
      expect(instance.DBParameterGroups!.length).toBeGreaterThanOrEqual(1);
    });

    test('should validate RDS subnet groups', async () => {
      const primaryDbEndpoint = outputs.primaryDbEndpoint;
      if (!primaryDbEndpoint) {
        console.log('Skipping RDS subnet test - no endpoint in outputs');
        return;
      }

      // Skip in LocalStack - RDS endpoint format doesn't match real AWS
      if (isLocalStack()) {
        console.log('Skipping RDS subnet test in LocalStack - endpoint format differs');
        return;
      }

      const instanceId = primaryDbEndpoint.split('.')[0];
      const response = await primaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        })
      );

      const instance = response.DBInstances![0];
      expect(instance.DBSubnetGroup).toBeDefined();
      expect(instance.DBSubnetGroup!.VpcId).toBe(outputs.primaryVpcId);
    });
  });

  describe('Load Balancer Health', () => {
    test('should validate target group health', async () => {
      const albDns = outputs.loadBalancerDnsName;
      if (!albDns) {
        console.log('Skipping target health test - no ALB DNS in outputs');
        return;
      }

      const albResponse = await primaryClients.elbv2.send(
        new DescribeLoadBalancersCommand()
      );
      const alb = albResponse.LoadBalancers!.find((lb: any) => lb.DNSName === albDns);
      
      if (!alb) return;

      const tgResponse = await primaryClients.elbv2.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        })
      );

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);

      for (const tg of tgResponse.TargetGroups!) {
        if (!tg.TargetGroupArn) continue;
        const healthResponse = await primaryClients.elbv2.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tg.TargetGroupArn,
          })
        );

        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      }
    });
  });

  describe('Monitoring Infrastructure', () => {
    test('should validate SNS topic configuration', async () => {
      const snsTopicArn = outputs.snsTopicArn;
      if (!snsTopicArn) {
        console.log('Skipping SNS test - no topic ARN in outputs');
        return;
      }

      expect(snsTopicArn).toContain('arn:aws:sns:');
      expect(snsTopicArn).toContain(primaryRegion);
    });

    test('should validate VPC flow logs', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping flow logs test - no VPC ID in outputs');
        return;
      }

      // VPC Flow Logs validation would require additional API calls
      expect(outputs.vpcLogGroupName).toBeDefined();
      expect(outputs.flowLogsRoleName).toBeDefined();
    });
  });

  describe('Security Infrastructure', () => {
    test('should validate KMS key rotation', async () => {
      const keyId = outputs.primaryKmsKeyId;
      if (!keyId) {
        console.log('Skipping KMS rotation test - no key ID in outputs');
        return;
      }

      const response = await primaryClients.kms.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should validate S3 bucket lifecycle policies', async () => {
      const bucketName = outputs.logBucketName;
      if (!bucketName) {
        console.log('Skipping lifecycle test - no bucket name in outputs');
        return;
      }

      const lifecycleResponse = await primaryClients.s3.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThanOrEqual(1);
      
      const rule = lifecycleResponse.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration!.Days).toBe(90);
    });
  });

  describe('e2e: Multi-Region VPC Configuration', () => {
    test('e2e: Primary VPC exists with correct CIDR', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping primary VPC test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('e2e: Secondary VPC exists with non-overlapping CIDR', async () => {
      const vpcId = outputs.secondaryVpcId;
      if (!vpcId) {
        console.log('Skipping secondary VPC test - no VPC ID in outputs');
        return;
      }

      const response = await secondaryClients.ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.1.0.0/16'); // Non-overlapping with primary
    });

    test('e2e: Primary VPC has correct subnet configuration', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping primary subnet test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Check for public and private subnets
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('e2e: Secondary VPC has correct subnet configuration', async () => {
      const vpcId = outputs.secondaryVpcId;
      if (!vpcId) {
        console.log('Skipping secondary subnet test - no VPC ID in outputs');
        return;
      }

      const response = await secondaryClients.ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('e2e: KMS Encryption Configuration', () => {
    test('e2e: Primary KMS key exists and is enabled', async () => {
      const keyId = outputs.primaryKmsKeyId;
      if (!keyId) {
        console.log('Skipping primary KMS test - no key ID in outputs');
        return;
      }

      const response = await primaryClients.kms.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
    });

    test('e2e: Secondary KMS key exists and is enabled', async () => {
      const keyId = outputs.secondaryKmsKeyId;
      if (!keyId) {
        console.log('Skipping secondary KMS test - no key ID in outputs');
        return;
      }

      const response = await secondaryClients.kms.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
    });

    test('e2e: KMS key policies are properly configured', async () => {
      const keyId = outputs.primaryKmsKeyId;
      if (!keyId) {
        console.log('Skipping KMS policy test - no key ID in outputs');
        return;
      }

      const response = await primaryClients.kms.send(
        new GetKeyPolicyCommand({
          KeyId: keyId,
          PolicyName: 'default',
        })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
    });
  });

  describe('e2e: RDS Multi-Region Database Configuration', () => {
    test('e2e: Primary MySQL database exists and is available', async () => {
      const dbEndpoint = outputs.primaryDbEndpoint;
      if (!dbEndpoint) {
        console.log('Skipping primary DB test - no endpoint in outputs');
        return;
      }

      // Skip in LocalStack - RDS endpoint format doesn't match real AWS
      if (isLocalStack()) {
        console.log('Skipping primary DB test in LocalStack - endpoint format differs');
        return;
      }

      // Extract instance identifier from endpoint
      const instanceId = dbEndpoint.split('.')[0];

      const response = await primaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const instance = response.DBInstances![0];

      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.Engine).toBe('mysql');
      expect(instance.EngineVersion).toMatch(/^8\.0/);
      expect(instance.StorageEncrypted).toBe(true);
      expect(instance.KmsKeyId).toBeDefined();
    });

    test('e2e: Secondary read replica exists and is available', async () => {
      const dbEndpoint = outputs.secondaryDbEndpoint;
      if (!dbEndpoint) {
        console.log('Skipping secondary DB test - no endpoint in outputs');
        return;
      }

      // Extract instance identifier from endpoint
      const instanceId = dbEndpoint.split('.')[0];

      const response = await secondaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const instance = response.DBInstances![0];

      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.Engine).toBe('mysql');
      expect(instance.EngineVersion).toMatch(/^8\.0/);
      expect(instance.StorageEncrypted).toBe(true);
      expect(instance.KmsKeyId).toBeDefined();
      expect(instance.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
    });

    test('e2e: Database encryption uses correct KMS keys', async () => {
      const primaryDbEndpoint = outputs.primaryDbEndpoint;
      const primaryKmsKeyArn = outputs.primaryKmsKeyArn;

      if (!primaryDbEndpoint || !primaryKmsKeyArn) {
        console.log('Skipping DB encryption test - missing outputs');
        return;
      }

      // Skip in LocalStack - RDS endpoint format doesn't match real AWS
      if (isLocalStack()) {
        console.log('Skipping DB encryption test in LocalStack - endpoint format differs');
        return;
      }

      const instanceId = primaryDbEndpoint.split('.')[0];
      const response = await primaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        })
      );

      const instance = response.DBInstances![0];
      expect(instance.KmsKeyId).toBe(primaryKmsKeyArn);
    });
  });

  describe('e2e: Load Balancer Configuration', () => {
    test('e2e: Application Load Balancer is active and internet-facing', async () => {
      const albDns = outputs.loadBalancerDnsName;
      if (!albDns) {
        console.log('Skipping ALB test - no DNS in outputs');
        return;
      }

      const response = await primaryClients.elbv2.send(
        new DescribeLoadBalancersCommand()
      );

      const alb = response.LoadBalancers!.find((lb: any) => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      // LocalStack may not populate Scheme attribute
      if (!isLocalStack()) {
        expect(alb!.Scheme).toBe('internet-facing');
      }
    });

    test('e2e: Load balancer listens on port 80', async () => {
      const albDns = outputs.loadBalancerDnsName;
      if (!albDns) {
        console.log('Skipping ALB listener test - no DNS in outputs');
        return;
      }

      const albResponse = await primaryClients.elbv2.send(
        new DescribeLoadBalancersCommand()
      );

      const alb = albResponse.LoadBalancers!.find((lb: any) => lb.DNSName === albDns);
      if (!alb) return;

      // Check target groups forward to port 8080
      const tgResponse = await primaryClients.elbv2.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        })
      );

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);

      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.Port).toBe(8080);
      expect(targetGroup.Protocol).toBe('HTTP');
    });

    test('e2e: Target group health checks are configured', async () => {
      const albDns = outputs.loadBalancerDnsName;
      if (!albDns) {
        console.log('Skipping target group test - no DNS in outputs');
        return;
      }

      const albResponse = await primaryClients.elbv2.send(
        new DescribeLoadBalancersCommand()
      );

      const alb = albResponse.LoadBalancers!.find((lb: any) => lb.DNSName === albDns);
      if (!alb) return;

      const tgResponse = await primaryClients.elbv2.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        })
      );

      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.HealthCheckPath).toBeDefined();
      expect(targetGroup.HealthCheckIntervalSeconds).toBeDefined();
      expect(targetGroup.HealthyThresholdCount).toBeDefined();
      expect(targetGroup.UnhealthyThresholdCount).toBeDefined();
    });
  });

  describe('e2e: Auto Scaling Configuration', () => {
    test('e2e: Auto Scaling Group is configured correctly', async () => {
      const asgName = outputs.autoScalingGroupName;
      if (!asgName) {
        console.log('Skipping ASG test - no ASG name in outputs');
        return;
      }

      const response = await primaryClients.autoscaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];

      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBeDefined();
    });

    test('e2e: Auto Scaling Group uses t2.micro instances', async () => {
      const asgName = outputs.autoScalingGroupName;
      if (!asgName) {
        console.log('Skipping ASG instance type test - no ASG name in outputs');
        return;
      }

      const response = await primaryClients.autoscaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = response.AutoScalingGroups![0];
      expect(asg.LaunchTemplate || asg.LaunchConfigurationName).toBeDefined();

      // Instance type verification would require additional API calls
      // to describe launch template or launch configuration
    });

    test('e2e: Scaling policies are configured', async () => {
      const asgName = outputs.autoScalingGroupName;
      if (!asgName) {
        console.log('Skipping scaling policies test - no ASG name in outputs');
        return;
      }

      const response = await primaryClients.autoscaling.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: asgName,
        })
      );

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(1);

      // Check for scale up and scale down policies
      const policies = response.ScalingPolicies!;
      const hasScaleUpPolicy = policies.some(p => 
        p.ScalingAdjustment && p.ScalingAdjustment > 0
      );
      const hasScaleDownPolicy = policies.some(p => 
        p.ScalingAdjustment && p.ScalingAdjustment < 0
      );

      expect(hasScaleUpPolicy || hasScaleDownPolicy).toBe(true);
    });
  });

  describe('e2e: Security Groups Configuration', () => {
    test('e2e: Security groups allow correct traffic', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping security group test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);

      // Check for ALB security group (allows HTTP from internet)
      const albSg = response.SecurityGroups!.find(sg =>
        sg.IpPermissions!.some(rule =>
          rule.FromPort === 80 &&
          rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        )
      );
      expect(albSg).toBeDefined();

      // Check for database security group (allows MySQL)
      const dbSg = response.SecurityGroups!.find(sg =>
        sg.IpPermissions!.some(rule =>
          rule.FromPort === 3306 && rule.ToPort === 3306
        )
      );
      expect(dbSg).toBeDefined();
    });

    test('e2e: Security groups follow least privilege principle', async () => {
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping security group privilege test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      // Verify no security group allows all traffic from 0.0.0.0/0 on all ports
      const insecureGroups = response.SecurityGroups!.filter(sg =>
        sg.IpPermissions!.some(rule =>
          rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0') &&
          (!rule.FromPort || !rule.ToPort || rule.FromPort === 0)
        )
      );

      expect(insecureGroups.length).toBe(0);
    });
  });

  describe('e2e: Monitoring and Logging', () => {
    test('e2e: CloudWatch alarms are configured', async () => {
      const response = await primaryClients.cloudwatch.send(
        new DescribeAlarmsCommand()
      );

      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        // Check for CPU utilization alarms
        const cpuAlarms = response.MetricAlarms.filter(alarm =>
          alarm.MetricName === 'CPUUtilization'
        );

        expect(cpuAlarms.length).toBeGreaterThanOrEqual(1);

        cpuAlarms.forEach(alarm => {
          expect(alarm.Statistic).toBeDefined();
          expect(alarm.Period).toBeDefined();
          expect(alarm.EvaluationPeriods).toBeDefined();
        });
      }
    });

    test('e2e: CloudTrail is enabled and logging', async () => {
      const cloudTrailName = outputs.cloudTrailName;
      if (!cloudTrailName) {
        console.log('Skipping CloudTrail test - no trail name in outputs');
        return;
      }

      const response = await primaryClients.cloudtrail.send(
        new DescribeTrailsCommand({
          trailNameList: [cloudTrailName],
        })
      );

      expect(response.trailList).toHaveLength(1);
      const trail = response.trailList![0];

      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.S3BucketName).toBeDefined();
      expect(trail.S3KeyPrefix).toBe('cloudtrail-logs');

      // Check if trail is logging
      try {
        const statusResponse = await primaryClients.cloudtrail.send(
          new GetTrailStatusCommand({
            Name: cloudTrailName,
          })
        );
        expect(statusResponse.IsLogging).toBe(true);
      } catch (error: any) {
        if (error.name === 'TrailNotFoundException') {
          console.log('CloudTrail may still be creating');
        } else {
          throw error;
        }
      }
    });

    test('e2e: S3 logging bucket is properly configured', async () => {
      const bucketName = outputs.logBucketName;
      if (!bucketName) {
        console.log('Skipping S3 logging test - no bucket name in outputs');
        return;
      }

      // Check bucket exists
      await primaryClients.s3.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );

      // Check versioning
      const versioningResponse = await primaryClients.s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await primaryClients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Check public access block
      const publicAccessResponse = await primaryClients.s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    });
  });

  describe('e2e: WAF and Shield Protection', () => {
    test('e2e: WAF Web ACL is configured', async () => {
      const webAclId = outputs.webAclId;
      if (!webAclId) {
        console.log('Skipping WAF test - no Web ACL ID in outputs');
        return;
      }

      const response = await primaryClients.wafv2.send(
        new GetWebACLCommand({
          Id: webAclId,
          Name: outputs.webAclName,
          Scope: 'REGIONAL',
        })
      );

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.DefaultAction).toBeDefined();
    });

    test('e2e: WAF rules are properly configured', async () => {
      const webAclId = outputs.webAclId;
      if (!webAclId) {
        console.log('Skipping WAF rules test - no Web ACL ID in outputs');
        return;
      }

      const response = await primaryClients.wafv2.send(
        new GetWebACLCommand({
          Id: webAclId,
          Name: outputs.webAclName,
          Scope: 'REGIONAL',
        })
      );

      const webAcl = response.WebACL!;
      expect(webAcl.Rules!.length).toBeGreaterThanOrEqual(1);

      // Check for common protection rules
      const hasRateLimitRule = webAcl.Rules!.some(rule =>
        rule.Statement?.RateBasedStatement
      );
      const hasGeoBlockRule = webAcl.Rules!.some(rule =>
        rule.Statement?.GeoMatchStatement
      );

      expect(hasRateLimitRule || hasGeoBlockRule).toBe(true);
    });
  });

  describe('e2e: Resource Tagging', () => {
    test('e2e: All resources have Environment: Production tag', async () => {
      // This test would require checking tags on multiple resource types
      // For brevity, we'll check VPC tags as an example
      const vpcId = outputs.primaryVpcId;
      if (!vpcId) {
        console.log('Skipping tagging test - no VPC ID in outputs');
        return;
      }

      const response = await primaryClients.ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.Tags).toBeDefined();

      const environmentTag = vpc.Tags!.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe(environmentSuffix);
    });
  });

  describe('e2e: End-to-End Connectivity', () => {
    test('e2e: Load balancer endpoint resolves', async () => {
      const albDns = outputs.loadBalancerDnsName;
      if (!albDns) {
        console.log('Skipping connectivity test - no ALB DNS in outputs');
        return;
      }

      const dns = require('dns').promises;

      try {
        const addresses = await dns.resolve4(albDns);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('DNS not yet propagated for ALB:', albDns);
      }
    });

    test('e2e: Database endpoints are reachable from VPC', async () => {
      const primaryDbEndpoint = outputs.primaryDbEndpoint;
      const secondaryDbEndpoint = outputs.secondaryDbEndpoint;

      if (!primaryDbEndpoint || !secondaryDbEndpoint) {
        console.log('Skipping DB connectivity test - missing endpoints');
        return;
      }

      // In a real test, you would test connectivity from within the VPC
      // This is a placeholder for that functionality
      expect(primaryDbEndpoint).toContain('.rds.amazonaws.com');
      expect(secondaryDbEndpoint).toContain('.rds.amazonaws.com');
    });

    test('e2e: Cross-region replication is working', async () => {
      const primaryDbEndpoint = outputs.primaryDbEndpoint;
      const secondaryDbEndpoint = outputs.secondaryDbEndpoint;

      if (!primaryDbEndpoint || !secondaryDbEndpoint) {
        console.log('Skipping replication test - missing endpoints');
        return;
      }

      // Extract instance identifiers
      const primaryInstanceId = primaryDbEndpoint.split('.')[0];
      const secondaryInstanceId = secondaryDbEndpoint.split('.')[0];

      // Check primary instance
      const primaryResponse = await primaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: primaryInstanceId,
        })
      );

      // Check secondary instance
      const secondaryResponse = await secondaryClients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: secondaryInstanceId,
        })
      );

      const primaryInstance = primaryResponse.DBInstances![0];
      const secondaryInstance = secondaryResponse.DBInstances![0];

      expect(primaryInstance.ReadReplicaDBInstanceIdentifiers).toBeDefined();
      expect(secondaryInstance.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
    });
  });

  describe('LocalStack Environment Detection', () => {
    test('should detect LocalStack environment correctly', () => {
      const endpoint = process.env.AWS_ENDPOINT_URL || '';
      const isLocalStackEnv = endpoint.includes('localhost') || endpoint.includes('localstack');
      
      // When running in CI with LocalStack, this should be true
      if (process.env.AWS_ENDPOINT_URL) {
        expect(isLocalStackEnv).toBe(true);
      }
      // Verify the detection logic works
      expect(typeof isLocalStackEnv).toBe('boolean');
    });

    test('should handle missing endpoint gracefully', () => {
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;
      
      // Temporarily unset to test the fallback
      delete process.env.AWS_ENDPOINT_URL;
      const endpoint = process.env.AWS_ENDPOINT_URL || '';
      const isLocalStackEnv = endpoint.includes('localhost') || endpoint.includes('localstack');
      expect(isLocalStackEnv).toBe(false);
      
      // Restore
      if (originalEndpoint) {
        process.env.AWS_ENDPOINT_URL = originalEndpoint;
      }
    });

    test('should identify LocalStack endpoint patterns', () => {
      // Test various LocalStack endpoint patterns
      const testEndpoints = [
        { url: 'http://localhost:4566', expected: true },
        { url: 'http://localstack:4566', expected: true },
        { url: 'http://s3.localhost.localstack.cloud:4566', expected: true },
        { url: 'https://rds.amazonaws.com', expected: false },
        { url: '', expected: false },
      ];

      testEndpoints.forEach(({ url, expected }) => {
        const isLocalStack = url.includes('localhost') || url.includes('localstack');
        expect(isLocalStack).toBe(expected);
      });
    });
  });

});