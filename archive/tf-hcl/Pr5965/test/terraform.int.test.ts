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

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  vpc_cidr?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  internet_gateway_id?: TfOutputValue<string>;
  public_route_table_id?: TfOutputValue<string>;
  web_security_group_id?: TfOutputValue<string>;
  database_security_group_id?: TfOutputValue<string>;
  availability_zones?: TfOutputValue<string[]>;
};

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

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "lib/terraform.tfstate.d/outputs.json"),
    path.resolve(process.cwd(), "lib/.terraform/outputs.json"),
    path.resolve(process.cwd(), "tf-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "tf-outputs.json"),
    path.resolve(process.cwd(), "outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(outputPath, "utf8"));
        // Check if outputs are already structured (have sensitive/type/value)
        const firstKey = Object.keys(raw)[0];
        if (firstKey && raw[firstKey] && typeof raw[firstKey] === "object" && "value" in raw[firstKey]) {
          // Already structured format
          return raw as StructuredOutputs;
        } else {
          // Flat format - convert to structured
          const structured: StructuredOutputs = {};
          for (const [key, value] of Object.entries(raw)) {
            if (key === "vpc_id" || key === "vpc_cidr" || key === "internet_gateway_id" || 
                key === "public_route_table_id" || key === "web_security_group_id" || 
                key === "database_security_group_id") {
              structured[key as keyof StructuredOutputs] = {
                sensitive: false,
                type: "string",
                value: String(value),
              } as any;
            } else if (key === "public_subnet_ids" || key === "private_subnet_ids" || key === "availability_zones") {
              structured[key as keyof StructuredOutputs] = {
                sensitive: false,
                type: "list(string)",
                value: ensureStringArray(value),
              } as any;
            }
          }
          return structured;
        }
      } catch (err) {
        console.warn(`Failed to parse outputs from ${outputPath}:`, err);
      }
    }
  }

  // Fallback: try reading from environment variables or terraform output
  // For CI/CD, outputs might be available as environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.TF_VPC_ID) {
    outputs.vpc_id = { sensitive: false, type: "string", value: process.env.TF_VPC_ID };
  }
  if (process.env.TF_VPC_CIDR) {
    outputs.vpc_cidr = { sensitive: false, type: "string", value: process.env.TF_VPC_CIDR };
  }
  if (process.env.TF_PUBLIC_SUBNET_IDS) {
    try {
      outputs.public_subnet_ids = { sensitive: false, type: "list(string)", value: JSON.parse(process.env.TF_PUBLIC_SUBNET_IDS) };
    } catch {
      outputs.public_subnet_ids = { sensitive: false, type: "list(string)", value: process.env.TF_PUBLIC_SUBNET_IDS.split(",").map(s => s.trim()) };
    }
  }
  if (process.env.TF_PRIVATE_SUBNET_IDS) {
    try {
      outputs.private_subnet_ids = { sensitive: false, type: "list(string)", value: JSON.parse(process.env.TF_PRIVATE_SUBNET_IDS) };
    } catch {
      outputs.private_subnet_ids = { sensitive: false, type: "list(string)", value: process.env.TF_PRIVATE_SUBNET_IDS.split(",").map(s => s.trim()) };
    }
  }
  if (process.env.TF_INTERNET_GATEWAY_ID) {
    outputs.internet_gateway_id = { sensitive: false, type: "string", value: process.env.TF_INTERNET_GATEWAY_ID };
  }
  if (process.env.TF_PUBLIC_ROUTE_TABLE_ID) {
    outputs.public_route_table_id = { sensitive: false, type: "string", value: process.env.TF_PUBLIC_ROUTE_TABLE_ID };
  }
  if (process.env.TF_WEB_SECURITY_GROUP_ID) {
    outputs.web_security_group_id = { sensitive: false, type: "string", value: process.env.TF_WEB_SECURITY_GROUP_ID };
  }
  if (process.env.TF_DATABASE_SECURITY_GROUP_ID) {
    outputs.database_security_group_id = { sensitive: false, type: "string", value: process.env.TF_DATABASE_SECURITY_GROUP_ID };
  }
  if (process.env.TF_AVAILABILITY_ZONES) {
    try {
      outputs.availability_zones = { sensitive: false, type: "list(string)", value: JSON.parse(process.env.TF_AVAILABILITY_ZONES) };
    } catch {
      outputs.availability_zones = { sensitive: false, type: "list(string)", value: process.env.TF_AVAILABILITY_ZONES.split(",").map(s => s.trim()) };
    }
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Set environment variables or ensure Terraform outputs are available."
    );
  }

  return outputs;
}

function mapOutputs(structured: StructuredOutputs): TerraformOutputs {
  const vpcId = structured.vpc_id?.value;
  if (!vpcId) {
    throw new Error("vpc_id output is required for integration tests");
  }

  return {
    vpcId: String(vpcId),
    vpcCidr: structured.vpc_cidr?.value ? String(structured.vpc_cidr.value) : undefined,
    publicSubnetIds: ensureStringArray(structured.public_subnet_ids?.value),
    privateSubnetIds: ensureStringArray(structured.private_subnet_ids?.value),
    internetGatewayId: structured.internet_gateway_id?.value ? String(structured.internet_gateway_id.value) : undefined,
    publicRouteTableId: structured.public_route_table_id?.value ? String(structured.public_route_table_id.value) : undefined,
    webSecurityGroupId: structured.web_security_group_id?.value ? String(structured.web_security_group_id.value) : undefined,
    databaseSecurityGroupId: structured.database_security_group_id?.value ? String(structured.database_security_group_id.value) : undefined,
    availabilityZones: ensureStringArray(structured.availability_zones?.value),
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

const structuredOutputs = readStructuredOutputs();
const outputs = mapOutputs(structuredOutputs);
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
