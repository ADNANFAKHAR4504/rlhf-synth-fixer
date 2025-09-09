import fs from "fs";
import path from "path";

describe("MyStack CloudFormation Template", () => {
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
    test("should define ProjectName, AllowedIPRange, AllowedSSHCIDR, DBUsername, LatestAmiId", () => {
      const params = ["ProjectName", "AllowedIPRange", "AllowedSSHCIDR", "DBUsername", "LatestAmiId"];
      params.forEach(param => expect(template.Parameters[param]).toBeDefined());
    });
  });

  describe("Resources", () => {
    test("should create VPC with CIDR 10.0.0.0/16", () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe("AWS::EC2::VPC");
      expect(vpc.Properties.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should create InternetGateway and attach it", () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe("AWS::EC2::InternetGateway");

      const attachment = template.Resources.AttachIGW;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    });

    test("should define 2 public and 2 private subnets", () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBe(4);
    });

    test("should define PublicSubnet associations with PublicRouteTable", () => {
      expect(template.Resources.PublicSubnet1Assoc.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
      expect(template.Resources.PublicSubnet2Assoc.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
    });

    test("should define WebSecurityGroup allowing SSH, HTTP, and HTTPS", () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe("AWS::EC2::SecurityGroup");

      const ports = sg.Properties.SecurityGroupIngress.map((r: any) => r.FromPort);
      expect(ports).toEqual(expect.arrayContaining([22, 80, 443]));
    });

    test("should define WebServer EC2 instance with IAM profile", () => {
      const ec2 = template.Resources.WebServer;
      expect(ec2).toBeDefined();
      expect(ec2.Type).toBe("AWS::EC2::Instance");
      expect(ec2.Properties.IamInstanceProfile).toBeDefined();
    });

    test("should define EC2AppRole and EC2InstanceProfile", () => {
      const role = template.Resources.EC2AppRole;
      const profile = template.Resources.EC2InstanceProfile;
      expect(role).toBeDefined();
      expect(profile).toBeDefined();
      expect(profile.Properties.Roles).toContainEqual({ Ref: "EC2AppRole" });
    });

    test("should define ApplicationBucket with encryption and blocked public access", () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe("AWS::S3::Bucket");

      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toMatchObject({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    test("should define Database (RDS) with 7-day backup retention and encryption", () => {
      const rds = template.Resources.Database;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe("AWS::RDS::DBInstance");
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.StorageEncrypted).toBe(true);

      expect(rds.DeletionPolicy).toBe("Delete");
      expect(rds.UpdateReplacePolicy).toBe("Delete");
    });

    test("should define UnauthorizedAlarm CloudWatch Alarm", () => {
      const alarm = template.Resources.UnauthorizedAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");
      expect(alarm.Properties.MetricName).toBe("UnauthorizedAPICalls");
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  describe("Outputs", () => {
    test("should define expected outputs", () => {
      const expected = [
        "VPCId",
        "WebServerInstanceId",
        "DatabaseEndpoint",
        "ApplicationBucket",
        "DynamoDBTableName",
        "CloudTrailArn"
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
  });
});