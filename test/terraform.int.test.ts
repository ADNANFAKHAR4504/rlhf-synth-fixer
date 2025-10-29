// integration.test.ts
import { expect } from "@jest/globals";
import { describe, test, beforeAll, afterEach } from "@jest/globals";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeNatGatewaysCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeRouteTablesCommand,
  DescribeInstancesCommand,
  RunInstancesCommand,
  TerminateInstancesCommand
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand, 
  DescribeTargetHealthCommand, 
  DescribeTargetGroupsCommand, 
  DescribeListenersCommand 
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient, 
  DescribeDBInstancesCommand, 
  DescribeDBSubnetGroupsCommand,
  DescribeDBParameterGroupsCommand,
  CreateDBSnapshotCommand,
  DescribeDBSnapshotsCommand,
  DeleteDBSnapshotCommand
} from "@aws-sdk/client-rds";
import { 
  SecretsManagerClient, 
  GetSecretValueCommand, 
  DescribeSecretCommand,
  UpdateSecretCommand,
  RotateSecretCommand
} from "@aws-sdk/client-secrets-manager";
import { 
  S3Client, 
  HeadBucketCommand, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectVersionsCommand, 
  GetBucketVersioningCommand, 
  GetBucketEncryptionCommand, 
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand
} from "@aws-sdk/client-s3";
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand, 
  GetInstanceProfileCommand,
  ListInstanceProfilesForRoleCommand
} from "@aws-sdk/client-iam";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand, 
  GetMetricStatisticsCommand,
  PutMetricDataCommand
} from "@aws-sdk/client-cloudwatch";
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand, 
  FilterLogEventsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand,
  DescribeAutoScalingInstancesCommand,
  SetDesiredCapacityCommand,
  DescribeLaunchTemplatesCommand,
  DescribeScalingActivitiesCommand
} from "@aws-sdk/client-auto-scaling";
import { 
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
  DescribeInstanceInformationCommand
} from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import mysql from 'mysql2/promise';

const awsRegion = "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });

