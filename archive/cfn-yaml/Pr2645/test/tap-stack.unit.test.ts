import * as fs from "fs";
import * as path from "path";

describe("TapStack CloudFormation Template Unit Tests", () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
    const file = fs.readFileSync(templatePath, "utf8");
    template = JSON.parse(file);
  });

  // -------------------------------
  // General template validations
  // -------------------------------
  it("should use correct AWSTemplateFormatVersion", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  it("should have a valid description", () => {
    expect(template.Description).toContain("Secure, compliant AWS baseline environment");
  });

  it("should include mandatory top-level sections", () => {
    expect(template).toHaveProperty("Parameters");
    expect(template).toHaveProperty("Resources");
    expect(template).toHaveProperty("Outputs");
  });

  // -------------------------------
  // Parameters
  // -------------------------------
  it("should define required parameters with defaults", () => {
    const params = template.Parameters;
    expect(params.EnvironmentName.Default).toBe("prod");
    expect(params.VpcCIDR.Default).toBe("10.0.0.0/16");
    expect(params.PublicSubnet1CIDR.Default).toBe("10.0.1.0/24");
    expect(params.PublicSubnet2CIDR.Default).toBe("10.0.2.0/24");
    expect(params.PrivateSubnet1CIDR.Default).toBe("10.0.3.0/24");
    expect(params.PrivateSubnet2CIDR.Default).toBe("10.0.4.0/24");
    expect(params.LatestAmiId.Default).toContain("amzn2-ami");
  });

  it("should allow EnableConfig parameter to only be true or false", () => {
    expect(template.Parameters.EnableConfig.AllowedValues).toEqual(["true", "false"]);
  });

  it("should define KeyName parameter with default empty string", () => {
    expect(template.Parameters.KeyName.Default).toBe("");
  });

  // -------------------------------
  // Conditions
  // -------------------------------
  it("should define HasKeyName as a Not+Equals condition", () => {
    const cond = template.Conditions.HasKeyName;
    expect(cond["Fn::Not"]).toBeDefined();
    expect(cond["Fn::Not"][0]["Fn::Equals"]).toBeDefined();
  });

  it("should define CreateConfig condition as Equals EnableConfig true", () => {
    const cond = template.Conditions.CreateConfig;
    expect(cond["Fn::Equals"]).toBeDefined();
    expect(cond["Fn::Equals"][0].Ref).toBe("EnableConfig");
    expect(cond["Fn::Equals"][1]).toBe("true");
  });

  // -------------------------------
  // KMS Key
  // -------------------------------
  it("should include a KMS CMK with key rotation enabled", () => {
    const kms = template.Resources.KmsKey;
    expect(kms.Type).toBe("AWS::KMS::Key");
    expect(kms.Properties.EnableKeyRotation).toBe(true);
  });

  it("should define KMS Key with correct policy principal", () => {
    const kms = template.Resources.KmsKey;
    const statement = kms.Properties.KeyPolicy.Statement[0];
    expect(statement.Principal.AWS["Fn::Sub"]).toContain("${AWS::AccountId}:root");
  });

  // -------------------------------
  // Networking
  // -------------------------------
  it("should define a VPC with DNS support and tagging", () => {
    const vpc = template.Resources.VPC;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);

    const tags = vpc.Properties.Tags;
    const envTag = tags.find((t: any) => t.Key === "Environment");
    expect(envTag).toBeDefined();
    expect(envTag.Value.Ref).toBe("EnvironmentName");
  });

  it("should create four subnets with correct mapping of Public vs Private", () => {
    const subnets = [
      template.Resources.PublicSubnet1,
      template.Resources.PublicSubnet2,
      template.Resources.PrivateSubnet1,
      template.Resources.PrivateSubnet2,
    ];
    expect(subnets.every(s => s.Type === "AWS::EC2::Subnet")).toBe(true);

    expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  it("should define Internet Gateway and attachment", () => {
    expect(template.Resources.InternetGateway.Type).toBe("AWS::EC2::InternetGateway");
    expect(template.Resources.AttachGateway.Type).toBe("AWS::EC2::VPCGatewayAttachment");
  });

  it("should create a public route with destination 0.0.0.0/0", () => {
    const route = template.Resources.PublicRoute;
    expect(route.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
  });

  // -------------------------------
  // Security
  // -------------------------------
  it("should restrict Security Group ingress to only ports 80 and 443", () => {
    const sg = template.Resources.WebSG;
    const ingress = sg.Properties.SecurityGroupIngress;
    expect(ingress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ FromPort: 443, ToPort: 443 }),
      ])
    );
    expect(ingress.length).toBe(2);
  });

  it("should allow all outbound traffic", () => {
    const sg = template.Resources.WebSG.Properties.SecurityGroupEgress;
    expect(sg[0].IpProtocol).toBe(-1);
    expect(sg[0].CidrIp).toBe("0.0.0.0/0");
  });

  // -------------------------------
  // EC2
  // -------------------------------
  it("should use dynamic AMI via SSM parameter", () => {
    expect(template.Parameters.LatestAmiId.Default).toContain("amzn2-ami");
  });

  it("should ensure EC2 instance is t3.micro", () => {
    expect(template.Resources.EC2Instance.Properties.InstanceType).toBe("t3.micro");
  });

  it("should enforce encryption on EC2 EBS volume with KMS", () => {
    const ebs = template.Resources.EC2Instance.Properties.BlockDeviceMappings[0].Ebs;
    expect(ebs.Encrypted).toBe(true);
    expect(ebs.KmsKeyId.Ref).toBe("KmsKey");
  });

  // -------------------------------
  // S3 Buckets
  // -------------------------------
  it("should configure S3 buckets with KMS encryption and versioning", () => {
    const secureBucket = template.Resources.SecureBucket;
    expect(
      secureBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm
    ).toBe("aws:kms");
    expect(secureBucket.Properties.VersioningConfiguration.Status).toBe("Enabled");
  });

  it("should use KMS SSE on TrailBucket", () => {
    const bucket = template.Resources.TrailBucket;
    const algo =
      bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm;
    expect(algo).toBe("aws:kms");
  });

  // -------------------------------
  // CloudTrail Bucket Policy
  // -------------------------------
  it("should define a CloudTrail bucket policy with correct permissions", () => {
    const policy = template.Resources.TrailBucketPolicy;
    const statements = policy.Properties.PolicyDocument.Statement;
    const aclCheck = statements.find((s: any) => s.Sid === "AWSCloudTrailAclCheck");
    const writePerm = statements.find((s: any) => s.Sid === "AWSCloudTrailWrite");

    expect(aclCheck).toBeDefined();
    expect(aclCheck.Action).toBe("s3:GetBucketAcl");

    expect(writePerm).toBeDefined();
    expect(writePerm.Action).toBe("s3:PutObject");
    expect(writePerm.Condition.StringEquals["s3:x-amz-acl"]).toBe(
      "bucket-owner-full-control"
    );
  });

  // -------------------------------
  // AWS Config
  // -------------------------------
  it("should define AWS Config resources as conditional", () => {
    const role = template.Resources.ConfigRole;
    const recorder = template.Resources.ConfigRecorder;

    expect(role.Condition).toBe("CreateConfig");
    expect(recorder.Condition).toBe("CreateConfig");
  });

  // -------------------------------
  // CloudWatch
  // -------------------------------
  it("should define a CloudWatch alarm for Unauthorized API calls", () => {
    const alarm = template.Resources.UnauthorizedApiCallsAlarm;
    expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");
    expect(alarm.Properties.MetricName).toBe("UnauthorizedAPICalls");
    expect(alarm.Properties.Threshold).toBe(1);
  });

  // -------------------------------
  // Outputs
  // -------------------------------
  it("should output critical resource IDs and ARNs", () => {
    const outputs = Object.keys(template.Outputs);
    expect(outputs).toEqual(
      expect.arrayContaining([
        "VpcId",
        "PublicSubnet1Id",
        "PublicSubnet2Id",
        "PrivateSubnet1Id",
        "PrivateSubnet2Id",
        "EC2InstanceId",
        "SecureBucketName",
        "S3BucketArn",
        "TrailBucketName",
        "TrailBucketArn",
        "KmsKeyId",
        "KmsKeyArn",
        "UnauthorizedApiCallsAlarmName",
      ])
    );
  });

  // -------------------------------
  // Compliance Checks
  // -------------------------------
  it("should apply EnvironmentName tag to all taggable resources", () => {
    const resources = template.Resources;
    Object.values(resources).forEach((res: any) => {
      if (res.Properties?.Tags) {
        const envTag = res.Properties.Tags.find((t: any) => t.Key === "Environment");
        expect(envTag).toBeDefined();
        expect(envTag.Value.Ref).toBe("EnvironmentName");
      }
    });
  });
});
