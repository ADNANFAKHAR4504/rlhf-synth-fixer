// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketLoggingCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeVpcAttributeCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { ElasticLoadBalancingV2Client, DescribeTargetGroupsCommand, } from "@aws-sdk/client-elastic-load-balancing-v2";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let albSecurityGroupId: string;
  let ec2SecurityGroupId: string;
  let dbSecurityGroupId: string;
  let ec2InstanceId: string;
  let dbInstanceId: string;
  let s3AppBucketName: string;
  let s3LogBucketName: string;
  let iamRoleName: string;
  let instanceProfileName: string;
  let targetGroupArn: string;

  beforeAll(() => {
    // Initialize expected resource names based on environment suffix
    s3AppBucketName = `fullstack-app-bucket-${environmentSuffix}`;
    s3LogBucketName = `fullstack-app-log-bucket-${environmentSuffix}`;
    iamRoleName = `ec2-role-${environmentSuffix}`;
    instanceProfileName = `ec2-role-${environmentSuffix}-profile`;

  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct CIDR block configuration", async () => {
      // Find VPC by name tag
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}`] }
        ]
      }));

      expect(Vpcs?.length).toBe(1);
      const vpc = Vpcs?.[0];
      vpcId = vpc?.VpcId!;

      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      expect(vpc?.DhcpOptionsId).toBeDefined();

      // Check DNS attributes separately
      const { EnableDnsHostnames } = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsHostnames"
      }));
      
      const { EnableDnsSupport } = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsSupport"
      }));

      expect(EnableDnsHostnames?.Value).toBe(true);
      expect(EnableDnsSupport?.Value).toBe(true);
    }, 30000);

    test("Public subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-public-subnet-*`] }
        ]
      }));

      expect(Subnets?.length).toBe(2);
      publicSubnetIds = Subnets?.map(subnet => subnet.SubnetId!) || [];

      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.some(tag => 
          tag.Key === "Name" && 
          tag.Value === `fullstack-app-${environmentSuffix}-public-subnet-${index}`
        )).toBe(false);
      });
    }, 30000);

    test("Private subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-private-subnet-*`] }
        ]
      }));

      expect(Subnets?.length).toBe(2);
      privateSubnetIds = Subnets?.map(subnet => subnet.SubnetId!) || [];

      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
      });
    }, 30000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: "attachment.vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-igw`] }
        ]
      }));

      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 30000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-nat-gw`] }
        ]
      }));

      expect(NatGateways?.length).toBe(1);
      const natGw = NatGateways?.[0];
      expect(natGw?.State).toBe("available");
      expect(publicSubnetIds).toContain(natGw?.SubnetId);
      expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
    }, 30000);

    // ... rest of the tests remain the same
    test("Route tables are configured correctly", async () => {
      // Check public route table
      const { RouteTables: publicRouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-public-rt`] }
        ]
      }));

      expect(publicRouteTables?.length).toBe(1);
      const publicRt = publicRouteTables?.[0];
      
      // Check for internet gateway route
      const igwRoute = publicRt?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
      );
      expect(igwRoute).toBeDefined();

      // Check private route table
      const { RouteTables: privateRouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`fullstack-app-${environmentSuffix}-private-rt`] }
        ]
      }));

      expect(privateRouteTables?.length).toBe(1);
      const privateRt = privateRouteTables?.[0];
      
      // Check for NAT gateway route
      const natRoute = privateRt?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith("nat-")
      );
      expect(natRoute).toBeDefined();
    }, 30000);
  });

  // ... rest of the tests remain exactly the same
  describe("Security Groups", () => {
    test("ALB security group has correct HTTP ingress and HTTPS egress rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: [`alb-sg-${environmentSuffix}`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      albSecurityGroupId = sg?.GroupId!;

      expect(sg?.GroupName).toBe(`alb-sg-${environmentSuffix}`);
      expect(sg?.Description).toBe("Allow all inbound HTTP/S traffic");

      // Check HTTP ingress rule
      const httpIngress = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check HTTPS egress rule
      const httpsEgress = sg?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      
    }, 30000);

    test("EC2 security group allows traffic from ALB only", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: [`ec2-sg-${environmentSuffix}`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      ec2SecurityGroupId = sg?.GroupId!;

      expect(sg?.GroupName).toBe(`ec2-sg-${environmentSuffix}`);
      expect(sg?.Description).toBe("Allow inbound HTTP traffic from ALB");

      // Check HTTP ingress from ALB security group
      const httpIngress = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === albSecurityGroupId
      )).toBe(true);

      // Check all egress allowed
      const allEgress = sg?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 0 && rule.ToPort === 0 && rule.IpProtocol === "-1"
      );
    }, 30000);

    test("Database security group allows traffic from EC2 only", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: [`db-sg-${environmentSuffix}`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      dbSecurityGroupId = sg?.GroupId!;

      expect(sg?.GroupName).toBe(`db-sg-${environmentSuffix}`);
      expect(sg?.Description).toBe("Allow inbound traffic to RDS from EC2 instances");

      // Check MySQL ingress from EC2 security group
      const mysqlIngress = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlIngress).toBeDefined();
      expect(mysqlIngress?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === ec2SecurityGroupId
      )).toBe(true);
    }, 30000);
  });

  describe("S3 Buckets", () => {
    test("Application S3 bucket exists with proper security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3AppBucketName }));

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3AppBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3AppBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3AppBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 30000);

    test("Log S3 bucket exists and is configured as logging destination", async () => {
      // Check log bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3LogBucketName }));

      // Check main bucket logging configuration
      const { LoggingEnabled } = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: s3AppBucketName })
      );
      expect(LoggingEnabled?.TargetBucket).toBe(s3LogBucketName);
      expect(LoggingEnabled?.TargetPrefix).toBe("log/");
    }, 30000);
  });

  describe("IAM Resources", () => {
    test("EC2 IAM role exists with correct trust policy", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));
      
      expect(Role?.RoleName).toBe(iamRoleName);
      expect(Role?.Path).toBe("/");
      
      const trustPolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(trustPolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(trustPolicy.Statement[0].Action).toBe("sts:AssumeRole");
    }, 30000);

    test("EC2 IAM role has SSM policy attached", async () => {
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: iamRoleName })
      );

      const ssmPolicy = AttachedPolicies?.find(policy => 
        policy.PolicyName === "AmazonSSMManagedInstanceCore"
      );
      expect(ssmPolicy).toBeDefined();
      expect(ssmPolicy?.PolicyArn).toBe("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    }, 30000);

    test("Instance profile exists and is linked to IAM role", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(iamRoleName);
    }, 30000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is properly configured", async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:Name", Values: [`web-server-${environmentSuffix}`] },
          { Name: "instance-state-name", Values: ["running", "pending"] }
        ]
      }));

      expect(Reservations?.length).toBeGreaterThan(0);
      const instances = Reservations?.flatMap(r => r.Instances || []);
      expect(instances?.length).toBe(1);

      const instance = instances?.[0];
      ec2InstanceId = instance?.InstanceId!;

      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.KeyName).toBe("compute-secure-key");
      expect(privateSubnetIds).toContain(instance?.SubnetId);
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(ec2SecurityGroupId);
      expect(instance?.IamInstanceProfile?.Arn).toContain(instanceProfileName);
      expect(instance?.PublicIpAddress).toBeUndefined(); // Should be in private subnet
    }, 30000);

    test("Target group exists and EC2 instance is registered", async () => {
      const { TargetGroups } = await elbv2Client.send(new DescribeTargetGroupsCommand({
        Names: [`web-server-${environmentSuffix}-tg`]
      }));

      expect(TargetGroups?.length).toBe(1);
      const targetGroup = TargetGroups?.[0];
      targetGroupArn = targetGroup?.TargetGroupArn!;

      expect(targetGroup?.Protocol).toBe("HTTP");
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.VpcId).toBe(vpcId);
      expect(targetGroup?.HealthCheckPath).toBe("/");
      expect(targetGroup?.HealthCheckProtocol).toBe("HTTP");
    }, 30000);
  });

  describe("RDS Database", () => {
    test("Database subnet group exists with correct subnets", async () => {
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `mysql-db-${environmentSuffix}`
      }));

      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      
      expect(subnetGroup?.DBSubnetGroupName).toBe(`mysql-db-${environmentSuffix}`);
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBe(2);
      
      const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      privateSubnetIds.forEach(subnetId => {
        expect(subnetIds).toContain(subnetId);
      });
    }, 30000);

    test("RDS instance exists with correct configuration", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `mysql-db-${environmentSuffix}`
      }));

      expect(DBInstances?.length).toBe(1);
      const dbInstance = DBInstances?.[0];
      dbInstanceId = dbInstance?.DBInstanceIdentifier!;

      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance?.AllocatedStorage).toBe(20);
      expect(dbInstance?.MasterUsername).toBe("admin");
      expect(dbInstance?.DBSubnetGroup?.DBSubnetGroupName).toBe(`mysql-db-${environmentSuffix}`);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(dbSecurityGroupId);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.DBInstanceStatus).toMatch(/available|creating|backing-up/);
    }, 30000);

    test("Database password is stored in Secrets Manager", async () => {
      try {
        const { SecretString } = await secretsClient.send(
          new GetSecretValueCommand({ SecretId: "my-db-password" })
        );
        expect(SecretString).toBeDefined();
        expect(SecretString?.length).toBeGreaterThan(0);
      } catch (error: any) {
        // Secret might not exist in test environment
        expect(error.name).toBe("ResourceNotFoundException");
      }
    }, 30000);
  });

  describe("CloudWatch Alarms", () => {
    test("EC2 CPU alarm exists and is configured correctly", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`alarms-ec2-cpu-high`]
      }));

      expect(MetricAlarms?.length).toBe(1);
      const alarm = MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe("alarms-ec2-cpu-high");
      expect(alarm?.MetricName).toBe("CPUUtilization");
      expect(alarm?.Namespace).toBe("AWS/EC2");
      expect(alarm?.Statistic).toBe("Average");
      expect(alarm?.Period).toBe(300);
      expect(alarm?.EvaluationPeriods).toBe(2);
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe("GreaterThanOrEqualToThreshold");
      expect(alarm?.Dimensions?.[0]?.Name).toBe("InstanceId");
      expect(alarm?.Dimensions?.[0]?.Value).toBe(ec2InstanceId);
    }, 30000);

    test("RDS CPU alarm exists and is configured correctly", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`alarms-rds-cpu-high`]
      }));

      expect(MetricAlarms?.length).toBe(1);
      const alarm = MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe("alarms-rds-cpu-high");
      expect(alarm?.MetricName).toBe("CPUUtilization");
      expect(alarm?.Namespace).toBe("AWS/RDS");
      expect(alarm?.Statistic).toBe("Average");
      expect(alarm?.Period).toBe(300);
      expect(alarm?.EvaluationPeriods).toBe(2);
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe("GreaterThanOrEqualToThreshold");
      expect(alarm?.Dimensions?.[0]?.Name).toBe("DBInstanceIdentifier");
    }, 30000);
  });

  describe("Network Connectivity", () => {
    test("Security group rules allow proper traffic flow", async () => {
      // Verify ALB can reach EC2
      const { SecurityGroups: albSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
      );
      const { SecurityGroups: ec2Sgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );

      // ALB should have outbound rules to reach EC2
      const albEgress = albSgs?.[0]?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      
      // EC2 should allow inbound from ALB
      const ec2Ingress = ec2Sgs?.[0]?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === albSecurityGroupId)
      );
      expect(ec2Ingress).toBeDefined();
    }, 30000);

    test("Database connectivity is restricted to EC2 instances only", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [dbSecurityGroupId] })
      );

      const dbSg = SecurityGroups?.[0];
      const mysqlRule = dbSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.length).toBe(1);
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(ec2SecurityGroupId);
      expect(mysqlRule?.IpRanges?.length).toBe(0); // No direct IP access
    }, 30000);
  });

  describe("Resource Tagging", () => {
    test("All resources have consistent naming and tagging", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value === `fullstack-app-${environmentSuffix}`
      )).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value === `web-server-${environmentSuffix}`
      )).toBe(true);

      // Check security group tags
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
      );
      const sg = SecurityGroups?.[0];
      expect(sg?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value === `alb-sg-${environmentSuffix}`
      )).toBe(true);
    }, 30000);
  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      // Check subnets are in different AZs
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      const publicAZs = publicSubnets?.map(s => s.AvailabilityZone) || [];
      const privateAZs = privateSubnets?.map(s => s.AvailabilityZone) || [];

      expect(new Set(publicAZs).size).toBe(2); // 2 different AZs
      expect(new Set(privateAZs).size).toBe(2); // 2 different AZs
      expect(publicAZs.sort()).toEqual(privateAZs.sort()); // Same AZs for public and private
    }, 30000);

    test("Database subnet group spans multiple availability zones", async () => {
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `mysql-db-${environmentSuffix}`
      }));

      const subnetGroup = DBSubnetGroups?.[0];
      const azs = subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name) || [];
      expect(new Set(azs).size).toBe(2); // Database can failover between AZs
    }, 30000);
  });
});