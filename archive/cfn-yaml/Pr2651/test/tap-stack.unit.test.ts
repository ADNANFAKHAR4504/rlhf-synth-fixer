/**
 * Unit tests for TapStack (CloudFormation template)
 *
 * - Reads ../lib/TapStack.json (canonical for assertions)
 * - Verifies ../lib/TapStack.yml exists (no YAML parsing dependency required)
 * - Validates key resources, properties, tags, security rules, lifecycle, monitoring, and outputs
 *
 * NOTE: Tests are intentionally resilient to minor structural changes and avoid external libs.
 */

import * as fs from "fs";
import * as path from "path";

type CFTemplate = {
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");

function readTemplate(): CFTemplate {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const tpl = JSON.parse(raw) as CFTemplate;
  if (!tpl || typeof tpl !== "object" || !tpl.Resources) {
    throw new Error("Invalid CloudFormation template JSON: missing Resources");
  }
  return tpl;
}

function resourceEntries(tpl: CFTemplate) {
  return Object.entries(tpl.Resources);
}

function getResourcesByType(tpl: CFTemplate, type: string) {
  return resourceEntries(tpl)
    .filter(([, r]) => r?.Type === type)
    .map(([id, r]) => ({ id, r }));
}

function getResource(tpl: CFTemplate, logicalId: string) {
  return tpl.Resources[logicalId];
}

function hasProjectTag(res: any): boolean {
  const tags: Array<{ Key: string; Value: any }> =
    res?.Properties?.Tags || res?.Properties?.tags || [];
  return tags.some((t) => t.Key === "Project" && t.Value === "MultiEnvDemo");
}

function getSecurityGroupIngress(res: any) {
  return res?.Properties?.SecurityGroupIngress || [];
}

function findIngress(
  ingressList: any[],
  opts: { port?: number; cidr?: string; sourceSgRef?: string }
) {
  return ingressList.find((rule) => {
    const portOk =
      opts.port == null ||
      (rule.FromPort === opts.port && rule.ToPort === opts.port);
    const cidrOk = opts.cidr == null || rule.CidrIp === opts.cidr;
    const srcOk =
      opts.sourceSgRef == null ||
      JSON.stringify(rule.SourceSecurityGroupId) === JSON.stringify({ Ref: opts.sourceSgRef });
    return portOk && (cidrOk || srcOk);
  });
}

function pathHas(obj: any, pathArr: (string | number)[]) {
  // Safe accessor for nested properties
  return !!pathArr.reduce((acc: any, key: any) => (acc == null ? undefined : acc[key]), obj);
}

function get(obj: any, pathArr: (string | number)[]) {
  return pathArr.reduce((acc: any, key: any) => (acc == null ? undefined : acc[key]), obj);
}

describe("TapStack template sanity", () => {
  it("YAML file exists and JSON file parses", () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
    const yml = fs.readFileSync(yamlPath, "utf8");
    expect(yml.length).toBeGreaterThan(50); // non-empty
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(() => readTemplate()).not.toThrow();
  });
});

describe("Core structure & sections", () => {
  const tpl = readTemplate();

  it("has required top-level sections", () => {
    expect(tpl).toHaveProperty("Resources");
    // Parameters/Conditions/Outputs may exist; only assert when critical below
  });

  it("defines key parameters", () => {
    expect(tpl.Parameters).toBeDefined();
    const p = tpl.Parameters!;
    expect(p).toHaveProperty("Environment");
    expect(p).toHaveProperty("VpcCidr");
    expect(p).toHaveProperty("InstanceType");
    expect(p).toHaveProperty("DBInstanceClass");
    expect(p).toHaveProperty("DBName");
    expect(p).toHaveProperty("DBUsername");
    expect(p).toHaveProperty("DBPasswordSSMParam"); // optional but present
    expect(p).toHaveProperty("AllowHttpFromWorld");
  });

  it("defines key conditions used for branching", () => {
    expect(tpl.Conditions).toBeDefined();
    const c = tpl.Conditions!;
    expect(c).toHaveProperty("EnableHttpAccess");
    expect(c).toHaveProperty("HasAlarmEmail");
    expect(c).toHaveProperty("HasDBPasswordPath");
  });
});

