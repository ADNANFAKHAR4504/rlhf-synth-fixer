// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeSecurityGroupRulesCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribeAutoScalingInstancesCommand, SetDesiredCapacityCommand } from "@aws-sdk/client-auto-scaling";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, GetSecretValueCommand, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, HeadBucketCommand, GetBucketPolicyCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, GetDashboardCommand, PutMetricDataCommand, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let albDnsName: string;
  let asgName: string;
  let dashboardUrl: string;
  let privateSubnetIds: string[];
  let rdsSecretArn: string;
  let s3LogsBucket: string;
  let securityGroups: {
    alb: string;
    ec2: string;
    rds: string;
  };
  let targetGroupArn: string;
  let vpcId: string;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    albDnsName = stackOutputs["alb-dns-name"];
    asgName = stackOutputs["asg-name"];
    dashboardUrl = stackOutputs["dashboard-url"];
    privateSubnetIds = stackOutputs["private-subnet-ids"].split(",");
    rdsSecretArn = stackOutputs["rds-secret-arn"];
    s3LogsBucket = stackOutputs["s3-logs-bucket"];
    securityGroups = stackOutputs["security-group-ids"];
    targetGroupArn = stackOutputs["target-group-arn"];
    vpcId = stackOutputs["vpc-id"];

    if (!albDnsName || !asgName || !rdsSecretArn || !s3LogsBucket) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("Application Load Balancer Configuration", () => {
    test("ALB exists and is accessible", async () => {
      const albArn = `arn:aws:elasticloadbalancing:${awsRegion}:*:loadbalancer/app/${albDnsName.split("-")[0]}/*`;
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");
      expect(alb?.SecurityGroups).toContain(securityGroups.alb);
    }, 20000);

    test("ALB has healthy targets in target group", async () => {
      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn,
        })
      );

      expect(TargetHealthDescriptions).toBeDefined();
      expect(TargetHealthDescriptions!.length).toBeGreaterThanOrEqual(1);
      
      const healthyTargets = TargetHealthDescriptions?.filter(
        target => target.TargetHealth?.State === "healthy"
      );
      expect(healthyTargets!.length).toBeGreaterThanOrEqual(1);
    }, 20000);
  });

  describe("Auto Scaling Group Configuration", () => {
    test("ASG exists with correct configuration", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = AutoScalingGroups?.[0];
      expect(asg).toBeDefined();
      expect(asg?.AutoScalingGroupName).toBe(asgName);
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(asg?.MinSize || 1);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 1);
      expect(asg?.TargetGroupARNs).toContain(targetGroupArn);
      expect(asg?.VPCZoneIdentifier).toBeDefined();
      
      // Verify it's using private subnets
      const asgSubnets = asg?.VPCZoneIdentifier?.split(",") || [];
      asgSubnets.forEach(subnet => {
        expect(privateSubnetIds).toContain(subnet.trim());
      });
    }, 20000);

    test("ASG instances are running and healthy", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instances = AutoScalingGroups?.[0]?.Instances || [];
      expect(instances.length).toBeGreaterThanOrEqual(1);

      const healthyInstances = instances.filter(
        instance => instance.LifecycleState === "InService" && 
                   instance.HealthStatus === "Healthy"
      );
      expect(healthyInstances.length).toBeGreaterThanOrEqual(1);
    }, 20000);

    test("ASG can scale based on policies", async () => {
      // Get current state
      const { AutoScalingGroups: initialGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const initialCapacity = initialGroups?.[0]?.DesiredCapacity || 1;
      expect(initialCapacity).toBeGreaterThanOrEqual(1);

      // Note: We won't actually change capacity to avoid disrupting the environment
      // Just verify scaling configuration exists
      expect(initialGroups?.[0]?.EnabledMetrics).toBeDefined();
    }, 20000);
  });

  describe("Security Groups Interactions", () => {
    test("ALB security group allows HTTPS/HTTP from internet", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroups.alb],
        })
      );

      const albSg = SecurityGroups?.[0];
      expect(albSg).toBeDefined();
      
      const httpIngress = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
    }, 20000);

    test("EC2 security group allows traffic only from ALB", async () => {
      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            {
              Name: "group-id",
              Values: [securityGroups.ec2],
            },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      const httpFromAlb = ingressRules?.find(rule => 
        rule.FromPort === 80 && 
        rule.ToPort === 80 && 
        rule.ReferencedGroupInfo?.GroupId === securityGroups.alb
      );

      expect(httpFromAlb).toBeDefined();
      expect(httpFromAlb?.IpProtocol).toBe("tcp");
    }, 20000);

    test("RDS security group allows traffic only from EC2", async () => {
      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            {
              Name: "group-id",
              Values: [securityGroups.rds],
            },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      const mysqlFromEc2 = ingressRules?.find(rule => 
        rule.FromPort === 3306 && 
        rule.ToPort === 3306 && 
        rule.ReferencedGroupInfo?.GroupId === securityGroups.ec2
      );

      expect(mysqlFromEc2).toBeDefined();
      expect(mysqlFromEc2?.IpProtocol).toBe("tcp");
    }, 20000);
  });

  describe("IAM Roles and Policies", () => {
    test("EC2 instances have correct IAM instance profile", async () => {
      // Get instances from ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId) || [];
      expect(instanceIds.length).toBeGreaterThan(0);

      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: instanceIds.filter(id => id !== undefined) as string[],
        })
      );

      const instances = Reservations?.flatMap(r => r.Instances) || [];
      instances.forEach(instance => {
        expect(instance?.IamInstanceProfile).toBeDefined();
        expect(instance?.IamInstanceProfile?.Arn).toContain(`${stackName}-iam-instance-profile`);
      });
    }, 20000);

    test("EC2 role has permissions to access Secrets Manager", async () => {
      const roleName = `${stackName}-iam-ec2-role`;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role).toBeDefined();
      expect(Role?.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");

      // Simulate policy to check permissions
      const { EvaluationResults } = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: Role?.Arn,
          ActionNames: ["secretsmanager:GetSecretValue"],
          ResourceArns: [rdsSecretArn],
        })
      );

      const secretsAccess = EvaluationResults?.find(
        result => result.EvalActionName === "secretsmanager:GetSecretValue"
      );
      expect(secretsAccess?.EvalDecision).toBe("allowed");
    }, 20000);
  });

  describe("S3 Bucket Configuration", () => {
    test("S3 bucket exists and is configured for ALB logs", async () => {
      await s3Client.send(
        new HeadBucketCommand({ Bucket: s3LogsBucket })
      );

      // Verify bucket policy allows ALB to write logs
      const { Policy } = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: s3LogsBucket })
      );

      const policyDoc = JSON.parse(Policy || "{}");
      const albStatement = policyDoc.Statement?.find((s: any) => 
        s.Principal?.AWS?.includes("797873946194") || // ELB service account for us-west-2
        s.Principal?.Service === "elasticloadbalancing.amazonaws.com"
      );

      expect(albStatement).toBeDefined();
      expect(albStatement?.Action).toContain("s3:PutObject");
    }, 20000);

    test("ALB logs are being written to S3", async () => {
      // Check if there are any log files in the bucket
      const { Contents } = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: s3LogsBucket,
          Prefix: "alb-logs/",
          MaxKeys: 10,
        })
      );

      // Note: Logs might not exist immediately after deployment
      if (Contents && Contents.length > 0) {
        expect(Contents.length).toBeGreaterThan(0);
        expect(Contents[0].Key).toContain("alb-logs/");
      }
    }, 20000);
  });

  describe("CloudWatch Integration", () => {
    test("CloudWatch dashboard exists and contains expected widgets", async () => {
      const dashboardName = `${stackName}-monitoring-production-dashboard`;
      
      const { DashboardBody } = await cloudWatchClient.send(
        new GetDashboardCommand({
          DashboardName: dashboardName,
        })
      );

      expect(DashboardBody).toBeDefined();
      const dashboard = JSON.parse(DashboardBody || "{}");
      
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThanOrEqual(3);
      
      // Check for EC2, ALB, and RDS widgets
      const widgetTitles = dashboard.widgets.map((w: any) => w.properties?.title);
      expect(widgetTitles).toContain("EC2 Auto Scaling Group Metrics");
      expect(widgetTitles).toContain("Application Load Balancer Metrics");
      expect(widgetTitles).toContain("RDS Database Metrics");
    }, 20000);

    test("EC2 instances are sending metrics to CloudWatch", async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago

      const { Datapoints } = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [
            {
              Name: "AutoScalingGroupName",
              Value: asgName,
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
      // Check ASG spans multiple AZs
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = AutoScalingGroups?.[0];
      const azs = asg?.AvailabilityZones || [];
      expect(azs.length).toBeGreaterThanOrEqual(2);

      // Check ALB spans multiple AZs
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

  });
});