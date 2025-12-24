import fs from "fs";
import path from "path";

describe("ProdEnv CloudFormation Template", () => {
  let template: any;

  beforeAll(() => {
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
      const required = ["ProdEnvInstanceType", "ProdEnvNotificationEmail"];
      required.forEach(param => expect(template.Parameters[param]).toBeDefined());
    });

    test("ProdEnvInstanceType should allow t3.micro", () => {
      const p = template.Parameters.ProdEnvInstanceType;
      expect(p.Type).toBe("String");
      expect(p.AllowedValues).toContain("t3.micro");
    });
  });

  describe("Resources", () => {
    test("should create a VPC and exactly 2 subnets", () => {
      const vpc = Object.values(template.Resources).find((r: any) => r.Type === "AWS::EC2::VPC");
      expect(vpc).toBeDefined();

      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBe(2);
    });

    test("should define one Security Group with ingress on 22, 80, 443", () => {
      const sg = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::EC2::SecurityGroup"
      ) as any;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress.map((i: any) => i.FromPort);
      expect(ingress).toEqual(expect.arrayContaining([22, 80, 443]));
    });

    test("should define an encrypted S3 Bucket with dynamic name", () => {
      const bucket = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::S3::Bucket"
      ) as any;
      expect(bucket).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toMatchObject({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
      // Check Fn::Sub
      expect(bucket.Properties.BucketName).toHaveProperty("Fn::Sub");
      expect(bucket.Properties.BucketName["Fn::Sub"]).toBe("prod-env-data-${AWS::AccountId}-${AWS::Region}");
    });

    test("should create exactly 2 EC2 instances with dynamic Name tags", () => {
      const instances = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Instance"
      );
      expect(instances.length).toBe(2);

      instances.forEach(instance => {
        const inst = instance as any;
        const nameTag = inst.Properties.Tags.find((t: any) => t.Key === "Name");
        expect(nameTag.Value).toMatch(/^instance[12]$/); // Matches "instance1" or "instance2"
      });
    });

    test("should create IAM Role and InstanceProfile", () => {
      const role = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::IAM::Role"
      );
      const profile = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::IAM::InstanceProfile"
      );
      expect(role).toBeDefined();
      expect(profile).toBeDefined();
    });

    test("should create an SNS Topic with dynamic name", () => {
      const topic = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::SNS::Topic"
      ) as any;
      expect(topic).toBeDefined();
      expect(topic.Properties.TopicName).toBe("prod-env-cpualert-topic");
    });

    test("KeyPair resource should have dynamic KeyName", () => {
      const kp = template.Resources.ProdEnvKeyPair as any;
      expect(kp).toBeDefined();
      expect(kp.Properties.KeyName).toBe("prod-env-keypair");
    });
  });

  describe("Outputs", () => {
    test("should define all key outputs", () => {
      const expected = [
        "ProdEnvVPCId",
        "ProdEnvDataBucketName",
        "ProdEnvSNSTopicArn",
        "ProdEnvInstance1Id",
        "ProdEnvInstance2Id",
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
  });

  describe("Extended resource validation", () => {
    test("VPC should have CIDR 10.0.0.0/16", () => {
      const vpc = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::EC2::VPC"
      ) as any;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.CidrBlock).toBe("10.0.0.0/16");
    });

    test("Security Group should not allow 0.0.0.0/0 ingress", () => {
      const sg = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::EC2::SecurityGroup"
      ) as any;
      expect(sg).toBeDefined();
      const cidrs = sg.Properties.SecurityGroupIngress.map((i: any) => i.CidrIp);
      expect(cidrs).not.toContain("0.0.0.0/0");
    });

    test("S3 bucket should retain on deletion", () => {
      const bucket = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::S3::Bucket"
      ) as any;
      expect(bucket).toBeDefined();
      expect(bucket.DeletionPolicy).toBe("Retain");
      expect(bucket.UpdateReplacePolicy).toBe("Retain");
    });

    test("CloudWatch CPU alarm threshold should be 80", () => {
      const alarm1 = template.Resources["ProdEnvInstance1CPUAlarm"];
      expect(alarm1).toBeDefined();
      expect(alarm1.Properties.Threshold).toBe(80);
    });

    test("SNS Subscription should use condition ProdEnvHasEmail", () => {
      const sub = Object.values(template.Resources).find(
        (r: any) => r.Type === "AWS::SNS::Subscription"
      ) as any;
      expect(sub).toBeDefined();
      expect(sub.Condition).toBe("ProdEnvHasEmail");
    });
  });
});
