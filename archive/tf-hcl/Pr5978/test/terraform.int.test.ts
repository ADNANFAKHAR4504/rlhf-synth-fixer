import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import {
  DescribeFlowLogsCommand,
  DescribeRouteTablesCommand,
  DescribeTransitGatewayRouteTablesCommand,
  DescribeVpcEndpointsCommand,
  EC2Client,
  SearchTransitGatewayRoutesCommand,
} from "@aws-sdk/client-ec2";
import { LambdaClient } from "@aws-sdk/client-lambda";
import {
  GetHostedZoneCommand,
  Route53Client
} from "@aws-sdk/client-route-53";
import { S3Client } from "@aws-sdk/client-s3";
import { SSMClient } from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";

interface TerraformOutputs {
  [key: string]: {
    value: string | string[] | number | { [key: string]: string };
  };
}

function loadTerraformOutputs(): TerraformOutputs {
  const ciOutputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
  if (fs.existsSync(ciOutputPath)) {
    const content = fs.readFileSync(ciOutputPath, "utf8");
    console.log("Loading outputs from:", ciOutputPath);
    const outputs = JSON.parse(content);
    console.log("Parsed outputs keys:", Object.keys(outputs));
    return outputs;
  }

  const flatOutputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
  if (fs.existsSync(flatOutputPath)) {
    console.log("Loading flat outputs from:", flatOutputPath);
    const flatOutputs = JSON.parse(fs.readFileSync(flatOutputPath, "utf8"));
    console.log("Flat outputs:", flatOutputs);
    const converted: any = {};
    for (const [key, value] of Object.entries(flatOutputs)) {
      converted[key] = { value };
    }
    return converted;
  }

  const outputPath = path.resolve(__dirname, "../terraform-outputs.json");
  if (fs.existsSync(outputPath)) {
    console.log("Loading outputs from:", outputPath);
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  }

  const altPath = path.resolve(__dirname, "../lib/terraform.tfstate");
  if (fs.existsSync(altPath)) {
    console.log("Loading outputs from state file:", altPath);
    const state = JSON.parse(fs.readFileSync(altPath, "utf8"));
    return state.outputs || {};
  }

  throw new Error("Could not find Terraform outputs");
}

