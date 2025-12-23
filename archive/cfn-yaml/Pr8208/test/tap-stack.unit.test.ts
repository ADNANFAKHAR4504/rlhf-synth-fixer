// test/tap-stack.unit.test.ts
import * as fs from "fs";
import * as path from "path";

/** Resolve a file by checking common locations + env override */
function resolveFile(basename: string, envVar: string): string {
  const cwd = process.cwd();
  const cand = [
    process.env[envVar],
    path.resolve(cwd, "lib", basename),
    path.resolve(cwd, "./lib", basename),
    path.resolve(cwd, "../lib", basename),
  ].filter(Boolean) as string[];

  for (const p of cand) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  throw new Error(
    `File not found: ${basename}. Tried:\n${cand.map((p) => ` - ${p}`).join("\n")}\n` +
    `Hint: ensure TapStack.json is at ./lib/TapStack.json or set ${envVar}.`
  );
}

/** Load JSON template (authoritative) */
function readTemplateJson(): any {
  const p = resolveFile("TapStack.json", "TAPSTACK_JSON");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

/** Read YAML text for sanity checks (no YAML parser to avoid extra deps) */
function readTemplateYamlText(): string {
  const p = resolveFile("TapStack.yml", "TAPSTACK_YML");
  return fs.readFileSync(p, "utf-8");
}

function expectKey(obj: any, key: string) {
  expect(obj).toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(obj, key)).toBe(true);
}

