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
    test("should define Environment and InstanceType", () => {
      const params = ["Environment", "InstanceType"];
      params.forEach(param => expect(template.Parameters[param]).toBeDefined());
    });

    test("InstanceType should allow t3.micro", () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe("String");
      expect(p.AllowedValues).toContain("t3.micro");
    });
  });

  describe("Resources", () => {
    test("should create VPC with CIDR 10.0.0.0/16", () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe("AWS::EC2::VPC");
      expect(vpc.Properties.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should create 4 subnets (2 public, 2 private)", () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBe(4);
    });

    test("should define InternetGateway and NAT Gateway", () => {
      expect(template.Resources.InternetGateway.Type).toBe("AWS::EC2::InternetGateway");
      expect(template.Resources.NatGateway.Type).toBe("AWS::EC2::NatGateway");
    });

    test("should define Public and Private RouteTables with routes", () => {
      const rtPublic = template.Resources.PublicRouteTable;
      const rtPrivate = template.Resources.PrivateRouteTable;
      expect(rtPublic.Type).toBe("AWS::EC2::RouteTable");
      expect(rtPrivate.Type).toBe("AWS::EC2::RouteTable");

      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Type).toBe("AWS::EC2::Route");
      expect(publicRoute.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");

      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Type).toBe("AWS::EC2::Route");
      expect(privateRoute.Properties.NatGatewayId).toBeDefined();
    });

    test("should define ALB, EC2, and RDS Security Groups", () => {
      const sgALB = template.Resources.ALBSecurityGroup;
      const sgEC2 = template.Resources.EC2SecurityGroup;
      const sgRDS = template.Resources.RDSSecurityGroup;

      expect(sgALB.Type).toBe("AWS::EC2::SecurityGroup");
      expect(sgEC2.Type).toBe("AWS::EC2::SecurityGroup");
      expect(sgRDS.Type).toBe("AWS::EC2::SecurityGroup");

      expect(sgALB.Properties.SecurityGroupIngress[0]).toMatchObject({
        FromPort: 443,
        ToPort: 443,
        CidrIp: "0.0.0.0/0",
      });
      expect(sgEC2.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toBeDefined();
      expect(sgRDS.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });

    test("should define IAM Role and InstanceProfile", () => {
      const role = template.Resources.EC2InstanceRole;
      const profile = template.Resources.EC2InstanceProfile;
      expect(role).toBeDefined();
      expect(profile).toBeDefined();
      expect(profile.Properties.Roles).toContainEqual({Ref: "EC2InstanceRole"});
    });

    test("should define LambdaExecutionRole with basic execution policy", () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe("AWS::IAM::Role");
      expect(role.Properties.ManagedPolicyArns).toContain(
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      );
    });

    test("should create an encrypted S3 bucket with public access blocked", () => {
      const bucket = template.Resources.SecureLogsBucket;
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

    test("should create one EC2 instance with IAM profile", () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2).toBeDefined();
      expect(ec2.Type).toBe("AWS::EC2::Instance");
      expect(ec2.Properties.IamInstanceProfile).toBeDefined();
    });

    test("should create an Application Load Balancer, TargetGroup, and Listener", () => {
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");
      expect(template.Resources.ALBTargetGroup.Type).toBe("AWS::ElasticLoadBalancingV2::TargetGroup");
      expect(template.Resources.ALBListener.Type).toBe("AWS::ElasticLoadBalancingV2::Listener");
    });

    test("should define RDS Instance with SecretsManager", () => {
      const secret = template.Resources.RDSMasterSecret;
      const rds = template.Resources.RDSInstance;
      const subnetGroup = template.Resources.RDSSubnetGroup;

      expect(secret.Type).toBe("AWS::SecretsManager::Secret");
      expect(rds.Type).toBe("AWS::RDS::DBInstance");
      expect(rds.DeletionPolicy).toBe("Snapshot");
      expect(rds.UpdateReplacePolicy).toBe("Snapshot");
      expect(subnetGroup.Type).toBe("AWS::RDS::DBSubnetGroup");
    });
  });

  describe("Outputs", () => {
    test("should define all key outputs", () => {
      const expected = ["VpcId", "ALBEndpoint", "S3Bucket", "RDSInstanceEndpoint"];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
  });
});
