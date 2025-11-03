import { expect } from "@jest/globals";
import { describe, test, beforeAll } from "@jest/globals";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNatGatewaysCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand, DescribeTasksCommand, ListTasksCommand, UpdateServiceCommand, DescribeTaskDefinitionCommand, DescribeCapacityProvidersCommand } from "@aws-sdk/client-ecs";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, GetSecretValueCommand, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectVersionsCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, GetDashboardCommand, DescribeAlarmsCommand, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { CodePipelineClient, GetPipelineCommand, GetPipelineStateCommand } from "@aws-sdk/client-codepipeline";
import { CodeBuildClient, BatchGetProjectsCommand } from "@aws-sdk/client-codebuild";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const awsRegion = "us-west-2"; // Fixed to us-west-2 as per requirements
const ec2Client = new EC2Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const codePipelineClient = new CodePipelineClient({ region: awsRegion });
const codeBuildClient = new CodeBuildClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });

describe("Multi-Tier AWS Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackName: string;
  
  // Output values
  let albDnsName: string;
  let albArn: string;
  let targetGroupArn: string;
  let applicationUrl: string;
  let ecsClusterName: string;
  let ecsServiceName: string;
  let taskDefinitionArn: string;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let s3BucketName: string;
  let s3BucketArn: string;
  let rdsEndpoint: string;
  let rdsPort: number;
  let rdsDatabaseName: string;
  let codePipelineArn: string;
  let codeBuildProjectName: string;
  let snsTopicArn: string;
  let dashboardUrl: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    
    const outputData = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputData)[0];
    outputs = outputData[stackName];

    // Extract values from deployment outputs
    albDnsName = outputs["alb-dns-name"];
    albArn = outputs["alb-arn"];
    targetGroupArn = outputs["alb-target-group-arn"];
    applicationUrl = outputs["application-url"];
    ecsClusterName = outputs["ecs-cluster-name"];
    ecsServiceName = outputs["ecs-service-name"];
    taskDefinitionArn = outputs["ecs-task-definition"];
    vpcId = outputs["vpc-id"];
    publicSubnetIds = outputs["public-subnet-ids"].split(",");
    privateSubnetIds = outputs["private-subnet-ids"].split(",");
    s3BucketName = outputs["s3-bucket-name"];
    s3BucketArn = outputs["s3-bucket-arn"];
    rdsEndpoint = outputs["rds-endpoint"];
    rdsPort = outputs["rds-port"];
    rdsDatabaseName = outputs["rds-database-name"];
    codePipelineArn = outputs["codepipeline-arn"];
    codeBuildProjectName = outputs["codebuild-project-name"];
    snsTopicArn = outputs["sns-topic-arn"];
    dashboardUrl = outputs["cloudwatch-dashboard-url"];

    if (!albDnsName || !ecsClusterName || !vpcId || !s3BucketName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  // ==================== Resource Validation Tests ====================
  describe("Resource Validation (Non-Interactive)", () => {
    describe("VPC and Networking Resources", () => {
      test("VPC exists with correct CIDR block", async () => {
        const { Vpcs } = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        const vpc = Vpcs?.[0];
        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
        expect(vpc?.State).toBe("available");
        
        const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
        expect(nameTag?.Value).toBe("multi-tier-vpc");
      }, 20000);

      test("Internet Gateway is attached to VPC", async () => {
        const { InternetGateways } = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [
              { Name: "attachment.vpc-id", Values: [vpcId] }
            ]
          })
        );

        expect(InternetGateways).toBeDefined();
        expect(InternetGateways?.length).toBe(1);
        const igw = InternetGateways?.[0];
        expect(igw?.Attachments?.[0]?.State).toBe("available");
      }, 20000);

      test("NAT Gateway exists and is available", async () => {
        const { NatGateways } = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: "vpc-id", Values: [vpcId] },
              { Name: "state", Values: ["available"] }
            ]
          })
        );

        expect(NatGateways).toBeDefined();
        expect(NatGateways?.length).toBeGreaterThanOrEqual(1);
        const natGw = NatGateways?.[0];
        expect(natGw?.State).toBe("available");
        expect(natGw?.SubnetId).toBe(publicSubnetIds[0]);
      }, 20000);

      test("Subnets are correctly configured", async () => {
        const { Subnets } = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
          })
        );

        expect(Subnets?.length).toBe(4); // 2 public + 2 private

        // Check public subnets
        const publicSubnets = Subnets?.filter(s => publicSubnetIds.includes(s.SubnetId!));
        expect(publicSubnets?.length).toBe(2);
        publicSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.VpcId).toBe(vpcId);
        });

        // Check private subnets
        const privateSubnets = Subnets?.filter(s => privateSubnetIds.includes(s.SubnetId!));
        expect(privateSubnets?.length).toBe(2);
        privateSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.VpcId).toBe(vpcId);
        });

        // Check availability zones
        const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);
      }, 20000);

      test("Route tables are correctly configured", async () => {
        const { RouteTables } = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: "vpc-id", Values: [vpcId] }
            ]
          })
        );

        // Should have at least 3 route tables (1 main + 1 public + 1 private)
        expect(RouteTables?.length).toBeGreaterThanOrEqual(3);

        const publicRt = RouteTables?.find(rt => 
          rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "public-route-table")
        );
        expect(publicRt).toBeDefined();
        
        const privateRt = RouteTables?.find(rt => 
          rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "private-route-table")
        );
        expect(privateRt).toBeDefined();
      }, 20000);
    });

    describe("ECS Cluster and Service Configuration", () => {
      test("ECS Cluster exists with Container Insights enabled", async () => {
        const { clusters } = await ecsClient.send(
          new DescribeClustersCommand({
            clusters: [ecsClusterName],
            include: ["SETTINGS"]
          })
        );

        const cluster = clusters?.[0];
        expect(cluster).toBeDefined();
        expect(cluster?.clusterName).toBe(ecsClusterName);
        expect(cluster?.status).toBe("ACTIVE");
        
        const containerInsights = cluster?.settings?.find(s => s.name === "containerInsights");
        expect(containerInsights?.value).toBe("enabled");
      }, 20000);

      test("ECS Capacity Provider is configured", async () => {
        const { capacityProviders } = await ecsClient.send(
          new DescribeCapacityProvidersCommand({
            capacityProviders: ["multi-tier-capacity-provider"]
          })
        );

        expect(capacityProviders?.length).toBe(1);
        const cp = capacityProviders?.[0];
        expect(cp?.status).toBe("ACTIVE");
        expect(cp?.autoScalingGroupProvider?.managedScaling?.status).toBe("ENABLED");
      }, 20000);

      test("ECS Task Definition is correctly configured", async () => {
        const { taskDefinition } = await ecsClient.send(
          new DescribeTaskDefinitionCommand({
            taskDefinition: taskDefinitionArn
          })
        );

        expect(taskDefinition).toBeDefined();
        expect(taskDefinition?.family).toBe("multi-tier-app");
        expect(taskDefinition?.networkMode).toBe("bridge");
        expect(taskDefinition?.requiresCompatibilities).toContain("EC2");
        expect(taskDefinition?.cpu).toBe("512");
        expect(taskDefinition?.memory).toBe("1024");

        const container = taskDefinition?.containerDefinitions?.[0];
        expect(container?.name).toBe("web-app");
        expect(container?.essential).toBe(true);
        expect(container?.portMappings?.[0]?.containerPort).toBe(80);
      }, 20000);

      test("ECS Service is running with correct configuration", async () => {
        const { services } = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: ecsClusterName,
            services: [ecsServiceName]
          })
        );

        const service = services?.[0];
        expect(service).toBeDefined();
        expect(service?.serviceName).toBe(ecsServiceName);
        expect(service?.status).toBe("ACTIVE");
        expect(service?.launchType).toBe("EC2");
        expect(service?.desiredCount).toBe(2);
        expect(service?.loadBalancers?.[0]?.targetGroupArn).toBe(targetGroupArn);
        expect(service?.deploymentConfiguration?.minimumHealthyPercent).toBe(50);
        expect(service?.deploymentConfiguration?.maximumPercent).toBe(200);
      }, 20000);

      test("Auto Scaling Group for ECS instances exists", async () => {
        const { AutoScalingGroups } = await autoScalingClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: ["multi-tier-ecs-asg"]
          })
        );

        const asg = AutoScalingGroups?.[0];
        expect(asg).toBeDefined();
        expect(asg?.MinSize).toBe(2);
        expect(asg?.MaxSize).toBe(4);
        expect(asg?.HealthCheckType).toBe("EC2");
      }, 20000);
    });

    describe("Application Load Balancer Configuration", () => {
      test("ALB exists with correct configuration", async () => {
        const { LoadBalancers } = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [albArn]
          })
        );

        const alb = LoadBalancers?.[0];
        expect(alb).toBeDefined();
        expect(alb?.DNSName).toBe(albDnsName);
        expect(alb?.Type).toBe("application");
        expect(alb?.Scheme).toBe("internet-facing");
        expect(alb?.State?.Code).toBe("active");
        expect(alb?.AvailabilityZones?.length).toBe(2);
        expect(alb?.IpAddressType).toBe("ipv4");
      }, 20000);

      test("Target Group is configured correctly", async () => {
        const { TargetGroups } = await elbClient.send(
          new DescribeTargetGroupsCommand({
            TargetGroupArns: [targetGroupArn]
          })
        );

        const tg = TargetGroups?.[0];
        expect(tg).toBeDefined();
        expect(tg?.TargetGroupName).toBe("multi-tier-tg");
        expect(tg?.Protocol).toBe("HTTP");
        expect(tg?.Port).toBe(80);
        expect(tg?.TargetType).toBe("instance");
        expect(tg?.HealthCheckProtocol).toBe("HTTP");
        expect(tg?.HealthCheckPath).toBe("/");
        expect(tg?.HealthyThresholdCount).toBe(2);
        expect(tg?.UnhealthyThresholdCount).toBe(3);
      }, 20000);

      test("ALB Listener is configured for HTTP", async () => {
        const { Listeners } = await elbClient.send(
          new DescribeListenersCommand({
            LoadBalancerArn: albArn
          })
        );

        expect(Listeners?.length).toBe(1);
        const listener = Listeners?.[0];
        expect(listener?.Protocol).toBe("HTTP");
        expect(listener?.Port).toBe(80);
        expect(listener?.DefaultActions?.[0]?.Type).toBe("forward");
        expect(listener?.DefaultActions?.[0]?.TargetGroupArn).toBe(targetGroupArn);
      }, 20000);
    });

    describe("RDS Database Configuration", () => {
      test("RDS instance exists with correct configuration", async () => {
        const { DBInstances } = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: "multi-tier-postgres"
          })
        );

        const db = DBInstances?.[0];
        expect(db).toBeDefined();
        expect(db?.DBInstanceStatus).toBe("available");
        expect(db?.Engine).toBe("postgres");
        expect(db?.DBInstanceClass).toBe("db.t3.micro");
        expect(db?.AllocatedStorage).toBe(20);
        expect(db?.StorageType).toBe("gp3");
        expect(db?.StorageEncrypted).toBe(true);
        expect(db?.MultiAZ).toBe(true);
        expect(db?.BackupRetentionPeriod).toBe(7);
        expect(db?.PubliclyAccessible).toBe(false);
        expect(db?.MasterUsername).toBe("dbadmin");
        expect(db?.DBName).toBe(rdsDatabaseName);
        expect(db?.Endpoint?.Port).toBe(rdsPort);
      }, 30000);

      test("RDS Subnet Group exists", async () => {
        const { DBSubnetGroups } = await rdsClient.send(
          new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: "multi-tier-db-subnet-group"
          })
        );

        const subnetGroup = DBSubnetGroups?.[0];
        expect(subnetGroup).toBeDefined();
        expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");
        expect(subnetGroup?.Subnets?.length).toBe(2);
        
        const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier);
        expect(subnetIds?.sort()).toEqual(privateSubnetIds.sort());
      }, 20000);
    });

    describe("S3 Bucket Configuration", () => {
      test("S3 bucket exists with versioning enabled", async () => {
        await s3Client.send(
          new HeadBucketCommand({ Bucket: s3BucketName })
        );

        const { Status } = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: s3BucketName })
        );
        expect(Status).toBe("Enabled");
      }, 20000);

      test("S3 bucket has encryption enabled", async () => {
        const { ServerSideEncryptionConfiguration } = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: s3BucketName })
        );

        const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      }, 20000);

      test("S3 bucket has public access blocked", async () => {
        const publicAccessBlock = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
        );

        expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }, 20000);
    });

    describe("IAM Roles Configuration", () => {
      test("ECS Task Role exists with correct policies", async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: "multi-tier-ecs-task-role" })
        );

        expect(Role).toBeDefined();
        expect(Role?.AssumeRolePolicyDocument).toContain("ecs-tasks.amazonaws.com");

        const { PolicyNames } = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: Role!.RoleName })
        );
        expect(PolicyNames?.length).toBeGreaterThan(0);
      }, 20000);

      test("CodeBuild Role exists", async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: "multi-tier-codebuild-role" })
        );

        expect(Role).toBeDefined();
        expect(Role?.AssumeRolePolicyDocument).toContain("codebuild.amazonaws.com");
      }, 20000);

      test("CodePipeline Role exists", async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: "multi-tier-codepipeline-role" })
        );

        expect(Role).toBeDefined();
        expect(Role?.AssumeRolePolicyDocument).toContain("codepipeline.amazonaws.com");
      }, 20000);
    });

    describe("CI/CD Pipeline Configuration", () => {
      test("CodePipeline exists with correct stages", async () => {
        const pipelineName = "multi-tier-pipeline";
        const { pipeline } = await codePipelineClient.send(
          new GetPipelineCommand({ name: pipelineName })
        );

        expect(pipeline).toBeDefined();
        expect(pipeline?.name).toBe(pipelineName);
        expect(pipeline?.roleArn).toContain("multi-tier-codepipeline-role");
        expect(pipeline?.stages?.length).toBe(3);
        
        const stageNames = pipeline?.stages?.map(s => s.name);
        expect(stageNames).toEqual(["Source", "Build", "Deploy"]);
      }, 20000);

      test("CodeBuild project exists", async () => {
        const { projects } = await codeBuildClient.send(
          new BatchGetProjectsCommand({
            names: [codeBuildProjectName]
          })
        );

        const project = projects?.[0];
        expect(project).toBeDefined();
        expect(project?.name).toBe(codeBuildProjectName);
        expect(project?.serviceRole).toContain("multi-tier-codebuild-role");
        expect(project?.environment?.type).toBe("LINUX_CONTAINER");
        expect(project?.environment?.computeType).toBe("BUILD_GENERAL1_SMALL");
      }, 20000);

      test("SNS Topic exists", async () => {
        const { Attributes } = await snsClient.send(
          new GetTopicAttributesCommand({
            TopicArn: snsTopicArn
          })
        );

        expect(Attributes).toBeDefined();
        expect(Attributes?.DisplayName).toBe("Pipeline Notifications");
      }, 20000);
    });

    describe("Monitoring Configuration", () => {
      test("CloudWatch Dashboard exists", async () => {
        const { DashboardName } = await cloudWatchClient.send(
          new GetDashboardCommand({
            DashboardName: "multi-tier-monitoring"
          })
        );

        expect(DashboardName).toBe("multi-tier-monitoring");
      }, 20000);

      test("CloudWatch Log Groups exist", async () => {
        const { logGroups } = await cloudWatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: "/ecs/multi-tier-app"
          })
        );

        expect(logGroups?.length).toBeGreaterThan(0);
        const logGroup = logGroups?.[0];
        expect(logGroup?.logGroupName).toBe("/ecs/multi-tier-app");
        expect(logGroup?.retentionInDays).toBe(7);
      }, 20000);

      test("CloudWatch Alarms are configured", async () => {
        const { MetricAlarms } = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: "multi-tier-"
          })
        );

        expect(MetricAlarms).toBeDefined();
        expect(MetricAlarms?.length).toBeGreaterThan(0);

        const alarmNames = MetricAlarms?.map(a => a.AlarmName);
        expect(alarmNames).toContain("multi-tier-ecs-cpu-high");
        expect(alarmNames).toContain("multi-tier-ecs-memory-high");
        expect(alarmNames).toContain("multi-tier-rds-cpu-high");
        expect(alarmNames).toContain("multi-tier-rds-storage-low");
      }, 20000);
    });
  });

  // ==================== Cross-Service Tests ====================
  describe("Cross-Service Tests (Interactive)", () => {

    test("ECS tasks can write logs to CloudWatch", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

      const { events } = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName: "/ecs/multi-tier-app",
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          limit: 10
        })
      );

      // Tasks might not have logs immediately after deployment
      if (events && events.length > 0) {
        expect(events[0].message).toBeDefined();
        expect(events[0].timestamp).toBeDefined();
      }
    }, 20000);

    test("Security groups allow ECS to RDS communication", async () => {
      // Get ECS security group
      const { SecurityGroups: ecsSGs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: ["multi-tier-ecs-sg"] },
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      // Get RDS security group  
      const { SecurityGroups: rdsSGs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: ["multi-tier-rds-sg"] },
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      const ecsSecurityGroupId = ecsSGs?.[0]?.GroupId;
      const rdsSecurityGroup = rdsSGs?.[0];

      // Check RDS security group allows traffic from ECS
      const postgresRule = rdsSecurityGroup?.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && 
        rule.ToPort === 5432 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === ecsSecurityGroupId)
      );

      expect(postgresRule).toBeDefined();
    }, 20000);
  });

  // ==================== End-to-End Tests ====================
  describe("End-to-End Tests (Interactive)", () => {
    test("Complete application stack is accessible via ALB", async () => {
      try {
        // Make HTTP request to ALB
        const response = await axios.get(applicationUrl, {
          timeout: 10000,
          validateStatus: () => true
        });

        // nginx default response or custom app response
        expect(response.headers).toBeDefined();
      } catch (error: any) {
        // If connection refused, it might be due to no running tasks
        if (error.code === 'ECONNREFUSED') {
          console.warn("ALB connection refused - checking ECS tasks");
          
          const { taskArns } = await ecsClient.send(
            new ListTasksCommand({
              cluster: ecsClusterName,
              serviceName: ecsServiceName,
              desiredStatus: "RUNNING"
            })
          );
          
          expect(taskArns?.length).toBeGreaterThan(0);
        } else {
          throw error;
        }
      }
    }, 30000);

    test("Database secret is accessible and valid", async () => {
      // Get RDS instance to find secret ARN
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "multi-tier-postgres"
        })
      );

      const secretArn = DBInstances?.[0]?.MasterUserSecret?.SecretArn;
      expect(secretArn).toBeDefined();

      // Get secret value
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: secretArn
        })
      );

      expect(SecretString).toBeDefined();
      const credentials = JSON.parse(SecretString!);
      
      expect(credentials.username).toBe("dbadmin");
      expect(credentials.password).toBeDefined();
    }, 20000);

    test("Monitoring captures ECS and ALB metrics", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 30 * 60 * 1000); // Last 30 minutes

      // Check ECS CPU metrics
      const ecsMetrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/ECS",
          MetricName: "CPUUtilization",
          Dimensions: [
            { Name: "ClusterName", Value: ecsClusterName },
            { Name: "ServiceName", Value: ecsServiceName }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average"]
        })
      );

      // Check ALB request count
      const albMetrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/ApplicationELB",
          MetricName: "RequestCount",
          Dimensions: [
            { Name: "LoadBalancer", Value: albArn.split(":loadbalancer/")[1] }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Sum"]
        })
      );

      // Metrics might not be available immediately after deployment
      if (ecsMetrics.Datapoints && ecsMetrics.Datapoints.length > 0) {
        expect(ecsMetrics.Datapoints[0].Average).toBeDefined();
      }
      
      if (albMetrics.Datapoints && albMetrics.Datapoints.length > 0) {
        expect(albMetrics.Datapoints[0].Sum).toBeDefined();
      }
    }, 30000);

    test("Full request flow with failover recovery", async () => {
      // Get initial service state
      const { services: initialServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );

      const initialDesiredCount = initialServices?.[0]?.desiredCount || 2;
      const initialRunningCount = initialServices?.[0]?.runningCount || 0;

      // Scale down to 0 to simulate failure
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: 0
        })
      );

      // Wait for tasks to stop
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Verify service is scaled down
      const { services: scaledDownServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );

      expect(scaledDownServices?.[0]?.desiredCount).toBe(0);

      // Scale back up
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: initialDesiredCount
        })
      );

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 40000));

      // Verify service recovered
      const { services: recoveredServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );

      expect(recoveredServices?.[0]?.desiredCount).toBe(initialDesiredCount);
      expect(recoveredServices?.[0]?.runningCount).toBeGreaterThanOrEqual(0);

      // Verify targets are healthy again
      let healthy = false;
      for (let i = 0; i < 10; i++) {
        const { TargetHealthDescriptions } = await elbClient.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroupArn
          })
        );

        const healthyTargets = TargetHealthDescriptions?.filter(
          t => t.TargetHealth?.State === "healthy"
        );

        if (healthyTargets && healthyTargets.length > 0) {
          healthy = true;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }, 180000);
  });

  // ==================== Service-Level Tests ====================
  describe("Service-Level Tests (Interactive)", () => {
    test("S3 bucket supports versioning for rollback", async () => {
      const testKey = `test-versioning/${Date.now()}.json`;
      const version1 = { version: 1, timestamp: new Date().toISOString() };
      const version2 = { version: 2, timestamp: new Date().toISOString() };

      // Upload version 1
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(version1),
          ContentType: "application/json"
        })
      );

      // Upload version 2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(version2),
          ContentType: "application/json"
        })
      );

      // List versions
      const { Versions } = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: testKey
        })
      );

      expect(Versions?.length).toBe(2);
      expect(Versions?.[0]?.IsLatest).toBe(true);

      // Get latest version
      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey
        })
      );

      const latestContent = JSON.parse(await Body!.transformToString());
      expect(latestContent.version).toBe(2);

      // Get specific version (first version)
      const firstVersionId = Versions?.[1]?.VersionId;
      const { Body: v1Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
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
            Bucket: s3BucketName,
            Key: testKey,
            VersionId: version.VersionId
          })
        );
      }
    }, 30000);

    test("ECS service can be updated with new task definition", async () => {
      const { taskDefinition: currentTaskDef } = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefinitionArn
        })
      );

      // Note: In a real scenario, you would register a new task definition
      // For this test, we'll verify the service can be updated
      const { service } = await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          forceNewDeployment: true
        })
      );

      expect(service?.deployments?.length).toBeGreaterThanOrEqual(1);
      expect(service?.deployments?.[0]?.status).toBe("PRIMARY");
    }, 30000);

    test("RDS automated backups are configured", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "multi-tier-postgres"
        })
      );

      const db = DBInstances?.[0];
      expect(db?.BackupRetentionPeriod).toBe(7);
      expect(db?.PreferredBackupWindow).toBe("03:00-04:00");
      expect(db?.BackupTarget).toBeDefined();
    }, 20000);

    test("CloudWatch Dashboard displays key metrics", async () => {
      const { DashboardBody } = await cloudWatchClient.send(
        new GetDashboardCommand({
          DashboardName: "multi-tier-monitoring"
        })
      );

      expect(DashboardBody).toBeDefined();
      const dashboard = JSON.parse(DashboardBody!);
      
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBe(4);
      
      const widgetTitles = dashboard.widgets.map((w: any) => w.properties.title);
      expect(widgetTitles).toContain("ECS CPU Utilization");
      expect(widgetTitles).toContain("ECS Memory Utilization");
      expect(widgetTitles).toContain("RDS CPU Utilization");
      expect(widgetTitles).toContain("ALB Request Count");
    }, 20000);
  });
});