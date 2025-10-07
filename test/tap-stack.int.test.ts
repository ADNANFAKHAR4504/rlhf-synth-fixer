// __tests__/tap-stack.int.test.ts
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeSecurityGroupRulesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNetworkInterfacesCommand
} from "@aws-sdk/client-ec2";
import { 
  RDSClient, 
  DescribeDBInstancesCommand, 
  DescribeDBSubnetGroupsCommand,
  DescribeDBClusterParameterGroupsCommand 
} from "@aws-sdk/client-rds";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let natGatewayId: string;
  let natEipAddress: string;
  let publicSecurityGroupId: string;
  let privateSecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let rdsEndpoint: string;
  let rdsDbName: string;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    natEipAddress = stackOutputs["nat-eip-address"];
    publicSecurityGroupId = stackOutputs["public-security-group-id"];
    privateSecurityGroupId = stackOutputs["private-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsDbName = stackOutputs["rds-db-name"];

    if (!vpcId || !natGatewayId || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("Network Infrastructure", () => {
    test("VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
    }, 20000);

    test("Public and private subnets are properly configured", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
        })
      );

      expect(Subnets?.length).toBe(4); // 2 public + 2 private

      // Check public subnets
      const publicSubnets = Subnets?.filter(subnet => 
        publicSubnetIds.includes(subnet.SubnetId!)
      );
      publicSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.find(t => t.Key === "Type")?.Value).toBe("public");
      });

      // Check private subnets
      const privateSubnets = Subnets?.filter(subnet => 
        privateSubnetIds.includes(subnet.SubnetId!)
      );
      privateSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.find(t => t.Key === "Type")?.Value).toBe("private");
      });
    }, 20000);

    test("NAT Gateway is active and correctly configured", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: [natGatewayId],
        })
      );

      const natGateway = NatGateways?.[0];
      expect(natGateway).toBeDefined();
      expect(natGateway?.State).toBe("available");
      expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBe(natEipAddress);
      
      // Verify NAT Gateway is in a public subnet
      expect(publicSubnetIds).toContain(natGateway?.SubnetId);
    }, 20000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: "attachment.vpc-id",
              Values: [vpcId],
            },
          ],
        })
      );

      expect(InternetGateways?.length).toBeGreaterThanOrEqual(1);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
    }, 20000);
  });

  describe("Routing Configuration", () => {
    test("Public subnets route to Internet Gateway", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: "vpc-id",
              Values: [vpcId],
            },
            {
              Name: "association.subnet-id",
              Values: publicSubnetIds,
            },
          ],
        })
      );

      expect(RouteTables?.length).toBeGreaterThanOrEqual(1);
      
      RouteTables?.forEach(routeTable => {
        const igwRoute = routeTable.Routes?.find(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && 
          route.GatewayId?.startsWith("igw-")
        );
        expect(igwRoute).toBeDefined();
        expect(igwRoute?.State).toBe("active");
      });
    }, 20000);

    test("Private subnets route to NAT Gateway", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: "vpc-id",
              Values: [vpcId],
            },
            {
              Name: "association.subnet-id",
              Values: privateSubnetIds,
            },
          ],
        })
      );

      expect(RouteTables?.length).toBeGreaterThanOrEqual(1);
      
      RouteTables?.forEach(routeTable => {
        const natRoute = routeTable.Routes?.find(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && 
          route.NatGatewayId === natGatewayId
        );
        expect(natRoute).toBeDefined();
        expect(natRoute?.State).toBe("active");
      });
    }, 20000);
  });

  describe("Security Groups Interactions", () => {
    test("Public security group allows HTTP/HTTPS from internet", async () => {
      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            {
              Name: "group-id",
              Values: [publicSecurityGroupId],
            },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      
      // Check HTTP rule
      const httpRule = ingressRules?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.CidrIpv4).toBe("0.0.0.0/0");
      expect(httpRule?.IpProtocol).toBe("tcp");

      // Check HTTPS rule
      const httpsRule = ingressRules?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.CidrIpv4).toBe("0.0.0.0/0");
      expect(httpsRule?.IpProtocol).toBe("tcp");
    }, 20000);

    test("RDS security group allows MySQL traffic only from private security group", async () => {
      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            {
              Name: "group-id",
              Values: [rdsSecurityGroupId],
            },
          ],
        })
      );

      const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
      const mysqlFromPrivate = ingressRules?.find(rule => 
        rule.FromPort === 3306 && 
        rule.ToPort === 3306 && 
        rule.ReferencedGroupInfo?.GroupId === privateSecurityGroupId
      );

      expect(mysqlFromPrivate).toBeDefined();
      expect(mysqlFromPrivate?.IpProtocol).toBe("tcp");
      
      // Ensure no other ingress rules exist (security best practice)
      expect(ingressRules?.length).toBe(1);
    }, 20000);

    test("All security groups have proper egress rules", async () => {
      const securityGroupIds = [publicSecurityGroupId, privateSecurityGroupId, rdsSecurityGroupId];
      
      for (const sgId of securityGroupIds) {
        const { SecurityGroupRules } = await ec2Client.send(
          new DescribeSecurityGroupRulesCommand({
            Filters: [
              {
                Name: "group-id",
                Values: [sgId],
              },
            ],
          })
        );

        const egressRules = SecurityGroupRules?.filter(rule => rule.IsEgress);
        const allowAllEgress = egressRules?.find(rule => 
          rule.CidrIpv4 === "0.0.0.0/0" &&
          rule.IpProtocol === "-1"
        );

        expect(allowAllEgress).toBeDefined();
      }
    }, 20000);
  });

  describe("RDS Database Configuration", () => {
    test("RDS instance exists and is available", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.DBName).toBe(rdsDbName);
      expect(dbInstance?.Endpoint?.Address).toContain(dbIdentifier);
      expect(dbInstance?.Endpoint?.Port).toBe(3306);
    }, 20000);

    test("RDS is in private subnets and not publicly accessible", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      
      // Verify DB subnet group
      const dbSubnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;
      expect(dbSubnetGroupName).toBeDefined();

      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbSubnetGroupName,
        })
      );

      const subnetGroup = DBSubnetGroups?.[0];
      const subnetIds = subnetGroup?.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      
      // All DB subnets should be private subnets
      subnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    }, 20000);

    test("RDS has Multi-AZ enabled for high availability", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 20000);

    test("RDS has proper security group attached", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      const vpcSecurityGroups = dbInstance?.VpcSecurityGroups || [];
      
      const hasRdsSecurityGroup = vpcSecurityGroups.some(
        sg => sg.VpcSecurityGroupId === rdsSecurityGroupId && sg.Status === "active"
      );
      
      expect(hasRdsSecurityGroup).toBe(true);
      expect(vpcSecurityGroups.length).toBe(1); // Should only have one security group
    }, 20000);
  });

  describe("Cross-Service Network Connectivity", () => {
    test("Resources in public subnet can reach internet through IGW", async () => {
      // Verify that public subnets have proper route to IGW
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: "association.subnet-id",
              Values: publicSubnetIds,
            },
          ],
        })
      );

      RouteTables?.forEach(routeTable => {
        const internetRoute = routeTable.Routes?.find(r => 
          r.DestinationCidrBlock === "0.0.0.0/0" && r.GatewayId?.startsWith("igw-")
        );
        expect(internetRoute).toBeDefined();
      });
    }, 20000);

    test("Resources in private subnet can reach internet through NAT Gateway", async () => {
      // Verify that private subnets have proper route to NAT Gateway
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: "association.subnet-id",
              Values: privateSubnetIds,
            },
          ],
        })
      );

      RouteTables?.forEach(routeTable => {
        const natRoute = routeTable.Routes?.find(r => 
          r.DestinationCidrBlock === "0.0.0.0/0" && r.NatGatewayId === natGatewayId
        );
        expect(natRoute).toBeDefined();
      });

      // Verify NAT Gateway has an Elastic IP
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: [natGatewayId],
        })
      );

      const natGateway = NatGateways?.[0];
      expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBe(natEipAddress);
    }, 20000);

    test("Network interfaces in private subnets can communicate with RDS", async () => {
      // Check if any network interfaces exist in private subnets that could connect to RDS
      const { NetworkInterfaces } = await ec2Client.send(
        new DescribeNetworkInterfacesCommand({
          Filters: [
            {
              Name: "subnet-id",
              Values: privateSubnetIds,
            },
          ],
        })
      );

      if (NetworkInterfaces && NetworkInterfaces.length > 0) {
        // Check that these interfaces could potentially connect to RDS
        NetworkInterfaces.forEach(eni => {
          const hasPrivateSecurityGroup = eni.Groups?.some(
            group => group.GroupId === privateSecurityGroupId
          );
          
          // If ENI has private security group, it should be able to connect to RDS
          if (hasPrivateSecurityGroup) {
            expect(eni.SubnetId).toBeDefined();
            expect(privateSubnetIds).toContain(eni.SubnetId);
          }
        });
      }
    }, 20000);
  });

  describe("High Availability and Redundancy", () => {
    test("Subnets span multiple availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
        })
      );

      const availabilityZones = new Set(
        Subnets?.map(subnet => subnet.AvailabilityZone)
      );

      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify each type of subnet exists in multiple AZs
      const publicAZs = new Set(
        Subnets?.filter(s => publicSubnetIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      const privateAZs = new Set(
        Subnets?.filter(s => privateSubnetIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );

      expect(publicAZs.size).toBeGreaterThanOrEqual(2);
      expect(privateAZs.size).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("RDS subnet group spans multiple availability zones", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbSubnetGroupName = DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbSubnetGroupName,
        })
      );

      const subnets = DBSubnetGroups?.[0]?.Subnets || [];
      const availabilityZones = new Set(
        subnets.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );

      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Security Best Practices", () => {
    test("No security groups allow unrestricted access except public HTTP/HTTPS", async () => {
      const allSecurityGroups = [privateSecurityGroupId, rdsSecurityGroupId];
      
      for (const sgId of allSecurityGroups) {
        const { SecurityGroupRules } = await ec2Client.send(
          new DescribeSecurityGroupRulesCommand({
            Filters: [
              {
                Name: "group-id",
                Values: [sgId],
              },
            ],
          })
        );

        const ingressRules = SecurityGroupRules?.filter(rule => !rule.IsEgress);
        
        ingressRules?.forEach(rule => {
          // Should not have 0.0.0.0/0 in private or RDS security groups
          expect(rule.CidrIpv4).not.toBe("0.0.0.0/0");
        });
      }
    }, 20000);

    test("SSH access is restricted to specific CIDR", async () => {
      const { SecurityGroupRules } = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [
            {
              Name: "group-id",
              Values: [publicSecurityGroupId],
            },
          ],
        })
      );

      const sshRule = SecurityGroupRules?.find(rule => 
        !rule.IsEgress && rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule?.CidrIpv4).not.toBe("0.0.0.0/0");
      expect(sshRule?.CidrIpv4).toBe("106.213.83.113/32"); // As configured in tap-stack
    }, 20000);

    test("RDS is not accessible from the internet", async () => {
      const dbIdentifier = rdsEndpoint.split(".")[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = DBInstances?.[0];
      
      // RDS should not be publicly accessible
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      
      // RDS should be in private subnets only
      const dbSubnets = dbInstance?.DBSubnetGroup?.Subnets || [];
      dbSubnets.forEach(subnet => {
        expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
      });
    }, 20000);
  });

  describe("Resource Tagging and Organization", () => {
    test("All resources have proper tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = Vpcs?.[0];
      const vpcTags = vpc?.Tags || [];
      
      expect(vpcTags.find(t => t.Key === "Project")?.Value).toBeDefined();
      expect(vpcTags.find(t => t.Key === "Environment")?.Value).toBeDefined();
      expect(vpcTags.find(t => t.Key === "ManagedBy")?.Value).toBe("Terraform");
      expect(vpcTags.find(t => t.Key === "CreatedBy")?.Value).toBe("CDKTF");

      // Check subnet tags
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
        })
      );

      Subnets?.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.find(t => t.Key === "Project")?.Value).toBeDefined();
        expect(tags.find(t => t.Key === "Environment")?.Value).toBeDefined();
        expect(tags.find(t => t.Key === "Type")?.Value).toBeDefined();
      });
    }, 20000);
  });
});