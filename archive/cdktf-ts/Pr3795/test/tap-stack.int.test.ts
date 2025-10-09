// __tests__/tap-stack.int.test.ts
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupRulesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeDBInstancesCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  GetParameterCommand,
  SSMClient
} from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let natGatewayEip: string;
  let publicInstanceIds: string[];
  let rdsEndpoint: string;
  let appLogsBucket: string;
  let stackName: string;
  let projectName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    // Extract values from deployment outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    natGatewayEip = stackOutputs["nat-gateway-eip"];
    publicInstanceIds = stackOutputs["public-ec2-instance-ids"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    appLogsBucket = stackOutputs["app-logs-s3-bucket"];

    // Extract project name from stack name (e.g., TapStackpr3795 -> tap-pr3795)
    projectName = stackName.replace('TapStack', 'tap-');

    if (!vpcId || !rdsEndpoint || !appLogsBucket) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("VPC and Network Module Interactions", () => {
    test("VPC integrates correctly with public and private subnets", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");

      // Verify subnets are associated with the VPC
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      expect(Subnets?.length).toBe(4);
      Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
      });
    }, 20000);

    test("NAT Gateway properly connects private subnets to internet", async () => {
      // Find NAT Gateway by EIP
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{
            Name: "state",
            Values: ["available"]
          }]
        })
      );

      const natGateway = NatGateways?.find(ng =>
        ng.NatGatewayAddresses?.some(addr => addr.PublicIp === natGatewayEip)
      );

      expect(natGateway).toBeDefined();
      expect(natGateway?.State).toBe("available");

      // Verify NAT Gateway is in a public subnet
      expect(publicSubnetIds).toContain(natGateway?.SubnetId);

      // Check private subnet route tables point to NAT Gateway
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{
            Name: "vpc-id",
            Values: [vpcId]
          }]
        })
      );

      const privateRouteTables = RouteTables?.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId === natGateway?.NatGatewayId)
      );

      expect(privateRouteTables?.length).toBeGreaterThan(0);
    }, 20000);

    test("Internet Gateway enables public subnet internet access", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{
            Name: "attachment.vpc-id",
            Values: [vpcId]
          }]
        })
      );

      const igw = InternetGateways?.[0];
      expect(igw).toBeDefined();
      expect(igw?.Attachments?.[0]?.State).toBe("available");

      // Verify public subnets route to IGW
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{
            Name: "vpc-id",
            Values: [vpcId]
          }]
        })
      );

      const publicRouteTables = RouteTables?.filter(rt =>
        rt.Routes?.some(r => r.GatewayId === igw?.InternetGatewayId)
      );

      expect(publicRouteTables?.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Security Module and Network Access Control", () => {
    test("Security groups properly control access between compute and database tiers", async () => {
      // Get security groups from instances
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: publicInstanceIds
        })
      );

      const publicInstanceSgIds = new Set<string>();
      Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          instance.SecurityGroups?.forEach(sg => {
            if (sg.GroupId) publicInstanceSgIds.add(sg.GroupId);
          });
        });
      });

      // Get RDS security groups
      const dbIdentifier = rdsEndpoint.split(".")[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      const rdsSgIds = new Set<string>();
      DBInstances?.[0]?.VpcSecurityGroups?.forEach(sg => {
        if (sg.VpcSecurityGroupId) rdsSgIds.add(sg.VpcSecurityGroupId);
      });

      // Verify RDS security group allows access from public instance security group
      for (const rdsSgId of rdsSgIds) {
        const { SecurityGroupRules } = await ec2Client.send(
          new DescribeSecurityGroupRulesCommand({
            Filters: [{
              Name: "group-id",
              Values: [rdsSgId]
            }]
          })
        );

        const mysqlIngressRules = SecurityGroupRules?.filter(rule =>
          !rule.IsEgress && rule.FromPort === 3306 && rule.ToPort === 3306
        );

        expect(mysqlIngressRules?.length).toBeGreaterThan(0);

        // Check if any rule references the public instance security group
        const hasAccessFromPublicInstances = mysqlIngressRules?.some(rule =>
          publicInstanceSgIds.has(rule.ReferencedGroupInfo?.GroupId || "")
        );

        expect(hasAccessFromPublicInstances).toBe(true);
      }
    }, 20000);

  });

  describe("Compute and Database Module Interactions", () => {
    test("EC2 instances can potentially connect to RDS through security groups", async () => {
      // Verify EC2 instances are in public subnets
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: publicInstanceIds
        })
      );

      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(publicSubnetIds).toContain(instance.SubnetId);
        expect(instance.State?.Name).toBe("running");
      });

      // Verify RDS is in private subnets
      const dbIdentifier = rdsEndpoint.split(".")[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      const dbInstance = DBInstances?.[0];
      const dbSubnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];

      dbSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });

      // Verify they're in the same VPC
      expect(dbInstance?.DBSubnetGroup?.VpcId).toBe(vpcId);
    }, 20000);

    test("RDS instance profile and configuration matches compute requirements", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      const dbInstance = DBInstances?.[0];

      // Check MySQL configuration
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Endpoint?.Port).toBe(3306);

      // Verify Multi-AZ for high availability with compute instances
      expect(dbInstance?.MultiAZ).toBe(true);

      // Check encryption for secure data transfer
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 20000);
  });

  describe("Storage Module Integration", () => {
    test("S3 bucket is properly configured for application logs", async () => {
      // Verify bucket exists
      const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
      const bucket = Buckets?.find(b => b.Name === appLogsBucket);
      expect(bucket).toBeDefined();

      // Check versioning
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: appLogsBucket })
      );
      expect(versioning.Status).toBe("Enabled");

      // Check encryption
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: appLogsBucket })
      );
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      // Check public access block
      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: appLogsBucket })
      );
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("S3 bucket can be accessed by EC2 instances via IAM roles", async () => {
      // Get instance profiles from EC2 instances
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: publicInstanceIds
        })
      );

      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        // Verify instances have IAM instance profiles
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile?.Arn).toContain("instance-profile");
      });

      // Note: Actual S3 access would require checking IAM policies which is beyond this test scope
    }, 20000);
  });

  describe("Monitoring Module and VPC Flow Logs Integration", () => {
    test("CloudWatch log group exists for VPC flow logs", async () => {
      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/vpc/flowlogs/${projectName}`
        })
      );

      expect(logGroups?.length).toBeGreaterThan(0);
      const flowLogsGroup = logGroups?.[0];
      expect(flowLogsGroup?.retentionInDays).toBe(7);
    }, 20000);

  });

  describe("Parameter Store Integration", () => {
    test("Database connection parameters are stored in SSM", async () => {
      const parameterNames = [
        `/${projectName}/db/endpoint`,
        `/${projectName}/db/port`,
        `/${projectName}/db/credentials-ref`
      ];

      for (const paramName of parameterNames) {
        const { Parameter } = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName
          })
        );

        expect(Parameter).toBeDefined();
        expect(Parameter?.Name).toBe(paramName);
        expect(Parameter?.Type).toBe("String");
      }
    }, 20000);

    test("SSM parameters contain correct database information", async () => {
      // Check endpoint parameter
      const { Parameter: endpointParam } = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${projectName}/db/endpoint`
        })
      );
      expect(endpointParam?.Value).toBe(rdsEndpoint);

      // Check port parameter  
      const { Parameter: portParam } = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${projectName}/db/port`
        })
      );
      expect(portParam?.Value).toBe("3306");
    }, 20000);
  });

  describe("Cross-Module High Availability", () => {
    test("Resources are distributed across multiple AZs", async () => {
      // Check subnets span multiple AZs
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      const azSet = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azSet.size).toBeGreaterThanOrEqual(2);

      // Check EC2 instances are distributed
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: publicInstanceIds
        })
      );

      const instanceAZs = new Set(
        Reservations?.flatMap(r => r.Instances || [])
          .map(i => i.Placement?.AvailabilityZone)
      );
      expect(instanceAZs.size).toBeGreaterThanOrEqual(2);

      // RDS Multi-AZ is already verified in previous tests
    }, 20000);

    test("NAT Gateway provides reliable internet access for private resources", async () => {
      // Verify NAT Gateway has an Elastic IP
      expect(natGatewayEip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      // Check that private route tables all point to NAT Gateway
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{
            Name: "vpc-id",
            Values: [vpcId]
          }]
        })
      );

      const privateRouteTableCount = RouteTables?.filter(rt => {
        const hasNatRoute = rt.Routes?.some(r =>
          r.DestinationCidrBlock === "0.0.0.0/0" && r.NatGatewayId
        );
        const associatedWithPrivateSubnet = rt.Associations?.some(a =>
          privateSubnetIds.includes(a.SubnetId || "")
        );
        return hasNatRoute && associatedWithPrivateSubnet;
      }).length;

      expect(privateRouteTableCount).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Service Communication Patterns", () => {
    test("Public instances can reach internet and private resources", async () => {
      // Verify public instances have public IPs
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: publicInstanceIds
        })
      );

      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PrivateIpAddress).toBeDefined();
      });

      // Verify they're in subnets with proper routing
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: instances?.map(i => i.SubnetId!).filter(Boolean) || []
        })
      );

      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    }, 20000);

    test("Database is isolated but accessible from application tier", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      const dbInstance = DBInstances?.[0];

      // Database should not be publicly accessible
      expect(dbInstance?.PubliclyAccessible).toBe(false);

      // But should have security group rules allowing access from compute tier
      const dbSgIds = dbInstance?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) || [];

      for (const sgId of dbSgIds) {
        // Skip undefined security group IDs
        if (!sgId) continue;

        const { SecurityGroupRules } = await ec2Client.send(
          new DescribeSecurityGroupRulesCommand({
            Filters: [{
              Name: "group-id",
              Values: [sgId]
            }]
          } as any)
        );

        const ingressRules = SecurityGroupRules?.filter(r => !r.IsEgress);
        const hasMySQLRule = ingressRules?.some(r =>
          r.FromPort === 3306 && r.ToPort === 3306
        );

        expect(hasMySQLRule).toBe(true);
      }
    }, 20000);
  });
});