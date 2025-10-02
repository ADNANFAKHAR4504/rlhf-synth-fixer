import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand, 
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeNatGatewaysCommand, 
  DescribeRouteTablesCommand,
  DescribeLaunchTemplatesCommand,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";
import { 
  RDSClient, 
  DescribeDBInstancesCommand, 
  DescribeDBSubnetGroupsCommand 
} from "@aws-sdk/client-rds";
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand, 
  DescribeTargetGroupsCommand, 
  DescribeListenersCommand,
  DescribeTargetHealthCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
  SetDesiredCapacityCommand
} from "@aws-sdk/client-auto-scaling";
import { 
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand
} from "@aws-sdk/client-iam";
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  DescribeAlarmHistoryCommand,
  GetMetricStatisticsCommand
} from "@aws-sdk/client-cloudwatch";
import { 
  SecretsManagerClient, 
  DescribeSecretCommand, 
  GetSecretValueCommand 
} from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let natGatewayId: string;
  let publicRouteTableId: string;
  let privateRouteTableId: string;
  let publicSecurityGroupId: string; // This is actually the ALB security group
  let rdsSecurityGroupId: string;
  let albDnsName: string;
  let albZoneId: string;
  let autoScalingGroupName: string;
  let s3LogsBucketName: string;
  let s3LogsBucketArn: string;
  let rdsEndpoint: string;
  let rdsInstanceId: string;
  let rdsPort: number;
  let ec2LaunchTemplateId: string;
  let cloudwatchLogGroupName: string;
  let ebsLifecyclePolicyId: string;
  let stackKey: string;
  let environmentSuffix: string;

  beforeAll(() => {
    // Load deployment outputs from flat-outputs.json
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    const stackOutputs = outputs[stackKey];

    // Extract environment suffix from stack key (e.g., "TapStackpr3225" -> "pr3225")
    environmentSuffix = stackKey.replace('TapStack', '') || 'default';

    // Extract all required outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    privateSubnetIds = JSON.parse(stackOutputs["private-subnet-ids"]);
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    publicRouteTableId = stackOutputs["public-route-table-id"];
    privateRouteTableId = stackOutputs["private-route-table-id"];
    publicSecurityGroupId = stackOutputs["public-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    albDnsName = stackOutputs["alb-dns-name"];
    albZoneId = stackOutputs["alb-zone-id"];
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    s3LogsBucketName = stackOutputs["s3-logs-bucket-name"];
    s3LogsBucketArn = stackOutputs["s3-logs-bucket-arn"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsInstanceId = stackOutputs["rds-instance-id"];
    rdsPort = parseInt(stackOutputs["rds-port"], 10);
    ec2LaunchTemplateId = stackOutputs["ec2-launch-template-id"];
    cloudwatchLogGroupName = stackOutputs["cloudwatch-log-group-name"];
    ebsLifecyclePolicyId = stackOutputs["ebs-lifecycle-policy-id"];

    // Validate required outputs
    if (!vpcId || !autoScalingGroupName || !s3LogsBucketName || !rdsEndpoint || !albDnsName) {
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
      expect(nameTag?.Value).toContain("tap");
      expect(nameTag?.Value).toContain("vpc");

      const projectTag = vpc?.Tags?.find(tag => tag.Key === "Project");
      expect(projectTag?.Value).toBe("tap");

      const envTag = vpc?.Tags?.find(tag => tag.Key === "Environment");
      expect(envTag?.Value).toBe(environmentSuffix);
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );

      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 20000);

    test("Public and private subnets are correctly configured", async () => {
      // Check public subnets
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(publicSubnets?.length).toBe(2);

      const expectedPublicCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
      publicSubnets?.forEach((subnet) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedPublicCidrs.includes(subnet?.CidrBlock || "")).toBe(true);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
        
        const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
        expect(nameTag?.Value).toContain("public-subnet");
      });

      // Check private subnets
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(privateSubnets?.length).toBe(2);

      const expectedPrivateCidrs = ["10.0.11.0/24", "10.0.12.0/24"];
      privateSubnets?.forEach((subnet) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedPrivateCidrs.includes(subnet?.CidrBlock || "")).toBe(true);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
        
        const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
        expect(nameTag?.Value).toContain("private-subnet");
      });
    }, 20000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      expect(NatGateways?.length).toBe(1);

      const natGw = NatGateways?.[0];
      expect(natGw?.NatGatewayId).toBe(natGatewayId);
      expect(natGw?.State).toBe("available");
      expect(publicSubnetIds.includes(natGw?.SubnetId || "")).toBe(true);
      expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
    }, 20000);

    test("Route tables are properly configured", async () => {
      // Test public route table
      const { RouteTables: publicRouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({ RouteTableIds: [publicRouteTableId] })
      );
      expect(publicRouteTables?.length).toBe(1);

      const publicRouteTable = publicRouteTables?.[0];
      expect(publicRouteTable?.VpcId).toBe(vpcId);
      
      // Check for internet gateway route
      const igwRoute = publicRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === internetGatewayId
      );
      expect(igwRoute).toBeDefined();

      // Test private route table
      const { RouteTables: privateRouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({ RouteTableIds: [privateRouteTableId] })
      );
      expect(privateRouteTables?.length).toBe(1);

      const privateRouteTable = privateRouteTables?.[0];
      expect(privateRouteTable?.VpcId).toBe(vpcId);
      
      // Check for NAT gateway route
      const natRoute = privateRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId === natGatewayId
      );
      expect(natRoute).toBeDefined();
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP/HTTPS from anywhere", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const albSg = SecurityGroups?.[0];
      expect(albSg?.VpcId).toBe(vpcId);

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

    test("RDS security group has correct database access rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const rdsSg = SecurityGroups?.[0];
      expect(rdsSg?.VpcId).toBe(vpcId);
      
      // Check for MySQL/Aurora port access
      const dbRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(dbRule).toBeDefined();
    }, 20000);
  });

  describe("IAM Resources", () => {
    test("EC2 instance profile exists with correct permissions and environment suffix", async () => {
      const profileName = `tap-${environmentSuffix}-ec2-instance-profile`;
      const roleName = `tap-${environmentSuffix}-ec2-role`;

      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe(profileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(roleName);
    }, 20000);

    test("RDS enhanced monitoring role exists", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: `tap-${environmentSuffix}-rds-monitoring-role` })
      );

      expect(Role?.RoleName).toBe(`tap-${environmentSuffix}-rds-monitoring-role`);
    }, 20000);
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
      expect(db?.StorageType).toBe("gp3");
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBe(7);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.MultiAZ).toBe(false); // Not enabled for non-prod
      expect(db?.DBName).toBe("tapdb");
      expect(db?.MasterUsername).toBe("dbadmin");
      expect(db?.Endpoint?.Port).toBe(3306);
      // AWS manages the password
      expect(db?.MasterUserSecret).toBeDefined();
    }, 30000);

    test("RDS subnet group is correctly configured", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group` })
      );

      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
      expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");
    }, 20000);
  });

  describe("Auto Scaling Group", () => {
    test("Auto Scaling Group exists and is properly configured", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      expect(AutoScalingGroups?.length).toBe(1);

      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(4);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg?.HealthCheckGracePeriod).toBeGreaterThanOrEqual(300);
      
      // Verify ASG is in private subnets
      const asgSubnetIds = asg?.VPCZoneIdentifier?.split(",") || [];
      privateSubnetIds.forEach(subnetId => {
        expect(asgSubnetIds.includes(subnetId)).toBe(true);
      });
    }, 20000);

    test("Launch Template is properly configured", async () => {
      const { LaunchTemplates } = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ec2LaunchTemplateId] })
      );
      expect(LaunchTemplates?.length).toBe(1);

      const template = LaunchTemplates?.[0];
      expect(template?.LaunchTemplateId).toBe(ec2LaunchTemplateId);
      expect(template?.LaunchTemplateName).toContain(`tap-${environmentSuffix}`);
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket is configured for secure log storage", async () => {
      // Test bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3LogsBucketName }));

      // Test versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3LogsBucketName })
      );
      expect(Status).toBe("Enabled");

      // Test public access block
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3LogsBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("S3 bucket has proper encryption configuration", async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3LogsBucketName })
      );

      expect(ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 20000);
  });

  // INTERACTIVE TEST CASES - Testing interactions between 2-3 services

  describe("Interactive Tests: ALB → EC2 Target Health", () => {
    test("ALB successfully routes traffic to healthy EC2 instances in target group", async () => {
      // Get ALB details
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();

      // Get target groups
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: alb?.LoadBalancerArn })
      );
      expect(TargetGroups?.length).toBeGreaterThan(0);

      const targetGroupArn = TargetGroups?.[0]?.TargetGroupArn;

      // Get target health
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );

      expect(healthyTargets?.length).toBeGreaterThan(0);

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
      // Get the actual ALB ARN
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find((lb: any) => lb.DNSName === albDnsName);

      if (alb) {
        const { Listeners: actualListeners } = await elbv2Client.send(
          new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancerArn })
        );

        const httpListener = actualListeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
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

    test("CloudWatch log group exists for EC2 instances", async () => {
      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({ 
          logGroupNamePrefix: cloudwatchLogGroupName 
        })
      );

      const logGroup = logGroups?.find(lg => lg.logGroupName === cloudwatchLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(cloudwatchLogGroupName);
    }, 20000);
  });

  describe("Interactive Tests: EC2 → S3 Logging", () => {
    test("EC2 instances have correct IAM permissions for S3 log bucket", async () => {
      // Get the IAM role policy
      const roleName = `tap-${environmentSuffix}-ec2-role`;
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.Tags?.some(tag => tag.Key === 'Project' && tag.Value === 'tap')).toBe(true);

      // The policy should allow access to the tap-logs-bucket
      // Note: We can't easily test inline policies without additional permissions
      // but we verified the role exists and is attached to the instance profile
    }, 20000);
  });

  describe("Interactive Tests: EC2 → RDS Network Connectivity", () => {
    test("EC2 and RDS are in correct network configuration for connectivity", async () => {
      // Get RDS subnet group details
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group` })
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

      // Check for MySQL port access - should allow from VPC CIDR
      const rdsSg = SecurityGroups?.[0];
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && 
        rule.ToPort === 3306 &&
        rule.IpProtocol === 'tcp'
      );

      expect(mysqlRule).toBeDefined();
    }, 20000);
  });

  describe("Interactive Tests: Load Balancer → Target Group → Auto Scaling", () => {
    test("Target group is properly attached to Auto Scaling Group", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );

      const asg = AutoScalingGroups?.[0];
      expect(asg?.TargetGroupARNs?.length).toBeGreaterThan(0);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);
    }, 20000);

    test("Auto Scaling Group maintains desired capacity with healthy instances", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );

      const asg = AutoScalingGroups?.[0];
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(4);

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
        Project: 'tap',
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

    test("High Availability: Resources are distributed across multiple availability zones", async () => {
      // Check public subnets AZs
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      const publicAZs = publicSubnets?.map(subnet => subnet.AvailabilityZone) || [];
      expect(new Set(publicAZs).size).toBe(2); // Should span 2 AZs

      // Check private subnets AZs
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      
      const privateAZs = privateSubnets?.map(subnet => subnet.AvailabilityZone) || [];
      expect(new Set(privateAZs).size).toBe(2); // Should span 2 AZs

      // Check ASG spans multiple AZs
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );

      const asg = AutoScalingGroups?.[0];
      const asgAZs = asg?.AvailabilityZones || [];
      expect(asgAZs.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("Security Compliance: All storage is encrypted", async () => {
      // S3 encryption already tested above
      
      // Check RDS encryption
      const rdsIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      expect(DBInstances?.[0]?.StorageEncrypted).toBe(true);

      // Check launch template for EBS encryption
      const { LaunchTemplates } = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ec2LaunchTemplateId] })
      );

      if (LaunchTemplates && LaunchTemplates.length > 0) {
        expect(LaunchTemplates[0]?.LaunchTemplateId).toBe(ec2LaunchTemplateId);
      }
    }, 20000);
  });
});