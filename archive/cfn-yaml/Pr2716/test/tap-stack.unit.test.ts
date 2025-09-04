import fs from "fs";
import path from "path";

describe("TapStack CloudFormation Template", () => {
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
    test("should define VpcCidrBlock and Environment", () => {
      expect(template.Parameters.VpcCidrBlock).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test("VpcCidrBlock should have correct properties", () => {
      const p = template.Parameters.VpcCidrBlock;
      expect(p.Type).toBe("String");
      expect(p.Default).toBe("10.0.0.0/16");
      expect(p.AllowedPattern).toBeDefined();
      expect(p.ConstraintDescription).toBeDefined();
    });

    test("Environment should have correct properties", () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe("String");
      expect(p.Default).toBe("production");
      expect(p.AllowedValues).toEqual(["production", "staging", "development"]);
      expect(p.Description).toBeDefined();
    });
  });

  describe("Resources", () => {
    test("should create VPC with dynamic CIDR and DNS enabled", () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe("AWS::EC2::VPC");
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: "VpcCidrBlock" });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-vpc" },
      });
      expect(vpc.Properties.Tags).toContainEqual({
        Key: "Environment",
        Value: { Ref: "Environment" },
      });
    });

    test("should create 4 subnets (2 public, 2 private)", () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBe(4);

      const publicSubnets = subnets.filter((s: any) => s.Properties.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter((s: any) => !s.Properties.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);

      subnets.forEach((subnet: any) => {
        expect(subnet.Properties.VpcId).toEqual({ Ref: "VPC" });
        expect(subnet.Properties.AvailabilityZone).toMatchObject({
          "Fn::Select": [expect.any(Number), { "Fn::GetAZs": "" }],
        });
        expect(subnet.Properties.CidrBlock).toMatchObject({
          "Fn::Select": [expect.any(Number), { "Fn::Cidr": [{ Ref: "VpcCidrBlock" }, 4, 8] }],
        });
        expect(subnet.Properties.Tags).toContainEqual({
          Key: "Environment",
          Value: { Ref: "Environment" },
        });
        expect(subnet.Properties.Tags).toContainEqual({
          Key: "Name",
          Value: { "Fn::Sub": expect.stringContaining("${Environment}-") },
        });
      });
    });

    test("should define InternetGateway and NAT Gateway", () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe("AWS::EC2::InternetGateway");
      expect(igw.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-igw" },
      });

      const eip = template.Resources.NatGatewayEIP;
      expect(eip.Type).toBe("AWS::EC2::EIP");
      expect(eip.DependsOn).toContain("InternetGatewayAttachment");
      expect(eip.Properties.Domain).toBe("vpc");

      const nat = template.Resources.NatGateway;
      expect(nat.Type).toBe("AWS::EC2::NatGateway");
      expect(nat.DependsOn).toContain("InternetGatewayAttachment");
      expect(nat.Properties.AllocationId).toEqual({
        "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"],
      });
      expect(nat.Properties.SubnetId).toEqual({ Ref: "PublicSubnet1" });
      expect(nat.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-nat-gateway" },
      });
    });

    test("should define InternetGatewayAttachment", () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment.Type).toBe("AWS::EC2::VPCGatewayAttachment");
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: "InternetGateway" });
      expect(attachment.Properties.VpcId).toEqual({ Ref: "VPC" });
    });

    test("should define Public and Private RouteTables with routes", () => {
      const rtPublic = template.Resources.PublicRouteTable;
      expect(rtPublic.Type).toBe("AWS::EC2::RouteTable");
      expect(rtPublic.Properties.VpcId).toEqual({ Ref: "VPC" });
      expect(rtPublic.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-public-rt" },
      });

      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute.Type).toBe("AWS::EC2::Route");
      expect(publicRoute.DependsOn).toContain("InternetGatewayAttachment");
      expect(publicRoute.Properties.RouteTableId).toEqual({ Ref: "PublicRouteTable" });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: "InternetGateway" });

      const rtPrivate = template.Resources.PrivateRouteTable;
      expect(rtPrivate.Type).toBe("AWS::EC2::RouteTable");
      expect(rtPrivate.Properties.VpcId).toEqual({ Ref: "VPC" });
      expect(rtPrivate.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-private-rt" },
      });

      const privateRoute = template.Resources.DefaultPrivateRoute;
      expect(privateRoute.Type).toBe("AWS::EC2::Route");
      expect(privateRoute.Properties.RouteTableId).toEqual({ Ref: "PrivateRouteTable" });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: "NatGateway" });
    });

    test("should define RouteTableAssociations for all subnets", () => {
      const associations = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::SubnetRouteTableAssociation"
      );
      expect(associations.length).toBe(4);

      const publicAssociations = associations.filter((a: any) =>
        ["PublicSubnet1", "PublicSubnet2"].includes(a.Properties.SubnetId.Ref)
      );
      const privateAssociations = associations.filter((a: any) =>
        ["PrivateSubnet1", "PrivateSubnet2"].includes(a.Properties.SubnetId.Ref)
      );
      expect(publicAssociations.length).toBe(2);
      expect(privateAssociations.length).toBe(2);

      publicAssociations.forEach((assoc: any) => {
        expect(assoc.Properties.RouteTableId).toEqual({ Ref: "PublicRouteTable" });
      });
      privateAssociations.forEach((assoc: any) => {
        expect(assoc.Properties.RouteTableId).toEqual({ Ref: "PrivateRouteTable" });
      });
    });

    test("should define WebSecurityGroup allowing SSH and HTTP", () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg.Type).toBe("AWS::EC2::SecurityGroup");
      expect(sg.Properties.GroupDescription).toBe("Security group allowing SSH and HTTP access");
      expect(sg.Properties.VpcId).toEqual({ Ref: "VPC" });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: "tcp",
        FromPort: 22,
        ToPort: 22,
        CidrIp: "0.0.0.0/0",
        Description: "SSH access",
      });
      expect(sg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: "tcp",
        FromPort: 80,
        ToPort: 80,
        CidrIp: "0.0.0.0/0",
        Description: "HTTP access",
      });
      expect(sg.Properties.SecurityGroupEgress).toContainEqual({
        IpProtocol: -1,
        CidrIp: "0.0.0.0/0",
        Description: "All outbound traffic",
      });
      expect(sg.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-web-sg" },
      });
    });

    test("should define IAM Role with S3 access and InstanceProfile", () => {
      const role = template.Resources.EC2S3Role;
      expect(role.Type).toBe("AWS::IAM::Role");
      expect(role.Properties.AssumeRolePolicyDocument).toMatchObject({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      });
      expect(role.Properties.ManagedPolicyArns).toContain("arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess");
      expect(role.Properties.Tags).toContainEqual({
        Key: "Name",
        Value: { "Fn::Sub": "${Environment}-ec2-s3-role" },
      });

      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe("AWS::IAM::InstanceProfile");
      expect(profile.Properties.Roles).toContainEqual({ Ref: "EC2S3Role" });
      expect(profile.Properties.Tags).toBeUndefined();
    });

    test("all taggable resources should include Environment tag", () => {
      Object.values(template.Resources)
        .filter((r: any) => r.Properties?.Tags)
        .forEach((res: any) => {
          expect(res.Properties.Tags).toContainEqual({
            Key: "Environment",
            Value: { Ref: "Environment" },
          });
        });
    });
  });

  describe("Outputs", () => {
    test("should define all key outputs", () => {
      const expected = [
        "VPCId",
        "PublicSubnet1Id",
        "PublicSubnet2Id",
        "PrivateSubnet1Id",
        "PrivateSubnet2Id",
        "WebSecurityGroupId",
        "EC2InstanceProfileArn",
        "NatGatewayId",
        "InternetGatewayId",
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });

    test("outputs should have correct values", () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: "VPC" });
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({ Ref: "PublicSubnet1" });
      expect(template.Outputs.PublicSubnet2Id.Value).toEqual({ Ref: "PublicSubnet2" });
      expect(template.Outputs.PrivateSubnet1Id.Value).toEqual({ Ref: "PrivateSubnet1" });
      expect(template.Outputs.PrivateSubnet2Id.Value).toEqual({ Ref: "PrivateSubnet2" });
      expect(template.Outputs.WebSecurityGroupId.Value).toEqual({ Ref: "WebSecurityGroup" });
      expect(template.Outputs.EC2InstanceProfileArn.Value).toEqual({
        "Fn::GetAtt": ["EC2InstanceProfile", "Arn"],
      });
      expect(template.Outputs.NatGatewayId.Value).toEqual({ Ref: "NatGateway" });
      expect(template.Outputs.InternetGatewayId.Value).toEqual({ Ref: "InternetGateway" });
    });

    test("export names should follow naming convention", () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedSuffix = outputKey === "EC2InstanceProfileArn" ? "-ARN" : "-ID";
        expect(output.Export.Name).toEqual({
          "Fn::Sub": `\${Environment}-${outputKey.replace(/Id$|Arn$/, expectedSuffix)}`,
        });
      });
    });
  });

  describe("Template Validation", () => {
    test("should have valid JSON structure", () => {
      expect(() => JSON.parse(fs.readFileSync(path.join(__dirname, "../lib/TapStack.json"), "utf8"))).not.toThrow();
    });

    test("should not have undefined or null required sections", () => {
      expect(template.AWSTemplateFormatVersion).not.toBeUndefined();
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeUndefined();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeUndefined();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeUndefined();
      expect(template.Outputs).not.toBeNull();
    });

    test("should have correct number of resources and parameters", () => {
      expect(Object.keys(template.Resources).length).toBe(20);
      expect(Object.keys(template.Parameters).length).toBe(2);
      expect(Object.keys(template.Outputs).length).toBe(9);
    });
  });

  describe("Resource Naming Convention", () => {
    test("taggable resources should have Name tag with Environment", () => {
      Object.values(template.Resources)
        .filter((r: any) => r.Properties?.Tags)
        .forEach((res: any) => {
          const nameTag = res.Properties.Tags.find((tag: any) => tag.Key === "Name");
          expect(nameTag.Value).toEqual({ "Fn::Sub": expect.stringContaining("${Environment}") });
        });
    });
  });
});