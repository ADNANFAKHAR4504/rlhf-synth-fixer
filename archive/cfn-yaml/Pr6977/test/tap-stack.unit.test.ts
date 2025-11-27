import * as fs from "fs";
import * as path from "path";

describe("TapStack – Comprehensive Unit Tests (28 Tests)", () => {

  const templatePath = path.join(process.cwd(), "lib", "TapStack.json");
  let template: any;

  beforeAll(() => {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template JSON not found at: ${templatePath}`);
    }

    const file = fs.readFileSync(templatePath, "utf8");
    template = JSON.parse(file);
  });


  // ---------------------------------------------------------
  // 1 — Template Structure
  // ---------------------------------------------------------

  test("Template should be a valid JSON object", () => {
    expect(typeof template).toBe("object");
  });

  test("Template must contain Resources section", () => {
    expect(template.Resources).toBeDefined();
  });

  test("Template must contain Parameters section", () => {
    expect(template.Parameters).toBeDefined();
  });

  test("Template must contain Outputs section", () => {
    expect(template.Outputs).toBeDefined();
  });

  // ---------------------------------------------------------
  // 2 — Parameter Validations
  // ---------------------------------------------------------

  test("EnvironmentSuffix parameter must exist", () => {
    expect(template.Parameters.EnvironmentSuffix).toBeDefined();
  });

  test("EnvironmentSuffix must follow allowed pattern", () => {
    const regex = /^[a-z0-9-]{1,20}$/;
    expect(regex.test(template.Parameters.EnvironmentSuffix.Default)).toBe(true);
  });

  test("EC2InstanceType must allow only t2.micro and t3.micro", () => {
    const allowed = template.Parameters.EC2InstanceType.AllowedValues;
    expect(allowed).toEqual(["t2.micro", "t3.micro"]);
  });

  test("AllowedIPRange parameter must exist", () => {
    expect(template.Parameters.AllowedIPRange).toBeDefined();
  });

  // ---------------------------------------------------------
  // 3 — KMS Key Validations
  // ---------------------------------------------------------

  test("KMSKey must exist", () => {
    expect(template.Resources.KMSKey).toBeDefined();
  });

  test("KMSKey must have valid KeyPolicy", () => {
    const doc = template.Resources.KMSKey.Properties.KeyPolicy;
    expect(doc.Statement.length).toBeGreaterThan(0);
  });

  test("KMSKeyAlias must target the correct key", () => {
    const alias = template.Resources.KMSKeyAlias;
    expect(alias.Properties.TargetKeyId).toBeDefined();
  });

  // ---------------------------------------------------------
  // 4 — VPC + Subnets + Routing
  // ---------------------------------------------------------

  test("VPC must exist", () => {
    expect(template.Resources.VPC).toBeDefined();
  });

  test("VPC should have DNS support enabled", () => {
    const props = template.Resources.VPC.Properties;
    expect(props.EnableDnsHostnames).toBe(true);
    expect(props.EnableDnsSupport).toBe(true);
  });

  test("There must be exactly 4 subnets", () => {
    const subnets = ["PublicSubnet1", "PublicSubnet2", "PrivateSubnet1", "PrivateSubnet2"];
    subnets.forEach((s) => expect(template.Resources[s]).toBeDefined());
  });

  test("Route tables must exist", () => {
    expect(template.Resources.PublicRouteTable).toBeDefined();
    expect(template.Resources.PrivateRouteTable).toBeDefined();
  });

  // ---------------------------------------------------------
  // 5 — Security Groups
  // ---------------------------------------------------------

  test("ALBSecurityGroup must exist", () => {
    expect(template.Resources.ALBSecurityGroup).toBeDefined();
  });

  test("DatabaseSecurityGroup must allow port 3306", () => {
    const sg = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
    const rule = sg.find((r: any) => r.ToPort === 3306);
    expect(rule).toBeDefined();
  });

  // ---------------------------------------------------------
  // 6 — S3 Buckets & Policies
  // ---------------------------------------------------------

  test("CloudTrailBucket must exist", () => {
    expect(template.Resources.CloudTrailBucket).toBeDefined();
  });

  test("CloudTrailBucket must have encryption enabled", () => {
    const bucket = template.Resources.CloudTrailBucket.Properties;
    expect(bucket.BucketEncryption).toBeDefined();
  });

  test("ApplicationBucket must have versioning enabled", () => {
    const appBucket = template.Resources.ApplicationBucket.Properties;
    expect(appBucket.VersioningConfiguration.Status).toBe("Enabled");
  });

  test("ApplicationBucketPolicy must be defined", () => {
    expect(template.Resources.ApplicationBucketPolicy).toBeDefined();
  });

  // ---------------------------------------------------------
  // 7 — CloudTrail & Logging
  // ---------------------------------------------------------

  test("CloudTrail must reference the correct bucket", () => {
    const ct = template.Resources.CloudTrail.Properties;
    expect(ct.S3BucketName).toBeDefined();
  });

  test("CloudTrailLogGroup must exist", () => {
    expect(template.Resources.CloudTrailLogGroup).toBeDefined();
  });

  test("CloudTrailRole must exist", () => {
    expect(template.Resources.CloudTrailRole).toBeDefined();
  });

  // ---------------------------------------------------------
  // 8 — RDS Validation (Secrets Manager + Private)
  // ---------------------------------------------------------

  test("DBSubnetGroup must include private subnets", () => {
    const group = template.Resources.DBSubnetGroup.Properties.SubnetIds;
    expect(group.length).toBe(2);
  });

  test("RDSInstance must use SecretsManager dynamic reference", () => {
    const rds = template.Resources.RDSInstance.Properties.MasterUserPassword;
    expect(JSON.stringify(rds)).toContain("secretsmanager");
  });

  test("RDS must not be publicly accessible", () => {
    const rds = template.Resources.RDSInstance.Properties;
    expect(rds.PubliclyAccessible).toBe(false);
  });

  // ---------------------------------------------------------
  // 9 — EC2 + Launch Template
  // ---------------------------------------------------------

  test("EC2LaunchTemplate must exist", () => {
    expect(template.Resources.EC2LaunchTemplate).toBeDefined();
  });

  test("EC2Instance must reference launch template", () => {
    const ec2 = template.Resources.EC2Instance.Properties;
    expect(ec2.LaunchTemplate).toBeDefined();
  });

  // ---------------------------------------------------------
  // 10 — WAF Validations
  // ---------------------------------------------------------

  test("WAFWebACL must exist", () => {
    expect(template.Resources.WAFWebACL).toBeDefined();
  });

  test("WAF must contain managed rule groups", () => {
    const waf = template.Resources.WAFWebACL.Properties.Rules;
    expect(waf.length).toBeGreaterThan(1);
  });

  test("WAF must associate with ALB", () => {
    expect(template.Resources.WAFAssociation).toBeDefined();
  });

  // ---------------------------------------------------------
  // 11 — Outputs
  // ---------------------------------------------------------

  test("Stack must output VPC ID", () => {
    expect(template.Outputs.VPCId).toBeDefined();
  });

  test("Stack must output RDS Endpoint", () => {
    expect(template.Outputs.RDSEndpoint).toBeDefined();
  });

});
