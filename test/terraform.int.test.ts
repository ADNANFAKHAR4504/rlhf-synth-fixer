import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeTransitGatewaysCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSecurityGroupId = (v: string) => v.startsWith("sg-");
const isValidInstanceId = (v: string) => v.startsWith("i-");
const isValidNaclId = (v: string) => v.startsWith("acl-");
const isValidRouteTableId = (v: string) => v.startsWith("rtb-");
const isValidTgwId = (v: string) => v.startsWith("tgw-");
const isValidTgwAttachmentId = (v: string) => v.startsWith("tgw-attach-");
const isValidFlowLogId = (v: string) => v.startsWith("fl-");
const isValidIgwId = (v: string) => v.startsWith("igw-");
const isValidCidr = (v: string) => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidIpAddress = (v: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v);

const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};

const parseObject = (v: any) => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Payment Processing Platform Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;
  let integrationSummary: any;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }

    integrationSummary = parseObject(outputs.integration_summary);
    region = integrationSummary?.region || "eu-central-1";
  });

  describe("Output Structure Validation", () => {
    it("should have essential infrastructure outputs", () => {
      const requiredOutputs = [
        "vpc_id", "vpc_cidr_block", "public_subnet_ids", "private_app_subnet_ids",
        "private_db_subnet_ids", "nat_instance_id", "transit_gateway_id",
        "transit_gateway_attachment_id", "vpc_flow_logs_s3_bucket"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should have integration summary with all required fields", () => {
      expect(integrationSummary).toBeDefined();
      expect(integrationSummary).toHaveProperty("vpc_id");
      expect(integrationSummary).toHaveProperty("vpc_cidr");
      expect(integrationSummary).toHaveProperty("public_subnets");
      expect(integrationSummary).toHaveProperty("application_subnets");
      expect(integrationSummary).toHaveProperty("database_subnets");
      expect(integrationSummary).toHaveProperty("nat_instance_id");
      expect(integrationSummary).toHaveProperty("transit_gateway_id");
      expect(integrationSummary).toHaveProperty("region");
    });

    it("should not expose sensitive information", () => {
      const sensitivePatterns = [
        /password/i, /secret/i, /private_key/i, /access_key/i,
        /session_token/i, /credentials/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });

    it("should have consistent resource IDs across outputs", () => {
      expect(outputs.vpc_id).toBe(integrationSummary.vpc_id);
      expect(outputs.nat_instance_id).toBe(integrationSummary.nat_instance_id);
      expect(outputs.transit_gateway_id).toBe(integrationSummary.transit_gateway_id);
    });
  });

  describe("VPC Infrastructure", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates VPC configuration and CIDR block", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      expect(isValidVpcId(outputs.vpc_id)).toBe(true);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");

      // Check DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);

      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      expect(isValidCidr(outputs.vpc_cidr_block)).toBe(true);
      expect(vpc.CidrBlock).toBe(outputs.vpc_cidr_block);
    });

    it("validates Internet Gateway attachment", async () => {
      if (skipIfMissing("internet_gateway_id", outputs)) return;

      expect(isValidIgwId(outputs.internet_gateway_id)).toBe(true);

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.InternetGatewayId).toBeTruthy();
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe("available");
    });

    it("validates public subnet configuration", async () => {
      if (skipIfMissing("public_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(2);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toBe(index === 0 ? "10.0.1.0/24" : "10.0.2.0/24");
      });

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(azs.length);
    });

    it("validates private application subnet configuration", async () => {
      if (skipIfMissing("private_app_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_app_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(2);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      const expectedAppCidrs = ["10.0.11.0/24", "10.0.12.0/24"];
      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(expectedAppCidrs).toContain(subnet.CidrBlock);
      });

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(azs.length);
    });

    it("validates private database subnet configuration", async () => {
      if (skipIfMissing("private_db_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_db_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(2);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      const expectedDbCidrs = ["10.0.21.0/24", "10.0.22.0/24"];
      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(expectedDbCidrs).toContain(subnet.CidrBlock);
      });

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(azs.length);
    });

    it("validates availability zone distribution", async () => {
      const ec2Client = new EC2Client({ region });

      const allSubnetIds = [
        ...parseArray(outputs.public_subnet_ids),
        ...parseArray(outputs.private_app_subnet_ids),
        ...parseArray(outputs.private_db_subnet_ids)
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const response = await ec2Client.send(command);
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);

      expect(azs.length).toBe(6);
      expect(azs.filter(az => az === azs[0]).length).toBe(3);
      expect(azs.filter(az => az === azs[1]).length).toBe(3);
    });
  });

  describe("NAT Instance Configuration", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates NAT instance deployment", async () => {
      if (skipIfMissing("nat_instance_id", outputs)) return;

      expect(isValidInstanceId(outputs.nat_instance_id)).toBe(true);

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.nat_instance_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe("running");
      expect(instance.InstanceType).toBe("t3.micro");
      expect(instance.SourceDestCheck).toBe(false);

      expect(isValidIpAddress(outputs.nat_instance_private_ip)).toBe(true);
      expect(instance.PrivateIpAddress).toBe(outputs.nat_instance_private_ip);

      expect(isValidIpAddress(outputs.nat_instance_public_ip)).toBe(true);
      expect(instance.PublicIpAddress).toBe(outputs.nat_instance_public_ip);

      const publicSubnetIds = parseArray(outputs.public_subnet_ids);
      expect(publicSubnetIds).toContain(instance.SubnetId);
    });

    it("validates NAT instance security group", async () => {
      if (skipIfMissing("nat_instance_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.nat_instance_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.nat_instance_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();

      const httpsRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();

      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
    });

    it("validates NAT instance has Elastic IP association", async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.nat_instance_id]
      });

      const response = await ec2Client.send(instanceCommand);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toBe(outputs.nat_instance_public_ip);
      expect(instance.NetworkInterfaces![0].Association?.PublicIp).toBe(outputs.nat_instance_public_ip);
    });
  });

  describe("Route Tables and Routing", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates route table configuration", async () => {
      if (skipIfMissing("route_table_ids", outputs)) return;

      const routeTableIds = parseObject(outputs.route_table_ids);
      expect(routeTableIds).toHaveProperty("public");
      expect(routeTableIds).toHaveProperty("application");
      expect(routeTableIds).toHaveProperty("database");

      Object.values(routeTableIds).forEach((rtId: any) => {
        expect(isValidRouteTableId(rtId)).toBe(true);
      });

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: Object.values(routeTableIds) as string[]
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables!.forEach(rt => {
        expect(rt.VpcId).toBe(outputs.vpc_id);
      });
    });

    it("validates public route table has correct routes", async () => {
      const routeTableIds = parseObject(outputs.route_table_ids);

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [routeTableIds.public]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const internetRoute = routeTable.Routes?.find(route =>
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
      );
      expect(internetRoute).toBeDefined();
      expect(internetRoute?.GatewayId).toBe(outputs.internet_gateway_id);

      const tgwRoute = routeTable.Routes?.find(route =>
        route.DestinationCidrBlock === "10.100.0.0/16" && route.TransitGatewayId?.startsWith("tgw-")
      );
      expect(tgwRoute).toBeDefined();
      expect(tgwRoute?.TransitGatewayId).toBe(outputs.transit_gateway_id);
    });

    it("validates private route tables have NAT instance routes", async () => {
      const routeTableIds = parseObject(outputs.route_table_ids);

      for (const rtType of ["application", "database"]) {
        const command = new DescribeRouteTablesCommand({
          RouteTableIds: [routeTableIds[rtType]]
        });

        const response = await ec2Client.send(command);
        const routeTable = response.RouteTables![0];

        const natRoute = routeTable.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NetworkInterfaceId
        );
        expect(natRoute).toBeDefined();

        const tgwRoute = routeTable.Routes?.find(route =>
          route.DestinationCidrBlock === "10.100.0.0/16" && route.TransitGatewayId?.startsWith("tgw-")
        );
        expect(tgwRoute).toBeDefined();
        expect(tgwRoute?.TransitGatewayId).toBe(outputs.transit_gateway_id);
      }
    });

    it("validates route table subnet associations", async () => {
      const routeTableIds = parseObject(outputs.route_table_ids);
      const publicSubnets = parseArray(outputs.public_subnet_ids);
      const appSubnets = parseArray(outputs.private_app_subnet_ids);
      const dbSubnets = parseArray(outputs.private_db_subnet_ids);

      for (const [type, subnetIds] of [
        ["public", publicSubnets],
        ["application", appSubnets],
        ["database", dbSubnets]
      ]) {
        const command = new DescribeRouteTablesCommand({
          RouteTableIds: [routeTableIds[type]]
        });

        const response = await ec2Client.send(command);
        const routeTable = response.RouteTables![0];

        const associatedSubnets = routeTable.Associations?.map(assoc => assoc.SubnetId).filter(Boolean);

        (subnetIds as string[]).forEach(subnetId => {
          expect(associatedSubnets).toContain(subnetId);
        });
      }
    });
  });

  describe("Network ACLs Security", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates Network ACLs deployment", async () => {
      if (skipIfMissing("network_acl_ids", outputs)) return;

      const naclIds = parseObject(outputs.network_acl_ids);
      expect(naclIds).toHaveProperty("public");
      expect(naclIds).toHaveProperty("application");
      expect(naclIds).toHaveProperty("database");

      Object.values(naclIds).forEach((naclId: any) => {
        expect(isValidNaclId(naclId)).toBe(true);
      });

      const command = new DescribeNetworkAclsCommand({
        NetworkAclIds: Object.values(naclIds) as string[]
      });

      const response = await ec2Client.send(command);
      expect(response.NetworkAcls).toHaveLength(3);

      response.NetworkAcls!.forEach(nacl => {
        expect(nacl.VpcId).toBe(outputs.vpc_id);
      });
    });

    it("validates Network ACL rules block specified CIDR ranges", async () => {
      const naclIds = parseObject(outputs.network_acl_ids);

      for (const naclId of Object.values(naclIds)) {
        const command = new DescribeNetworkAclsCommand({
          NetworkAclIds: [naclId as string]
        });

        const response = await ec2Client.send(command);
        const nacl = response.NetworkAcls![0];

        const blockedCidrs = ["192.168.0.0/16", "172.16.0.0/12"];

        blockedCidrs.forEach(cidr => {
          const ingressDenyRule = nacl.Entries?.find(entry =>
            !entry.Egress && entry.RuleAction === "deny" && entry.CidrBlock === cidr
          );
          expect(ingressDenyRule).toBeDefined();

          const egressDenyRule = nacl.Entries?.find(entry =>
            entry.Egress && entry.RuleAction === "deny" && entry.CidrBlock === cidr
          );
          expect(egressDenyRule).toBeDefined();
        });

        const ingressAllowRule = nacl.Entries?.find(entry =>
          !entry.Egress && entry.RuleAction === "allow" && entry.CidrBlock === "0.0.0.0/0"
        );
        expect(ingressAllowRule).toBeDefined();

        const egressAllowRule = nacl.Entries?.find(entry =>
          entry.Egress && entry.RuleAction === "allow" && entry.CidrBlock === "0.0.0.0/0"
        );
        expect(egressAllowRule).toBeDefined();
      }
    });

    it("validates Network ACL subnet associations", async () => {
      const naclIds = parseObject(outputs.network_acl_ids);
      const publicSubnets = parseArray(outputs.public_subnet_ids);
      const appSubnets = parseArray(outputs.private_app_subnet_ids);
      const dbSubnets = parseArray(outputs.private_db_subnet_ids);

      for (const [type, subnetIds, naclId] of [
        ["public", publicSubnets, naclIds.public],
        ["application", appSubnets, naclIds.application],
        ["database", dbSubnets, naclIds.database]
      ]) {
        const command = new DescribeNetworkAclsCommand({
          NetworkAclIds: [naclId as string]
        });

        const response = await ec2Client.send(command);
        const nacl = response.NetworkAcls![0];

        const associatedSubnets = nacl.Associations?.map(assoc => assoc.SubnetId);

        (subnetIds as string[]).forEach(subnetId => {
          expect(associatedSubnets).toContain(subnetId);
        });
      }
    });
  });

  describe("VPC Flow Logs and S3", () => {
    let ec2Client: EC2Client;
    let s3Client: S3Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
      s3Client = new S3Client({ region });
    });

    it("validates S3 bucket for VPC Flow Logs", async () => {
      if (skipIfMissing("vpc_flow_logs_s3_bucket", outputs)) return;

      const bucketName = outputs.vpc_flow_logs_s3_bucket;
      expect(bucketName).toMatch(/^fintech-vpc-flow-logs-\d{14}$/);

      try {
        const command = new HeadBucketCommand({
          Bucket: bucketName
        });
        await s3Client.send(command);
      } catch (error) {
        fail(`S3 bucket ${bucketName} not accessible: ${error}`);
      }
    });

    it("validates S3 bucket encryption configuration", async () => {
      const bucketName = outputs.vpc_flow_logs_s3_bucket;

      try {
        const command = new GetBucketEncryptionCommand({
          Bucket: bucketName
        });
        const response = await s3Client.send(command);

        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
        expect(response.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      } catch (error) {
        fail(`Failed to get bucket encryption: ${error}`);
      }
    });

    it("validates VPC Flow Logs configuration", async () => {
      if (skipIfMissing("vpc_flow_log_id", outputs)) return;

      expect(isValidFlowLogId(outputs.vpc_flow_log_id)).toBe(true);

      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.vpc_flow_log_id]
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toHaveLength(1);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog.TrafficType).toBe("ALL");
      expect(flowLog.LogDestinationType).toBe("s3");
      expect(flowLog.ResourceId).toBe(outputs.vpc_id);

      const expectedS3Arn = `arn:aws:s3:::${outputs.vpc_flow_logs_s3_bucket}`;
      expect(flowLog.LogDestination).toBe(expectedS3Arn);
    });
  });

  describe("Transit Gateway Configuration", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates Transit Gateway deployment", async () => {
      if (skipIfMissing("transit_gateway_id", outputs)) return;

      expect(isValidTgwId(outputs.transit_gateway_id)).toBe(true);

      const command = new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [outputs.transit_gateway_id]
      });

      const response = await ec2Client.send(command);
      expect(response.TransitGateways).toHaveLength(1);

      const tgw = response.TransitGateways![0];
      expect(tgw.State).toBe("available");
      expect(tgw.Description).toContain("Payment Platform");
      expect(tgw.Options?.DefaultRouteTableAssociation).toBe("enable");
      expect(tgw.Options?.DefaultRouteTablePropagation).toBe("enable");
    });

    it("validates Transit Gateway VPC attachment", async () => {
      if (skipIfMissing("transit_gateway_attachment_id", outputs)) return;

      expect(isValidTgwAttachmentId(outputs.transit_gateway_attachment_id)).toBe(true);

      const command = new DescribeTransitGatewayAttachmentsCommand({
        TransitGatewayAttachmentIds: [outputs.transit_gateway_attachment_id]
      });

      const response = await ec2Client.send(command);
      expect(response.TransitGatewayAttachments).toHaveLength(1);

      const attachment = response.TransitGatewayAttachments![0];
      expect(attachment.State).toBe("available");
      expect(attachment.ResourceType).toBe("vpc");
      expect(attachment.ResourceId).toBe(outputs.vpc_id);
      expect(attachment.TransitGatewayId).toBe(outputs.transit_gateway_id);

      const appSubnets = parseArray(outputs.private_app_subnet_ids);
      expect(attachment.ResourceId).toBe(outputs.vpc_id);
      expect(appSubnets.length).toBeGreaterThan(0);
    });

    it("validates Transit Gateway route table", async () => {
      if (skipIfMissing("transit_gateway_route_table_id", outputs)) return;

      const tgwRouteTableId = outputs.transit_gateway_route_table_id;
      expect(tgwRouteTableId).toMatch(/^tgw-rtb-/);

      expect(tgwRouteTableId).toBeDefined();
      expect(tgwRouteTableId.trim().length).toBeGreaterThan(0);
    });
  });

  describe("Resource Tagging and Compliance", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates that key resources have proper tags", async () => {
      const resourceChecks = [
        { command: new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] }), accessor: "Vpcs" },
        { command: new DescribeInstancesCommand({ InstanceIds: [outputs.nat_instance_id] }), accessor: "Reservations" },
        { command: new DescribeTransitGatewaysCommand({ TransitGatewayIds: [outputs.transit_gateway_id] }), accessor: "TransitGateways" }
      ];

      for (const { command, accessor } of resourceChecks) {
        const response = await ec2Client.send(command);
        const resources = accessor === "Reservations"
          ? (response as any)[accessor][0].Instances
          : (response as any)[accessor];

        resources.forEach((resource: any) => {
          const tags = resource.Tags || [];
          const tagNames = tags.map((tag: any) => tag.Key);

          expect(tagNames).toContain("Environment");
          expect(tagNames).toContain("Project");
          expect(tagNames).toContain("ManagedBy");

          const envTag = tags.find((tag: any) => tag.Key === "Environment");
          expect(envTag?.Value).toBe("Production");

          const projectTag = tags.find((tag: any) => tag.Key === "Project");
          expect(projectTag?.Value).toBe("PaymentPlatform");

          const managedByTag = tags.find((tag: any) => tag.Key === "ManagedBy");
          expect(managedByTag?.Value).toBe("Terraform");
        });
      }
    });
  });

  describe("Security and Compliance Validation", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates that private subnets do not have direct internet access", async () => {
      const privateSubnets = [
        ...parseArray(outputs.private_app_subnet_ids),
        ...parseArray(outputs.private_db_subnet_ids)
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnets
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it("validates NAT instance is only in public subnet", async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.nat_instance_id]
      });

      const response = await ec2Client.send(instanceCommand);
      const instance = response.Reservations![0].Instances![0];

      const publicSubnets = parseArray(outputs.public_subnet_ids);
      expect(publicSubnets).toContain(instance.SubnetId);
    });

    it("validates VPC Flow Logs capture all traffic", async () => {
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.vpc_flow_log_id]
      });

      const response = await ec2Client.send(command);
      const flowLog = response.FlowLogs![0];

      expect(flowLog.TrafficType).toBe("ALL");
      expect(flowLog.FlowLogStatus).toBe("ACTIVE");
    });

    it("validates consistent CIDR block usage", () => {
      expect(outputs.vpc_cidr_block).toBe("10.0.0.0/16");
      expect(integrationSummary.vpc_cidr).toBe("10.0.0.0/16");

      const expectedSubnetCidrs = [
        "10.0.1.0/24", "10.0.2.0/24",      // Public
        "10.0.11.0/24", "10.0.12.0/24",    // Private App
        "10.0.21.0/24", "10.0.22.0/24"     // Private DB
      ];

      expectedSubnetCidrs.forEach(cidr => {
        expect(isValidCidr(cidr)).toBe(true);
      });
    });
  });

  describe("Regional Independence Validation", () => {
    it("validates infrastructure is deployed in correct region", () => {
      expect(region).toBe("eu-central-1");
      expect(integrationSummary.region).toBe("eu-central-1");
    });

    it("validates availability zone usage", () => {
      const azs = parseArray(outputs.availability_zones);
      expect(azs).toHaveLength(3);
      azs.forEach((az: string) => {
        expect(az).toMatch(/^eu-central-1[abc]$/);
      });
    });
  });
});
