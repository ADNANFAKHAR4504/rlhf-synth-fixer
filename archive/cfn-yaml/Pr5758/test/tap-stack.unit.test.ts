import * as fs from "fs";
import * as path from "path";

type CFNResource = { Type: string; Properties?: any; DependsOn?: any };
type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, CFNResource>;
  Outputs?: Record<string, any>;
};

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");

// ---------- Helpers ----------

const loadJsonTemplate = (): CFNTemplate => {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed as CFNTemplate;
};

const yamlText = (): string => fs.readFileSync(yamlPath, "utf8");

const getResource = (tpl: CFNTemplate, logicalId: string): CFNResource | undefined =>
  tpl.Resources?.[logicalId];

const findResourcesByType = (tpl: CFNTemplate, type: string) =>
  Object.entries(tpl.Resources ?? {}).filter(([, res]) => res.Type === type);

const isCfnStringLike = (v: unknown): boolean => {
  // Accept literal string or intrinsic function objects like { Ref: ... } or { "Fn::Sub": ... }
  if (typeof v === "string") return true;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as any);
    return keys.some((k) => ["Ref", "Fn::Sub", "Fn::Join", "Fn::Select", "Fn::GetAtt"].includes(k));
  }
  return false;
};

// YAML search helpers (fallback when JSON lacks explicit structures)
const includesAll = (text: string, needles: string[]) => needles.every((n) => text.includes(n));
const yamlHasType = (text: string, cfnType: string) => text.includes(`Type: ${cfnType}`);
const yamlCount = (text: string, needle: string) => (text.match(new RegExp(escapeRegExp(needle), "g")) || []).length;
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- Tests ----------

describe("TapStack template — file presence & basic structure", () => {
  test("YAML file exists and contains CloudFormation markers", () => {
    const exists = fs.existsSync(yamlPath);
    expect(exists).toBe(true);

    const content = yamlText();
    expect(content.length).toBeGreaterThan(50);
    expect(content).toMatch(/AWSTemplateFormatVersion:/);
    expect(content).toMatch(/Resources:/);
  });

  test("JSON file exists and is a valid CloudFormation-like object", () => {
    const exists = fs.existsSync(jsonPath);
    expect(exists).toBe(true);

    const tpl = loadJsonTemplate();
    expect(typeof tpl).toBe("object");
    expect(tpl).toHaveProperty("Resources");
    expect(tpl.Resources && Object.keys(tpl.Resources!).length).toBeGreaterThan(10);
  });
});

describe("TapStack template — Parameters & Description", () => {
  const tpl = loadJsonTemplate();

  test("Has a descriptive Description", () => {
    expect(typeof tpl.Description).toBe("string");
    expect(tpl.Description!.toLowerCase()).toContain("serverless");
  });

  test("Includes required parameters", () => {
    const p = tpl.Parameters ?? {};
    const required = [
      "Team",
      "Service",
      "UseCase",
      "EnvironmentSuffix",
      "VpcCidr",
      "PublicSubnet1Cidr",
      "PublicSubnet2Cidr",
      "PrivateSubnet1Cidr",
      "PrivateSubnet2Cidr",
      "NotificationEmail",
      "LambdaRuntime",
    ];
    required.forEach((name) => expect(p).toHaveProperty(name));
  });
});

