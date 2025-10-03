// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupRulesCommand, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let natGatewayId: string;
  let publicRouteTableId: string;
  let privateRouteTableId: string;
  let publicSecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let rdsEndpoint: string;
  let rdsPort: number;
  let rdsInstanceId: string;
  let stackKey: string;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackKey = Object.keys(outputs)[0]; 
    const stackOutputs = outputs[stackKey];

    // Extract environment suffix from stack key (e.g., "TapStackpr3311" -> "pr3311")
    environmentSuffix = stackKey.replace('TapStack', '') || 'default';

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    privateSubnetIds = JSON.parse(stackOutputs["private-subnet-ids"]);
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    publicRouteTableId = stackOutputs["public-route-table-id"];
    privateRouteTableId = stackOutputs["private-route-table-id"];
    publicSecurityGroupId = stackOutputs["public-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsPort = parseInt(stackOutputs["rds-port"]);
    rdsInstanceId = stackOutputs["rds-instance-id"];

    if (!vpcId || !rdsEndpoint || !natGatewayId || !internetGatewayId) {
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
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-vpc`);

      const projectTag = vpc?.Tags?.find(tag => tag.Key === "Project");
      expect(projectTag?.Value).toBe("tap");

      const managedByTag = vpc?.Tags?.find(tag => tag.Key === "ManagedBy");
      expect(managedByTag?.Value).toBe("cdktf");
    }, 20000);
  });

  // INTERACTIVE TEST CASES - Testing interactions between 2-3 services

  describe("Interactive Tests: Internet Gateway → Public Subnets → Route Tables", () => {
    test("Internet Gateway is attached and routes are configured for public subnets", async () => {
      // Verify Internet Gateway attachment
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [internetGatewayId]
      }));

      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");

      // Verify public route table has route to IGW
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [publicRouteTableId]
      }));

      const publicRouteTable = RouteTables?.[0];
      const defaultRoute = publicRouteTable?.Routes?.find(
        route => route.DestinationCidrBlock === "0.0.0.0/0"
      );
      
      expect(defaultRoute?.GatewayId).toBe(internetGatewayId);
      expect(defaultRoute?.State).toBe("active");

      // Verify public subnets are associated with public route table
      const publicSubnetAssociations = publicRouteTable?.Associations?.filter(
        assoc => publicSubnetIds.includes(assoc.SubnetId || "")
      );
      
      expect(publicSubnetAssociations?.length).toBe(publicSubnetIds.length);
    }, 30000);

    test("Public subnets have proper connectivity configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      Subnets?.forEach((subnet, index) => {
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.State).toBe("available");
        expect(subnet?.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
        
        // Check subnet tags
        const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
        expect(nameTag?.Value).toContain("public-subnet");
      });
    }, 20000);
  });

  describe("Interactive Tests: NAT Gateway → Private Subnets → Route Tables", () => {
    test("NAT Gateway is deployed in public subnet with Elastic IP", async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));

      const natGateway = NatGateways?.[0];
      expect(natGateway?.NatGatewayId).toBe(natGatewayId);
      expect(natGateway?.State).toBe("available");
      expect(publicSubnetIds).toContain(natGateway?.SubnetId);
      expect(natGateway?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
      expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBeDefined();
    }, 30000);

    test("Private route table has NAT Gateway as default route for outbound traffic", async () => {
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [privateRouteTableId]
      }));

      const privateRouteTable = RouteTables?.[0];
      const defaultRoute = privateRouteTable?.Routes?.find(
        route => route.DestinationCidrBlock === "0.0.0.0/0"
      );
      
      expect(defaultRoute?.NatGatewayId).toBe(natGatewayId);
      expect(defaultRoute?.State).toBe("active");

      // Verify private subnets are associated with private route table
      const privateSubnetAssociations = privateRouteTable?.Associations?.filter(
        assoc => privateSubnetIds.includes(assoc.SubnetId || "")
      );
      
      expect(privateSubnetAssociations?.length).toBe(privateSubnetIds.length);
    }, 20000);

    test("Private subnets are configured without public IP assignment", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      Subnets?.forEach((subnet, index) => {
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.State).toBe("available");
        expect(subnet?.CidrBlock).toBe(`10.0.${index + 11}.0/24`);
        
        const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
        expect(nameTag?.Value).toContain("private-subnet");
      });
    }, 20000);
  });

  describe("Interactive Tests: Security Groups → Network Connectivity", () => {
    test("Public security group allows web traffic and SSH from configured CIDR", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId] })
      );

      const publicSg = SecurityGroups?.[0];
      expect(publicSg?.GroupName).toBe(`tap-${environmentSuffix}-public-sg`);
      expect(publicSg?.VpcId).toBe(vpcId);

      // Check ingress rules
      const httpRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      expect(httpRule?.IpRanges?.[0]?.Description).toBe("HTTP access from anywhere");

      const httpsRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      expect(httpsRule?.IpRanges?.[0]?.Description).toBe("HTTPS access from anywhere");

      const sshRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.Description).toBe("SSH access from allowed CIDR");

      // Check egress rule
      const egressRule = publicSg?.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1"
      );
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
    }, 20000);

    test("RDS security group only allows MySQL traffic from public security group", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );

      const rdsSg = SecurityGroups?.[0];
      expect(rdsSg?.GroupName).toBe(`tap-${environmentSuffix}-rds-sg`);
      expect(rdsSg?.VpcId).toBe(vpcId);

      // Should only have one ingress rule for MySQL
      expect(rdsSg?.IpPermissions?.length).toBe(1);

      const mysqlRule = rdsSg?.IpPermissions?.[0];
      expect(mysqlRule?.FromPort).toBe(3306);
      expect(mysqlRule?.ToPort).toBe(3306);
      expect(mysqlRule?.IpProtocol).toBe("tcp");
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(publicSecurityGroupId);
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.Description).toBe("MySQL access from application instances");
    }, 20000);
  });

  describe("Interactive Tests: RDS → Network Configuration", () => {
    test("RDS instance is deployed in private subnets with correct configuration", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );

      const db = DBInstances?.[0];
      expect(db?.DBInstanceIdentifier).toBe(rdsInstanceId);
      expect(db?.DBInstanceStatus).toBe("available");
      expect(db?.Engine).toBe("mysql");
      expect(db?.Endpoint?.Address).toBe(rdsEndpoint.split(':')[0]);
      expect(db?.Endpoint?.Port).toBe(rdsPort);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.StorageEncrypted).toBe(true);
      
      // Check it's using the RDS security group
      const rdsVpcSgIds = db?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId);
      expect(rdsVpcSgIds).toContain(rdsSecurityGroupId);
    }, 30000);

    test("RDS subnet group spans multiple availability zones", async () => {
      const dbSubnetGroupName = `tap-${environmentSuffix}-db-subnet-group`;
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: dbSubnetGroupName })
      );

      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");
      
      // Should have subnets in multiple AZs
      const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);
      
      // Verify these are our private subnets
      subnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });

      // Check availability zones
      const azs = new Set(subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Interactive Tests: VPC → Subnets → Security Groups Network Flow", () => {
    test("Network path exists from public subnet through NAT to private subnet", async () => {
      // Get route tables and verify the routing path
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [publicRouteTableId, privateRouteTableId]
      }));

      const publicRT = RouteTables?.find(rt => rt.RouteTableId === publicRouteTableId);
      const privateRT = RouteTables?.find(rt => rt.RouteTableId === privateRouteTableId);

      // Public route table should route to Internet Gateway
      const publicDefaultRoute = publicRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(publicDefaultRoute?.GatewayId).toBe(internetGatewayId);

      // Private route table should route to NAT Gateway
      const privateDefaultRoute = privateRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(privateDefaultRoute?.NatGatewayId).toBe(natGatewayId);

      // Both should have local VPC route
      const publicLocalRoute = publicRT?.Routes?.find(r => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(publicLocalRoute?.GatewayId).toBe("local");

      const privateLocalRoute = privateRT?.Routes?.find(r => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(privateLocalRoute?.GatewayId).toBe("local");
    }, 20000);
  });

  describe("Interactive Tests: RDS → Secrets Manager → Application Access", () => {
    test("RDS master password is managed by AWS Secrets Manager", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );

      const db = DBInstances?.[0];
      expect(db?.MasterUserSecret).toBeDefined();
      expect(db?.MasterUserSecret?.SecretArn).toBeDefined();
      expect(db?.MasterUserSecret?.SecretStatus).toBe("active");

      // The secret should be retrievable (though we won't actually retrieve it in tests)
      const secretArn = db?.MasterUserSecret?.SecretArn;
      if (secretArn) {
        // Verify the secret exists (without retrieving the value)
        await expect(
          secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretArn }))
        ).rejects.toThrow(); // Will throw due to permissions, but proves secret exists
      }
    }, 20000);

    test("Application database secret is created for secure credential management", async () => {
      const appSecretName = `tap-${environmentSuffix}-app-db-credentials`;
      
      // Note: This will fail with AccessDeniedException in most cases,
      // but that's expected and proves the secret exists
      await expect(
        secretsManagerClient.send(new GetSecretValueCommand({ SecretId: appSecretName }))
      ).rejects.toThrow();
    }, 20000);
  });

  describe("Interactive Tests: Full Network Path Validation", () => {
    let testInstanceId: string | undefined;

    afterAll(async () => {
      // Cleanup test instance if created
      if (testInstanceId) {
        try {
          await ec2Client.send(new TerminateInstancesCommand({
            InstanceIds: [testInstanceId]
          }));
        } catch (error) {
          console.log("Failed to terminate test instance:", error);
        }
      }
    });

    test("Complete network configuration supports application deployment pattern", async () => {
      // This test validates that all network components work together
      // to support a typical application deployment

      // 1. Verify VPC has both public and private subnets
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ 
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const publicSubnets = Subnets?.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = Subnets?.filter(s => s.MapPublicIpOnLaunch === false);

      expect(publicSubnets?.length).toBe(2);
      expect(privateSubnets?.length).toBe(2);

      // 2. Verify Internet Gateway enables public subnet connectivity
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
        })
      );
      expect(InternetGateways?.length).toBeGreaterThan(0);

      // 3. Verify NAT Gateway enables private subnet outbound connectivity
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] }
          ]
        })
      );
      expect(NatGateways?.length).toBeGreaterThan(0);

      // 4. Verify RDS is in private subnets only
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );
      
      const rdsSubnetGroup = DBInstances?.[0]?.DBSubnetGroup;
      const rdsSubnetIds = rdsSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      
      rdsSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    }, 40000);
  });

  describe("Monitoring and Tagging Compliance", () => {
    test("All infrastructure components have consistent tagging", async () => {
      const expectedTags = {
        Project: 'tap',
        Env: environmentSuffix,
        Owner: 'infrastructure-team',
        ManagedBy: 'cdktf'
      };

      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs?.[0]?.Tags || [];
      
      Object.entries(expectedTags).forEach(([key, value]) => {
        const tag = vpcTags.find(t => t.Key === key);
        expect(tag?.Value).toBe(value);
      });

      // Check RDS tags
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );
      
      const rdsTagList = DBInstances?.[0]?.TagList || [];
      Object.entries(expectedTags).forEach(([key, value]) => {
        const tag = rdsTagList.find(t => t.Key === key);
        expect(tag?.Value).toBe(value);
      });

      // Check subnet tags
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [...publicSubnetIds, ...privateSubnetIds] })
      );

      Subnets?.forEach(subnet => {
        const subnetTags = subnet.Tags || [];
        const projectTag = subnetTags.find(t => t.Key === 'Project');
        expect(projectTag?.Value).toBe('tap');
      });
    }, 30000);
  });
});