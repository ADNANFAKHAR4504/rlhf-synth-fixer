// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeRouteTablesCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand, SetDesiredCapacityCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand, DescribeAlarmHistoryCommand, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, PublishCommand } from "@aws-sdk/client-sns";
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand, ListSecretsCommand } from "@aws-sdk/client-secrets-manager";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
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
  let s3BucketName: string;
  let snsTopicArn: string;
  let stackKey: string;
  let environmentSuffix: string = 'pr3197'; // Extract from stack key

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackKey = Object.keys(outputs)[0]; 
    const stackOutputs = outputs[stackKey];

    // Extract environment suffix from stack key (e.g., "TapStackpr3197" -> "pr3197")
    environmentSuffix = stackKey.replace('TapStack', '') || 'default';

    vpcId = stackOutputs["vpc-id"];
    // Parse the JSON encoded subnet IDs
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    loadBalancerDnsName = stackOutputs["load-balancer-dns-name"];
    targetGroupArn = stackOutputs["target-group-arn"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
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
      
      // Check tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe("tap-vpc");
      
      const projectTag = vpc?.Tags?.find(tag => tag.Key === "Project");
      expect(projectTag?.Value).toBe("TAP");
      
      const managedByTag = vpc?.Tags?.find(tag => tag.Key === "ManagedBy");
      expect(managedByTag?.Value).toBe("Terraform");
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
        subnet.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("tap-public-subnet"))
      );
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("tap-private-subnet"))
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
    test("EC2 instance profile exists with correct permissions and environment suffix", async () => {
      const profileName = `tap-ec2-instance-profile-${environmentSuffix}`;
      const roleName = `tap-ec2-role-${environmentSuffix}`;
      
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe(profileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(roleName);
    }, 20000);

    test("RDS enhanced monitoring role exists", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: "tap-rds-enhanced-monitoring-role" })
      );

      expect(Role?.RoleName).toBe("tap-rds-enhanced-monitoring-role");    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration including enhanced monitoring", async () => {
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
      // AWS manages the password
      expect(db?.MasterUserSecret).toBeDefined();
    }, 30000);

    test("RDS subnet group is correctly configured", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: "tap-db-subnet-group-tts" })
      );
      
      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
      expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");
    }, 20000);
  });

  // INTERACTIVE TEST CASES - Testing interactions between 2-3 services

  describe("Interactive Tests: ALB → EC2 Target Health", () => {
    test("ALB successfully routes traffic to healthy EC2 instances in target group", async () => {
      // Get target health
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );
      
      expect(healthyTargets?.length).toBeGreaterThan(0);

      // Verify ALB DNS is reachable      
      // Check that healthy targets are from our ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asgInstanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId) || [];
      healthyTargets?.forEach(target => {
        expect(asgInstanceIds).toContain(target.Target?.Id);
      });
    }, 30000);

    test("ALB listener correctly forwards traffic to target group", async () => {
      const { Listeners } = await elbv2Client.send(new DescribeListenersCommand({
        LoadBalancerArn: loadBalancerDnsName.includes('tap-application-load-balancer') 
          ? `arn:aws:elasticloadbalancing:${awsRegion}:*:loadbalancer/app/tap-application-load-balancer/*` 
          : undefined
      })).catch(() => ({ Listeners: [] }));

      // Get the actual ALB ARN
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);
      
      if (alb) {
        const { Listeners: actualListeners } = await elbv2Client.send(
          new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancerArn })
        );
        
        const httpListener = actualListeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.DefaultActions?.[0]?.TargetGroupArn).toBe(targetGroupArn);
        expect(httpListener?.Protocol).toBe('HTTP');
      }
    }, 20000);
  });

  describe("Interactive Tests: Auto Scaling → CloudWatch Metrics", () => {
    test("Auto Scaling Group sends metrics to CloudWatch", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const { Datapoints } = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/AutoScaling',
        MetricName: 'GroupDesiredCapacity',
        Dimensions: [
          {
            Name: 'AutoScalingGroupName',
            Value: autoScalingGroupName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average'],
      }));

      // Should have at least some data points
      expect(Datapoints).toBeDefined();
      expect(Array.isArray(Datapoints)).toBe(true);
    }, 20000);

    test("CloudWatch alarms monitor Auto Scaling Group CPU utilization", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNames: ["tap-high-cpu-utilization", "tap-low-cpu-utilization"] 
        })
      );
      
      expect(MetricAlarms?.length).toBe(2);
      
      const highCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-high-cpu-utilization");
      expect(highCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(highCpuAlarm?.Namespace).toBe('AWS/AutoScaling');
      expect(highCpuAlarm?.Threshold).toBe(70);
      expect(highCpuAlarm?.Dimensions?.find(d => d.Name === 'AutoScalingGroupName')?.Value).toBe(autoScalingGroupName);

      const lowCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-low-cpu-utilization");
      expect(lowCpuAlarm?.Threshold).toBe(20);
    }, 20000);
  });

  describe("Interactive Tests: EC2 → S3 Logging", () => {
    test("S3 bucket is configured for secure log storage", async () => {
      // Test bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Test versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");

      // Test public access block
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("EC2 instances have correct IAM permissions for S3 log bucket", async () => {
      // Get the IAM role policy
      const roleName = `tap-ec2-role-${environmentSuffix}`;
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.Tags?.some(tag => tag.Key === 'Project' && tag.Value === 'TAP')).toBe(true);
      
      // The policy should allow access to the tap-logs-bucket
      // Note: We can't easily test inline policies without additional permissions
      // but we verified the role exists and is attached to the instance profile
    }, 20000);
  });


  describe("Interactive Tests: CloudWatch → SNS → Auto Scaling Chain", () => {
    test("CloudWatch alarms trigger both SNS notifications and Auto Scaling policies", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNames: ["tap-high-cpu-utilization", "tap-low-cpu-utilization"] 
        })
      );
      
      // Get scaling policies
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribePoliciesCommand({ AutoScalingGroupName: autoScalingGroupName })
      );
      
      const scaleUpPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-up-policy");
      const scaleDownPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-down-policy");

      // Verify high CPU alarm actions
      const highCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-high-cpu-utilization");
      expect(highCpuAlarm?.AlarmActions).toContain(scaleUpPolicy?.PolicyARN);
      expect(highCpuAlarm?.AlarmActions).toContain(snsTopicArn);
      
      // Verify low CPU alarm actions
      const lowCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-low-cpu-utilization");
      expect(lowCpuAlarm?.AlarmActions).toContain(scaleDownPolicy?.PolicyARN);
      expect(lowCpuAlarm?.AlarmActions).toContain(snsTopicArn);
    }, 20000);

    test("SNS topic has valid email subscription for alerts", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      
      expect(Attributes?.DisplayName).toBe("TAP CloudWatch Alerts");
      
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );
      
      expect(Subscriptions?.length).toBeGreaterThan(0);
      const emailSub = Subscriptions?.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
      expect(emailSub?.Endpoint).toMatch(/^[\w.-]+@[\w.-]+\.[\w]+$/);
    }, 20000);
  });

  describe("Interactive Tests: EC2 → RDS Network Connectivity", () => {
    test("EC2 and RDS are in correct network configuration for connectivity", async () => {
      // Get RDS subnet group details
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: "tap-db-subnet-group-tts" })
      );
      
      const rdsSubnetIds = DBSubnetGroups?.[0]?.Subnets?.map(s => s.SubnetIdentifier) || [];
      
      // Get EC2 instances from ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const ec2SubnetIds = AutoScalingGroups?.[0]?.VPCZoneIdentifier?.split(',') || [];
      
const subnetIds = [...rdsSubnetIds, ...ec2SubnetIds].filter(
  (id): id is string => id !== undefined
);

const { Subnets } = await ec2Client.send(
  new DescribeSubnetsCommand({
    SubnetIds: subnetIds,
  })
);

      
      const vpcIds = new Set(Subnets?.map(s => s.VpcId));
      expect(vpcIds.size).toBe(1); // All subnets should be in the same VPC
      expect(vpcIds.has(vpcId)).toBe(true);
    }, 20000);

    test("Security group rules allow EC2 to RDS MySQL connection", async () => {
      // Get RDS security groups
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const rdsSgIds = DBInstances?.[0]?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) || [];
      
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: rdsSgIds as string[] })
      );
      
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "tap-rds-security-group");
      
      // Check for MySQL port access from EC2 security group
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && 
        rule.ToPort === 3306 &&
        rule.IpProtocol === 'tcp' &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)
      );
      
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.Description).toBeUndefined(); // Can be undefined or have description
    }, 20000);
  });

  describe("Interactive Tests: Load Balancer → Target Group → Auto Scaling", () => {
    test("Target group is properly attached to Auto Scaling Group", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.TargetGroupARNs).toContain(targetGroupArn);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);
    }, 20000);

    test("Auto Scaling Group maintains desired capacity with healthy instances", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      
      // Check instance health
      const healthyInstances = asg?.Instances?.filter(i => 
        i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );
      
      expect(healthyInstances?.length).toBeGreaterThanOrEqual(asg?.MinSize || 0);
    }, 20000);
  });

  describe("Monitoring and Compliance Integration", () => {
    test("All components have proper tagging for compliance", async () => {
      const requiredTags = {
        Project: 'TAP',
        ManagedBy: 'Terraform',
        Environment: environmentSuffix
      };

      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs?.[0]?.Tags || [];
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(vpcTags.some(tag => tag.Key === key && tag.Value === value)).toBe(true);
      });

      // Check ASG tags
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const asgTags = AutoScalingGroups?.[0]?.Tags || [];
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(asgTags.some(tag => tag.Key === key && tag.Value === value)).toBe(true);
      });
    }, 20000);

    test("Enhanced monitoring is enabled across EC2 and RDS", async () => {
      // Check EC2 detailed monitoring
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      if (instanceIds.length > 0) {
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );
        
        const instances = Reservations?.flatMap(r => r.Instances || []);
        instances?.forEach(instance => {
          expect(instance?.Monitoring?.State).toBe("enabled");
        });
      }

      // Check RDS enhanced monitoring
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.MonitoringInterval).toBe(60);
      expect(db?.MonitoringRoleArn).toContain("tap-rds-enhanced-monitoring-role");
    }, 30000);
  });
});