describe("TapStack — Unit Validation (JSON as source of truth, YAML presence check)", () => {
  const tpl = readTemplateJson();

  // 01
  test("loads TapStack.json and has AWSTemplateFormatVersion", () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl.AWSTemplateFormatVersion).toBe("string");
  });

  // 02
  test("has Description string", () => {
    expect(typeof tpl.Description).toBe("string");
    expect(tpl.Description.length).toBeGreaterThan(10);
  });

  // 03
  test("has Parameters section with required keys", () => {
    expectKey(tpl, "Parameters");
    const p = tpl.Parameters;
    expectKey(p, "ProjectName");
    expectKey(p, "EnvironmentSuffix");
    expectKey(p, "VpcCidr");
    expectKey(p, "PublicSubnetCidrs");
    expectKey(p, "PrivateSubnetCidrs");
    expectKey(p, "InstanceType");
    expectKey(p, "DesiredCapacity");
    expectKey(p, "MaxSize");
    expectKey(p, "AllowedSshCidr");
  });

  // 04
  test("EnvironmentSuffix uses regex AllowedPattern and has Default (no hard AllowedValues)", () => {
    const ps = tpl.Parameters.EnvironmentSuffix;
    expect(ps).toBeTruthy();
    expect(typeof ps.Default).toBe("string");
    expect(typeof ps.AllowedPattern).toBe("string");
    expect(ps.AllowedValues).toBeUndefined();
  });

  // 05
  test("ProjectName has safe default and pattern", () => {
    const p = tpl.Parameters.ProjectName;
    expect(p.Default).toMatch(/^[a-z0-9-]{3,32}$/);
    expect(typeof p.AllowedPattern).toBe("string");
  });

  // 06
  test("VpcCidr has CIDR pattern", () => {
    const p = tpl.Parameters.VpcCidr;
    expect(typeof p.Default).toBe("string");
    expect(typeof p.AllowedPattern).toBe("string");
    expect(p.Default).toMatch(/\/\d{1,2}$/);
  });

  // 07
  test("PublicSubnetCidrs has two defaults", () => {
    const p = tpl.Parameters.PublicSubnetCidrs;
    expect(typeof p.Default).toBe("string");
    expect(p.Default.split(",").length).toBe(2);
  });

  // 08
  test("PrivateSubnetCidrs has two defaults", () => {
    const p = tpl.Parameters.PrivateSubnetCidrs;
    expect(typeof p.Default).toBe("string");
    expect(p.Default.split(",").length).toBe(2);
  });

  // 09
  test("Mappings has CW.Defaults metrics/alarm keys", () => {
    expectKey(tpl, "Mappings");
    const m = tpl.Mappings;
    expectKey(m, "CW");
    expectKey(m.CW, "Defaults");
    const d = m.CW.Defaults;
    ["Interval", "CpuHighThreshold", "MemHighThreshold", "PeriodSecs", "EvalPeriods"].forEach((k) =>
      expectKey(d, k)
    );
  });

  // 10
  test("Resources section exists", () => {
    expectKey(tpl, "Resources");
  });

  // 11
  test("Core VPC components exist", () => {
    const r = tpl.Resources;
    ["VPC", "InternetGateway", "VPCGatewayAttachment", "PublicRouteTable"].forEach((k) => expectKey(r, k));
  });

  // 12
  test("Public and private subnets (A & B) exist", () => {
    const r = tpl.Resources;
    ["PublicSubnetA", "PublicSubnetB", "PrivateSubnetA", "PrivateSubnetB"].forEach((k) => expectKey(r, k));
  });

  // 13
  test("EC2 security group exposes SSH(22), HTTP(80), HTTPS(443)", () => {
    const sg = tpl.Resources.SecurityGroupEc2;
    expect(sg.Type).toBe("AWS::EC2::SecurityGroup");
    const ingress = sg.Properties.SecurityGroupIngress || [];
    const ports = ingress.map((r: any) => r.ToPort);
    expect(ports).toEqual(expect.arrayContaining([22, 80, 443]));
  });

  // 14
  test("IAM InstanceRole has CWAgent managed policy and S3 read/list inline policy", () => {
    const role = tpl.Resources.InstanceRole;
    expect(role.Type).toBe("AWS::IAM::Role");
    const managed = role.Properties.ManagedPolicyArns || [];
    expect(managed).toEqual(expect.arrayContaining(["arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"]));
    const inline = role.Properties.Policies?.[0]?.PolicyDocument?.Statement || [];
    const s3Stmt = inline.find(
      (s: any) => Array.isArray(s.Action) && s.Action.some((a: string) => a.startsWith("s3:Get"))
    );
    expect(s3Stmt).toBeTruthy();
    expect(s3Stmt.Action).toEqual(expect.arrayContaining(["s3:Get*", "s3:List*"]));
  });

  // 15
  test("InstanceProfile attaches InstanceRole", () => {
    const ip = tpl.Resources.InstanceProfile;
    expect(ip.Type).toBe("AWS::IAM::InstanceProfile");
    expect(Array.isArray(ip.Properties.Roles)).toBe(true);
    expect(ip.Properties.Roles.length).toBeGreaterThan(0);
  });

  // 16
  test("LaunchTemplate references AMI and InstanceProfile", () => {
    const lt = tpl.Resources.LaunchTemplate;
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
    const image = lt.Properties.LaunchTemplateData.ImageId;
    expect(image).toBeDefined();
    expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toBeDefined();
  });

  // 17
  test("CloudWatch log groups exist for EC2 and App", () => {
    const r = tpl.Resources;
    expectKey(r, "CloudWatchLogGroupEC2");
    expectKey(r, "CloudWatchLogGroupApp");
  });

  // 18
  test("Top-level structure restricted to known CFN sections", () => {
    const allowed = new Set([
      "AWSTemplateFormatVersion",
      "Description",
      "Parameters",
      "Mappings",
      "Conditions",
      "Resources",
      "Metadata",
      "Outputs",
    ]);
    Object.keys(tpl).forEach((k) => {
      expect(allowed.has(k)).toBe(true);
    });
  });

  // 19
  test("YAML file exists and contains key markers (sanity)", () => {
    const y = readTemplateYamlText();
    expect(y).toMatch(/AWSTemplateFormatVersion:/);
    expect(y).toMatch(/Parameters:/);
    expect(y).toMatch(/Resources:/);
    expect(y).toMatch(/Outputs:/);
  });
});
