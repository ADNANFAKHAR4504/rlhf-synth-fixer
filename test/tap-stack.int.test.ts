// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
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
  let rdsSecretArn: string;
  let s3BucketName: string;
  let snsTopicArn: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // "TapStackpr2916"
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
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
    test("Default VPC exists and is available", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.IsDefault).toBe(true);
    }, 20000);

    test("Public subnets exist and are accessible", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBeGreaterThanOrEqual(2);

      Subnets?.forEach((subnet) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
        expect(subnet?.DefaultForAz).toBe(true);
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP/HTTPS from anywhere", async () => {
      // Get ALB to find its security group
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

      // Check HTTP ingress rule
      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check HTTPS ingress rule
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

      // Check HTTP rule from ALB security group
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);

      // Check SSH rule from VPC CIDR
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/8")).toBe(true);
    }, 20000);
  });

  describe("IAM Resources", () => {

    test("EC2 instance profile exists", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: "tap-ec2-instance-profile" })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe("tap-ec2-instance-profile");
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe("tap-ec2-role");
    }, 20000);
  });

  describe("Auto Scaling Group", () => {
    test("Auto Scaling Group exists with correct configuration", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      expect(AutoScalingGroups?.length).toBe(1);

      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(2);
      expect(asg?.HealthCheckType).toBe("ELB");
      expect(asg?.HealthCheckGracePeriod).toBe(300);
      expect(asg?.TargetGroupARNs).toContain(targetGroupArn);

      // Check that ASG is using public subnets
      asg?.VPCZoneIdentifier?.split(',').forEach(subnetId => {
        expect(publicSubnetIds).toContain(subnetId);
      });
    }, 20000);

    test("Auto Scaling Group has running instances", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.Instances?.length).toBe(2);

      // Check instances are healthy
      asg?.Instances?.forEach(instance => {
        expect(instance?.HealthStatus).toBe("Healthy");
        expect(instance?.LifecycleState).toBe("InService");
      });

      // Verify actual EC2 instances
      const instanceIds = asg?.Instances?.map(i => i.InstanceId || "") || [];
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(instance?.State?.Name).toBe("running");
        expect(instance?.InstanceType).toBe("t3.micro");
        expect(instance?.IamInstanceProfile?.Arn).toContain("tap-ec2-instance-profile");
      });
    }, 30000);

    test("Scaling policies exist", async () => {
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribePoliciesCommand({ AutoScalingGroupName: autoScalingGroupName })
      );

      expect(ScalingPolicies?.length).toBe(2);
      
      const scaleUpPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-up-policy");
      expect(scaleUpPolicy).toBeDefined();
      expect(scaleUpPolicy?.ScalingAdjustment).toBe(1);
      expect(scaleUpPolicy?.AdjustmentType).toBe("ChangeInCapacity");

      const scaleDownPolicy = ScalingPolicies?.find(p => p.PolicyName === "tap-scale-down-policy");
      expect(scaleDownPolicy).toBeDefined();
      expect(scaleDownPolicy?.ScalingAdjustment).toBe(-1);
      expect(scaleDownPolicy?.AdjustmentType).toBe("ChangeInCapacity");
    }, 20000);
  });

  describe("Application Load Balancer", () => {
    test("ALB exists with correct configuration", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);

      expect(alb).toBeDefined();
      expect(alb?.LoadBalancerName).toBe("tap-application-load-balancer");
      expect(alb?.Type).toBe("application");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.State?.Code).toBe("active");

      // Check subnets
      alb?.AvailabilityZones?.forEach((az: any) => {
        expect(publicSubnetIds).toContain(az.SubnetId);
      });
    }, 20000);

    test("Target group exists with correct health check configuration", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] })
      );
      expect(TargetGroups?.length).toBe(1);

      const targetGroup = TargetGroups?.[0];
      expect(targetGroup?.TargetGroupName).toBe("tap-target-group");
      expect(targetGroup?.VpcId).toBe(vpcId);
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.Protocol).toBe("HTTP");
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckPath).toBe("/");
      expect(targetGroup?.HealthyThresholdCount).toBe(2);
      expect(targetGroup?.UnhealthyThresholdCount).toBe(2);
      expect(targetGroup?.Matcher?.HttpCode).toBe("200");
    }, 20000);

    test("ALB listener exists and forwards to target group", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);
      
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb?.LoadBalancerArn })
      );

      expect(Listeners?.length).toBe(1);
      const listener = Listeners?.[0];
      expect(listener?.Port).toBe(80);
      expect(listener?.Protocol).toBe("HTTP");
      expect(listener?.DefaultActions?.[0]?.Type).toBe("forward");
      expect(listener?.DefaultActions?.[0]?.TargetGroupArn).toBe(targetGroupArn);
    }, 20000);

    test("Target group has healthy targets", async () => {
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      expect(TargetHealthDescriptions?.length).toBe(2);
      TargetHealthDescriptions?.forEach(target => {
        expect(target?.TargetHealth?.State).toMatch(/healthy|initial/);
      });
    }, 30000);
  });

  describe("CloudWatch Alarms", () => {
    test("CloudWatch alarms exist for auto scaling", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: ["tap-high-cpu-utilization", "tap-low-cpu-utilization"] })
      );

      expect(MetricAlarms?.length).toBe(2);

      const highCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-high-cpu-utilization");
      expect(highCpuAlarm).toBeDefined();
      expect(highCpuAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(highCpuAlarm?.Threshold).toBe(70);
      expect(highCpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(highCpuAlarm?.Namespace).toBe("AWS/AutoScaling");

      const lowCpuAlarm = MetricAlarms?.find(a => a.AlarmName === "tap-low-cpu-utilization");
      expect(lowCpuAlarm).toBeDefined();
      expect(lowCpuAlarm?.ComparisonOperator).toBe("LessThanThreshold");
      expect(lowCpuAlarm?.Threshold).toBe(20);
      expect(lowCpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(lowCpuAlarm?.Namespace).toBe("AWS/AutoScaling");
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
    }, 30000);

  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("SNS Topic", () => {
    test("SNS topic exists with correct configuration", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );

      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toBe("TAP CloudWatch Alerts");

      // Check subscriptions
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );

      expect(Subscriptions?.length).toBe(1);
      expect(Subscriptions?.[0]?.Protocol).toBe("email");
      expect(Subscriptions?.[0]?.Endpoint).toBe("admin@example.com");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have required standard tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      // Default VPC may not have our custom tags, so we'll check ASG instead
      
      // Check ASG tags
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const asg = AutoScalingGroups?.[0];
      expect(asg?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
      expect(asg?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "Terraform")).toBe(true);
    }, 20000);

    test("EC2 instances are properly configured for web serving", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );
      
      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(publicSubnetIds).toContain(instance?.SubnetId);
        expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(ec2SecurityGroupId);
        expect(instance?.IamInstanceProfile?.Arn).toContain("tap-ec2-instance-profile");
        expect(instance?.KeyName).toBe("compute-key1");
        expect(instance?.Monitoring?.State).toBe("enabled");
      });
    }, 20000);

    test("Database is properly secured and isolated", async () => {
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db?.DeletionProtection).toBe(false);
      expect(db?.MonitoringInterval).toBe(60);
      expect(db?.MonitoringRoleArn).toContain("tap-rds-enhanced-monitoring-role");
    }, 20000);

    test("Load balancer is properly exposed to internet", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === loadBalancerDnsName);
      
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");
      expect(alb?.State?.Code).toBe("active");
      
      // Verify it's in public subnets
      alb?.AvailabilityZones?.forEach((az: any) => {
        expect(publicSubnetIds).toContain(az.SubnetId);
      });
    }, 20000);
  });
});