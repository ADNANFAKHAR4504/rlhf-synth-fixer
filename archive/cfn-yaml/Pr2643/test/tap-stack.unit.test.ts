import * as fs from "fs";
import * as path from "path";

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

describe("TapStack CloudFormation Template", () => {
  it("should have correct template format version", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  it("should have a meaningful description", () => {
    expect(template.Description).toContain("TapStack.yml");
  });

  describe("Parameters", () => {
    it("should define EnvironmentName with dev/staging/prod allowed values", () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.AllowedValues).toEqual(["dev", "staging", "prod"]);
    });

    it("should define VpcCIDR with default 10.0.0.0/16", () => {
      expect(template.Parameters.VpcCIDR.Default).toBe("10.0.0.0/16");
    });

    it("should define subnet CIDRs for public/private", () => {
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe("10.0.1.0/24");
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe("10.0.2.0/24");
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe("10.0.11.0/24");
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe("10.0.12.0/24");
    });

    it("should define InstanceType with default t3.micro", () => {
      expect(template.Parameters.InstanceType.Default).toBe("t3.micro");
    });

    it("should define KeyName as optional", () => {
      expect(template.Parameters.KeyName.Default).toBe("");
    });

    it("should define CertificateArn as optional", () => {
      expect(template.Parameters.CertificateArn.Default).toBe("");
    });

    it("should use SSM parameter for LatestAmiId", () => {
      expect(template.Parameters.LatestAmiId.Type).toContain("AWS::SSM::Parameter::Value");
    });
  });

  describe("Conditions", () => {
    it("should have HasKeyName condition", () => {
      expect(template.Conditions.HasKeyName).toBeDefined();
    });

    it("should have HasCertificate condition", () => {
      expect(template.Conditions.HasCertificate).toBeDefined();
    });
  });

  describe("Resources", () => {
    it("should define a VPC with DNS support enabled", () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe("AWS::EC2::VPC");
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    it("should define two public and two private subnets", () => {
      expect(template.Resources.PublicSubnet1.Type).toBe("AWS::EC2::Subnet");
      expect(template.Resources.PublicSubnet2.Type).toBe("AWS::EC2::Subnet");
      expect(template.Resources.PrivateSubnet1.Type).toBe("AWS::EC2::Subnet");
      expect(template.Resources.PrivateSubnet2.Type).toBe("AWS::EC2::Subnet");
    });

    it("should attach an Internet Gateway", () => {
      expect(template.Resources.InternetGateway.Type).toBe("AWS::EC2::InternetGateway");
      expect(template.Resources.AttachGateway.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    });

    it("should define NAT gateways in both AZs", () => {
      expect(template.Resources.NatGateway1.Type).toBe("AWS::EC2::NatGateway");
      expect(template.Resources.NatGateway2.Type).toBe("AWS::EC2::NatGateway");
    });

    it("should define route tables and associations", () => {
      expect(template.Resources.PublicRouteTable.Type).toBe("AWS::EC2::RouteTable");
      expect(template.Resources.PrivateRouteTable1.Type).toBe("AWS::EC2::RouteTable");
      expect(template.Resources.PrivateRouteTable2.Type).toBe("AWS::EC2::RouteTable");
    });

    it("should define security groups for ALB and EC2", () => {
      expect(template.Resources.LoadBalancerSG.Type).toBe("AWS::EC2::SecurityGroup");
      expect(template.Resources.InstanceSG.Type).toBe("AWS::EC2::SecurityGroup");
    });

    it("should define a Launch Template using LatestAmiId", () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
      expect(lt.Properties.LaunchTemplateData.ImageId.Ref).toBe("LatestAmiId");
    });

    it("should define AutoScalingGroup across private subnets", () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe("AWS::AutoScaling::AutoScalingGroup");
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(2);
    });

    it("should define an ALB with listeners", () => {
      expect(template.Resources.LoadBalancer.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");
      expect(template.Resources.ListenerHTTP.Type).toBe("AWS::ElasticLoadBalancingV2::Listener");
      expect(template.Resources.ListenerHTTPS.Type).toBe("AWS::ElasticLoadBalancingV2::Listener");
    });

    it("should define CloudWatch alarms for CPU high/low", () => {
      expect(template.Resources.CPUAlarmHigh.Type).toBe("AWS::CloudWatch::Alarm");
      expect(template.Resources.CPUAlarmLow.Type).toBe("AWS::CloudWatch::Alarm");
    });

    it("should define an S3 bucket for logs with versioning enabled", () => {
      const bucket = template.Resources.LogBucket;
      expect(bucket.Type).toBe("AWS::S3::Bucket");
      expect(bucket.Properties.VersioningConfiguration.Status).toBe("Enabled");
    });
  });

  describe("Outputs", () => {
    it("should output VPCId and Subnet IDs", () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
    });

    it("should output ALB DNS and ARN", () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerArn).toBeDefined();
    });

    it("should output AutoScalingGroupName and LaunchTemplateId", () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.LaunchTemplateId).toBeDefined();
    });

    it("should output LogBucket details", () => {
      expect(template.Outputs.LogBucketName).toBeDefined();
      expect(template.Outputs.LogBucketArn).toBeDefined();
    });

    it("should output CloudWatch Alarm names", () => {
      expect(template.Outputs.CPUAlarmHighName).toBeDefined();
      expect(template.Outputs.CPUAlarmLowName).toBeDefined();
    });
  });
});
