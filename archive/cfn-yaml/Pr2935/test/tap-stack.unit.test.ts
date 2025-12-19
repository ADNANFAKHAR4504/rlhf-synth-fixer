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

    test("should include Description, Parameters, Mappings, Resources, and Outputs", () => {
      expect(typeof template.Description).toBe("string");
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
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
      const vpc = template.Resources.SecureEnvVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe("AWS::EC2::VPC");
      expect(vpc.Properties.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should create InternetGateway and attach it", () => {
      const igw = template.Resources.SecureEnvInternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe("AWS::EC2::InternetGateway");

      const attachment = template.Resources.SecureEnvVPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    });

    test("should define 2 public and 2 private subnets", () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === "AWS::EC2::Subnet"
      );
      expect(subnets.length).toBe(4);
    });

    test("should define NAT Gateways with EIPs", () => {
      expect(template.Resources.SecureEnvNATGateway1).toBeDefined();
      expect(template.Resources.SecureEnvNATGateway1.Type).toBe("AWS::EC2::NatGateway");
      expect(template.Resources.SecureEnvNATGateway2).toBeDefined();
      expect(template.Resources.SecureEnvNATGateway2.Type).toBe("AWS::EC2::NatGateway");
      expect(template.Resources.SecureEnvNATGateway1EIP).toBeDefined();
      expect(template.Resources.SecureEnvNATGateway2EIP).toBeDefined();
    });

    test("should define Public and Private RouteTable associations", () => {
      expect(template.Resources.SecureEnvPublicSubnet1RouteTableAssociation.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
      expect(template.Resources.SecureEnvPublicSubnet2RouteTableAssociation.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
      expect(template.Resources.SecureEnvPrivateSubnet1RouteTableAssociation.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
      expect(template.Resources.SecureEnvPrivateSubnet2RouteTableAssociation.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
    });

    test("should define WebServerSecurityGroup allowing SSH, HTTP, and HTTPS", () => {
      const sg = template.Resources.SecureEnvWebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe("AWS::EC2::SecurityGroup");

      const ports = sg.Properties.SecurityGroupIngress.map((r: any) => r.FromPort);
      expect(ports).toEqual(expect.arrayContaining([22, 80, 443]));
    });

    test("should define ALBSecurityGroup allowing HTTP and HTTPS", () => {
      const sg = template.Resources.SecureEnvALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe("AWS::EC2::SecurityGroup");

      const ports = sg.Properties.SecurityGroupIngress.map((r: any) => r.FromPort);
      expect(ports).toEqual(expect.arrayContaining([80, 443]));
    });

    test("should define two EC2 instances with IAM profile", () => {
      const ec2_1 = template.Resources.SecureEnvWebServer1;
      expect(ec2_1).toBeDefined();
      expect(ec2_1.Type).toBe("AWS::EC2::Instance");
      expect(ec2_1.Properties.IamInstanceProfile).toBeDefined();

      const ec2_2 = template.Resources.SecureEnvWebServer2;
      expect(ec2_2).toBeDefined();
      expect(ec2_2.Type).toBe("AWS::EC2::Instance");
      expect(ec2_2.Properties.IamInstanceProfile).toBeDefined();
    });

    test("should define EC2Role and EC2InstanceProfile", () => {
      const role = template.Resources.SecureEnvEC2Role;
      const profile = template.Resources.SecureEnvEC2InstanceProfile;
      expect(role).toBeDefined();
      expect(profile).toBeDefined();
      expect(profile.Properties.Roles).toContainEqual({ Ref: "SecureEnvEC2Role" });
    });

    test("should define S3 buckets with encryption and blocked public access", () => {
      const buckets = [
        "SecureEnvCloudTrailBucket",
        "SecureEnvApplicationBucket",
        "SecureEnvAccessLogsBucket",
        "SecureEnvConfigBucket"
      ];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        expect(resource).toBeDefined();
        expect(resource.Type).toBe("AWS::S3::Bucket");
        expect(resource.Properties.BucketEncryption).toBeDefined();
        expect(resource.Properties.PublicAccessBlockConfiguration).toMatchObject({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
      });
    });

    test("should define Database (RDS) with 7-day backup retention and encryption", () => {
      const rds = template.Resources.SecureEnvDatabase;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe("AWS::RDS::DBInstance");
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.DeletionPolicy).toBe("Delete");
      expect(rds.UpdateReplacePolicy).toBe("Delete");
    });

    test("should define DynamoDB table with server-side encryption", () => {
      const table = template.Resources.SecureEnvDynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe("AWS::DynamoDB::Table");
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test("should define Lambda function with VPC configuration", () => {
      const lambda = template.Resources.SecureEnvLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe("AWS::Lambda::Function");
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toContainEqual({ Ref: "SecureEnvWebServerSecurityGroup" });
    });

    test("should define CloudTrail with logging enabled", () => {
      const trail = template.Resources.SecureEnvCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe("AWS::CloudTrail::Trail");
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test("should define UnauthorizedAlarm CloudWatch Alarm", () => {
      const alarm = template.Resources.SecureEnvUnauthorizedAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");
      expect(alarm.Properties.MetricName).toBe("UnauthorizedAPICalls");
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test("should define Application Load Balancer with access logs", () => {
      const alb = template.Resources.SecureEnvApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");
      expect(alb.Properties.LoadBalancerAttributes).toContainEqual({
        Key: "access_logs.s3.enabled",
        Value: "true"
      });
    });
  });

  describe("Outputs", () => {
    test("should define expected outputs", () => {
      const expected = [
        "SecureEnvVPCId",
        "SecureEnvPublicSubnet1Id",
        "SecureEnvPublicSubnet2Id",
        "SecureEnvPrivateSubnet1Id",
        "SecureEnvPrivateSubnet2Id",
        "SecureEnvLoadBalancerDNS",
        "SecureEnvDatabaseEndpoint",
        "SecureEnvDynamoDBTableName",
        "SecureEnvCloudTrailArn"
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
  });
});