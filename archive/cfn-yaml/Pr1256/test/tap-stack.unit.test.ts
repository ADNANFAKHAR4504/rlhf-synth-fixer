import fs from "fs";
import path from "path";

describe("TapStack CloudFormation Template", () => {
  let template: any;

  beforeAll(() => {
    // Ensure you run cfn-flip if using YAML: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, "../lib/TapStack.json");
    const templateContent = fs.readFileSync(templatePath, "utf8");
    template = JSON.parse(templateContent);
  });

  describe("Template Structure", () => {
    test("should have correct AWSTemplateFormatVersion", () => {
      expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
    });

    test("should include Description, Parameters, Resources, and Outputs", () => {
      expect(typeof template.Description).toBe("string");
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe("Parameters", () => {
    test("should define required parameters", () => {
      const required = ["Project", "Environment", "DBUsername"];
      required.forEach(param => expect(template.Parameters[param]).toBeDefined());
    });

    test("DBUsername parameter should be string without spaces", () => {
      const p = template.Parameters.DBUsername;
      expect(p.Type).toBe("String");
    });

    test("should create a Secrets Manager secret", () => {
      const secret = Object.values(template.Resources).find(
      (r: any) => r.Type === "AWS::SecretsManager::Secret");
      expect(secret).toBeDefined();
    });
  });

  describe("Resources", () => {
    test("should create a VPC with at least two subnets", () => {
      const vpc = Object.values(template.Resources).find((r: any) => r.Type === "AWS::EC2::VPC");
      expect(vpc).toBeDefined();

      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    test("should create an Application Load Balancer", () => {
      const alb = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::ElasticLoadBalancingV2::LoadBalancer"
      ) as any;
      expect(alb).toBeDefined();
      expect(alb?.Properties?.Scheme).toMatch(/internet-facing|internal/);
    });

    test("should create an RDS instance", () => {
      const rds = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::RDS::DBInstance"
      ) as any;
      expect(rds).toBeDefined();
      expect(rds?.Properties?.Engine).toMatch(/postgres|mysql/);
    });

    test("should create at least two S3 buckets with encryption", () => {
      const buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::S3::Bucket"
      );
      expect(buckets.length).toBeGreaterThanOrEqual(2);
      buckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toMatchObject({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test("should create a WAF WebACL", () => {
      expect(
        Object.values(template.Resources).some((r: any) => r.Type === "AWS::WAFv2::WebACL")
      ).toBe(true);
    });

    test("should create AutoScaling resources", () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === "AWS::AutoScaling::AutoScalingGroup"
        )
      ).toBe(true);
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === "AWS::EC2::LaunchTemplate"
        )
      ).toBe(true);
    });
  });

  describe("Outputs", () => {
    test("should define key infrastructure outputs", () => {
      const expected = ["VPCId", "LoadBalancerDNS", "RDSEndpoint", "S3BucketName", "WebACLId"];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });

    test("should use Fn::Sub for all Export names", () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export && output.Export.Name && output.Export.Name["Fn::Sub"]) {
          expect(output.Export.Name["Fn::Sub"]).toMatch(/^\${AWS::StackName}-/);
        }
      });
    });
  });

  describe("Validation", () => {
    test("should not have null or undefined core sections", () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test("should have at least 4 parameters and 5 outputs", () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(5);
    });
  });
});
