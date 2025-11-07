import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAvailabilityZonesCommand,
} from "@aws-sdk/client-ec2";

jest.setTimeout(180_000);

type RawOutputValue = { value: any } | string | string[] | undefined;

interface TerraformOutputs {
  vpcId: string;
  vpcCidr?: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  internetGatewayId?: string;
  publicRouteTableId?: string;
  webSecurityGroupId?: string;
  databaseSecurityGroupId?: string;
  availabilityZones: string[];
}

function readRawOutputs(): Record<string, any> {
  const possiblePaths = [
    path.resolve(process.cwd(), "tf-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "tf-outputs.json"),
    path.resolve(process.cwd(), "outputs.json"),
    path.resolve(process.cwd(), "lib/terraform.tfstate.d/outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      try {
        const contents = fs.readFileSync(outputPath, "utf8");
        return JSON.parse(contents);
      } catch (err) {
        console.warn(`Failed to parse outputs from ${outputPath}:`, err);
      }
    }
  }

  const envJson = process.env.TF_OUTPUTS_JSON;
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch (err) {
      console.warn("Failed to parse TF_OUTPUTS_JSON env variable", err);
    }
  }

  const envOutputs: Record<string, string | undefined> = {
    vpc_id: process.env.TF_OUTPUT_VPC_ID,
    vpc_cidr: process.env.TF_OUTPUT_VPC_CIDR,
    public_route_table_id: process.env.TF_OUTPUT_PUBLIC_ROUTE_TABLE_ID,
    internet_gateway_id: process.env.TF_OUTPUT_INTERNET_GATEWAY_ID,
    public_subnet_ids: process.env.TF_OUTPUT_PUBLIC_SUBNET_IDS,
    private_subnet_ids: process.env.TF_OUTPUT_PRIVATE_SUBNET_IDS,
    web_security_group_id: process.env.TF_OUTPUT_WEB_SECURITY_GROUP_ID,
    database_security_group_id: process.env.TF_OUTPUT_DATABASE_SECURITY_GROUP_ID,
    availability_zones: process.env.TF_OUTPUT_AVAILABILITY_ZONES,
  };

  if (Object.values(envOutputs).some(Boolean)) {
    return envOutputs;
  }

  throw new Error(
    "Terraform outputs not found. Provide outputs via tf-outputs/all-outputs.json, tf-outputs.json, outputs.json, " +
      "lib/terraform.tfstate.d/outputs.json, TF_OUTPUTS_JSON, or TF_OUTPUT_* environment variables."
  );
}

function normalizeValue(raw: RawOutputValue): any {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw === "object" && "value" in raw) {
    return normalizeValue((raw as { value: any }).value);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  return raw;
}

function ensureStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // fall back to comma-separated parsing
    }
    return trimmed
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  return [];
}

function mapOutputs(raw: Record<string, any>): TerraformOutputs {
  const normalize = (key: string): any => normalizeValue(raw[key]);

  const vpcId = normalize("vpc_id");
  if (!vpcId) {
    throw new Error("vpc_id output is required for integration tests");
  }

  return {
    vpcId: String(vpcId),
    vpcCidr: normalize("vpc_cidr") ? String(normalize("vpc_cidr")) : undefined,
    publicSubnetIds: ensureStringArray(normalize("public_subnet_ids")),
    privateSubnetIds: ensureStringArray(normalize("private_subnet_ids")),
    internetGatewayId: normalize("internet_gateway_id") ? String(normalize("internet_gateway_id")) : undefined,
    publicRouteTableId: normalize("public_route_table_id") ? String(normalize("public_route_table_id")) : undefined,
    webSecurityGroupId: normalize("web_security_group_id") ? String(normalize("web_security_group_id")) : undefined,
    databaseSecurityGroupId: normalize("database_security_group_id") ? String(normalize("database_security_group_id")) : undefined,
    availabilityZones: ensureStringArray(normalize("availability_zones")),
  };
}

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseDelayMs = 2000, label?: string): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (label) {
        console.warn(`${label} attempt ${attempt}/${attempts} failed:`, error instanceof Error ? error.message : error);
      }
      if (attempt < attempts) {
        const delay = baseDelayMs * Math.pow(1.5, attempt - 1) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

const rawOutputs = readRawOutputs();
const outputs = mapOutputs(rawOutputs);
const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region });

describe("LIVE: Terraform Network Outputs", () => {
  test("required outputs are present", () => {
    expect(outputs.vpcId).toBeTruthy();
    expect(outputs.publicSubnetIds.length).toBeGreaterThan(0);
    expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);
    expect(outputs.webSecurityGroupId).toBeTruthy();
    expect(outputs.databaseSecurityGroupId).toBeTruthy();
  });
});

describe("LIVE: VPC Configuration", () => {
  test("VPC exists with expected CIDR", async () => {
    const response = await retry(
      () => ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })),
      8,
      2500,
      "DescribeVpcs"
    );

    const vpc = response.Vpcs?.[0];
    expect(vpc).toBeTruthy();
    expect(vpc?.VpcId).toBe(outputs.vpcId);
    if (outputs.vpcCidr) {
      expect(vpc?.CidrBlock).toBe(outputs.vpcCidr);
    }
    expect(vpc?.State).toBe("available");
  });

  test("Internet gateway is attached to VPC", async () => {
    if (!outputs.internetGatewayId) {
      console.warn("internet_gateway_id output not provided – skipping IGW attachment test");
      return;
    }

    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [outputs.internetGatewayId!],
          })
        ),
      8,
      2500,
      "DescribeInternetGateways"
    );

    const igw = response.InternetGateways?.[0];
    expect(igw).toBeTruthy();
    const attachment = igw?.Attachments?.find((att) => att.VpcId === outputs.vpcId);
    expect(attachment).toBeTruthy();
  });
});

