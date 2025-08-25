// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNatGatewaysCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeNetworkAclsCommand } from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let publicInstanceIds: string[];
  let privateInstanceIds: string[];
  let publicInstanceIps: string[];
  let privateInstanceIps: string[];
  let natGatewayId: string;
  let availabilityZones: string[];

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    publicInstanceIds = stackOutputs["public-instance-ids"];
    privateInstanceIds = stackOutputs["private-instance-ids"];
    publicInstanceIps = stackOutputs["public-instance-ips"];
    privateInstanceIps = stackOutputs["private-instance-ips"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    availabilityZones = stackOutputs["availability-zones"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !publicInstanceIds || !privateInstanceIds || !natGatewayId) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  test("VPC exists and has correct configuration", async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.length).toBe(1);
    expect(Vpcs?.[0].VpcId).toBe(vpcId);
    expect(Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
    expect(Vpcs?.[0].State).toBe("available");
  }, 20000);

  test("Public subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    expect(Subnets?.length).toBe(2);

    const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
    const actualCidrs = Subnets?.map(subnet => subnet.CidrBlock).sort();
    expect(actualCidrs).toEqual(expectedCidrs.sort());

    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
      expect(availabilityZones).toContain(subnet.AvailabilityZone);
    });
  }, 20000);

  test("Private subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
    expect(Subnets?.length).toBe(2);

    const expectedCidrs = ["10.0.10.0/24", "10.0.20.0/24"];
    const actualCidrs = Subnets?.map(subnet => subnet.CidrBlock).sort();
    expect(actualCidrs).toEqual(expectedCidrs.sort());

    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
      expect(availabilityZones).toContain(subnet.AvailabilityZone);
    });
  }, 20000);

  test("NAT Gateway exists and is configured correctly", async () => {
    const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] }));
    expect(NatGateways?.length).toBe(1);

    const natGateway = NatGateways?.[0];
    expect(natGateway?.NatGatewayId).toBe(natGatewayId);
    expect(natGateway?.State).toBe("available");
    expect(natGateway?.VpcId).toBe(vpcId);
    expect(publicSubnetIds).toContain(natGateway?.SubnetId);
  }, 20000);

  test("Internet Gateway exists and is attached to VPC", async () => {
    const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
      Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
    }));
    expect(InternetGateways?.length).toBe(1);

    const igw = InternetGateways?.[0];
    expect(igw?.Attachments?.length).toBe(1);
    expect(igw?.Attachments?.[0].VpcId).toBe(vpcId);
    expect(igw?.Attachments?.[0].State).toBe("available");
  }, 20000);

  test("Public EC2 instances exist and are running in public subnets", async () => {
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: publicInstanceIds }));
    expect(Reservations?.length).toBeGreaterThan(0);

    const instances = Reservations?.flatMap(r => r.Instances || []);
    expect(instances?.length).toBe(2);

    // Check that all expected instance IDs are present
    const actualInstanceIds = instances?.map(i => i.InstanceId) || [];
    expect(actualInstanceIds.sort()).toEqual(publicInstanceIds.sort());

    // Check that all expected public IPs are present
    const actualPublicIps = instances?.map(i => i.PublicIpAddress) || [];
    expect(actualPublicIps.sort()).toEqual(publicInstanceIps.sort());

    instances?.forEach(instance => {
      expect(instance.State?.Name).toBe("running");
      expect(publicSubnetIds).toContain(instance.SubnetId);
      expect(instance.PublicIpAddress).toBeTruthy();
      expect(instance.InstanceType).toBe("t3.micro");
    });
  }, 30000);

  test("Private EC2 instances exist and are running in private subnets", async () => {
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: privateInstanceIds }));
    expect(Reservations?.length).toBeGreaterThan(0);

    const instances = Reservations?.flatMap(r => r.Instances || []);
    expect(instances?.length).toBe(2);

    // Check that all expected instance IDs are present
    const actualInstanceIds = instances?.map(i => i.InstanceId) || [];
    expect(actualInstanceIds.sort()).toEqual(privateInstanceIds.sort());

    // Check that all expected private IPs are present
    const actualPrivateIps = instances?.map(i => i.PrivateIpAddress) || [];
    expect(actualPrivateIps.sort()).toEqual(privateInstanceIps.sort());

    instances?.forEach(instance => {
      expect(instance.State?.Name).toBe("running");
      expect(privateSubnetIds).toContain(instance.SubnetId);
      expect(instance.PublicIpAddress).toBeFalsy(); // Private instances should not have public IPs
      expect(instance.InstanceType).toBe("t3.micro");
    });
  }, 30000);

  test("Public security group has correct rules", async () => {
    // Get public instances to find their security groups
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: publicInstanceIds }));
    const instances = Reservations?.flatMap(r => r.Instances || []);
    const publicSecurityGroupId = instances?.[0]?.SecurityGroups?.[0]?.GroupId;

    expect(publicSecurityGroupId).toBeTruthy();

    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId!] }));
    expect(SecurityGroups?.length).toBe(1);

    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.VpcId).toBe(vpcId);

    // Check for HTTP rule (port 80)
    const httpRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

    // Check for HTTPS rule (port 443)
    const httpsRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

    // Check for SSH rule (port 22) - should be restricted to VPC CIDR
    const sshRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/16")).toBe(true);
  }, 20000);

  test("Private security group has correct rules", async () => {
    // Get private instances to find their security groups
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: privateInstanceIds }));
    const instances = Reservations?.flatMap(r => r.Instances || []);
    const privateSecurityGroupId = instances?.[0]?.SecurityGroups?.[0]?.GroupId;

    expect(privateSecurityGroupId).toBeTruthy();

    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [privateSecurityGroupId!] }));
    expect(SecurityGroups?.length).toBe(1);

    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.VpcId).toBe(vpcId);

    // Check for SSH rule (port 22) - should allow from public security group
    const sshRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();

    // Check for application traffic rule (port 8080)
    const appRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 8080 && rule.ToPort === 8080 && rule.IpProtocol === "tcp"
    );
    expect(appRule).toBeDefined();

    // Check for MySQL rule (port 3306)
    const mysqlRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
    );
    expect(mysqlRule).toBeDefined();
  }, 20000);

  test("Route tables are configured correctly", async () => {
    const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }]
    }));

    // Should have at least 3 route tables: default + public + private
    expect(RouteTables?.length).toBeGreaterThanOrEqual(3);

    // Find public route table (has route to Internet Gateway)
    const publicRouteTable = RouteTables?.find(rt => 
      rt.Routes?.some(route => route.GatewayId?.startsWith("igw-"))
    );
    expect(publicRouteTable).toBeDefined();

    // Find private route table (has route to NAT Gateway)
    const privateRouteTable = RouteTables?.find(rt => 
      rt.Routes?.some(route => route.NatGatewayId === natGatewayId)
    );
    expect(privateRouteTable).toBeDefined();

    // Verify public route table has internet route
    const internetRoute = publicRouteTable?.Routes?.find(route => 
      route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
    );
    expect(internetRoute).toBeDefined();

    // Verify private route table has NAT route
    const natRoute = privateRouteTable?.Routes?.find(route => 
      route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId === natGatewayId
    );
    expect(natRoute).toBeDefined();
  }, 20000);

  test("Network ACLs are configured correctly", async () => {
    const { NetworkAcls } = await ec2Client.send(new DescribeNetworkAclsCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }]
    }));

    // Should have at least 3 NACLs: default + public + private
    expect(NetworkAcls?.length).toBeGreaterThanOrEqual(3);

    // Find public NACL (associated with public subnets)
    const publicNacl = NetworkAcls?.find(nacl => 
      nacl.Associations?.some(assoc => publicSubnetIds.includes(assoc.SubnetId || ""))
    );
    expect(publicNacl).toBeDefined();

    // Find private NACL (associated with private subnets)
    const privateNacl = NetworkAcls?.find(nacl => 
      nacl.Associations?.some(assoc => privateSubnetIds.includes(assoc.SubnetId || ""))
    );
    expect(privateNacl).toBeDefined();

    // Verify public NACL has HTTP/HTTPS rules
    const publicHttpRule = publicNacl?.Entries?.find(entry => 
      entry.PortRange?.From === 80 && entry.PortRange?.To === 80 && entry.RuleAction === "allow"
    );
    expect(publicHttpRule).toBeDefined();

    const publicHttpsRule = publicNacl?.Entries?.find(entry => 
      entry.PortRange?.From === 443 && entry.PortRange?.To === 443 && entry.RuleAction === "allow"
    );
    expect(publicHttpsRule).toBeDefined();
  }, 20000);

  test("Availability zones are correctly distributed", async () => {
    expect(availabilityZones.length).toBe(2);
    expect(availabilityZones).toContain("us-east-1a");
    expect(availabilityZones).toContain("us-east-1b");

    // Verify subnets are in different AZs
    const { Subnets: publicSubnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    const { Subnets: privateSubnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));

    const publicAzs = publicSubnets?.map(subnet => subnet.AvailabilityZone).sort();
    const privateAzs = privateSubnets?.map(subnet => subnet.AvailabilityZone).sort();

    expect(publicAzs).toEqual(availabilityZones.sort());
    expect(privateAzs).toEqual(availabilityZones.sort());
  }, 20000);

  test("Instances have correct tags and naming", async () => {
    // Test public instances
    const { Reservations: publicReservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: publicInstanceIds }));
    const publicInstances = publicReservations?.flatMap(r => r.Instances || []);

    publicInstances?.forEach((instance, index) => {
      const nameTag = instance.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toMatch(/MyApp-Instance-Public-\d+/);
      
      const typeTag = instance.Tags?.find(tag => tag.Key === "Type");
      expect(typeTag?.Value).toBe("Public");
    });

    // Test private instances
    const { Reservations: privateReservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: privateInstanceIds }));
    const privateInstances = privateReservations?.flatMap(r => r.Instances || []);

    privateInstances?.forEach((instance, index) => {
      const nameTag = instance.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toMatch(/MyApp-Instance-Private-\d+/);
      
      const typeTag = instance.Tags?.find(tag => tag.Key === "Type");
      expect(typeTag?.Value).toBe("Private");
    });
  }, 20000);
});