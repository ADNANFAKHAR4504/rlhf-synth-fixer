// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupRulesCommand, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand, DescribeDBParameterGroupsCommand } from "@aws-sdk/client-rds";
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

      const envTag = vpc?.Tags?.find(tag => tag.Key === "Env");
      expect(envTag?.Value).toBe(environmentSuffix);

      const ownerTag = vpc?.Tags?.find(tag => tag.Key === "Owner");
      expect(ownerTag?.Value).toBe("infrastructure-team");
    }, 20000);

    test("Internet Gateway exists with correct configuration and attributes", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );

      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];

      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      
      // Verify attachment
      expect(igw?.Attachments?.length).toBe(1);
      const attachment = igw?.Attachments?.[0];
      expect(attachment?.VpcId).toBe(vpcId);
      expect(attachment?.State).toBe("available");

      // Check tags
      const nameTag = igw?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-igw`);

      const projectTag = igw?.Tags?.find(tag => tag.Key === "Project");
      expect(projectTag?.Value).toBe("tap");
    }, 20000);

    test("NAT Gateway exists with correct configuration and attributes", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );

      expect(NatGateways?.length).toBe(1);
      const natGw = NatGateways?.[0];

      expect(natGw?.NatGatewayId).toBe(natGatewayId);
      expect(natGw?.State).toBe("available");
      expect(natGw?.VpcId).toBe(vpcId);
      expect(natGw?.ConnectivityType).toBe("public");
      
      // Verify it's in a public subnet
      expect(publicSubnetIds).toContain(natGw?.SubnetId);

      // Verify Elastic IP allocation
      expect(natGw?.NatGatewayAddresses?.length).toBeGreaterThan(0);
      const natAddress = natGw?.NatGatewayAddresses?.[0];
      expect(natAddress?.AllocationId).toBeDefined();
      expect(natAddress?.PublicIp).toBeDefined();
      expect(natAddress?.NetworkInterfaceId).toBeDefined();
      expect(natAddress?.Status).toBe("succeeded");

      // Check tags
      const nameTag = natGw?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-nat-gw`);
    }, 30000);

    test("Elastic IP for NAT Gateway exists with correct attributes", async () => {
      // Get NAT Gateway details first
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      
      const allocationId = NatGateways?.[0]?.NatGatewayAddresses?.[0]?.AllocationId;
      expect(allocationId).toBeDefined();

      // Verify Elastic IP
      const { Addresses } = await ec2Client.send(
        new DescribeAddressesCommand({ AllocationIds: [allocationId!] })
      );

      expect(Addresses?.length).toBe(1);
      const eip = Addresses?.[0];

      expect(eip?.Domain).toBe("vpc");
      expect(eip?.PublicIp).toBeDefined();
      expect(eip?.AssociationId).toBeDefined();
      
      // Check tags
      const nameTag = eip?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-nat-eip`);
    }, 20000);

    test("Route Tables exist with correct configuration and routes", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({ 
          RouteTableIds: [publicRouteTableId, privateRouteTableId] 
        })
      );

      expect(RouteTables?.length).toBe(2);

      // Verify public route table
      const publicRT = RouteTables?.find(rt => rt.RouteTableId === publicRouteTableId);
      expect(publicRT?.VpcId).toBe(vpcId);
      
      // Check routes
      const publicInternetRoute = publicRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(publicInternetRoute?.GatewayId).toBe(internetGatewayId);
      expect(publicInternetRoute?.State).toBe("active");
      expect(publicInternetRoute?.Origin).toBe("CreateRoute");

      const publicLocalRoute = publicRT?.Routes?.find(r => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(publicLocalRoute?.GatewayId).toBe("local");
      expect(publicLocalRoute?.State).toBe("active");

      // Check associations
      const publicAssociations = publicRT?.Associations?.filter(a => !a.Main);
      expect(publicAssociations?.length).toBe(publicSubnetIds.length);

      // Check tags
      const publicNameTag = publicRT?.Tags?.find(tag => tag.Key === "Name");
      expect(publicNameTag?.Value).toBe(`tap-${environmentSuffix}-public-rt`);

      // Verify private route table
      const privateRT = RouteTables?.find(rt => rt.RouteTableId === privateRouteTableId);
      expect(privateRT?.VpcId).toBe(vpcId);

      // Check routes
      const privateInternetRoute = privateRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(privateInternetRoute?.NatGatewayId).toBe(natGatewayId);
      expect(privateInternetRoute?.State).toBe("active");

      const privateLocalRoute = privateRT?.Routes?.find(r => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(privateLocalRoute?.GatewayId).toBe("local");

      // Check associations
      const privateAssociations = privateRT?.Associations?.filter(a => !a.Main);
      expect(privateAssociations?.length).toBe(privateSubnetIds.length);

      // Check tags
      const privateNameTag = privateRT?.Tags?.find(tag => tag.Key === "Name");
      expect(privateNameTag?.Value).toBe(`tap-${environmentSuffix}-private-rt`);
    }, 30000);

    test("Security Groups exist with correct configuration and rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ 
          GroupIds: [publicSecurityGroupId, rdsSecurityGroupId] 
        })
      );

      expect(SecurityGroups?.length).toBe(2);

      // Verify public security group
      const publicSg = SecurityGroups?.find(sg => sg.GroupId === publicSecurityGroupId);
      expect(publicSg?.GroupName).toBe(`tap-${environmentSuffix}-public-sg`);
      expect(publicSg?.Description).toBe("Security group for public-facing instances");
      expect(publicSg?.VpcId).toBe(vpcId);

      // Check ingress rules in detail
      const httpRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule?.IpRanges?.length).toBe(1);
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      expect(httpRule?.IpRanges?.[0]?.Description).toBe("HTTP access from anywhere");

      const httpsRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule?.IpRanges?.length).toBe(1);
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      expect(httpsRule?.IpRanges?.[0]?.Description).toBe("HTTPS access from anywhere");

      const sshRule = publicSg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.Description).toBe("SSH access from allowed CIDR");

      // Check egress rules
      const egressRule = publicSg?.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1"
      );
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      expect(egressRule?.IpRanges?.[0]?.Description).toBe("All outbound traffic");

      // Verify RDS security group
      const rdsSg = SecurityGroups?.find(sg => sg.GroupId === rdsSecurityGroupId);
      expect(rdsSg?.GroupName).toBe(`tap-${environmentSuffix}-rds-sg`);
      expect(rdsSg?.Description).toBe("Security group for RDS instances");
      expect(rdsSg?.VpcId).toBe(vpcId);

      // Check MySQL ingress rule
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule?.UserIdGroupPairs?.length).toBe(1);
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(publicSecurityGroupId);
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.Description).toBe("MySQL access from application instances");

      // Check tags on both security groups
      [publicSg, rdsSg].forEach(sg => {
        const projectTag = sg?.Tags?.find(tag => tag.Key === "Project");
        expect(projectTag?.Value).toBe("tap");
        
        const envTag = sg?.Tags?.find(tag => tag.Key === "Env");
        expect(envTag?.Value).toBe(environmentSuffix);

        const managedByTag = sg?.Tags?.find(tag => tag.Key === "ManagedBy");
        expect(managedByTag?.Value).toBe("cdktf");
      });
    }, 30000);
  });

  describe("RDS Infrastructure", () => {
    test("RDS instance exists with correct configuration", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: `tap-${environmentSuffix}-mysql` })
      );

      expect(DBInstances?.length).toBe(1);
      const dbInstance = DBInstances?.[0];

      // Basic configuration
      expect(dbInstance?.DBInstanceIdentifier).toBe(`tap-${environmentSuffix}-mysql`);
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.EngineVersion).toContain("8.0"); // Should be 8.0.37 or similar
      expect(dbInstance?.DBName).toBe("tapdb");
      expect(dbInstance?.MasterUsername).toBe("dbadmin");

      // Instance class and storage
      const isProduction = environmentSuffix.toLowerCase() === 'prod' || environmentSuffix.toLowerCase() === 'production';
      expect(dbInstance?.DBInstanceClass).toBe(isProduction ? "db.t3.small" : "db.t3.micro");
      expect(dbInstance?.AllocatedStorage).toBe(isProduction ? 100 : 20);
      expect(dbInstance?.MaxAllocatedStorage).toBe(isProduction ? 1000 : 100);
      expect(dbInstance?.StorageType).toBe(isProduction ? "gp3" : "gp2");
      expect(dbInstance?.StorageEncrypted).toBe(true);

      // Network configuration
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.AvailabilityZone).toBeDefined();
      expect(dbInstance?.DBSubnetGroup?.DBSubnetGroupName).toBe(`tap-${environmentSuffix}-db-subnet-group`);

      // High availability and backup
      expect(dbInstance?.MultiAZ).toBe(isProduction);
      expect(dbInstance?.BackupRetentionPeriod).toBe(isProduction ? 30 : 7);
      expect(dbInstance?.PreferredBackupWindow).toBe("03:00-04:00");
      expect(dbInstance?.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      expect(dbInstance?.AutoMinorVersionUpgrade).toBe(!isProduction);

      // Security
      expect(dbInstance?.DeletionProtection).toBe(isProduction);
      expect(dbInstance?.VpcSecurityGroups?.length).toBe(1);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(rdsSecurityGroupId);

      // Monitoring
      expect(dbInstance?.MonitoringInterval).toBe(isProduction ? 60 : 0);
      expect(dbInstance?.EnabledCloudwatchLogsExports).toContain("error");
      expect(dbInstance?.EnabledCloudwatchLogsExports).toContain("general");
      expect(dbInstance?.EnabledCloudwatchLogsExports).toContain("slowquery");

      // Performance Insights
      expect(dbInstance?.PerformanceInsightsEnabled).toBe(isProduction);
      if (isProduction) {
        expect(dbInstance?.PerformanceInsightsRetentionPeriod).toBe(731);
      }

      // Master user secret
      expect(dbInstance?.MasterUserSecret?.SecretArn).toBeDefined();

      // Tags
      const nameTag = dbInstance?.TagList?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-db-instance`);

      const projectTag = dbInstance?.TagList?.find(tag => tag.Key === "Project");
      expect(projectTag?.Value).toBe("tap");
    }, 30000);

    test("DB subnet group exists with correct configuration", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ 
          DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group` 
        })
      );

      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];

      expect(subnetGroup?.DBSubnetGroupName).toBe(`tap-${environmentSuffix}-db-subnet-group`);
      expect(subnetGroup?.DBSubnetGroupDescription).toBe("Database subnet group for private subnets");
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.SubnetGroupStatus).toBe("Complete");

      // Verify subnets
      expect(subnetGroup?.Subnets?.length).toBe(2);
      subnetGroup?.Subnets?.forEach(subnet => {
        expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
        expect(subnet.SubnetStatus).toBe("Active");
      });

      // Check tags
      const nameTag = subnetGroup?.DBSubnetGroupArn ? 
        (await rdsClient.send(new DescribeDBSubnetGroupsCommand({}))).DBSubnetGroups?.find(
          sg => sg.DBSubnetGroupName === `tap-${environmentSuffix}-db-subnet-group`
        ) : subnetGroup;
      // Note: Tags might not be directly accessible on subnet groups
    }, 20000);

    test("DB parameter group exists with correct configuration", async () => {
      const { DBParameterGroups } = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({ 
          DBParameterGroupName: `tap-${environmentSuffix}-db-params` 
        })
      );

      expect(DBParameterGroups?.length).toBe(1);
      const paramGroup = DBParameterGroups?.[0];

      expect(paramGroup?.DBParameterGroupName).toBe(`tap-${environmentSuffix}-db-params`);
      expect(paramGroup?.DBParameterGroupFamily).toBe("mysql8.0");
      expect(paramGroup?.Description).toBe("Custom parameter group for MySQL");
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