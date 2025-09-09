import * as fs from "fs";
import * as path from "path";

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

describe("TapStack Unit Tests", () => {
  it("should be a valid CloudFormation template", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
    expect(template.Description).toMatch(/TapStack/);
  });

  // -------------------------------
  // Parameters
  // -------------------------------
  it("should define required Parameters with defaults", () => {
    const { SSHCidrBlock, LatestAmiId } = template.Parameters;
    expect(SSHCidrBlock.Type).toBe("String");
    expect(SSHCidrBlock.Default).toBe("203.0.113.0/24");
    expect(LatestAmiId.Type).toContain("AWS::SSM::Parameter::Value");
    expect(LatestAmiId.Default).toMatch(/amzn2-ami-hvm/);
  });

  // -------------------------------
  // VPC & Networking
  // -------------------------------
  it("should create a VPC with DNS support and hostnames enabled", () => {
    const vpc = template.Resources.MyAppVPC;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  it("should attach an Internet Gateway to the VPC", () => {
    const igwAttach = template.Resources.AttachGateway;
    expect(igwAttach.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    expect(igwAttach.Properties).toHaveProperty("VpcId");
    expect(igwAttach.Properties).toHaveProperty("InternetGatewayId");
  });

  it("should have a public route to 0.0.0.0/0", () => {
    const route = template.Resources.PublicRoute;
    expect(route.Type).toBe("AWS::EC2::Route");
    expect(route.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
  });

  it("should associate public subnets with the public route table", () => {
    expect(template.Resources.SubnetRouteTableAssociation1.Type).toBe(
      "AWS::EC2::SubnetRouteTableAssociation"
    );
    expect(template.Resources.SubnetRouteTableAssociation2.Type).toBe(
      "AWS::EC2::SubnetRouteTableAssociation"
    );
  });

  // -------------------------------
  // Security Groups
  // -------------------------------
  it("should restrict SSH to the provided CIDR block", () => {
    const sg = template.Resources.PublicSG;
    const sshRule = sg.Properties.SecurityGroupIngress.find(
      (r: any) => r.FromPort === 22
    );
    expect(sshRule.CidrIp).toEqual({ Ref: "SSHCidrBlock" });
  });

  it("should deny all public access in private SG (no ingress rules)", () => {
    const privateSg = template.Resources.PrivateSG;
    expect(privateSg.Properties.SecurityGroupIngress).toBeUndefined();
  });

  // -------------------------------
  // IAM
  // -------------------------------
  it("should configure EC2 role with assume-role for EC2", () => {
    const role = template.Resources.EC2Role;
    const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
    expect(statement.Principal.Service).toBe("ec2.amazonaws.com");
  });

  it("should ensure InstanceProfile includes the EC2 role", () => {
    const profile = template.Resources.EC2InstanceProfile;
    expect(profile.Type).toBe("AWS::IAM::InstanceProfile");
    expect(profile.Properties.Roles[0].Ref).toBe("EC2Role");
  });

  // -------------------------------
  // S3
  // -------------------------------
  it("should enforce log bucket naming convention", () => {
    const bucket = template.Resources.LogsBucket;
    expect(bucket.Properties.BucketName["Fn::Sub"]).toMatch(/^myapp-logs-/);
  });

  it("should enforce lifecycle expiration of 30 days", () => {
    const rules = template.Resources.LogsBucket.Properties.LifecycleConfiguration.Rules;
    expect(rules[0].ExpirationInDays).toBe(30);
  });

  // -------------------------------
  // Secrets Manager
  // -------------------------------
  it("should generate secret with username=admin", () => {
    const secret = template.Resources.RDSMasterSecret;
    expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toContain(
      "username"
    );
  });

  it("should exclude insecure characters from password", () => {
    const secret = template.Resources.RDSMasterSecret;
    expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toContain(
      "@"
    );
  });

  // -------------------------------
  // RDS
  // -------------------------------
  it("should configure RDS with KMS encryption", () => {
    const db = template.Resources.MyDB;
    expect(db.Properties.StorageEncrypted).toBe(true);
    expect(db.Properties.KmsKeyId).toBe("alias/aws/rds");
  });

  it("should attach RDS to private SG", () => {
    const db = template.Resources.MyDB;
    expect(db.Properties.VPCSecurityGroups[0].Ref).toBe("PrivateSG");
  });

  it("should configure RDS not publicly accessible", () => {
    const db = template.Resources.MyDB;
    expect(db.Properties.PubliclyAccessible).toBe(false);
  });

  // -------------------------------
  // Launch Template & ASG
  // -------------------------------
  it("should configure LaunchTemplate with detailed monitoring enabled", () => {
    const lt = template.Resources.LaunchTemplate;
    expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
  });

  it("should attach LaunchTemplate with dynamic AMI", () => {
    const lt = template.Resources.LaunchTemplate;
    expect(lt.Properties.LaunchTemplateData.ImageId.Ref).toBe("LatestAmiId");
  });

  it("should configure AutoScalingGroup with scaling limits", () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Properties.MinSize).toBe(2);
    expect(asg.Properties.MaxSize).toBe(6);
    expect(asg.Properties.DesiredCapacity).toBe(2);
  });

  it("should propagate tags at launch in AutoScalingGroup", () => {
    const asg = template.Resources.AutoScalingGroup;
    const envTag = asg.Properties.Tags.find((t: any) => t.Key === "Environment");
    expect(envTag.PropagateAtLaunch).toBe(true);
  });

  // -------------------------------
  // Outputs
  // -------------------------------
  it("should define outputs for networking", () => {
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty("VPCId");
    expect(outputs).toHaveProperty("PublicSubnet1Id");
    expect(outputs).toHaveProperty("PrivateSubnet1Id");
  });

  it("should define outputs for IAM", () => {
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty("EC2RoleName");
    expect(outputs).toHaveProperty("EC2RoleArn");
    expect(outputs).toHaveProperty("EC2InstanceProfileName");
  });

  it("should define outputs for RDS and Secrets", () => {
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty("RDSSecretName");
    expect(outputs).toHaveProperty("RDSInstanceEndpoint");
    expect(outputs).toHaveProperty("RDSInstancePort");
  });

  it("should define outputs for LaunchTemplate and ASG", () => {
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty("LaunchTemplateId");
    expect(outputs).toHaveProperty("AutoScalingGroupName");
  });

  // -------------------------------
  // Global best practice checks
  // -------------------------------
  it("all resources with tags should include Environment=Prod", () => {
    Object.entries(template.Resources).forEach(([_, resource]: any) => {
      if (resource.Properties && resource.Properties.Tags) {
        const tags = resource.Properties.Tags;
        const hasEnvTag = tags.some(
          (t: any) => t.Key === "Environment" && t.Value === "Prod"
        );
        expect(hasEnvTag).toBe(true);
      }
    });
  });

  it("all resources must have Type defined", () => {
    Object.values(template.Resources).forEach((res: any) => {
      expect(res).toHaveProperty("Type");
    });
  });

  it("all Outputs must have Description and Value", () => {
    Object.entries(template.Outputs).forEach(([_, out]: any) => {
      expect(out).toHaveProperty("Description");
      expect(out).toHaveProperty("Value");
    });
  });
});
