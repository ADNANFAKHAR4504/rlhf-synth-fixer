import * as fs from "fs";
import * as path from "path";

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

describe("TapStack CloudFormation Template - Unit Tests", () => {
  it("should have a valid AWSTemplateFormatVersion", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  it("should define all required parameters", () => {
    const params = template.Parameters;
    expect(params).toHaveProperty("Environment");
    expect(params).toHaveProperty("ProjectName");
    expect(params).toHaveProperty("Owner");
    expect(params).toHaveProperty("InstanceType");
    expect(params).toHaveProperty("DBUsername");
    expect(params).toHaveProperty("DBPassword");
  });

  it("should enforce Environment parameter allowed values", () => {
    const envParam = template.Parameters.Environment;
    expect(envParam.AllowedValues).toEqual([
      "development",
      "staging",
      "production",
    ]);
  });

  it("should have NoEcho set for sensitive parameters", () => {
    expect(template.Parameters.DBUsername.NoEcho).toBe(true);
    expect(template.Parameters.DBPassword.NoEcho).toBe(true);
  });

  it("should define a VPC with correct CIDR", () => {
    const vpc = template.Resources.VPC;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.CidrBlock).toBe("10.0.0.0/16");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  it("should create four subnets with correct CIDRs", () => {
    const { PublicSubnet1, PublicSubnet2, PrivateSubnet1, PrivateSubnet2 } =
      template.Resources;
    expect(PublicSubnet1.Properties.CidrBlock).toBe("10.0.1.0/24");
    expect(PublicSubnet2.Properties.CidrBlock).toBe("10.0.2.0/24");
    expect(PrivateSubnet1.Properties.CidrBlock).toBe("10.0.11.0/24");
    expect(PrivateSubnet2.Properties.CidrBlock).toBe("10.0.12.0/24");
  });

  it("should define Security Groups with correct rules", () => {
    const albSG = template.Resources.ALBSG;
    expect(albSG.Properties.SecurityGroupIngress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ FromPort: 443, ToPort: 443 }),
      ])
    );

    const instanceSG = template.Resources.InstanceSG;
    const ports = instanceSG.Properties.SecurityGroupIngress.map((r: any) => r.FromPort);
    expect(ports).toEqual(expect.arrayContaining([80, 443]));
  });

  it("should configure the RDS instance with encryption and Multi-AZ", () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Type).toBe("AWS::RDS::DBInstance");
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.StorageEncrypted).toBe(true);
    expect(rds.Properties.Engine).toBe("postgres");
  });

  it("should retrieve RDS password from Secrets Manager JSON key", () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Properties.MasterUserPassword["Fn::Sub"]).toMatch(
      /resolve:secretsmanager/
    );
    expect(rds.Properties.MasterUserPassword["Fn::Sub"]).toMatch(/::password/);
  });

  it("should enable S3 bucket versioning and encryption", () => {
    const bucket = template.Resources.LoggingBucket;
    expect(bucket.Properties.VersioningConfiguration.Status).toBe("Enabled");
    expect(
      bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm
    ).toBe("aws:kms");
  });

  it("should enforce correct CloudTrail bucket policy", () => {
    const policy = template.Resources.LoggingBucketPolicy;
    const statements = policy.Properties.PolicyDocument.Statement;
    const aclCheck = statements.find((s: any) => s.Sid === "AWSCloudTrailAclCheck");
    const write = statements.find((s: any) => s.Sid === "AWSCloudTrailWrite");

    expect(aclCheck).toBeDefined();
    expect(write).toBeDefined();
    expect(write.Condition.StringEquals["s3:x-amz-acl"]).toBe(
      "bucket-owner-full-control"
    );
  });

  it("should output critical resources", () => {
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty("VpcId");
    expect(outputs).toHaveProperty("ALBEndpoint");
    expect(outputs).toHaveProperty("RDSEndpoint");
    expect(outputs).toHaveProperty("LoggingBucketName");
    expect(outputs).toHaveProperty("CloudTrailArn");
  });

  // 🔹 Extra Tests Added Below 🔹

  it("should define an AutoScalingGroup with min=3, max=6, desired=3", () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Properties.MinSize).toBe(3);
    expect(asg.Properties.MaxSize).toBe(6);
    expect(asg.Properties.DesiredCapacity).toBe(3);
  });

  it("should attach AutoScalingGroup to the ALB Target Group", () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Properties.TargetGroupARNs).toEqual(
      expect.arrayContaining([{ Ref: "ALBTargetGroup" }])
    );
  });

  it("should configure LaunchTemplate with correct instance type and profile", () => {
    const lt = template.Resources.LaunchTemplate;
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
    expect(lt.Properties.LaunchTemplateData.InstanceType.Ref).toBe("InstanceType");
    expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toBeDefined();
  });

  it("should create Bastion host without SSH ingress (SSM-only)", () => {
    const bastionSG = template.Resources.BastionSG;
    expect(bastionSG.Properties.GroupDescription).toMatch(/SSM-only/);
    expect(bastionSG.Properties.SecurityGroupIngress).toBeUndefined();
  });

  it("should ensure IAM role for EC2 has least privilege", () => {
    const role = template.Resources.EC2Role;
    const managed = role.Properties.ManagedPolicyArns;
    expect(managed).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");

    const inlinePolicies = role.Properties.Policies;
    const s3Policy = inlinePolicies.find((p: any) => p.PolicyName === "EC2S3Access");
    expect(s3Policy).toBeDefined();
    expect(s3Policy.PolicyDocument.Statement[0].Action).toEqual(["s3:GetObject"]);
  });

  it("should enforce tagging on key resources", () => {
    const vpcTags = template.Resources.VPC.Properties.Tags.map((t: any) => t.Key);
    expect(vpcTags).toEqual(
      expect.arrayContaining(["Environment", "Owner", "Project", "Name"])
    );

    const secretTags = template.Resources.DBSecret.Properties.Tags.map((t: any) => t.Key);
    expect(secretTags).toEqual(
      expect.arrayContaining(["Environment", "Owner", "Project"])
    );
  });

  it("should define CloudTrail with Multi-Region logging enabled", () => {
    const trail = template.Resources.CloudTrail;
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    expect(trail.Properties.IsLogging).toBe(true);
  });
});
