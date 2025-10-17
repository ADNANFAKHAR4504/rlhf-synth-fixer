import * as fs from "fs";
import * as path from "path";

// Load synthesized template
const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template: Record<string, any> = JSON.parse(fs.readFileSync(templatePath, "utf8"));

describe("TapStack CloudFormation Template Validation", () => {
  // --- Global Template Structure ---
  test("Template should be valid JSON and contain Resources", () => {
    expect(template).toBeDefined();
    expect(typeof template).toBe("object");
    expect(template.Resources).toBeDefined();
  });

  test("Template should define Parameters and Outputs sections", () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  test("Template should define EnvironmentName parameter", () => {
    expect(template.Parameters.EnvironmentName).toBeDefined();
    expect(template.Parameters.EnvironmentName.Default).toBe("prod");
  });

  test("Template should not use deprecated AccessControl property", () => {
    const resources = Object.values(template.Resources) as Record<string, any>[];
    for (const resource of resources) {
      if (resource.Type === "AWS::S3::Bucket") {
        expect(resource.Properties.AccessControl).toBeUndefined();
      }
    }
  });

  // --- Networking Resources ---
  test("VPC should be defined with DNS support enabled", () => {
    const vpc = template.Resources.VPC as Record<string, any>;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  test("Should include 4 subnets (2 public, 2 private)", () => {
    const subnetIds = Object.keys(template.Resources).filter(k => k.includes("Subnet"));
    expect(subnetIds.length).toBeGreaterThanOrEqual(4);
  });

  test("NAT Gateways should be deployed in public subnets", () => {
    const nat1 = template.Resources.NatGateway1 as Record<string, any>;
    const nat2 = template.Resources.NatGateway2 as Record<string, any>;
    expect(nat1.Type).toBe("AWS::EC2::NatGateway");
    expect(nat2.Type).toBe("AWS::EC2::NatGateway");
    expect(nat1.Properties.SubnetId).toBeDefined();
    expect(nat2.Properties.SubnetId).toBeDefined();
  });

  test("InternetGateway should attach to the VPC", () => {
    const attachment = template.Resources.VPCGatewayAttachment as Record<string, any>;
    expect(attachment.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    expect(attachment.Properties.VpcId).toBeDefined();
    expect(attachment.Properties.InternetGatewayId).toBeDefined();
  });

  // --- Security and IAM ---
  test("EC2 IAM Role should assume ec2.amazonaws.com", () => {
    const role = template.Resources.EC2Role as Record<string, any>;
    expect(role.Type).toBe("AWS::IAM::Role");
    const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
    expect(statement.Principal.Service).toBe("ec2.amazonaws.com");
  });

  test("InstanceProfile should reference EC2Role", () => {
    const profile = template.Resources.EC2InstanceProfile as Record<string, any>;
    expect(profile.Type).toBe("AWS::IAM::InstanceProfile");
    expect(profile.Properties.Roles[0]).toBeDefined();
  });

  test("EC2Role should attach CloudWatch and SSM managed policies", () => {
    const role = template.Resources.EC2Role as Record<string, any>;
    const policies = role.Properties.ManagedPolicyArns;
    expect(policies).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    expect(policies).toContain("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy");
  });

  // --- Compute Resources ---
  test("LaunchTemplate should have UserData script and Nginx installation", () => {
    const lt = template.Resources.LaunchTemplate as Record<string, any>;
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
    expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
  });

  test("AutoScalingGroup should reference LaunchTemplate and TargetGroup", () => {
    const asg = template.Resources.AutoScalingGroup as Record<string, any>;
    expect(asg.Type).toBe("AWS::AutoScaling::AutoScalingGroup");
    expect(asg.Properties.LaunchTemplate).toBeDefined();
    expect(asg.Properties.TargetGroupARNs).toBeDefined();
  });

  test("LoadBalancer should be internet-facing", () => {
    const lb = template.Resources.LoadBalancer as Record<string, any>;
    expect(lb.Properties.Scheme).toBe("internet-facing");
  });

  test("Listener should forward traffic to TargetGroup", () => {
    const listener = template.Resources.Listener as Record<string, any>;
    expect(listener.Properties.DefaultActions[0].Type).toBe("forward");
  });

  // --- Database ---
  test("RDS Instance should be encrypted and MultiAZ", () => {
    const rds = template.Resources.RDSInstance as Record<string, any>;
    expect(rds.Type).toBe("AWS::RDS::DBInstance");
    expect(rds.Properties.StorageEncrypted).toBe(true);
    expect(rds.Properties.MultiAZ).toBe(true);
  });

  test("RDS should use private subnet group and security group", () => {
    const rds = template.Resources.RDSInstance as Record<string, any>;
    expect(rds.Properties.DBSubnetGroupName).toBeDefined();
    expect(rds.Properties.VPCSecurityGroups).toBeDefined();
  });

  
  // --- S3 Buckets ---
  test("All S3 buckets should have encryption enabled", () => {
    const buckets = Object.values(template.Resources).filter(
      (r: any) => (r as Record<string, any>).Type === "AWS::S3::Bucket"
    ) as Record<string, any>[];
    for (const b of buckets) {
      expect(b.Properties.BucketEncryption).toBeDefined();
      expect(
        b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe("AES256");
    }
  });

  test("CloudTrailBucketPolicy should contain correct Service Principal", () => {
    const policy = template.Resources.CloudTrailBucketPolicy as Record<string, any>;
    const statements = policy.Properties.PolicyDocument.Statement;
    const aclStatement = statements.find((s: any) => s.Sid === "AWSCloudTrailAclCheck");
    const putStatement = statements.find((s: any) => s.Sid === "AWSCloudTrailWrite");
    expect(aclStatement.Principal.Service).toBe("cloudtrail.amazonaws.com");
    expect(putStatement.Principal.Service).toBe("cloudtrail.amazonaws.com");
  });

  test("CloudTrail should depend on CloudTrailBucketPolicy", () => {
    const trail = template.Resources.CloudTrail as Record<string, any>;
    expect(trail.DependsOn).toBe("CloudTrailBucketPolicy");
  });

  // --- CloudFront ---
  test("CloudFrontDistribution should forward minimal values and be enabled", () => {
    const cf = template.Resources.CloudFrontDistribution as Record<string, any>;
    expect(cf.Type).toBe("AWS::CloudFront::Distribution");
    expect(cf.Properties.DistributionConfig.Enabled).toBe(true);
    expect(cf.Properties.DistributionConfig.DefaultCacheBehavior.ForwardedValues.Cookies.Forward).toBe("none");
  });

  // --- Outputs ---
  test("Outputs should export key infrastructure details", () => {
    const outputs = template.Outputs as Record<string, any>;
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.ALBDNS).toBeDefined();
    expect(outputs.RDSAddress).toBeDefined();
    expect(outputs.AppBucket).toBeDefined();
    expect(outputs.CloudFrontURL).toBeDefined();
  });

  // --- Parameters & Conditions ---
  test("Condition HasKeyPair should be defined and logical", () => {
    expect(template.Conditions.HasKeyPair).toBeDefined();
    const expr = template.Conditions.HasKeyPair["Fn::Not"];
    expect(expr).toBeDefined();
  });

  test("DBPasswordParam should store a secure value", () => {
    const param = template.Resources.DBPasswordParam as Record<string, any>;
    expect(param.Type).toBe("AWS::SSM::Parameter");
    expect(param.Properties.Value).toContain("#");
    expect(param.Properties.Name).toBe("/TapStack/DBPassword");
  });

  test("CloudTrail should enable log file validation and multi-region logging", () => {
    const trail = template.Resources.CloudTrail as Record<string, any>;
    expect(trail.Properties.EnableLogFileValidation).toBe(true);
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
  });

  test("Every resource should have a defined Type property", () => {
    Object.values(template.Resources).forEach((res: any) => {
      const r = res as Record<string, any>;
      expect(r.Type).toBeDefined();
    });
  });
});