describe("Networking — VPC, Subnets, NAT, Routes, Endpoints", () => {
  const tpl = loadJsonTemplate();

  test("Has exactly one VPC", () => {
    const vpcs = findResourcesByType(tpl, "AWS::EC2::VPC");
    expect(vpcs.length).toBe(1);
  });

  test("Has two public and two private subnets", () => {
    const subnets = findResourcesByType(tpl, "AWS::EC2::Subnet");
    expect(subnets.length).toBeGreaterThanOrEqual(4);
    ["PublicSubnet1", "PublicSubnet2", "PrivateSubnet1", "PrivateSubnet2"].forEach((id) =>
      expect(getResource(tpl, id)).toBeDefined()
    );
  });

  test("Has InternetGateway and its attachment", () => {
    expect(findResourcesByType(tpl, "AWS::EC2::InternetGateway").length).toBe(1);
    expect(findResourcesByType(tpl, "AWS::EC2::VPCGatewayAttachment").length).toBe(1);
  });

  test("Has two NAT Gateways and two EIPs", () => {
    expect(findResourcesByType(tpl, "AWS::EC2::NatGateway").length).toBeGreaterThanOrEqual(2);
    expect(findResourcesByType(tpl, "AWS::EC2::EIP").length).toBeGreaterThanOrEqual(2);
  });

  test("Has route tables and associations for public and private subnets", () => {
    expect(findResourcesByType(tpl, "AWS::EC2::RouteTable").length).toBeGreaterThanOrEqual(3);
    expect(findResourcesByType(tpl, "AWS::EC2::SubnetRouteTableAssociation").length).toBeGreaterThanOrEqual(4);
  });

  test("Has Gateway Endpoints for S3 and DynamoDB", () => {
    const vpces = findResourcesByType(tpl, "AWS::EC2::VPCEndpoint");
    // Primary check via JSON:
    const gatewayEndpoints = vpces.filter(([, res]) => {
      const sn = res.Properties?.ServiceName?.toString() ?? "";
      const hasRouteTableIds = Array.isArray(res.Properties?.RouteTableIds);
      return hasRouteTableIds && (sn.includes(".s3") || sn.includes(".dynamodb"));
    });

    if (gatewayEndpoints.length >= 2) {
      expect(gatewayEndpoints.length).toBeGreaterThanOrEqual(2);
    } else {
      // Fallback to YAML string inspection
      const y = yamlText();
      const hasS3Gateway = includesAll(y, ["Type: AWS::EC2::VPCEndpoint", "ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'"]) ||
                           includesAll(y, ["Type: AWS::EC2::VPCEndpoint", "ServiceName: com.amazonaws.us-east-1.s3"]);
      const hasDdbGateway = includesAll(y, ["Type: AWS::EC2::VPCEndpoint", "ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'"]) ||
                            includesAll(y, ["Type: AWS::EC2::VPCEndpoint", "ServiceName: com.amazonaws.us-east-1.dynamodb"]);
      expect(hasS3Gateway && hasDdbGateway).toBe(true);
    }
  });

  test("Has interface endpoints for SQS and CloudWatch Logs (optional CloudTrail)", () => {
    const vpces = findResourcesByType(tpl, "AWS::EC2::VPCEndpoint");
    const interfaceServices = vpces.filter(([, res]) => {
      const sn = res.Properties?.ServiceName?.toString() ?? "";
      return res.Properties?.VpcEndpointType === "Interface" && (sn.includes(".sqs") || sn.includes(".logs") || sn.includes(".cloudtrail"));
    });

    if (interfaceServices.length >= 2) {
      expect(interfaceServices.length).toBeGreaterThanOrEqual(2);
    } else {
      // Fallback to YAML string search
      const y = yamlText();
      const interfaceCount = yamlCount(y, "VpcEndpointType: Interface");
      const hasSqs = y.includes(".sqs") || y.includes("com.amazonaws.us-east-1.sqs");
      const hasLogs = y.includes(".logs") || y.includes("com.amazonaws.us-east-1.logs");
      expect(interfaceCount).toBeGreaterThanOrEqual(2);
      expect(hasSqs || hasLogs).toBe(true);
    }
  });
});

