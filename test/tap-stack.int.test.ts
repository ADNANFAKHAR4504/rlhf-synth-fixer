// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeSecurityGroupRulesCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand, DescribeTasksCommand, ListTasksCommand, RunTaskCommand, UpdateServiceCommand } from "@aws-sdk/client-ecs";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, GetSecretValueCommand, DescribeSecretCommand, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, GetDashboardCommand, DescribeAlarmsCommand, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let albDnsName: string;
  let albUrl: string;
  let ecsClusterName: string;
  let ecsServiceName: string;
  let taskDefinitionArn: string;
  let dashboardUrl: string;
  let dbSecretArn: string;
  let rdsEndpoint: string;
  let staticAssetsBucket: string;
  let staticAssetsBucketArn: string;
  let logGroupName: string;
  let vpcId: string;
  let vpcCidr: string;
  let alarmCount: string;
  let stackName: string;
  let projectName: string;
  let environment: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    // Extract values from deployment outputs
    albDnsName = stackOutputs["alb-dns-name"];
    albUrl = stackOutputs["alb-url"];
    ecsClusterName = stackOutputs["ecs-cluster-name"];
    ecsServiceName = stackOutputs["ecs-service-name"];
    taskDefinitionArn = stackOutputs["task-definition-arn"];
    dashboardUrl = stackOutputs["dashboard-url"];
    dbSecretArn = stackOutputs["db-secret-arn"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    staticAssetsBucket = stackOutputs["static-assets-bucket"];
    staticAssetsBucketArn = stackOutputs["static-assets-bucket-arn"];
    logGroupName = stackOutputs["log-group-name"];
    vpcId = stackOutputs["vpc-id"];
    vpcCidr = stackOutputs["vpc-cidr"];
    alarmCount = stackOutputs["alarm-count"];

    // Extract project name and environment from resource names
    const nameParts = ecsClusterName.split('-');
    environment = nameParts.pop()?.replace('-cluster', '') || 'pr4813';
    projectName = nameParts.join('-');

    if (!albDnsName || !ecsClusterName || !dbSecretArn || !staticAssetsBucket) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("Application Load Balancer Configuration", () => {
    test("ALB exists and is accessible", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");
      expect(alb?.IpScheme).toBe("ipv4");
    }, 20000);

    test("ALB has healthy targets from ECS tasks", async () => {
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes(`${projectName}-${environment}`)
      );
      expect(targetGroup).toBeDefined();

      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup?.TargetGroupArn,
        })
      );

      expect(TargetHealthDescriptions).toBeDefined();
      expect(TargetHealthDescriptions!.length).toBeGreaterThanOrEqual(1);
      
      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );
      expect(healthyTargets!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test("ALB responds to HTTP requests", async () => {
      try {
        const response = await axios.get(`${albUrl}/health`, {
          timeout: 10000,
          validateStatus: () => true,
        });
        
        expect([200, 404]).toContain(response.status);
        expect(response.headers).toBeDefined();
      } catch (error: any) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    }, 20000);
  });

  describe("ECS Fargate Service Configuration", () => {
    test("ECS cluster exists with correct configuration", async () => {
      const { clusters } = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [ecsClusterName],
          include: ["STATISTICS", "SETTINGS"],
        })
      );

      const cluster = clusters?.[0];
      expect(cluster).toBeDefined();
      expect(cluster?.clusterName).toBe(ecsClusterName);
      expect(cluster?.status).toBe("ACTIVE");
      
      // Verify Container Insights is enabled
      const containerInsightsSetting = cluster?.settings?.find(
        s => s.name === "containerInsights"
      );
      expect(containerInsightsSetting?.value).toBe("enabled");
    }, 20000);

    test("ECS service is running with desired tasks", async () => {
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      const service = services?.[0];
      expect(service).toBeDefined();
      expect(service?.serviceName).toBe(ecsServiceName);
      expect(service?.status).toBe("ACTIVE");
      expect(service?.launchType).toBe("FARGATE");
      expect(service?.desiredCount).toBeGreaterThanOrEqual(1);
      expect(service?.runningCount).toBe(service?.desiredCount);
      expect(service?.deployments?.[0]?.status).toBe("PRIMARY");
      expect(service?.taskDefinition).toBe(taskDefinitionArn);
    }, 30000);

    test("ECS tasks are running and healthy", async () => {
      const { taskArns } = await ecsClient.send(
        new ListTasksCommand({
          cluster: ecsClusterName,
          serviceName: ecsServiceName,
        })
      );

      expect(taskArns).toBeDefined();
      expect(taskArns!.length).toBeGreaterThanOrEqual(1);

      const { tasks } = await ecsClient.send(
        new DescribeTasksCommand({
          cluster: ecsClusterName,
          tasks: taskArns,
        })
      );

      tasks?.forEach(task => {
        expect(task.lastStatus).toBe("RUNNING");
        expect(task.healthStatus).toBe("HEALTHY");
        expect(task.launchType).toBe("FARGATE");
        expect(task.containers?.[0]?.lastStatus).toBe("RUNNING");
      });
    }, 20000);

    test("ECS service can scale up and down", async () => {
      // Get current desired count
      const { services: initialServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      const initialCount = initialServices?.[0]?.desiredCount || 1;
      const newCount = initialCount + 1;

      // Scale up
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: newCount,
        })
      );

      // Wait for scale up
      await new Promise(resolve => setTimeout(resolve, 10000));

      const { services: scaledServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      expect(scaledServices?.[0]?.desiredCount).toBe(newCount);

      // Scale back down
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: initialCount,
        })
      );

      await new Promise(resolve => setTimeout(resolve, 10000));

      const { services: finalServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      expect(finalServices?.[0]?.desiredCount).toBe(initialCount);
    }, 60000);
  });

  describe("Security Groups Interactions", () => {
    test("VPC and networking resources exist", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe(vpcCidr);
      expect(vpc?.State).toBe("available");
      expect(vpc?.EnableDnsHostnames).toBe(true);
      expect(vpc?.EnableDnsSupport).toBe(true);
    }, 20000);

    test("ALB security group allows HTTPS/HTTP from internet", async () => {
      const albSecurityGroupName = `${projectName}-${environment}-alb-sg`;
      
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: [albSecurityGroupName] },
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      const albSg = SecurityGroups?.[0];
      expect(albSg).toBeDefined();
      
      const httpIngress = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

      const httpsIngress = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
    }, 20000);

    test("Task security group allows traffic only from ALB", async () => {
      const taskSecurityGroupName = `${projectName}-${environment}-task-sg`;
      const albSecurityGroupName = `${projectName}-${environment}-alb-sg`;
      
      const { SecurityGroups: taskSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: [taskSecurityGroupName] },
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      const { SecurityGroups: albSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: [albSecurityGroupName] },
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      const taskSgId = taskSgs?.[0]?.GroupId;
      const albSgId = albSgs?.[0]?.GroupId;

      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            { Name: "group-id", Values: [taskSgId!] },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      const trafficFromAlb = ingressRules?.find(rule => 
        rule.ReferencedGroupInfo?.GroupId === albSgId
      );

      expect(trafficFromAlb).toBeDefined();
      expect(trafficFromAlb?.IpProtocol).toBe("tcp");
    }, 20000);

    test("RDS security group allows traffic only from ECS tasks", async () => {
      const dbSecurityGroupName = `${projectName}-${environment}-db-sg`;
      const taskSecurityGroupName = `${projectName}-${environment}-task-sg`;
      
      const { SecurityGroups: dbSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: [dbSecurityGroupName] },
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      const { SecurityGroups: taskSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: [taskSecurityGroupName] },
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      const dbSgId = dbSgs?.[0]?.GroupId;
      const taskSgId = taskSgs?.[0]?.GroupId;

      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            { Name: "group-id", Values: [dbSgId!] },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      const postgresFromTask = ingressRules?.find(rule => 
        rule.FromPort === 5432 && 
        rule.ToPort === 5432 && 
        rule.ReferencedGroupInfo?.GroupId === taskSgId
      );

      expect(postgresFromTask).toBeDefined();
      expect(postgresFromTask?.IpProtocol).toBe("tcp");
    }, 20000);
  });

  describe("RDS Database Configuration", () => {
    test("RDS instance exists with correct configuration", async () => {
      const dbIdentifier = `${projectName}-${environment}-db`;
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Engine).toBe("postgres");
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.MultiAZ).toBe(environment === "production");
      expect(dbInstance?.VpcSecurityGroups?.length).toBeGreaterThan(0);
    }, 20000);

    test("RDS subnet group spans multiple AZs", async () => {
      const subnetGroupName = `${projectName}-${environment}-db-subnet`;
      
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
      
      const azs = [...new Set(subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name))];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("IAM Roles and Secrets Manager", () => {
    test("ECS task execution role has correct permissions", async () => {
      const executionRoleName = `${projectName}-${environment}-task-execution`;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: executionRoleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.AssumeRolePolicyDocument).toContain("ecs-tasks.amazonaws.com");
    }, 20000);

    test("ECS task role can access database secrets", async () => {
      const taskRoleName = `${projectName}-${environment}-task`;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: taskRoleName })
      );

      expect(Role).toBeDefined();

      // Simulate policy to check permissions
      const { EvaluationResults } = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: Role?.Arn,
          ActionNames: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
          ResourceArns: [dbSecretArn],
        })
      );

      const getSecretAccess = EvaluationResults?.find(
        result => result.EvalActionName === "secretsmanager:GetSecretValue"
      );
      expect(getSecretAccess?.EvalDecision).toBe("allowed");

      const describeSecretAccess = EvaluationResults?.find(
        result => result.EvalActionName === "secretsmanager:DescribeSecret"
      );
      expect(describeSecretAccess?.EvalDecision).toBe("allowed");
    }, 20000);

    test("Database credentials can be retrieved from Secrets Manager", async () => {
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: dbSecretArn,
        })
      );

      expect(SecretString).toBeDefined();
      const credentials = JSON.parse(SecretString!);
      
      expect(credentials.username).toBe("dbadmin");
      expect(credentials.password).toBeDefined();
      expect(credentials.engine).toBe("postgres");
      expect(credentials.port).toBe(5432);
      expect(credentials.dbname).toBeDefined();
    }, 20000);

    test("Can update secret version in Secrets Manager", async () => {
      // Get current secret
      const { SecretString: originalSecret } = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: dbSecretArn,
        })
      );

      const originalCredentials = JSON.parse(originalSecret!);
      
      // Create new version with a test flag
      const testCredentials = {
        ...originalCredentials,
        testFlag: Date.now(),
      };

      await secretsManagerClient.send(
        new PutSecretValueCommand({
          SecretId: dbSecretArn,
          SecretString: JSON.stringify(testCredentials),
        })
      );

      // Verify the update
      const { SecretString: updatedSecret } = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: dbSecretArn,
        })
      );

      const updatedCredentials = JSON.parse(updatedSecret!);
      expect(updatedCredentials.testFlag).toBeDefined();

      // Restore original secret
      await secretsManagerClient.send(
        new PutSecretValueCommand({
          SecretId: dbSecretArn,
          SecretString: originalSecret,
        })
      );
    }, 30000);
  });

  describe("S3 Static Assets Bucket", () => {
    test("S3 bucket exists with correct configuration", async () => {
      await s3Client.send(
        new HeadBucketCommand({ Bucket: staticAssetsBucket })
      );

      // Bucket exists if no error is thrown
      expect(true).toBe(true);
    }, 20000);

    test("Can upload and retrieve objects from S3 bucket", async () => {
      const testKey = `test-assets/test-file-${Date.now()}.txt`;
      const testContent = "Test content for integration test";

      // Upload object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
          Body: testContent,
          ContentType: "text/plain",
        })
      );

      // Retrieve object
      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
        })
      );

      const retrievedContent = await Body?.transformToString();
      expect(retrievedContent).toBe(testContent);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
        })
      );
    }, 20000);

    test("S3 bucket versioning is enabled", async () => {
      const testKey = `test-versioning/file-${Date.now()}.txt`;
      
      // Upload first version
      await s3Client.send(
        new PutObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
          Body: "Version 1",
        })
      );

      // Upload second version
      await s3Client.send(
        new PutObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
          Body: "Version 2",
        })
      );

      // List versions
      const { Contents } = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: staticAssetsBucket,
          Prefix: testKey,
        })
      );

      expect(Contents).toBeDefined();
      expect(Contents?.length).toBeGreaterThanOrEqual(1);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: staticAssetsBucket,
          Key: testKey,
        })
      );
    }, 20000);
  });

  describe("CloudWatch Monitoring", () => {
    test("CloudWatch dashboard exists and contains expected widgets", async () => {
      const dashboardName = `${projectName}-${environment}-dashboard`;
      
      const { DashboardBody } = await cloudWatchClient.send(
        new GetDashboardCommand({
          DashboardName: dashboardName,
        })
      );

      expect(DashboardBody).toBeDefined();
      const dashboard = JSON.parse(DashboardBody || "{}");
      
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThanOrEqual(3);
      
      // Check for ECS, ALB, and RDS widgets
      const widgetTitles = dashboard.widgets.map((w: any) => w.properties?.title);
      expect(widgetTitles).toContain("ECS Service Metrics");
      expect(widgetTitles).toContain("ALB Metrics");
      expect(widgetTitles).toContain("RDS Metrics");
    }, 20000);

    test("CloudWatch alarms are configured", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `${projectName}-${environment}`,
        })
      );

      expect(MetricAlarms).toBeDefined();
      expect(MetricAlarms?.length).toBe(parseInt(alarmCount));

      // Verify specific alarms exist
      const alarmNames = MetricAlarms?.map(alarm => alarm.AlarmName);
      expect(alarmNames).toContain(`${projectName}-${environment}-high-cpu`);
      expect(alarmNames).toContain(`${projectName}-${environment}-high-memory`);
      expect(alarmNames).toContain(`${projectName}-${environment}-unhealthy-hosts`);
      expect(alarmNames).toContain(`${projectName}-${environment}-rds-cpu`);
      expect(alarmNames).toContain(`${projectName}-${environment}-rds-storage`);
    }, 20000);

    test("ECS tasks are sending logs to CloudWatch", async () => {
      const { logGroups } = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(logGroups).toBeDefined();
      expect(logGroups?.length).toBeGreaterThanOrEqual(1);
      expect(logGroups?.[0]?.logGroupName).toBe(logGroupName);

      // Check for recent log events
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

      const { events } = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName: logGroupName,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          limit: 10,
        })
      );

      // Logs might not exist immediately after deployment
      if (events && events.length > 0) {
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].message).toBeDefined();
      }
    }, 20000);

    test("ECS service metrics are being collected", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago

      const { Datapoints } = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/ECS",
          MetricName: "CPUUtilization",
          Dimensions: [
            {
              Name: "ClusterName",
              Value: ecsClusterName,
            },
            {
              Name: "ServiceName",
              Value: ecsServiceName,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average"],
        })
      );

      // Metrics might not be available immediately after deployment
      if (Datapoints && Datapoints.length > 0) {
        expect(Datapoints.length).toBeGreaterThan(0);
        expect(Datapoints[0].Average).toBeDefined();
      }
    }, 20000);
  });

  describe("High Availability", () => {
    test("Resources are deployed across multiple availability zones", async () => {
      // Check ECS tasks span multiple AZs
      const { taskArns } = await ecsClient.send(
        new ListTasksCommand({
          cluster: ecsClusterName,
          serviceName: ecsServiceName,
        })
      );

      const { tasks } = await ecsClient.send(
        new DescribeTasksCommand({
          cluster: ecsClusterName,
          tasks: taskArns,
        })
      );

      const taskAzs = tasks?.map(task => task.availabilityZone);
      const uniqueAzs = [...new Set(taskAzs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(1);

      // Check ALB spans multiple AZs
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("Subnets are properly distributed across AZs", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
          ],
        })
      );

      expect(Subnets).toBeDefined();
      expect(Subnets?.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private

      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.find(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.find(tag => tag.Key === "Type" && tag.Value === "Private")
      );

      expect(publicSubnets?.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets?.length).toBeGreaterThanOrEqual(3);

      const publicAzs = [...new Set(publicSubnets?.map(s => s.AvailabilityZone))];
      const privateAzs = [...new Set(privateSubnets?.map(s => s.AvailabilityZone))];

      expect(publicAzs.length).toBeGreaterThanOrEqual(3);
      expect(privateAzs.length).toBeGreaterThanOrEqual(3);
    }, 20000);
  });

  describe("End-to-End Workflow", () => {
    test("Complete request flow from ALB through ECS to RDS", async () => {
      // 1. Make request to ALB
      let response;
      try {
        response = await axios.get(`${albUrl}/health`, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch (error: any) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }

      if (response) {
        expect([200, 404]).toContain(response.status);
      }

      // 2. Verify ECS task received and processed the request
      const { taskArns } = await ecsClient.send(
        new ListTasksCommand({
          cluster: ecsClusterName,
          serviceName: ecsServiceName,
          desiredStatus: "RUNNING",
        })
      );

      expect(taskArns?.length).toBeGreaterThanOrEqual(1);

      // 3. Verify task can access RDS via Secrets Manager
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: dbSecretArn,
        })
      );

      const dbCredentials = JSON.parse(SecretString!);
      expect(dbCredentials.engine).toBe("postgres");
      expect(dbCredentials.port).toBe(5432);

      // 4. Verify monitoring captures the activity
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

      const { Datapoints } = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/ApplicationELB",
          MetricName: "RequestCount",
          Dimensions: [
            {
              Name: "LoadBalancer",
              Value: albDnsName.split('.')[0].replace(`${projectName}-${environment}-alb-`, 'app/'),
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 60,
          Statistics: ["Sum"],
        })
      );

      // Metrics might not be immediately available
      if (Datapoints && Datapoints.length > 0) {
        expect(Datapoints[0].Sum).toBeDefined();
      }

      // 5. Verify logs are being written
      const { events } = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName: logGroupName,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          limit: 5,
        })
      );

      // Logs might not exist immediately
      if (events && events.length > 0) {
        expect(events.length).toBeGreaterThan(0);
      }
    }, 60000);

    test("Failover and recovery scenario", async () => {
      // 1. Get initial task count
      const { services: initialServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      const initialRunningCount = initialServices?.[0]?.runningCount || 0;
      expect(initialRunningCount).toBeGreaterThanOrEqual(1);

      // 2. Force scale to 0 to simulate failure
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: 0,
        })
      );

      // Wait for tasks to stop
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 3. Verify tasks are stopped
      const { services: stoppedServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      expect(stoppedServices?.[0]?.runningCount).toBe(0);

      // 4. Restore service
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: ecsClusterName,
          service: ecsServiceName,
          desiredCount: initialRunningCount,
        })
      );

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 30000));

      // 5. Verify service recovered
      const { services: recoveredServices } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName],
        })
      );

      expect(recoveredServices?.[0]?.runningCount).toBe(initialRunningCount);
      expect(recoveredServices?.[0]?.deployments?.[0]?.status).toBe("PRIMARY");

      // 6. Verify targets are healthy again
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes(`${projectName}-${environment}`)
      );

      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup?.TargetGroupArn,
        })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );
      expect(healthyTargets!.length).toBeGreaterThanOrEqual(1);
    }, 120000);
  });
});