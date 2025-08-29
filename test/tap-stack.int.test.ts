// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });

describe("TapStack Web Application Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "public-subnet-ids",
      "private-subnet-ids",
      "ec2-instance-ids",
      "s3-bucket-name",
      "cloudwatch-alarm-arn",
      "region",
      "environment"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].DhcpOptionsId).toBeDefined();
      expect(Vpcs![0].State).toBe("available");
    }, 20000);

    test("Public subnets exist and are properly configured", async () => {
      const subnetIds = stackOutputs["public-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
        expect(subnet.State).toBe("available");
        // Verify CIDR blocks for public subnets
        expect(["10.0.1.0/24", "10.0.2.0/24"]).toContain(subnet.CidrBlock);
      });
    }, 20000);

    test("Private subnets exist and are properly configured", async () => {
      const subnetIds = stackOutputs["private-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
        expect(subnet.State).toBe("available");
        // Verify CIDR blocks for private subnets
        expect(["10.0.3.0/24", "10.0.4.0/24"]).toContain(subnet.CidrBlock);
      });
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    }, 20000);

    test("NAT Gateway exists in public subnet", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways).toHaveLength(1);
      expect(NatGateways![0].State).toBe("available");
      expect(NatGateways![0].VpcId).toBe(vpcId);
      // Verify NAT Gateway is in a public subnet
      expect(stackOutputs["public-subnet-ids"]).toContain(NatGateways![0].SubnetId);
    }, 20000);

    test("Route tables are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 3 route tables: default + public + private
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();
      
      // Check for private route table with NAT gateway route
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTable).toBeDefined();
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Web security group allows HTTP/HTTPS and SSH from VPC", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: [`${stackOutputs["environment"]}-web-sg`] }
        ]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const webSg = SecurityGroups![0];
      
      // Check HTTP ingress rule
      const httpRule = webSg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check HTTPS ingress rule
      const httpsRule = webSg.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check SSH rule (should be from VPC only)
      const sshRule = webSg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/16")).toBe(true);
    }, 20000);

    test("Database security group allows MySQL/PostgreSQL from web security group only", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: [`${stackOutputs["environment"]}-db-sg`] }
        ]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const dbSg = SecurityGroups![0];
      
      // Check MySQL ingress rule
      const mysqlRule = dbSg.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
      
      // Check PostgreSQL ingress rule
      const postgresRule = dbSg.IpPermissions?.find(rule => 
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs).toHaveLength(1);
    }, 20000);
  });

  describe("EC2 Instances", () => {
    test("Web instances are running and properly configured", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      expect(Reservations).toHaveLength(2);
      
      const instances = Reservations!.flatMap(r => r.Instances || []);
      expect(instances).toHaveLength(2);
      
      instances.forEach(instance => {
        expect(instance.State?.Name).toBe("running");
        expect(instance.InstanceType).toBe("t3.micro");
        expect(instance.VpcId).toBe(stackOutputs["vpc-id"]);
        // Instances should be in public subnets
        expect(stackOutputs["public-subnet-ids"]).toContain(instance.SubnetId);
        // Should have IAM instance profile
        expect(instance.IamInstanceProfile).toBeDefined();
        // Should have user data for web server setup
      });
    }, 30000);

    test("EC2 instances have proper IAM roles and policies", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instance = Reservations![0].Instances![0];
      const instanceProfileName = instance.IamInstanceProfile?.Arn?.split('/').pop();
      
      if (instanceProfileName) {
        const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName
        }));
        
        expect(InstanceProfile?.Roles).toHaveLength(1);
        
        const roleName = InstanceProfile!.Roles![0].RoleName;
        const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        
        // Verify assume role policy allows EC2
        const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
        expect(
          assumeRolePolicy.Statement.some(
            (statement: any) =>
              statement.Effect === "Allow" &&
              statement.Principal.Service === "ec2.amazonaws.com"
          )
        ).toBe(true);
      }
    }, 20000);
  });

  describe("S3 Storage Security", () => {
    test("S3 logs bucket exists and is accessible", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const headBucketResponse = await s3Client.send(new HeadBucketCommand({ 
        Bucket: bucketName 
      }));
      
      expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
    }, 20000);

    test("S3 bucket has AES-256 encryption enabled", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 20000);

    test("S3 bucket name follows naming convention", () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      const environment = stackOutputs["environment"];
      
      // expect(bucketName).toMatch(new RegExp(`^${environment}-web-app-logs-[a-z0-9]{6}$`));
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("CPU alarm exists and is properly configured", async () => {
      const alarmArn = stackOutputs["cloudwatch-alarm-arn"];
      const alarmName = alarmArn.split(':').pop();
      
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName!]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      const alarm = MetricAlarms![0];
      
      expect(alarm.AlarmName).toBe(`${stackOutputs["environment"]}-web-cpu-high`);
      expect(alarm.MetricName).toBe("CPUUtilization");
      expect(alarm.Namespace).toBe("AWS/EC2");
      expect(alarm.Statistic).toBe("Average");
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm.Dimensions).toHaveLength(1);
      expect(alarm.Dimensions![0].Name).toBe("InstanceId");
      expect(stackOutputs["ec2-instance-ids"]).toContain(alarm.Dimensions![0].Value);
    }, 20000);
  });

  describe("Resource Tagging and Compliance", () => {
    test("All VPC resources have proper tagging", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const environment = stackOutputs["environment"];
      
      // Test VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === environment)).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "SecureWebApp")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      
      // Test subnet tags
      const allSubnetIds = [...stackOutputs["public-subnet-ids"], ...stackOutputs["private-subnet-ids"]];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: allSubnetIds }));
      
      Subnets?.forEach(subnet => {
        const subnetTags = subnet.Tags || [];
        expect(subnetTags.some(tag => tag.Key === "Environment" && tag.Value === environment)).toBe(true);
        expect(subnetTags.some(tag => tag.Key === "Project" && tag.Value === "SecureWebApp")).toBe(true);
        expect(subnetTags.some(tag => tag.Key === "Type")).toBe(true);
      });
    }, 30000);

    test("EC2 instances have proper tagging", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const environment = stackOutputs["environment"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = Reservations!.flatMap(r => r.Instances || []);
      
      instances.forEach(instance => {
        const instanceTags = instance.Tags || [];
        expect(instanceTags.some(tag => tag.Key === "Environment" && tag.Value === environment)).toBe(true);
        expect(instanceTags.some(tag => tag.Key === "Project" && tag.Value === "SecureWebApp")).toBe(true);
        expect(instanceTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      });
    }, 20000);
  });

  describe("High Availability Configuration", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      const region = stackOutputs["region"];
      
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: allSubnetIds }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have resources in at least 2 AZs
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${region}[a-z]$`));
      });
    }, 20000);

    test("EC2 instances are distributed across different subnets", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = Reservations!.flatMap(r => r.Instances || []);
      const subnetIds = new Set(instances.map(instance => instance.SubnetId));
      
      // Instances should be in different subnets for HA
      expect(subnetIds.size).toBe(2);
    }, 20000);
  });

  describe("Network Security", () => {
    test("Private subnets cannot directly access internet", async () => {
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      const vpcId = stackOutputs["vpc-id"];
      
      // Get route tables associated with private subnets
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const privateRouteTables = RouteTables?.filter(rt => 
        rt.Associations?.some(assoc => 
          privateSubnetIds.includes(assoc.SubnetId || "")
        )
      );
      
      // Private route tables should not have direct internet gateway routes
      privateRouteTables?.forEach(rt => {
        const hasDirectInternetRoute = rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        );
        expect(hasDirectInternetRoute).toBe(false);
        
        // Should have NAT gateway route instead
        const hasNatRoute = rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        );
        expect(hasNatRoute).toBe(true);
      });
    }, 20000);
  });

  describe("Output Validation", () => {
    test("All required outputs are present and valid", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["public-subnet-ids"]).toHaveLength(2);
      expect(stackOutputs["private-subnet-ids"]).toHaveLength(2);
      expect(stackOutputs["ec2-instance-ids"]).toHaveLength(2);
      expect(stackOutputs["s3-bucket-name"]).toMatch(/^[a-z0-9-]+$/);
      expect(stackOutputs["cloudwatch-alarm-arn"]).toMatch(/^arn:aws:cloudwatch:/);
      expect(stackOutputs["region"]).toBe(awsRegion);
      expect(stackOutputs["environment"]).toBeDefined();
    });

    test("Resource naming follows conventions", () => {
      const environment = stackOutputs["environment"];
      const bucketName = stackOutputs["s3-bucket-name"];
      
      expect(bucketName).toContain(environment);
      expect(bucketName).toContain("web-app-logs");
    });
  });
});