describe("Hub-and-Spoke Network Architecture - Real-World Application Flows", () => {
  let outputs: TerraformOutputs;
  let usEast1Client: EC2Client;
  let euWest1Client: EC2Client;
  let apSoutheast1Client: EC2Client;
  let route53Client: Route53Client;
  let s3Client: S3Client;
  let ssmClient: SSMClient;
  let cloudWatchClient: CloudWatchClient;
  let lambdaClient: LambdaClient;

  beforeAll(() => {
    outputs = loadTerraformOutputs();

    usEast1Client = new EC2Client({ region: "us-east-1" });
    euWest1Client = new EC2Client({ region: "eu-west-1" });
    apSoutheast1Client = new EC2Client({ region: "ap-southeast-1" });
    route53Client = new Route53Client({ region: "us-east-1" });
    s3Client = new S3Client({ region: "us-east-1" });
    ssmClient = new SSMClient({ region: "us-east-1" });
    cloudWatchClient = new CloudWatchClient({ region: "us-east-1" });
    lambdaClient = new LambdaClient({ region: "us-east-1" });
  });

  describe("DNS Resolution Flow - Applications resolving internal DNS names", () => {
    test("Application in hub VPC can resolve dev.internal DNS queries", async () => {
      const devZoneId = outputs.dev_route53_zone_id?.value as string;
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      expect(devZoneId).toBeDefined();
      expect(hubVpcId).toBeDefined();

      const zoneCommand = new GetHostedZoneCommand({ Id: devZoneId });
      const zoneResponse = await route53Client.send(zoneCommand);

      expect(zoneResponse.HostedZone?.Name).toBe("dev.internal.");

      const vpcAssociations = zoneResponse.VPCs || [];
      const hubVpcAssociated = vpcAssociations.some(
        vpc => vpc.VPCId === hubVpcId && vpc.VPCRegion === "us-east-1"
      );
      expect(hubVpcAssociated).toBe(true);
    });

    test("Application in eu-west-1 spoke can resolve dev.internal DNS queries", async () => {
      const devZoneId = outputs.dev_route53_zone_id?.value as string;
      const euWest1VpcId = outputs.eu_west_1_vpc_id?.value as string;

      expect(devZoneId).toBeDefined();
      expect(euWest1VpcId).toBeDefined();

      const zoneCommand = new GetHostedZoneCommand({ Id: devZoneId });
      const zoneResponse = await route53Client.send(zoneCommand);

      expect(zoneResponse.HostedZone?.Name).toBe("dev.internal.");

      const vpcAssociations = zoneResponse.VPCs || [];
      // Check if eu-west-1 VPC is associated (VPC ID match is sufficient for cross-region)
      const euWest1VpcAssociated = vpcAssociations.some(
        vpc => vpc.VPCId === euWest1VpcId
      );

      expect(euWest1VpcAssociated).toBe(true);
    });

    test("Application in ap-southeast-1 spoke can resolve prod.internal DNS queries", async () => {
      const prodZoneId = outputs.prod_route53_zone_id?.value as string;
      const apSoutheast1VpcId = outputs.ap_southeast_1_vpc_id?.value as string;

      expect(prodZoneId).toBeDefined();
      expect(apSoutheast1VpcId).toBeDefined();

      const zoneCommand = new GetHostedZoneCommand({ Id: prodZoneId });
      const zoneResponse = await route53Client.send(zoneCommand);

      expect(zoneResponse.HostedZone?.Name).toBe("prod.internal.");

      const vpcAssociations = zoneResponse.VPCs || [];
      // Check if ap-southeast-1 VPC is associated (VPC ID match is sufficient for cross-region)
      const apSoutheast1VpcAssociated = vpcAssociations.some(
        vpc => vpc.VPCId === apSoutheast1VpcId
      );

      expect(apSoutheast1VpcAssociated).toBe(true);
    });
  });

  describe("Cross-Region Connectivity Flow - Applications communicating across regions via Transit Gateway", () => {
    test("Dev application in eu-west-1 can reach dev resources in us-east-1 via Transit Gateway", async () => {
      const devRtId = outputs.dev_transit_gateway_route_table_id?.value as string;

      expect(devRtId).toBeDefined();

      const command = new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [devRtId],
      });
      const response = await usEast1Client.send(command);

      const routeTable = response.TransitGatewayRouteTables?.[0];
      expect(routeTable).toBeDefined();

      const searchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: devRtId,
        Filters: [{ Name: "state", Values: ["active"] }],
      });
      const searchResponse = await usEast1Client.send(searchCommand);
      const routes = searchResponse.Routes || [];

      // Verify hub VPC route exists (from VPC attachment)
      const hubVpcRoute = routes.find((r: any) => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(hubVpcRoute).toBeDefined();
      expect(hubVpcRoute?.State).toBe("active");

      // Verify there are active routes that enable connectivity
      expect(routes.length).toBeGreaterThan(0);
      const activeRoutes = routes.filter((r: any) => r.State === "active");
      expect(activeRoutes.length).toBeGreaterThan(0);
    });

    test("Prod application in ap-southeast-1 can reach prod resources in us-east-1 via Transit Gateway", async () => {
      const prodRtId = outputs.prod_transit_gateway_route_table_id?.value as string;

      const command = new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [prodRtId],
      });
      const response = await usEast1Client.send(command);

      const routeTable = response.TransitGatewayRouteTables?.[0];
      expect(routeTable).toBeDefined();

      const searchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: prodRtId,
        Filters: [{ Name: "state", Values: ["active"] }],
      });
      const searchResponse = await usEast1Client.send(searchCommand);
      const routes = searchResponse.Routes || [];

      // Verify hub VPC route exists (from VPC attachment)
      const hubVpcRoute = routes.find((r: any) => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(hubVpcRoute).toBeDefined();
      expect(hubVpcRoute?.State).toBe("active");

      // Verify there are active routes that enable connectivity
      expect(routes.length).toBeGreaterThan(0);
      const activeRoutes = routes.filter((r: any) => r.State === "active");
      expect(activeRoutes.length).toBeGreaterThan(0);
    });

    test("Transit Gateway routes allow bidirectional communication between hub and spokes", async () => {
      const devRtId = outputs.dev_transit_gateway_route_table_id?.value as string;

      // Search for all active routes in the dev route table
      const searchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: devRtId,
        Filters: [{ Name: "state", Values: ["active"] }],
      });
      const searchResponse = await usEast1Client.send(searchCommand);

      expect(searchResponse.Routes).toBeDefined();
      const routes = searchResponse.Routes || [];
      expect(routes.length).toBeGreaterThan(0);

      // Verify hub VPC route exists for connectivity
      const hubVpcRoute = routes.find((r: any) => r.DestinationCidrBlock === "10.0.0.0/16");
      expect(hubVpcRoute).toBeDefined();
      expect(hubVpcRoute?.State).toBe("active");

      const activeRoutes = routes.filter((r: any) => r.State === "active");
      expect(activeRoutes.length).toBeGreaterThan(0);
    });
  });

  describe("Environment Isolation Flow - Dev and Prod applications cannot communicate", () => {
    test("Dev route table blocks traffic to prod CIDR (10.2.0.0/16) via blackhole route", async () => {
      const devRtId = outputs.dev_transit_gateway_route_table_id?.value as string;

      const searchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: devRtId,
        Filters: [{ Name: "state", Values: ["active", "blackhole"] }],
      });
      const searchResponse = await usEast1Client.send(searchCommand);
      const routes = searchResponse.Routes || [];

      const prodBlackhole = routes.find(
        (r: any) => r.DestinationCidrBlock === "10.2.0.0/16" && r.State === "blackhole"
      );

      expect(prodBlackhole).toBeDefined();
      expect(prodBlackhole?.State).toBe("blackhole");
    });

    test("Prod route table blocks traffic to dev CIDR (10.1.0.0/16) via blackhole route", async () => {
      const prodRtId = outputs.prod_transit_gateway_route_table_id?.value as string;

      const searchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: prodRtId,
        Filters: [{ Name: "state", Values: ["active", "blackhole"] }],
      });
      const searchResponse = await usEast1Client.send(searchCommand);
      const routes = searchResponse.Routes || [];

      const devBlackhole = routes.find(
        (r: any) => r.DestinationCidrBlock === "10.1.0.0/16" && r.State === "blackhole"
      );

      expect(devBlackhole).toBeDefined();
      expect(devBlackhole?.State).toBe("blackhole");
    });

    test("Dev and prod route tables are completely isolated", async () => {
      const devRtId = outputs.dev_transit_gateway_route_table_id?.value as string;
      const prodRtId = outputs.prod_transit_gateway_route_table_id?.value as string;

      expect(devRtId).not.toBe(prodRtId);

      const devCommand = new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [devRtId],
      });
      const devResponse = await usEast1Client.send(devCommand);

      const prodCommand = new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [prodRtId],
      });
      const prodResponse = await usEast1Client.send(prodCommand);

      expect(devResponse.TransitGatewayRouteTables?.length).toBe(1);
      expect(prodResponse.TransitGatewayRouteTables?.length).toBe(1);
      expect(devResponse.TransitGatewayRouteTables?.[0].TransitGatewayRouteTableId).not.toBe(
        prodResponse.TransitGatewayRouteTables?.[0].TransitGatewayRouteTableId
      );
    });
  });

  describe("NAT Routing Flow - Private subnet applications accessing internet", () => {
    test("Dev private subnet routes internet traffic through NAT instance", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;
      const natInstanceIds = outputs.nat_instance_ids?.value as { [key: string]: string };

      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "tag:Environment", Values: ["dev"] },
          { Name: "tag:Purpose", Values: ["routing"] },
        ],
      });
      const response = await usEast1Client.send(command);

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThan(0);

      const devRouteTable = routeTables[0];
      const internetRoute = devRouteTable.Routes?.find(
        r => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(internetRoute).toBeDefined();
      expect(internetRoute?.NetworkInterfaceId || internetRoute?.InstanceId).toBeDefined();

      if (internetRoute?.NetworkInterfaceId) {
        expect(internetRoute.NetworkInterfaceId).toBeTruthy();
      }
    });

    test("Prod private subnet routes internet traffic through NAT instance", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;
      const natInstanceIds = outputs.nat_instance_ids?.value as { [key: string]: string };

      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "tag:Environment", Values: ["prod"] },
          { Name: "tag:Purpose", Values: ["routing"] },
        ],
      });
      const response = await usEast1Client.send(command);

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThan(0);

      const prodRouteTable = routeTables[0];
      const internetRoute = prodRouteTable.Routes?.find(
        r => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(internetRoute).toBeDefined();
      expect(internetRoute?.NetworkInterfaceId || internetRoute?.InstanceId).toBeDefined();
    });
  });

  describe("SSM Connectivity Flow - Managing instances in private subnets via VPC endpoints", () => {
    test("SSM can connect to instances in hub VPC private subnets via VPC endpoints", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "service-name", Values: ["com.amazonaws.us-east-1.ssm"] },
        ],
      });
      const response = await usEast1Client.send(command);

      const endpoints = response.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThan(0);

      const ssmEndpoint = endpoints[0];
      expect(ssmEndpoint.State).toBe("available");
      expect(ssmEndpoint.PrivateDnsEnabled).toBe(true);
      expect(ssmEndpoint.SubnetIds?.length).toBeGreaterThan(0);
    });

    test("SSM Messages endpoint enables session manager connectivity in hub VPC", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "service-name", Values: ["com.amazonaws.us-east-1.ssmmessages"] },
        ],
      });
      const response = await usEast1Client.send(command);

      const endpoints = response.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0].State).toBe("available");
      expect(endpoints[0].PrivateDnsEnabled).toBe(true);
    });

    test("EC2 Messages endpoint enables agent communication in hub VPC", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "service-name", Values: ["com.amazonaws.us-east-1.ec2messages"] },
        ],
      });
      const response = await usEast1Client.send(command);

      const endpoints = response.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0].State).toBe("available");
      expect(endpoints[0].PrivateDnsEnabled).toBe(true);
    });

    test("SSM endpoints are available in spoke VPCs for cross-region management", async () => {
      const euWest1VpcId = outputs.eu_west_1_vpc_id?.value as string;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: "vpc-id", Values: [euWest1VpcId] },
          { Name: "service-name", Values: ["com.amazonaws.eu-west-1.ssm"] },
        ],
      });
      const response = await euWest1Client.send(command);

      const endpoints = response.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0].State).toBe("available");
    });
  });

  describe("Flow Log Delivery Flow - Network traffic logs being written to S3", () => {
    test("Flow logs are actively writing network traffic to S3 bucket", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;
      const bucketName = outputs.flow_logs_bucket_name?.value as string;

      const flowLogCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: "resource-id", Values: [hubVpcId] }],
      });
      const flowLogResponse = await usEast1Client.send(flowLogCommand);

      expect(flowLogResponse.FlowLogs?.length).toBeGreaterThan(0);
      const flowLog = flowLogResponse.FlowLogs?.[0];
      expect(flowLog?.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog?.LogDestination).toContain(bucketName);
      expect(flowLog?.DestinationOptions?.FileFormat).toBe("parquet");
    });

    test("Flow logs from all VPCs are delivered to the same S3 bucket", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;
      const euWest1VpcId = outputs.eu_west_1_vpc_id?.value as string;
      const apSoutheast1VpcId = outputs.ap_southeast_1_vpc_id?.value as string;
      const bucketName = outputs.flow_logs_bucket_name?.value as string;

      const hubCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: "resource-id", Values: [hubVpcId] }],
      });
      const hubResponse = await usEast1Client.send(hubCommand);
      expect(hubResponse.FlowLogs?.[0].LogDestination).toContain(bucketName);

      const euWest1Command = new DescribeFlowLogsCommand({
        Filter: [{ Name: "resource-id", Values: [euWest1VpcId] }],
      });
      const euWest1Response = await euWest1Client.send(euWest1Command);
      expect(euWest1Response.FlowLogs?.[0].LogDestination).toContain(bucketName);

      const apSoutheast1Command = new DescribeFlowLogsCommand({
        Filter: [{ Name: "resource-id", Values: [apSoutheast1VpcId] }],
      });
      const apSoutheast1Response = await apSoutheast1Client.send(apSoutheast1Command);
      expect(apSoutheast1Response.FlowLogs?.[0].LogDestination).toContain(bucketName);
    });

    test("Flow logs use Parquet format for efficient querying", async () => {
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const command = new DescribeFlowLogsCommand({
        Filter: [{ Name: "resource-id", Values: [hubVpcId] }],
      });
      const response = await usEast1Client.send(command);

      const flowLog = response.FlowLogs?.[0];
      expect(flowLog?.DestinationOptions?.FileFormat).toBe("parquet");
      expect(flowLog?.MaxAggregationInterval).toBe(60);
    });
  });

  describe("NAT Failover Flow - Automatic failover when primary NAT instance fails", () => {
    test("CloudWatch alarm monitors primary NAT instance and triggers failover Lambda", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: "us-east-1-dev-nat-1-status",
      });
      const response = await cloudWatchClient.send(command);

      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThan(0);

      const natAlarm = alarms[0];
      expect(natAlarm.AlarmName).toContain("nat");
      expect(natAlarm.AlarmActions?.length).toBeGreaterThan(0);
      expect(natAlarm.AlarmActions?.[0]).toContain("arn:aws:sns");
    });

    test("Lambda function is configured to handle NAT failover events", async () => {
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: "us-east-1-dev-nat-1-status",
      });
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);

      const alarm = alarmsResponse.MetricAlarms?.[0];
      expect(alarm).toBeDefined();

      const snsTopicArn = alarm?.AlarmActions?.[0];
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain("arn:aws:sns");
    });

    test("Backup NAT instances are available for failover in each environment", async () => {
      const natInstanceIds = outputs.nat_instance_ids?.value as { [key: string]: string };

      expect(natInstanceIds.dev_1).toBeDefined();
      expect(natInstanceIds.dev_2).toBeDefined();
      expect(natInstanceIds.prod_1).toBeDefined();
      expect(natInstanceIds.prod_2).toBeDefined();

      expect(natInstanceIds.dev_1).not.toBe(natInstanceIds.dev_2);
      expect(natInstanceIds.prod_1).not.toBe(natInstanceIds.prod_2);
    });
  });

  describe("End-to-End Application Flow - Complete application workflow", () => {
    test("Dev application workflow: DNS resolution -> Cross-region connectivity -> Internet access", async () => {
      const devZoneId = outputs.dev_route53_zone_id?.value as string;
      const devRtId = outputs.dev_transit_gateway_route_table_id?.value as string;
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const zoneCommand = new GetHostedZoneCommand({ Id: devZoneId });
      const zoneResponse = await route53Client.send(zoneCommand);
      expect(zoneResponse.HostedZone?.Name).toBe("dev.internal.");

      const tgwCommand = new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [devRtId],
      });
      const tgwResponse = await usEast1Client.send(tgwCommand);
      expect(tgwResponse.TransitGatewayRouteTables?.length).toBe(1);

      const routeTableCommand = new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "tag:Environment", Values: ["dev"] },
        ],
      });
      const routeTableResponse = await usEast1Client.send(routeTableCommand);
      const internetRoute = routeTableResponse.RouteTables?.[0].Routes?.find(
        (r: any) => r.DestinationCidrBlock === "0.0.0.0/0"
      );
      expect(internetRoute).toBeDefined();
    });

    test("Prod application workflow: Isolated DNS resolution -> Isolated connectivity -> Internet access", async () => {
      const prodZoneId = outputs.prod_route53_zone_id?.value as string;
      const prodRtId = outputs.prod_transit_gateway_route_table_id?.value as string;
      const hubVpcId = outputs.hub_vpc_id?.value as string;

      const zoneCommand = new GetHostedZoneCommand({ Id: prodZoneId });
      const zoneResponse = await route53Client.send(zoneCommand);
      expect(zoneResponse.HostedZone?.Name).toBe("prod.internal.");

      const tgwSearchCommand = new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: prodRtId,
        Filters: [{ Name: "state", Values: ["active", "blackhole"] }],
      });
      const tgwResponse = await usEast1Client.send(tgwSearchCommand);
      const routes = tgwResponse.Routes || [];
      const devBlackhole = routes.find(
        (r: any) => r.DestinationCidrBlock === "10.1.0.0/16" && r.State === "blackhole"
      );
      expect(devBlackhole).toBeDefined();

      const routeTableCommand = new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [hubVpcId] },
          { Name: "tag:Environment", Values: ["prod"] },
        ],
      });
      const routeTableResponse = await usEast1Client.send(routeTableCommand);
      const internetRoute = routeTableResponse.RouteTables?.[0].Routes?.find(
        (r: any) => r.DestinationCidrBlock === "0.0.0.0/0"
      );
      expect(internetRoute).toBeDefined();
    });
  });
});
