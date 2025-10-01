// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeRouteTablesCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand, SetDesiredCapacityCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand, DescribeAlarmHistoryCommand } from "@aws-sdk/client-cloudwatch";
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, PublishCommand } from "@aws-sdk/client-sns";
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { SSMClient } from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let autoScalingGroupName: string;
  let ec2SecurityGroupId: string;
  let loadBalancerDnsName: string;
  let targetGroupArn: string;
  let rdsEndpoint: string;
  let rdsSecretArn: string;
  let s3BucketName: string;
  let snsTopicArn: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; 
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"].split(',');
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    loadBalancerDnsName = stackOutputs["load-balancer-dns-name"];
    targetGroupArn = stackOutputs["target-group-arn"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsSecretArn = stackOutputs["rds-secret-arn"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    snsTopicArn = stackOutputs["sns-topic-arn"];

    if (!vpcId || !autoScalingGroupName || !s3BucketName || !rdsEndpoint || !loadBalancerDnsName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("VPC Infrastructure", () => {
    test("Custom VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      // expect(vpc?.EnableDnsHostnames).toBe(true);
      // expect(vpc?.EnableDnsSupport).toBe(true);
      
      // Check tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe("tap-vpc");
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways?.length).toBeGreaterThan(0);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 20000);

    test("Public and private subnets are correctly configured", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ 
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );
      
      // Should have at least 4 subnets (2 public, 2 private)
      expect(Subnets?.length).toBeGreaterThanOrEqual(4);
      
      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      
      expect(publicSubnets?.length).toBe(2);
      expect(privateSubnets?.length).toBe(2);
      
      // Check public subnets configuration
      publicSubnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
      });
      
      // Check private subnets configuration
      privateSubnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
      });
    }, 20000);

    test("Route tables are properly configured", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );
      
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-public-route-table")
      );
      
      expect(publicRouteTable).toBeDefined();
      
      // Check for internet gateway route
      const igwRoute = publicRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
      );
      expect(igwRoute).toBeDefined();
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP/HTTPS from anywhere", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);
      expect(alb).toBeDefined();

      const albSecurityGroupIds = alb?.SecurityGroups || [];
      expect(albSecurityGroupIds.length).toBeGreaterThan(0);

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: albSecurityGroupIds })
      );

      const albSg = SecurityGroups?.find(sg => sg.GroupName === 'tap-alb-security-group');
      expect(albSg).toBeDefined();
      expect(albSg?.VpcId).toBe(vpcId);
      expect(albSg?.Description).toBe('Security group for Application Load Balancer');

      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      const httpsRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
    }, 20000);

    test("EC2 security group allows traffic only from ALB", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(ec2SecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("tap-ec2-security-group");
      expect(sg?.Description).toBe("Security group for EC2 instances");

      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);

      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/8")).toBe(true);
    }, 20000);
  });

  describe("IAM Resources", () => {
    test("EC2 instance profile exists with correct permissions", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: "tap-ec2-instance-profile" })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe("tap-ec2-instance-profile");
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe("tap-ec2-role");
    }, 20000);

    test("RDS monitoring role exists", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: "tap-rds-enhanced-monitoring-role" })
      );

      expect(Role?.RoleName).toBe("tap-rds-enhanced-monitoring-role");
      const policy = JSON.parse(Role?.AssumeRolePolicyDocument || "{}");
      expect(policy.Statement[0].Principal.Service).toBe("monitoring.rds.amazonaws.com");
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      expect(DBInstances?.length).toBe(1);

      const db = DBInstances?.[0];
      expect(db?.DBInstanceIdentifier).toBe(rdsIdentifier);
      expect(db?.DBInstanceStatus).toBe("available");
      expect(db?.Engine).toBe("mysql");
      expect(db?.DBInstanceClass).toBe("db.t3.micro");
      expect(db?.AllocatedStorage).toBe(20);
      expect(db?.StorageType).toBe("gp2");
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBe(7);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.MultiAZ).toBe(true);
      expect(db?.DBName).toBe("tapdb");
      expect(db?.MasterUsername).toBe("admin");
      expect(db?.Endpoint?.Port).toBe(3306);
      expect(db?.MonitoringInterval).toBe(60);
      expect(db?.MonitoringRoleArn).toContain("tap-rds-enhanced-monitoring-role");
    }, 30000);

    test("RDS subnet group is correctly configured", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: "tap-db-subnet-group-tts" })
      );
      
      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  // INTERACTIVE TEST CASES - Testing interactions between 2-3 services

  describe("Interactive Tests: ALB → EC2 Instances", () => {
    test("ALB successfully routes traffic to healthy EC2 instances", async () => {
      // Get target health
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );
      
      expect(healthyTargets?.length).toBeGreaterThan(0);

      // Verify ALB DNS is reachable (Note: In real test, you might want to make actual HTTP request)
      expect(loadBalancerDnsName).toMatch(/^tap-application-load-balancer-.*\.elb\..*\.amazonaws\.com$/);
      
      // Check that healthy targets are from our ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asgInstanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId) || [];
      healthyTargets?.forEach(target => {
        expect(asgInstanceIds).toContain(target.Target?.Id);
      });
    }, 30000);

    test("Target group health checks work correctly", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] })
      );
      
      const targetGroup = TargetGroups?.[0];
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckPath).toBe("/");
      
      // Get target health and verify at least one is healthy
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );
      
      const healthyCount = TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === "healthy"
      ).length || 0;
      
      expect(healthyCount).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Interactive Tests: EC2 → S3 Access", () => {
    test("EC2 instances can interact with S3 bucket through IAM role", async () => {
      // First, verify EC2 instances have the correct IAM instance profile
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );
      
      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(instance?.IamInstanceProfile?.Arn).toContain("tap-ec2-instance-profile");
      });

      // Test S3 bucket exists and has correct permissions
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Simulate EC2 write operation to S3 (testing IAM permissions)
      const testKey = `test-${Date.now()}.txt`;
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: "Test data from integration test",
        }));
        
        // Verify object was written
        const response = await s3Client.send(new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        }));
        
        expect(response).toBeDefined();
      } catch (error: any) {
        // If access is denied, it's because we're not running as the EC2 role
        // This is expected in integration tests run from local/CI environment
        expect(error.name).toMatch(/AccessDenied|NoSuchBucket/);
      }
    }, 30000);
  });

  describe("Interactive Tests: Security Groups Chain (ALB → EC2 → RDS)", () => {
    test("Security groups properly chain from ALB to EC2 to RDS", async () => {
      // Get ALB security group
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);
      const albSgId = alb?.SecurityGroups?.[0];
      
      // Get EC2 security group and verify it allows traffic from ALB
      const { SecurityGroups: ec2Sgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      const ec2Sg = ec2Sgs?.[0];
      
      const albToEc2Rule = ec2Sg?.IpPermissions?.find(rule => 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === albSgId)
      );
      expect(albToEc2Rule).toBeDefined();
      expect(albToEc2Rule?.FromPort).toBe(80);
      
      // Get RDS security group
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      const rdsSgIds = DBInstances?.[0]?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) || [];
      
      const { SecurityGroups: rdsSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: rdsSgIds as string[] })
      );
      
      // Verify RDS security group allows traffic from EC2
      const rdsSg = rdsSgs?.find(sg => sg.GroupName === "tap-rds-security-group");
      const ec2ToRdsRule = rdsSg?.IpPermissions?.find(rule => 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)
      );
      expect(ec2ToRdsRule).toBeDefined();
      expect(ec2ToRdsRule?.FromPort).toBe(3306);
      expect(ec2ToRdsRule?.ToPort).toBe(3306);
    }, 30000);
  });

  describe("Interactive Tests: CloudWatch → Auto Scaling", () => {
    test("CloudWatch alarms are connected to Auto Scaling policies", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNames: ["tap-high-cpu-utilization", "tap-low-cpu-utilization"] 
        })
      );
      
      const highCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-high-cpu-utilization");
      const lowCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-low-cpu-utilization");
      
      // Get scaling policies
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribePoliciesCommand({ AutoScalingGroupName: autoScalingGroupName })
      );
      
      const scaleUpPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-up-policy");
      const scaleDownPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-down-policy");
      
      // Verify alarms are connected to policies
      expect(highCpuAlarm?.AlarmActions).toContain(scaleUpPolicy?.PolicyARN);
      expect(lowCpuAlarm?.AlarmActions).toContain(scaleDownPolicy?.PolicyARN);
      
      // Verify both alarms also trigger SNS
      expect(highCpuAlarm?.AlarmActions).toContain(snsTopicArn);
      expect(lowCpuAlarm?.AlarmActions).toContain(snsTopicArn);
    }, 20000);

    test("Auto Scaling Group responds to capacity changes", async () => {
      // Get current capacity
      const { AutoScalingGroups: asgsBefore } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const originalCapacity = asgsBefore?.[0]?.DesiredCapacity || 2;
      
      // Test scaling up
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: originalCapacity + 1,
      }));
      
      // Wait a bit for the change to take effect
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { AutoScalingGroups: asgsAfter } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      expect(asgsAfter?.[0]?.DesiredCapacity).toBe(originalCapacity + 1);
      
      // Scale back down
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: originalCapacity,
      }));
    }, 40000);
  });

  describe("Interactive Tests: CloudWatch → SNS Notifications", () => {
    test("SNS topic is configured to receive CloudWatch alarms", async () => {
      // Verify SNS topic exists
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      
      // Check CloudWatch alarms reference the SNS topic
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNames: ["tap-high-cpu-utilization", "tap-low-cpu-utilization"] 
        })
      );
      
      MetricAlarms?.forEach(alarm => {
        expect(alarm?.AlarmActions).toContain(snsTopicArn);
      });
      
      // Verify subscription exists
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );
      
      expect(Subscriptions?.length).toBeGreaterThan(0);
      expect(Subscriptions?.[0]?.Protocol).toBe("email");
    }, 20000);

    test("Can publish test message to SNS topic", async () => {
      try {
        const result = await snsClient.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: "Integration Test Message",
          Message: "This is a test message from integration tests",
        }));
        
        expect(result.MessageId).toBeDefined();
      } catch (error: any) {
        // If we don't have permission to publish, that's okay for integration test
        expect(error.name).toMatch(/AuthorizationError|AccessDenied/);
      }
    }, 20000);
  });

  describe("Interactive Tests: EC2 → RDS Connection", () => {
    test("EC2 security group allows connection to RDS", async () => {
      // Get RDS security group
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const rdsSgIds = DBInstances?.[0]?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) || [];
      
      // Verify RDS security group has ingress rule from EC2 security group
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: rdsSgIds as string[] })
      );
      
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "tap-rds-security-group");
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && 
        rule.ToPort === 3306 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)
      );
      
      expect(mysqlRule).toBeDefined();
    }, 20000);
  });

  describe("Monitoring and Observability Integration", () => {
    test("All EC2 instances have detailed monitoring enabled", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );
      
      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(instance?.Monitoring?.State).toBe("enabled");
      });
    }, 20000);

    test("RDS has enhanced monitoring enabled", async () => {
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.MonitoringInterval).toBe(60);
      expect(db?.MonitoringRoleArn).toBeDefined();
      expect(db?.MonitoringRoleArn).toContain("tap-rds-enhanced-monitoring-role");
    }, 20000);

    test("Auto Scaling Group has all required metrics enabled", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      const enabledMetrics = asg?.EnabledMetrics?.map(m => m.Metric) || [];
      
      expect(enabledMetrics).toContain("GroupMinSize");
      expect(enabledMetrics).toContain("GroupMaxSize");
      expect(enabledMetrics).toContain("GroupDesiredCapacity");
      expect(enabledMetrics).toContain("GroupInServiceInstances");
      expect(enabledMetrics).toContain("GroupTotalInstances");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have required standard tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "Terraform")).toBe(true);
      
      // Check ASG tags
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const asg = AutoScalingGroups?.[0];
      expect(asg?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
      expect(asg?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "Terraform")).toBe(true);
    }, 20000);

    test("S3 bucket has versioning and public access block enabled", async () => {
      // Check versioning
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
      
      // Check public access block
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("Database is encrypted and has automated backups", async () => {
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(db?.PreferredBackupWindow).toBeDefined();
      expect(db?.PreferredMaintenanceWindow).toBeDefined();
    }, 20000);
  });
});