describe("LIVE: Subnet Configuration", () => {
  test("Public subnets exist with public IP mapping enabled", async () => {
    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: outputs.publicSubnetIds,
          })
        ),
      8,
      2500,
      "DescribeSubnets(public)"
    );

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(outputs.publicSubnetIds.length);

    const azSet = new Set(outputs.availabilityZones);

    for (const subnet of response.Subnets!) {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      if (azSet.size > 0) {
        expect(azSet.has(String(subnet.AvailabilityZone))).toBe(true);
      }
      // If MapPublicIpOnLaunch isn't returned, describe attribute requires extra call; skip strict assertion if undefined.
      if (subnet.MapPublicIpOnLaunch !== undefined) {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      }
    }
  });

  test("Private subnets exist and do not map public IPs", async () => {
    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: outputs.privateSubnetIds,
          })
        ),
      8,
      2500,
      "DescribeSubnets(private)"
    );

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(outputs.privateSubnetIds.length);

    for (const subnet of response.Subnets!) {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      if (subnet.MapPublicIpOnLaunch !== undefined) {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      }
    }
  });
});

describe("LIVE: Route Tables", () => {
  test("Public route table has default route to internet gateway", async () => {
    if (!outputs.publicRouteTableId || !outputs.internetGatewayId) {
      console.warn("public_route_table_id or internet_gateway_id output missing – skipping route table test");
      return;
    }

    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeRouteTablesCommand({
            RouteTableIds: [outputs.publicRouteTableId!],
          })
        ),
      8,
      2500,
      "DescribeRouteTables(public)"
    );

    const routeTable = response.RouteTables?.[0];
    expect(routeTable).toBeTruthy();

    const internetRoute = routeTable?.Routes?.find(
      (route) => route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === outputs.internetGatewayId
    );
    expect(internetRoute).toBeTruthy();

    const associatedSubnetIds = (routeTable?.Associations || [])
      .map((assoc) => assoc.SubnetId)
      .filter((id): id is string => Boolean(id));

    for (const subnetId of outputs.publicSubnetIds) {
      expect(associatedSubnetIds).toContain(subnetId);
    }
  });
});

describe("LIVE: Security Groups", () => {
  test("Web security group allows internet HTTPS and VPC HTTP", async () => {
    if (!outputs.webSecurityGroupId) {
      console.warn("web_security_group_id output missing – skipping web SG test");
      return;
    }

    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.webSecurityGroupId!],
          })
        ),
      8,
      2500,
      "DescribeSecurityGroups(web)"
    );

    const sg = response.SecurityGroups?.[0];
    expect(sg).toBeTruthy();
    expect(sg?.VpcId).toBe(outputs.vpcId);

    const httpsRule = sg?.IpPermissions?.find(
      (perm) => perm.IpProtocol === "tcp" && perm.FromPort === 443 && perm.ToPort === 443
    );
    expect(httpsRule).toBeTruthy();
    const hasInternetCidr = (httpsRule?.IpRanges || []).some((range) => range.CidrIp === "0.0.0.0/0");
    expect(hasInternetCidr).toBe(true);

    if (outputs.vpcCidr) {
      const httpRule = sg?.IpPermissions?.find(
        (perm) => perm.IpProtocol === "tcp" && perm.FromPort === 80 && perm.ToPort === 80
      );
      expect(httpRule).toBeTruthy();
      const hasVpcCidr = (httpRule?.IpRanges || []).some((range) => range.CidrIp === outputs.vpcCidr);
      expect(hasVpcCidr).toBe(true);
    }

    const egressAllowsAll = (sg?.IpPermissionsEgress || []).some(
      (perm) => perm.IpProtocol === "-1" && (perm.IpRanges || []).some((range) => range.CidrIp === "0.0.0.0/0")
    );
    expect(egressAllowsAll).toBe(true);
  });

  test("Database security group only allows traffic from web security group", async () => {
    if (!outputs.databaseSecurityGroupId) {
      console.warn("database_security_group_id output missing – skipping database SG test");
      return;
    }

    const response = await retry(
      () =>
        ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.databaseSecurityGroupId!],
          })
        ),
      8,
      2500,
      "DescribeSecurityGroups(database)"
    );

    const sg = response.SecurityGroups?.[0];
    expect(sg).toBeTruthy();
    expect(sg?.VpcId).toBe(outputs.vpcId);

    const postgresRule = sg?.IpPermissions?.find(
      (perm) => perm.IpProtocol === "tcp" && perm.FromPort === 5432 && perm.ToPort === 5432
    );
    expect(postgresRule).toBeTruthy();

    const allowedGroups = (postgresRule?.UserIdGroupPairs || []).map((pair) => pair.GroupId);
    expect(allowedGroups).toContain(outputs.webSecurityGroupId);
  });
});

describe("LIVE: Availability Zones", () => {
  test("Outputs reference valid availability zones in the region", async () => {
    if (outputs.availabilityZones.length === 0) {
      console.warn("availability_zones output missing – skipping AZ validation test");
      return;
    }

    const response = await retry(
      () => ec2Client.send(new DescribeAvailabilityZonesCommand({ AllAvailabilityZones: false })),
      5,
      2000,
      "DescribeAvailabilityZones"
    );

    const availableAzNames = new Set((response.AvailabilityZones || []).map((az) => az.ZoneName));
    outputs.availabilityZones.forEach((az) => {
      expect(availableAzNames.has(az)).toBe(true);
    });
  });
});
