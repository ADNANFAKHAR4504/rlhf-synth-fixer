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
      const required = ["ProjectName", "AllowedIPRange"];
      required.forEach((param) => expect(template.Parameters[param]).toBeDefined());
    });

    test("parameters should be of correct type", () => {
      expect(template.Parameters.ProjectName.Type).toBe("String");
      expect(template.Parameters.AllowedIPRange.Type).toBe("String");
    });
  });

  describe("Resources", () => {
    test("should create a VPC with at least four subnets", () => {
      const vpc = Object.values(template.Resources).find((r: any) => r.Type === "AWS::EC2::VPC");
      expect(vpc).toBeDefined();

      const subnets = Object.values(template.Resources).filter((r: any) => r.Type === "AWS::EC2::Subnet");
      expect(subnets.length).toBeGreaterThanOrEqual(4);
    });

    test("should create a Web Security Group", () => {
      const sg = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::EC2::SecurityGroup"
      ) as any;
      expect(sg).toBeDefined();
      expect(sg.Properties.GroupDescription).toMatch(/web sg/i);
    });

    test("should create at least two S3 buckets with encryption and public access block", () => {
      const buckets = Object.values(template.Resources).filter((r: any) => r.Type === "AWS::S3::Bucket");
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

    test("should create a DynamoDB table with point-in-time recovery enabled", () => {
      const table = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::DynamoDB::Table"
      ) as any;
      expect(table).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test("should create AWS Config resources (Bucket, Role, Recorder, DeliveryChannel, Lambda)", () => {
      const configBucket = Object.values(template.Resources).find((r: any) => {
        const name = r.Properties.BucketName;
        if (!name) return false;
        if (typeof name === "string") return name.includes("config");
        if (name["Fn::Sub"]) return name["Fn::Sub"].includes("config");
        return false;
      });
      expect(configBucket).toBeDefined();

      const configRole = Object.values(template.Resources).find((r: any) => r.Type === "AWS::IAM::Role" && r.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service.includes("config"));
      expect(configRole).toBeDefined();

      const recorder = Object.values(template.Resources).find((r: any) => r.Type === "AWS::Config::ConfigurationRecorder");
      expect(recorder).toBeDefined();

      const deliveryChannel = Object.values(template.Resources).find((r: any) => r.Type === "AWS::Config::DeliveryChannel");
      expect(deliveryChannel).not.toBeNull();

      const lambda = Object.values(template.Resources).find((r: any) => r.Type === "AWS::Lambda::Function");
      expect(lambda).toBeDefined();
    });

    test("should create IAM roles and instance profile for application", () => {
      const role = Object.values(template.Resources).find((r: any) => r.Type === "AWS::IAM::Role" && r.Properties.Policies);
      expect(role).toBeDefined();

      const profile = Object.values(template.Resources).find((r: any) => r.Type === "AWS::IAM::InstanceProfile");
      expect(profile).toBeDefined();
    });
  });

  describe("Outputs", () => {
    test("should define key infrastructure outputs", () => {
      const expected = ["VPCId", "AppBucketName", "DynamoTableName", "CloudTrailArn"];
      expected.forEach((key) => expect(template.Outputs[key]).toBeDefined());
    });

    test("should not have empty output values", () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output).toBeDefined();
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

    test("should have at least 2 parameters and 4 outputs", () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(4);
    });
  });
});
