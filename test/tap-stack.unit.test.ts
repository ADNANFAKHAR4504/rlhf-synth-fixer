import * as fs from "fs";

const template = JSON.parse(
  fs.readFileSync(__dirname + "/../lib/TapStack.json", "utf8")
);

describe("TapStack CloudFormation Template", () => {
  // -------------------------
  // PARAMETERS
  // -------------------------
  it("should define required parameters with correct defaults", () => {
    const params = template.Parameters;
    expect(params.EnvironmentName.Default).toBe("tapstack");
    expect(params.VpcCIDR.Default).toBe("10.0.0.0/16");
    expect(params.PublicSubnet1CIDR.Default).toBe("10.0.1.0/24");
    expect(params.PublicSubnet2CIDR.Default).toBe("10.0.2.0/24");
    expect(params.PrivateSubnet1CIDR.Default).toBe("10.0.3.0/24");
    expect(params.PrivateSubnet2CIDR.Default).toBe("10.0.4.0/24");
    expect(params.InstanceType.Default).toBe("t2.micro");
    expect(params.AllowedSSHRange.Default).toBe("203.0.113.0/24");
    expect(params.LatestAmiId.Default).toContain(
      "/aws/service/ami-amazon-linux-latest/"
    );
  });

  // -------------------------
  // VPC + SUBNETS
  // -------------------------
  it("should create a VPC with DNS support and correct CIDR", () => {
    const vpc = template.Resources.VPC;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.CidrBlock.Ref).toBe("VpcCIDR");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  it("should create 2 public and 2 private subnets with correct CIDRs", () => {
    const r = template.Resources;
    expect(r.PublicSubnet1.Type).toBe("AWS::EC2::Subnet");
    expect(r.PublicSubnet1.Properties.CidrBlock.Ref).toBe("PublicSubnet1CIDR");
    expect(r.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

    expect(r.PublicSubnet2.Type).toBe("AWS::EC2::Subnet");
    expect(r.PublicSubnet2.Properties.CidrBlock.Ref).toBe("PublicSubnet2CIDR");

    expect(r.PrivateSubnet1.Type).toBe("AWS::EC2::Subnet");
    expect(r.PrivateSubnet1.Properties.CidrBlock.Ref).toBe("PrivateSubnet1CIDR");
    expect(r.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);

    expect(r.PrivateSubnet2.Type).toBe("AWS::EC2::Subnet");
    expect(r.PrivateSubnet2.Properties.CidrBlock.Ref).toBe("PrivateSubnet2CIDR");
    expect(r.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  // -------------------------
  // ROUTING
  // -------------------------
  it("should create InternetGateway, NAT Gateway and proper routes", () => {
    const r = template.Resources;
    expect(r.InternetGateway.Type).toBe("AWS::EC2::InternetGateway");
    expect(r.NatGateway.Type).toBe("AWS::EC2::NatGateway");
    expect(r.NatEIP.Type).toBe("AWS::EC2::EIP");

    // Route checks
    expect(r.PublicRoute.Type).toBe("AWS::EC2::Route");
    expect(r.PublicRoute.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(r.PrivateRoute.Properties.NatGatewayId.Ref).toBe("NatGateway");
  });

  // -------------------------
  // SECURITY GROUPS
  // -------------------------
  it("should restrict SSH to AllowedSSHRange", () => {
    const sg = template.Resources.InstanceSG;
    expect(sg.Type).toBe("AWS::EC2::SecurityGroup");
    const ingress = sg.Properties.SecurityGroupIngress[0];
    expect(ingress.IpProtocol).toBe("tcp");
    expect(ingress.FromPort).toBe(22);
    expect(ingress.CidrIp.Ref).toBe("AllowedSSHRange");
  });

  // -------------------------
  // IAM + INSTANCE PROFILE
  // -------------------------
  it("should attach IAM role with S3 access policy", () => {
    const role = template.Resources.EC2Role;
    expect(role.Type).toBe("AWS::IAM::Role");
    const stmt = role.Properties.Policies[0].PolicyDocument.Statement[0];
    expect(stmt.Action).toEqual(["s3:GetObject", "s3:PutObject"]);
    expect(stmt.Resource["Fn::Sub"]).toContain("${AppDataBucket}/*");
  });

  it("should create InstanceProfile referencing EC2Role", () => {
    const profile = template.Resources.InstanceProfile;
    expect(profile.Type).toBe("AWS::IAM::InstanceProfile");
    expect(profile.Properties.Roles[0].Ref).toBe("EC2Role");
  });

  // -------------------------
  // S3 BUCKET
  // -------------------------
  it("should enforce encryption and versioning on S3 bucket", () => {
    const bucket = template.Resources.AppDataBucket;
    expect(bucket.Type).toBe("AWS::S3::Bucket");
    expect(bucket.Properties.BucketEncryption).toBeDefined();
    expect(bucket.Properties.VersioningConfiguration.Status).toBe("Enabled");
  });

  // -------------------------
  // LAUNCH TEMPLATE + ASG
  // -------------------------
  it("should define LaunchTemplate with AMI, InstanceType, SG and Profile", () => {
    const lt = template.Resources.LaunchTemplate;
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
    const data = lt.Properties.LaunchTemplateData;
    expect(data.ImageId.Ref).toBe("LatestAmiId");
    expect(data.InstanceType.Ref).toBe("InstanceType");
    expect(data.IamInstanceProfile.Arn["Fn::GetAtt"][0]).toBe("InstanceProfile");
    expect(data.SecurityGroupIds[0].Ref).toBe("InstanceSG");
  });

  it("should configure ASG across both private subnets with scaling", () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Type).toBe("AWS::AutoScaling::AutoScalingGroup");
    expect(asg.Properties.VPCZoneIdentifier[0].Ref).toBe("PrivateSubnet1");
    expect(asg.Properties.VPCZoneIdentifier[1].Ref).toBe("PrivateSubnet2");
    expect(asg.Properties.MinSize).toBe(1);
    expect(asg.Properties.MaxSize).toBe(4);
    expect(asg.Properties.DesiredCapacity).toBe(2);
  });

  // -------------------------
  // CLOUDWATCH
  // -------------------------
  it("should configure CloudWatch alarms for CPU utilization", () => {
    const high = template.Resources.CPUAlarmHigh;
    expect(high.Properties.Threshold).toBe(70);
    expect(high.Properties.MetricName).toBe("CPUUtilization");

    const low = template.Resources.CPUAlarmLow;
    expect(low.Properties.Threshold).toBe(20);
    expect(low.Properties.MetricName).toBe("CPUUtilization");
  });

  // -------------------------
  // OUTPUTS
  // -------------------------
  it("should define key outputs including VPC, Subnets, SG, ASG, Bucket", () => {
    const outputs = template.Outputs;
    expect(outputs.VpcId.Value.Ref).toBe("VPC");
    expect(outputs.PublicSubnet1Id.Value.Ref).toBe("PublicSubnet1");
    expect(outputs.PrivateSubnet2Id.Value.Ref).toBe("PrivateSubnet2");
    expect(outputs.InstanceSecurityGroupId.Value.Ref).toBe("InstanceSG");
    expect(outputs.BucketName.Value.Ref).toBe("AppDataBucket");
    expect(outputs.AutoScalingGroupName.Value.Ref).toBe("AutoScalingGroup");
  });
});