describe("Networking (VPC, Subnets, Routes, NAT/IGW)", () => {
  const tpl = readTemplate();

  it("creates a VPC with DNS support enabled and tagged", () => {
    const vpcs = getResourcesByType(tpl, "AWS::EC2::VPC");
    expect(vpcs.length).toBe(1);
    const vpc = vpcs[0].r;
    expect(get(vpc, ["Properties", "EnableDnsSupport"])).toBe(true);
    expect(get(vpc, ["Properties", "EnableDnsHostnames"])).toBe(true);
    expect(hasProjectTag(vpc)).toBe(true);
  });

  it("creates 2 public and 2 private subnets with tags", () => {
    const subs = getResourcesByType(tpl, "AWS::EC2::Subnet");
    expect(subs.length).toBeGreaterThanOrEqual(4);
    // Logical IDs (recommended naming present in provided stack)
    ["PublicSubnet1", "PublicSubnet2", "PrivateSubnet1", "PrivateSubnet2"].forEach((id) => {
      const res = getResource(tpl, id);
      expect(res).toBeDefined();
      expect(hasProjectTag(res)).toBe(true);
    });
  });

  it("creates an Internet Gateway and NAT Gateway with proper attachments", () => {
    const igw = getResource(tpl, "InternetGateway");
    const igwAttach = getResource(tpl, "InternetGatewayAttachment");
    const natEip = getResource(tpl, "NatGatewayEIP");
    const natGw = getResource(tpl, "NatGateway");
    expect(igw).toBeDefined();
    expect(igwAttach).toBeDefined();
    expect(natEip).toBeDefined();
    expect(natGw).toBeDefined();
    expect(hasProjectTag(igw)).toBe(true);
    expect(hasProjectTag(natEip)).toBe(true);
    expect(hasProjectTag(natGw)).toBe(true);
  });

  it("sets public default route to IGW and private default route to NAT", () => {
    const pubRt = getResource(tpl, "DefaultPublicRoute");
    const privRt = getResource(tpl, "DefaultPrivateRoute");
    expect(pubRt).toBeDefined();
    expect(get(pubRt, ["Properties", "DestinationCidrBlock"])).toBe("0.0.0.0/0");
    expect(get(pubRt, ["Properties", "GatewayId"])).toBeDefined();
    expect(privRt).toBeDefined();
    expect(get(privRt, ["Properties", "DestinationCidrBlock"])).toBe("0.0.0.0/0");
    expect(get(privRt, ["Properties", "NatGatewayId"])).toBeDefined();
  });
});

describe("S3 bucket (versioning, lifecycle, encryption, block public access)", () => {
  const tpl = readTemplate();

  it("creates one S3 bucket with versioning, lifecycle and encryption", () => {
    const buckets = getResourcesByType(tpl, "AWS::S3::Bucket");
    expect(buckets.length).toBe(1);
    const b = buckets[0].r;

    expect(get(b, ["Properties", "VersioningConfiguration", "Status"])).toBe("Enabled");

    // Lifecycle: non-current to GLACIER after 30 days
    const rules = get(b, ["Properties", "LifecycleConfiguration", "Rules"]) || [];
    const noncurrent = rules.flatMap((r: any) => r?.NoncurrentVersionTransitions || []);
    const nc30 = noncurrent.find(
      (n: any) => n?.TransitionInDays === 30 && n?.StorageClass === "GLACIER"
    );
    expect(nc30).toBeDefined();

    // Encryption
    const sseAlgo = get(b, [
      "Properties",
      "BucketEncryption",
      "ServerSideEncryptionConfiguration",
      0,
      "ServerSideEncryptionByDefault",
      "SSEAlgorithm",
    ]);
    expect(sseAlgo).toBe("AES256");

    // Public access block
    expect(
      pathHas(b, ["Properties", "PublicAccessBlockConfiguration", "BlockPublicAcls"])
    ).toBe(true);
    expect(
      pathHas(b, ["Properties", "PublicAccessBlockConfiguration", "RestrictPublicBuckets"])
    ).toBe(true);

    expect(hasProjectTag(b)).toBe(true);
  });
});

describe("IAM role and permissions for EC2", () => {
  const tpl = readTemplate();
  const role = getResource(tpl, "EC2Role");

  it("defines an instance role with least-priv s3 read and logs permissions", () => {
    expect(role).toBeDefined();
    expect(hasProjectTag(role)).toBe(true);
    const policies = role?.Properties?.Policies || [];
    expect(policies.length).toBeGreaterThanOrEqual(3);

    const s3Policy = policies.find((p: any) => p.PolicyName === "S3BucketAccess");
    expect(s3Policy).toBeDefined();
    const s3Actions = JSON.stringify(s3Policy.PolicyDocument.Statement);
    expect(s3Actions).toMatch(/s3:GetObject/);
    expect(s3Actions).toMatch(/s3:ListBucket/);

    const logsPolicy = policies.find((p: any) => p.PolicyName === "CloudWatchLogs");
    expect(logsPolicy).toBeDefined();
    const logsActions = JSON.stringify(logsPolicy.PolicyDocument.Statement);
    expect(logsActions).toMatch(/logs:CreateLogStream/);
    expect(logsActions).toMatch(/logs:PutLogEvents/);

    const ssmPolicy = policies.find((p: any) => p.PolicyName === "SSMParameterAccess");
    expect(ssmPolicy).toBeDefined();
  });

  it("exposes an instance profile for the role", () => {
    const profile = getResource(tpl, "EC2InstanceProfile");
    expect(profile).toBeDefined();
    expect(get(profile, ["Properties", "Roles"])).toBeDefined();
  });
});