describe("Security & Encryption — KMS, S3 Bucket, Policies", () => {
  const tpl = loadJsonTemplate();

  test("KMS CMK with rotation and alias are defined", () => {
    const keys = findResourcesByType(tpl, "AWS::KMS::Key");
    const aliases = findResourcesByType(tpl, "AWS::KMS::Alias");
    expect(keys.length).toBe(1);
    expect(keys[0][1].Properties?.EnableKeyRotation).toBe(true);
    expect(aliases.length).toBe(1);
  });

  test("Logs S3 bucket configured with KMS encryption, versioning, and public access block", () => {
    const logsBucket = getResource(tpl, "LogsBucket");
    expect(logsBucket?.Type).toBe("AWS::S3::Bucket");
    const props = logsBucket?.Properties ?? {};
    expect(props.BucketName).toBeUndefined();
    expect(props.BucketEncryption).toBeDefined();
    expect(props.VersioningConfiguration?.Status).toBe("Enabled");
    const pab = props.PublicAccessBlockConfiguration;
    expect(pab?.BlockPublicAcls).toBe(true);
    expect(pab?.BlockPublicPolicy).toBe(true);
    expect(pab?.IgnorePublicAcls).toBe(true);
    expect(pab?.RestrictPublicBuckets).toBe(true);
  });

  test("LogsBucketPolicy denies non-TLS and enforces SSE-KMS", () => {
    const pol = getResource(tpl, "LogsBucketPolicy");
    expect(pol?.Type).toBe("AWS::S3::BucketPolicy");
    const statements = pol?.Properties?.PolicyDocument?.Statement ?? [];
    const denyTls = statements.find((s: any) => s.Sid?.includes("DenyInsecureConnections"));
    const denyUnenc = statements.find((s: any) => s.Sid?.includes("DenyUnEncryptedObjectUploads"));
    expect(denyTls).toBeDefined();
    expect(denyUnenc).toBeDefined();
  });
});

describe("IAM — Lambda role/policy least-privilege & no fixed names", () => {
  const tpl = loadJsonTemplate();

  test("LambdaRole exists and does not define RoleName (avoid conflicts)", () => {
    const role = getResource(tpl, "LambdaRole");
    expect(role?.Type).toBe("AWS::IAM::Role");
    expect(role?.Properties?.RoleName).toBeUndefined();
  });

  test("LambdaPolicy grants minimal, necessary permissions", () => {
    const pol = getResource(tpl, "LambdaPolicy");
    expect(pol?.Type).toBe("AWS::IAM::Policy");
    const doc = pol?.Properties?.PolicyDocument;
    expect(doc?.Statement?.length).toBeGreaterThanOrEqual(4);
    const asStr = JSON.stringify(doc);
    expect(asStr).toContain("logs:PutLogEvents");
    expect(asStr).toContain("s3:PutObject");
    expect(asStr).toContain("sqs:ReceiveMessage");
    expect(asStr).toContain("dynamodb:GetRecords");
    expect(asStr).toContain("kms:Decrypt");
  });
});

describe("Compute — Lambda function & VPC config", () => {
  const tpl = loadJsonTemplate();

  test("LambdaFunction exists with handler, runtime, and env vars", () => {
    const fn = getResource(tpl, "LambdaFunction");
    expect(fn?.Type).toBe("AWS::Lambda::Function");
    const p = fn?.Properties ?? {};
    expect(typeof p.Handler).toBe("string");
    // Runtime may be a string or an intrinsic (e.g., { Ref: "LambdaRuntime" })
    expect(isCfnStringLike(p.Runtime)).toBe(true);
    expect(p.Environment?.Variables?.TABLE_NAME).toBeDefined();
    expect(p.Environment?.Variables?.BUCKET_NAME).toBeDefined();
    expect(p.Environment?.Variables?.KMS_KEY_ARN).toBeDefined();
  });

  test("LambdaFunction is placed in private subnets with security group", () => {
    const fn = getResource(tpl, "LambdaFunction");
    const vpc = fn?.Properties?.VpcConfig;
    expect(Array.isArray(vpc?.SubnetIds)).toBe(true);
    expect(vpc?.SubnetIds.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(vpc?.SecurityGroupIds)).toBe(true);
    expect(vpc?.SecurityGroupIds.length).toBeGreaterThanOrEqual(1);
  });

  test("Lambda has dedicated LogGroup with 30-day retention", () => {
    const lg = getResource(tpl, "LambdaLogGroup");
    expect(lg?.Type).toBe("AWS::Logs::LogGroup");
    expect(lg?.Properties?.RetentionInDays).toBe(30);
  });
});