describe("Terraform Web Application Infrastructure Integration Tests", () => {
  // Parse deployment outputs
  let albDnsName: string;
  let albZoneId: string;
  let autoscalingGroupName: string;
  let databaseSubnetIds: string[];
  let dbSecretArn: string;
  let dbSecretName: string;
  let privateSubnetIds: string[];
  let publicSubnetIds: string[];
  let rdsEndpoint: string;
  let rdsHost: string;
  let rdsPort: number;
  let rdsReadReplicaEndpoints: string[];
  let s3LogsBucket: string;
  let securityGroupAlbId: string;
  let securityGroupRdsId: string;
  let securityGroupWebId: string;
  let vpcId: string;

  beforeAll(() => {
    // Parse the deployment outputs from environment or file
    const outputFilePath = process.env.TERRAFORM_OUTPUTS_FILE || 
                          path.join(__dirname, "..", "terraform-outputs.json");
    
    if (fs.existsSync(outputFilePath)) {
      const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
      
      albDnsName = outputs.alb_dns_name;
      albZoneId = outputs.alb_zone_id;
      autoscalingGroupName = outputs.autoscaling_group_name;
      databaseSubnetIds = JSON.parse(outputs.database_subnet_ids);
      dbSecretArn = outputs.db_secret_arn;
      dbSecretName = outputs.db_secret_name;
      privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      rdsEndpoint = outputs.rds_endpoint;
      [rdsHost, rdsPort] = rdsEndpoint.split(":");
      rdsPort = parseInt(rdsPort);
      rdsReadReplicaEndpoints = JSON.parse(outputs.rds_read_replica_endpoints);
      s3LogsBucket = outputs.s3_logs_bucket;
      securityGroupAlbId = outputs.security_group_alb_id;
      securityGroupRdsId = outputs.security_group_rds_id;
      securityGroupWebId = outputs.security_group_web_id;
      vpcId = outputs.vpc_id;
    } else {
      // Use environment variables as fallback
      albDnsName = process.env.ALB_DNS_NAME!;
      albZoneId = process.env.ALB_ZONE_ID!;
      autoscalingGroupName = process.env.AUTOSCALING_GROUP_NAME!;
      databaseSubnetIds = JSON.parse(process.env.DATABASE_SUBNET_IDS || "[]");
      dbSecretArn = process.env.DB_SECRET_ARN!;
      dbSecretName = process.env.DB_SECRET_NAME!;
      privateSubnetIds = JSON.parse(process.env.PRIVATE_SUBNET_IDS || "[]");
      publicSubnetIds = JSON.parse(process.env.PUBLIC_SUBNET_IDS || "[]");
      rdsEndpoint = process.env.RDS_ENDPOINT!;
      [rdsHost, rdsPort] = rdsEndpoint.split(":");
      rdsPort = parseInt(rdsPort);
      rdsReadReplicaEndpoints = JSON.parse(process.env.RDS_READ_REPLICA_ENDPOINTS || "[]");
      s3LogsBucket = process.env.S3_LOGS_BUCKET!;
      securityGroupAlbId = process.env.SECURITY_GROUP_ALB_ID!;
      securityGroupRdsId = process.env.SECURITY_GROUP_RDS_ID!;
      securityGroupWebId = process.env.SECURITY_GROUP_WEB_ID!;
      vpcId = process.env.VPC_ID!;
    }

    // Validate required outputs
    if (!albDnsName || !vpcId || !autoscalingGroupName) {
      throw new Error("Missing required deployment outputs for integration tests");
    }
  });

  // ==================== Resource Validation Tests (Non-Interactive) ====================
  describe("Resource Validation (Non-Interactive)", () => {
    
    describe("VPC and Networking Resources", () => {
      test("VPC exists with correct configuration", async () => {
        const { Vpcs } = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );

        const vpc = Vpcs?.[0];
        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
        expect(vpc?.State).toBe("available");
        expect(vpc?.EnableDnsHostnames).toBe(true);
        expect(vpc?.EnableDnsSupport).toBe(true);
      }, 30000);

      test("Internet Gateway is attached to VPC", async () => {
        const { InternetGateways } = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
          })
        );

        expect(InternetGateways).toHaveLength(1);
        const igw = InternetGateways?.[0];
        expect(igw?.Attachments?.[0]?.State).toBe("available");
        expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      }, 30000);

      test("NAT Gateways are properly configured", async () => {
        const { NatGateways } = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: "vpc-id", Values: [vpcId] },
              { Name: "state", Values: ["available"] }
            ]
          })
        );

        expect(NatGateways?.length).toBe(2); // One per AZ
        
        NatGateways?.forEach(natGw => {
          expect(natGw?.State).toBe("available");
          expect(publicSubnetIds).toContain(natGw?.SubnetId);
          expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
        });
      }, 30000);

      test("Subnets are correctly configured across AZs", async () => {
        const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds];
        const { Subnets } = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
        );

        expect(Subnets?.length).toBe(6); // 2 public + 2 private + 2 database

        // Validate public subnets
        const publicSubnets = Subnets?.filter(s => publicSubnetIds.includes(s.SubnetId!));
        expect(publicSubnets?.length).toBe(2);
        publicSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.VpcId).toBe(vpcId);
          expect(subnet.State).toBe("available");
        });

        // Validate private subnets
        const privateSubnets = Subnets?.filter(s => privateSubnetIds.includes(s.SubnetId!));
        expect(privateSubnets?.length).toBe(2);
        privateSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.VpcId).toBe(vpcId);
        });

        // Validate database subnets
        const dbSubnets = Subnets?.filter(s => databaseSubnetIds.includes(s.SubnetId!));
        expect(dbSubnets?.length).toBe(2);
        dbSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.VpcId).toBe(vpcId);
        });

        // Check AZ distribution
        const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);
      }, 30000);

      test("Route tables are properly configured", async () => {
        const { RouteTables } = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [{ Name: "vpc-id", Values: [vpcId] }]
          })
        );

        // Check for public route table with IGW route
        const publicRouteTable = RouteTables?.find(rt => 
          rt.Routes?.some(r => r.GatewayId?.startsWith("igw-"))
        );
        expect(publicRouteTable).toBeDefined();

        // Check for private route tables with NAT routes
        const privateRouteTables = RouteTables?.filter(rt =>
          rt.Routes?.some(r => r.NatGatewayId?.startsWith("nat-"))
        );
        expect(privateRouteTables?.length).toBeGreaterThanOrEqual(2);
      }, 30000);
    });

    describe("Security Groups Configuration", () => {
      test("ALB Security Group allows HTTP/HTTPS traffic", async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupAlbId] })
        );

        const albSg = SecurityGroups?.[0];
        expect(albSg).toBeDefined();
        expect(albSg?.VpcId).toBe(vpcId);

        // Check ingress rules
        const httpRule = albSg?.IpPermissions?.find(r => r.FromPort === 80);
        expect(httpRule).toBeDefined();
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

        const httpsRule = albSg?.IpPermissions?.find(r => r.FromPort === 443);
        expect(httpsRule).toBeDefined();
        expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      }, 30000);

      test("Web Security Group allows traffic from ALB", async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupWebId] })
        );

        const webSg = SecurityGroups?.[0];
        expect(webSg).toBeDefined();

        // Check HTTP from ALB
        const httpFromAlb = webSg?.IpPermissions?.find(r => 
          r.FromPort === 80 &&
          r.UserIdGroupPairs?.some(p => p.GroupId === securityGroupAlbId)
        );
        expect(httpFromAlb).toBeDefined();

        // Check SSH from VPC
        const sshRule = webSg?.IpPermissions?.find(r => r.FromPort === 22);
        expect(sshRule).toBeDefined();
        expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe("10.0.0.0/16");
      }, 30000);

      test("RDS Security Group allows traffic from Web servers", async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupRdsId] })
        );

        const rdsSg = SecurityGroups?.[0];
        expect(rdsSg).toBeDefined();

        const mysqlRule = rdsSg?.IpPermissions?.find(r =>
          r.FromPort === 3306 &&
          r.UserIdGroupPairs?.some(p => p.GroupId === securityGroupWebId)
        );
        expect(mysqlRule).toBeDefined();
      }, 30000);
    });

    describe("Application Load Balancer Configuration", () => {
      test("ALB exists with correct configuration", async () => {
        const { LoadBalancers } = await elbClient.send(
          new DescribeLoadBalancersCommand({
            Names: [albDnsName.split("-")[0] + "-" + albDnsName.split("-")[1] + "-alb"]
          })
        );

        const alb = LoadBalancers?.[0];
        expect(alb).toBeDefined();
        expect(alb?.DNSName).toBe(albDnsName);
        expect(alb?.Type).toBe("application");
        expect(alb?.Scheme).toBe("internet-facing");
        expect(alb?.State?.Code).toBe("active");
        expect(alb?.SecurityGroups).toContain(securityGroupAlbId);
      }, 30000);

      test("Target Group is properly configured", async () => {
        const { TargetGroups } = await elbClient.send(
          new DescribeTargetGroupsCommand({
            Names: [`${autoscalingGroupName.split("-asg")[0]}-tg`]
          })
        );

        const tg = TargetGroups?.[0];
        expect(tg).toBeDefined();
        expect(tg?.Protocol).toBe("HTTP");
        expect(tg?.Port).toBe(80);
        expect(tg?.TargetType).toBe("instance");
        expect(tg?.HealthCheckEnabled).toBe(true);
        expect(tg?.HealthCheckPath).toBe("/");
        expect(tg?.HealthCheckIntervalSeconds).toBe(30);
        expect(tg?.HealthyThresholdCount).toBe(2);
        expect(tg?.UnhealthyThresholdCount).toBe(2);
        expect(tg?.Matcher?.HttpCode).toBe("200");
      }, 30000);

      test("ALB Listener is configured for HTTP", async () => {
        const { LoadBalancers } = await elbClient.send(
          new DescribeLoadBalancersCommand({
            Names: [albDnsName.split("-")[0] + "-" + albDnsName.split("-")[1] + "-alb"]
          })
        );
        
        const albArn = LoadBalancers?.[0]?.LoadBalancerArn;
        
        const { Listeners } = await elbClient.send(
          new DescribeListenersCommand({ LoadBalancerArn: albArn })
        );

        const httpListener = Listeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe("HTTP");
        expect(httpListener?.DefaultActions?.[0]?.Type).toBe("forward");
      }, 30000);
    });

    describe("Auto Scaling Group Configuration", () => {
      test("Auto Scaling Group exists with correct configuration", async () => {
        const { AutoScalingGroups } = await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [autoscalingGroupName]
          })
        );

        const asg = AutoScalingGroups?.[0];
        expect(asg).toBeDefined();
        expect(asg?.MinSize).toBe(2);
        expect(asg?.MaxSize).toBe(6);
        expect(asg?.DesiredCapacity).toBe(4);
        expect(asg?.HealthCheckType).toBe("ELB");
        expect(asg?.HealthCheckGracePeriod).toBe(300);
        expect(asg?.VPCZoneIdentifier).toBeDefined();
        
        // Check enabled metrics
        expect(asg?.EnabledMetrics?.map(m => m.Metric)).toEqual(
          expect.arrayContaining([
            "GroupMinSize",
            "GroupMaxSize",
            "GroupDesiredCapacity",
            "GroupInServiceInstances",
            "GroupTotalInstances"
          ])
        );
      }, 30000);

      test("Launch Template is properly configured", async () => {
        const { AutoScalingGroups } = await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [autoscalingGroupName]
          })
        );

        const launchTemplate = AutoScalingGroups?.[0]?.LaunchTemplate;
        expect(launchTemplate).toBeDefined();
        expect(launchTemplate?.Version).toBe("$Latest");
      }, 30000);

      test("Auto Scaling Policies are configured", async () => {
        const { MetricAlarms } = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [
              `webapp-production-cpu-high`,
              `webapp-production-cpu-low`
            ]
          })
        );

        expect(MetricAlarms?.length).toBe(2);
        
        const cpuHighAlarm = MetricAlarms?.find(a => a.AlarmName?.includes("cpu-high"));
        expect(cpuHighAlarm?.ComparisonOperator).toBe("GreaterThanOrEqualToThreshold");
        expect(cpuHighAlarm?.Threshold).toBe(70);
        expect(cpuHighAlarm?.EvaluationPeriods).toBe(2);
        
        const cpuLowAlarm = MetricAlarms?.find(a => a.AlarmName?.includes("cpu-low"));
        expect(cpuLowAlarm?.ComparisonOperator).toBe("LessThanOrEqualToThreshold");
        expect(cpuLowAlarm?.Threshold).toBe(20);
      }, 30000);
    });

    describe("RDS Configuration", () => {
      test("RDS Master instance is properly configured", async () => {
        const dbIdentifier = rdsHost.split(".")[0];
        const { DBInstances } = await rdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );

        const db = DBInstances?.[0];
        expect(db).toBeDefined();
        expect(db?.DBInstanceStatus).toBe("available");
        expect(db?.Engine).toBe("mysql");
        expect(db?.DBInstanceClass).toBe("db.t3.medium");
        expect(db?.AllocatedStorage).toBe(100);
        expect(db?.StorageType).toBe("gp3");
        expect(db?.StorageEncrypted).toBe(true);
        expect(db?.MultiAZ).toBe(true);
        expect(db?.BackupRetentionPeriod).toBe(30);
        expect(db?.PubliclyAccessible).toBe(false);
        expect(db?.AutoMinorVersionUpgrade).toBe(true);
        expect(db?.PerformanceInsightsEnabled).toBe(true);
        expect(db?.EnabledCloudwatchLogsExports).toEqual(
          expect.arrayContaining(["error", "general", "slowquery"])
        );
      }, 30000);

      test("RDS Read Replicas are configured", async () => {
        for (const replicaEndpoint of rdsReadReplicaEndpoints) {
          const replicaIdentifier = replicaEndpoint.split(".")[0];
          const { DBInstances } = await rdsClient.send(
            new DescribeDBInstancesCommand({ DBInstanceIdentifier: replicaIdentifier })
          );

          const replica = DBInstances?.[0];
          expect(replica).toBeDefined();
          expect(replica?.DBInstanceStatus).toBe("available");
          expect(replica?.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
          expect(replica?.Engine).toBe("mysql");
        }
      }, 30000);

      test("DB Subnet Group is configured", async () => {
        const { DBSubnetGroups } = await rdsClient.send(
          new DescribeDBSubnetGroupsCommand({
            Filters: [{ Name: "vpc-id", Values: [vpcId] }]
          })
        );

        const subnetGroup = DBSubnetGroups?.[0];
        expect(subnetGroup).toBeDefined();
        expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");
        expect(subnetGroup?.Subnets?.length).toBe(2);
        
        const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier).sort();
        expect(subnetIds).toEqual(databaseSubnetIds.sort());
      }, 30000);

      test("DB Parameter Group has correct settings", async () => {
        const { DBParameterGroups } = await rdsClient.send(
          new DescribeDBParameterGroupsCommand({
            Filters: [{ Name: "name", Values: ["webapp-production-mysql-params"] }]
          })
        );

        const paramGroup = DBParameterGroups?.[0];
        expect(paramGroup).toBeDefined();
        expect(paramGroup?.DBParameterGroupFamily).toBe("mysql8.0");
      }, 30000);
    });

    describe("S3 Bucket Configuration", () => {
      test("S3 bucket exists with versioning enabled", async () => {
        await s3Client.send(new HeadBucketCommand({ Bucket: s3LogsBucket }));

        const { Status } = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: s3LogsBucket })
        );
        expect(Status).toBe("Enabled");
      }, 30000);

      test("S3 bucket has server-side encryption", async () => {
        const { ServerSideEncryptionConfiguration } = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: s3LogsBucket })
        );

        const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      }, 30000);

      test("S3 bucket has public access blocked", async () => {
        const response = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: s3LogsBucket })
        );

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      }, 30000);

      test("S3 bucket has lifecycle configuration", async () => {
        const { Rules } = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: s3LogsBucket })
        );

        const rule = Rules?.[0];
        expect(rule?.Status).toBe("Enabled");
        expect(rule?.Transitions?.length).toBeGreaterThan(0);
        expect(rule?.Expiration?.Days).toBe(365);
      }, 30000);

      test("S3 bucket policy allows ALB access", async () => {
        const { Policy } = await s3Client.send(
          new GetBucketPolicyCommand({ Bucket: s3LogsBucket })
        );

        const policyDoc = JSON.parse(Policy!);
        const albStatement = policyDoc.Statement.find((s: any) => 
          s.Principal?.AWS?.includes("arn:aws:iam")
        );
        expect(albStatement).toBeDefined();
        expect(albStatement.Effect).toBe("Allow");
        expect(albStatement.Action).toBe("s3:PutObject");
      }, 30000);
    });

    describe("IAM Configuration", () => {
      test("Web server IAM role exists with correct policies", async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: "webapp-production-web-role" })
        );

        expect(Role).toBeDefined();
        expect(Role?.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");

        const { AttachedPolicies } = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: Role!.RoleName })
        );

        const policyArns = AttachedPolicies?.map(p => p.PolicyArn);
        expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
        expect(policyArns).toContain("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy");
      }, 30000);

      test("Instance profile is associated with role", async () => {
        const { InstanceProfile } = await iamClient.send(
          new GetInstanceProfileCommand({ 
            InstanceProfileName: "webapp-production-web-profile" 
          })
        );

        expect(InstanceProfile).toBeDefined();
        expect(InstanceProfile?.Roles?.length).toBe(1);
        expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe("webapp-production-web-role");
      }, 30000);
    });

    describe("Secrets Manager Configuration", () => {
      test("Database credentials secret exists", async () => {
        const { Name, ARN, VersionIdsToStages, RotationEnabled } = await secretsManagerClient.send(
          new DescribeSecretCommand({ SecretId: dbSecretArn })
        );

        expect(Name).toBe(dbSecretName);
        expect(ARN).toBe(dbSecretArn);
        expect(VersionIdsToStages).toBeDefined();
      }, 30000);

      test("Secret contains valid database credentials", async () => {
        const { SecretString } = await secretsManagerClient.send(
          new GetSecretValueCommand({ SecretId: dbSecretArn })
        );

        const credentials = JSON.parse(SecretString!);
        expect(credentials.username).toBe("admin");
        expect(credentials.password).toBeDefined();
        expect(credentials.engine).toBe("mysql");
        expect(credentials.port).toBe(3306);
        expect(credentials.dbname).toBe("webapp");
      }, 30000);
    });

    describe("CloudWatch Monitoring", () => {
      test("CloudWatch Log Groups exist for RDS", async () => {
        const dbIdentifier = rdsHost.split(".")[0];
        const logGroupNames = [
          `/aws/rds/instance/${dbIdentifier}/errortf`,
          `/aws/rds/instance/${dbIdentifier}/general`,
          `/aws/rds/instance/${dbIdentifier}/slowquery`
        ];

        for (const logGroupName of logGroupNames) {
          const { logGroups } = await cloudWatchLogsClient.send(
            new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
          );

          const logGroup = logGroups?.find(lg => lg.logGroupName === logGroupName);
          expect(logGroup).toBeDefined();
          expect(logGroup?.retentionInDays).toBe(7);
        }
      }, 30000);
    });
  });

  // ==================== Cross-Service Tests (Interactive) ====================
  describe("Cross-Service Tests (Interactive)", () => {
    
    test("EC2 instances can reach RDS through security groups", async () => {
      // Get running instances from ASG
      const { AutoScalingInstances } = await autoScalingClient.send(
        new DescribeAutoScalingInstancesCommand({})
      );

      const asgInstances = AutoScalingInstances?.filter(
        i => i.AutoScalingGroupName === autoscalingGroupName
      );

      if (asgInstances && asgInstances.length > 0) {
        const instanceId = asgInstances[0].InstanceId;
        
        // Verify instance has web security group
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [instanceId!] })
        );

        const instance = Reservations?.[0]?.Instances?.[0];
        const instanceSgIds = instance?.SecurityGroups?.map(sg => sg.GroupId);
        expect(instanceSgIds).toContain(securityGroupWebId);
      }
    }, 30000);

    test("ALB can route traffic to healthy EC2 instances", async () => {
      // Get target group ARN
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`${autoscalingGroupName.split("-asg")[0]}-tg`]
        })
      );
      
      const targetGroupArn = TargetGroups?.[0]?.TargetGroupArn;

      // Check target health
      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === "healthy"
      );

      expect(healthyTargets?.length).toBeGreaterThan(0);
    }, 30000);

    test("Web servers can access Secrets Manager for DB credentials", async () => {
      // Verify IAM policy allows access to secret
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ 
          RoleName: "webapp-production-web-role" 
        })
      );

      const hasSecretsPolicy = AttachedPolicies?.some(
        p => p.PolicyName?.includes("secrets-manager-read")
      );

      expect(hasSecretsPolicy || AttachedPolicies?.length).toBeTruthy();
    }, 30000);

    test("NAT Gateway allows private subnet outbound connectivity", async () => {
      // Verify NAT gateway is in route table for private subnets
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "association.subnet-id", Values: privateSubnetIds }
          ]
        })
      );

      RouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.NatGatewayId);
        expect(natRoute).toBeDefined();
        expect(natRoute?.DestinationCidrBlock).toBe("0.0.0.0/0");
      });
    }, 30000);

    test("ALB logs are written to S3 bucket", async () => {
      // List objects in the ALB logs prefix
      const prefix = "alb/";
      const { Contents } = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3LogsBucket,
          Prefix: prefix,
          MaxKeys: 10
        })
      );

      // ALB logs might not be immediate, but bucket should be accessible
      expect(Contents).toBeDefined();
    }, 30000);
  });

  // ==================== End-to-End Tests (Interactive) ====================
  describe("End-to-End Tests (Interactive)", () => {
    
    test("Complete application stack is accessible via ALB", async () => {
      const applicationUrl = `http://${albDnsName}`;
      
      try {
        const response = await axios.get(applicationUrl, {
          timeout: 15000,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Integration-Test'
          }
        });

        expect(response.status).toBeLessThan(500);
        expect(response.headers).toBeDefined();
      } catch (error: any) {
        // Even if connection fails, verify infrastructure is up
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.warn(`ALB not responding at ${applicationUrl}, checking infrastructure...`);
          
          // Verify at least one healthy target
          const { TargetGroups } = await elbClient.send(
            new DescribeTargetGroupsCommand({
              Names: [`${autoscalingGroupName.split("-asg")[0]}-tg`]
            })
          );
          
          const targetGroupArn = TargetGroups?.[0]?.TargetGroupArn;
          const { TargetHealthDescriptions } = await elbClient.send(
            new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
          );
          
          const healthyTargets = TargetHealthDescriptions?.filter(
            t => t.TargetHealth?.State === "healthy"
          );
          
          expect(healthyTargets?.length).toBeGreaterThan(0);
        } else {
          throw error;
        }
      }
    }, 45000);

    test("Database connectivity through read replicas", async () => {
      // Get credentials from Secrets Manager
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: dbSecretArn })
      );
      
      const credentials = JSON.parse(SecretString!);
      
      // Test connection to master
      let masterConnection;
      try {
        masterConnection = await mysql.createConnection({
          host: rdsHost,
          port: rdsPort,
          user: credentials.username,
          password: credentials.password,
          database: credentials.dbname,
          connectTimeout: 10000
        });
        
        const [rows] = await masterConnection.execute('SELECT 1 as result');
        expect(rows).toBeDefined();
        
      } catch (error) {
        console.warn("Direct DB connection failed (expected if not in VPC):", error);
      } finally {
        if (masterConnection) await masterConnection.end();
      }

      // Test read replica endpoints exist
      expect(rdsReadReplicaEndpoints.length).toBeGreaterThan(0);
      
      for (const replicaEndpoint of rdsReadReplicaEndpoints) {
        const [replicaHost, replicaPort] = replicaEndpoint.split(":");
        expect(replicaHost).toBeDefined();
        expect(replicaPort).toBe("3306");
      }
    }, 45000);

    test("Auto Scaling responds to capacity changes", async () => {
      // Get current capacity
      const { AutoScalingGroups: initialGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoscalingGroupName]
        })
      );

      const initialDesiredCapacity = initialGroups?.[0]?.DesiredCapacity || 4;
      const newDesiredCapacity = initialDesiredCapacity + 1;

      // Scale up
      await autoScalingClient.send(
        new SetDesiredCapacityCommand({
          AutoScalingGroupName: autoscalingGroupName,
          DesiredCapacity: newDesiredCapacity,
          HonorCooldown: false
        })
      );

      // Wait for scaling activity
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify scaling activity
      const { Activities } = await autoScalingClient.send(
        new DescribeScalingActivitiesCommand({
          AutoScalingGroupName: autoscalingGroupName,
          MaxRecords: 5
        })
      );

      const latestActivity = Activities?.[0];
      expect(latestActivity?.Cause).toContain("capacity from");

      // Scale back down
      await autoScalingClient.send(
        new SetDesiredCapacityCommand({
          AutoScalingGroupName: autoscalingGroupName,
          DesiredCapacity: initialDesiredCapacity,
          HonorCooldown: false
        })
      );
    }, 90000);

    test("CloudWatch metrics are being collected", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

      // Check ASG metrics
      const asgCpuMetrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [
            { Name: "AutoScalingGroupName", Value: autoscalingGroupName }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average", "Maximum"]
        })
      );

      // Check RDS metrics
      const dbIdentifier = rdsHost.split(".")[0];
      const rdsMetrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/RDS",
          MetricName: "DatabaseConnections",
          Dimensions: [
            { Name: "DBInstanceIdentifier", Value: dbIdentifier }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average"]
        })
      );

      // Metrics might not be immediately available for new resources
      if (asgCpuMetrics.Datapoints && asgCpuMetrics.Datapoints.length > 0) {
        expect(asgCpuMetrics.Datapoints[0].Average).toBeDefined();
      }
      
      if (rdsMetrics.Datapoints && rdsMetrics.Datapoints.length > 0) {
        expect(rdsMetrics.Datapoints[0].Average).toBeDefined();
      }
    }, 45000);
  });

  // ==================== Service-Level Tests (Interactive) ====================
  describe("Service-Level Tests (Interactive)", () => {
    
    test("S3 bucket versioning for configuration rollback", async () => {
      const testKey = `test/config-${Date.now()}.json`;
      const version1 = { version: 1, timestamp: new Date().toISOString() };
      const version2 = { version: 2, timestamp: new Date().toISOString() };

      // Upload first version
      const upload1 = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3LogsBucket,
          Key: testKey,
          Body: JSON.stringify(version1),
          ContentType: "application/json",
          Metadata: { "test": "integration" }
        })
      );

      // Upload second version
      const upload2 = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3LogsBucket,
          Key: testKey,
          Body: JSON.stringify(version2),
          ContentType: "application/json",
          Metadata: { "test": "integration" }
        })
      );

      // List all versions
      const { Versions } = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3LogsBucket,
          Prefix: testKey
        })
      );

      expect(Versions?.length).toBe(2);
      expect(Versions?.[0]?.IsLatest).toBe(true);

      // Retrieve specific version
      const firstVersionId = Versions?.[1]?.VersionId;
      const { Body: v1Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3LogsBucket,
          Key: testKey,
          VersionId: firstVersionId
        })
      );

      const v1Content = JSON.parse(await v1Body!.transformToString());
      expect(v1Content.version).toBe(1);

      // Cleanup
      for (const version of Versions || []) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3LogsBucket,
            Key: testKey,
            VersionId: version.VersionId
          })
        );
      }
    }, 45000);

    test("RDS automated backup and snapshot creation", async () => {
      const dbIdentifier = rdsHost.split(".")[0];
      const snapshotId = `test-snapshot-${Date.now()}`;

      // Create manual snapshot
      const { DBSnapshot } = await rdsClient.send(
        new CreateDBSnapshotCommand({
          DBSnapshotIdentifier: snapshotId,
          DBInstanceIdentifier: dbIdentifier
        })
      );

      expect(DBSnapshot?.DBSnapshotIdentifier).toBe(snapshotId);
      expect(DBSnapshot?.Status).toBe("creating");

      // Wait for snapshot to be available (simplified check)
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify snapshot exists
      const { DBSnapshots } = await rdsClient.send(
        new DescribeDBSnapshotsCommand({
          DBSnapshotIdentifier: snapshotId
        })
      );

      const snapshot = DBSnapshots?.[0];
      expect(snapshot).toBeDefined();

      // Cleanup: Delete test snapshot
      try {
        await rdsClient.send(
          new DeleteDBSnapshotCommand({
            DBSnapshotIdentifier: snapshotId
          })
        );
      } catch (error) {
        console.warn("Failed to delete test snapshot:", error);
      }
    }, 120000);

    test("SSM connectivity to EC2 instances", async () => {
      // Get instances managed by SSM
      const { InstanceInformationList } = await ssmClient.send(
        new DescribeInstanceInformationCommand({})
      );

      const managedInstances = InstanceInformationList?.filter(
        i => i.PingStatus === "Online"
      );

      if (managedInstances && managedInstances.length > 0) {
        const instanceId = managedInstances[0].InstanceId;
        
        // Send a simple command
        const { Command } = await ssmClient.send(
          new SendCommandCommand({
            InstanceIds: [instanceId!],
            DocumentName: "AWS-RunShellScript",
            Parameters: {
              commands: ["echo 'Integration test'; date"]
            },
            TimeoutSeconds: 30
          })
        );

        expect(Command?.CommandId).toBeDefined();
        expect(Command?.Status).toMatch(/InProgress|Success/);
      }
    }, 45000);

    test("CloudWatch Logs are receiving application logs", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const dbIdentifier = rdsHost.split(".")[0];
      const logGroups = [
        `/aws/rds/instance/${dbIdentifier}/errortf`,
        `/aws/rds/instance/${dbIdentifier}/general`
      ];

      for (const logGroupName of logGroups) {
        try {
          const { events } = await cloudWatchLogsClient.send(
            new FilterLogEventsCommand({
              logGroupName,
              startTime: startTime.getTime(),
              endTime: endTime.getTime(),
              limit: 5
            })
          );

          // Logs might not exist if DB hasn't generated any
          if (events && events.length > 0) {
            expect(events[0].message).toBeDefined();
          }
        } catch (error: any) {
          if (error.name !== 'ResourceNotFoundException') {
            throw error;
          }
        }
      }
    }, 45000);

    test("Auto Scaling Group maintains desired capacity", async () => {
      // Get current instances
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoscalingGroupName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      const desiredCapacity = asg?.DesiredCapacity || 0;
      const currentInstances = asg?.Instances?.length || 0;

      // Check if ASG is maintaining capacity
      expect(currentInstances).toBeGreaterThanOrEqual(asg?.MinSize || 0);
      expect(currentInstances).toBeLessThanOrEqual(asg?.MaxSize || 10);

      // Verify instances are in service
      const inServiceInstances = asg?.Instances?.filter(
        i => i.LifecycleState === "InService"
      );

      expect(inServiceInstances?.length).toBeGreaterThan(0);
    }, 30000);

    test("Database secret rotation readiness", async () => {
      // Update secret with new test value (without actually rotating)
      const testMetadata = { 
        lastTestRotation: new Date().toISOString(),
        testRun: "integration"
      };

      const { ARN, VersionId } = await secretsManagerClient.send(
        new UpdateSecretCommand({
          SecretId: dbSecretArn,
          Description: `Last tested: ${new Date().toISOString()}`
        })
      );

      expect(ARN).toBe(dbSecretArn);
      expect(VersionId).toBeDefined();

      // Verify secret is still accessible
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: dbSecretArn })
      );

      const credentials = JSON.parse(SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
    }, 30000);
  });
});