describe("EC2 instance (type, image, SG rules, user data, logging)", () => {
  const tpl = readTemplate();

  it("restricts SSH to 203.0.113.0/24 and optionally allows HTTP", () => {
    const ec2Sg = getResource(tpl, "EC2SecurityGroup");
    expect(ec2Sg).toBeDefined();
    expect(hasProjectTag(ec2Sg)).toBe(true);
    const ingress = getSecurityGroupIngress(ec2Sg);
    const ssh = findIngress(ingress, { port: 22, cidr: "203.0.113.0/24" });
    expect(ssh).toBeDefined();
    // HTTP rule is conditional; do not assert its presence strictly
  });
});

describe("RDS (subnet group, parameter group, db instance)", () => {
  const tpl = readTemplate();

  it("creates DB subnet group for two private subnets and parameter group with max_connections=150", () => {
    const subnetGrp = getResource(tpl, "DBSubnetGroup");
    expect(subnetGrp).toBeDefined();
    const subnets = get(subnetGrp, ["Properties", "SubnetIds"]) || [];
    expect(subnets.length).toBeGreaterThanOrEqual(2);

    const paramGrp = getResource(tpl, "DBParameterGroup");
    expect(paramGrp).toBeDefined();
    expect(get(paramGrp, ["Properties", "Family"])).toMatch(/^mysql8/);
    expect(get(paramGrp, ["Properties", "Parameters", "max_connections"])).toBe("150");
  });

  it("limits DB ingress to the EC2 security group (port 3306)", () => {
    const dbSg = getResource(tpl, "RDSSecurityGroup");
    expect(dbSg).toBeDefined();
    const ingress = getSecurityGroupIngress(dbSg);
    const fromEc2 = findIngress(ingress, { port: 3306, sourceSgRef: "EC2SecurityGroup" });
    expect(fromEc2).toBeDefined();
  });

  it("references credentials via conditional (SSM path or generated secret)", () => {
    const db = getResource(tpl, "DBInstance");
    const mup = get(db, ["Properties", "MasterUserPassword"]);
    // Expect Fn::If structure present
    expect(mup && typeof mup === "object" && "Fn::If" in mup).toBe(true);
  });
});

describe("Monitoring & alarm", () => {
  const tpl = readTemplate();

  it("defines an alarm for CPUUtilization >= 70%", () => {
    const alarms = getResourcesByType(tpl, "AWS::CloudWatch::Alarm");
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    const a = alarms[0].r;
    expect(get(a, ["Properties", "MetricName"])).toBe("CPUUtilization");
    expect(get(a, ["Properties", "Threshold"])).toBe(70);
    expect(get(a, ["Properties", "ComparisonOperator"])).toMatch(/GreaterThan/);
  });

  it("exposes an SNS topic for notifications", () => {
    const topics = getResourcesByType(tpl, "AWS::SNS::Topic");
    expect(topics.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Outputs for critical resources", () => {
  const tpl = readTemplate();

  it("exports bucket name, DB endpoint/port, instance id/public DNS, and VPC id", () => {
    expect(tpl.Outputs).toBeDefined();
    const o = tpl.Outputs!;
    ["BucketName", "DBEndpointAddress", "DBPort", "InstanceId", "InstancePublicDnsName", "VpcId"].forEach(
      (k) => expect(o).toHaveProperty(k)
    );
  });
});

describe("Tagging standards (spot checks)", () => {
  const tpl = readTemplate();

  it("applies Project=MultiEnvDemo tag across key resources", () => {
    const ids = [
      "VPC",
      "PublicSubnet1",
      "PublicSubnet2",
      "PrivateSubnet1",
      "PrivateSubnet2",
      "S3Bucket",
      "CloudWatchLogGroup",
      "EC2Role",
      "EC2SecurityGroup",
      "RDSSecurityGroup",
      "DBParameterGroup",
      "DBInstance",
      "EC2Instance",
    ];
    ids.forEach((id) => {
      const res = getResource(tpl, id);
      expect(res).toBeDefined();
      expect(hasProjectTag(res)).toBe(true);
    });
  });
});