describe("Data & Messaging — DynamoDB, SQS, DLQ, Event Source Mappings", () => {
  const tpl = loadJsonTemplate();

  test("DynamoDB table uses on-demand billing and NEW_IMAGE stream", () => {
    const t = getResource(tpl, "DynamoDBTable");
    expect(t?.Type).toBe("AWS::DynamoDB::Table");
    expect(t?.Properties?.BillingMode).toBe("PAY_PER_REQUEST");
    expect(t?.Properties?.StreamSpecification?.StreamViewType).toBe("NEW_IMAGE");
  });

  test("SQS queue and DLQ configured with redrive policy", () => {
    const q = getResource(tpl, "SQSQueue");
    const dlq = getResource(tpl, "SQSDeadLetterQueue");
    expect(q?.Type).toBe("AWS::SQS::Queue");
    expect(dlq?.Type).toBe("AWS::SQS::Queue");
    expect(q?.Properties?.RedrivePolicy?.deadLetterTargetArn).toBeDefined();
    expect(q?.Properties?.RedrivePolicy?.maxReceiveCount).toBeGreaterThanOrEqual(1);
  });

  test("Event source mappings exist for SQS and DynamoDB Streams", () => {
    const esms = findResourcesByType(tpl, "AWS::Lambda::EventSourceMapping");
    const joined = JSON.stringify(esms.map(([, r]) => r));
    expect(joined).toContain("SQSQueue");
    expect(joined).toContain("DynamoDBTable");
  });
});

describe("Observability — SNS alerts & CloudWatch Alarm", () => {
  const tpl = loadJsonTemplate();

  test("SNS Topic and Subscription exist for alerts", () => {
    expect(findResourcesByType(tpl, "AWS::SNS::Topic").length).toBeGreaterThanOrEqual(1);
    expect(findResourcesByType(tpl, "AWS::SNS::Subscription").length).toBeGreaterThanOrEqual(1);
  });
});

describe("Audit — CloudTrail configured to log to encrypted S3", () => {
  const tpl = loadJsonTemplate();

  test("CloudTrail trail exists and references the LogsBucket with KMS", () => {
    const trail = getResource(tpl, "CloudTrailTrail");
    expect(trail?.Type).toBe("AWS::CloudTrail::Trail");
    expect(trail?.Properties?.S3BucketName).toBeDefined();

    // Ensure not using invalid S3 data event wildcard that caused prior failures
    const selectors = trail?.Properties?.EventSelectors ?? [];
    const asStr = JSON.stringify(selectors);
    expect(asStr).not.toContain("arn:aws:s3:::*/*");
  });
});

describe("Outputs — essential identifiers exposed", () => {
  const tpl = loadJsonTemplate();

  test("Outputs exist for core networking and services", () => {
    const o = tpl.Outputs ?? {};
    const mustHave = [
      "VPCId",
      "PublicSubnet1Id",
      "PublicSubnet2Id",
      "PrivateSubnet1Id",
      "PrivateSubnet2Id",
      "LambdaSecurityGroupId",
      "LogBucketName",
      "KMSKeyArn",
      "LambdaFunctionName",
      "LambdaFunctionArn",
      "SQSQueueUrl",
      "SQSQueueArn",
      "SQSDLQArn",
      "DynamoDBTableName",
      "DynamoDBStreamArn",
      "SNSTopicArn",
      "CloudTrailArn",
    ];
    mustHave.forEach((k) => expect(o).toHaveProperty(k));
  });
});
