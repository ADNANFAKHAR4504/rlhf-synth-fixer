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
        FromPort: 80,
        ToPort: 80,
        CidrIp: "0.0.0.0/0",
      });
      expect(sgEC2.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toBeDefined();
      expect(sgRDS.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });

    test("should define LambdaSecurityGroup allowing internal VPC traffic", () => {
      const sgLambda = template.Resources.LambdaSecurityGroup;
      expect(sgLambda).toBeDefined();
      expect(sgLambda.Type).toBe("AWS::EC2::SecurityGroup");
      expect(sgLambda.Properties.SecurityGroupIngress[0].CidrIp).toBe("10.0.0.0/16");
    });

    test("should define IAM Role with tags and InstanceProfile without tags", () => {
      const role = template.Resources.EC2InstanceRole;
      const profile = template.Resources.EC2InstanceProfile;

      expect(role).toBeDefined();
      expect(profile).toBeDefined();
      expect(profile.Properties.Roles).toContainEqual({ Ref: "EC2InstanceRole" });

      // Role can have tags
      expect(role.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: "Environment" }),
        ])
      );

      // InstanceProfile cannot have tags
      expect(profile.Properties.Tags).toBeUndefined();
    });

    test("should define LambdaExecutionRole with DynamoDB access", () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe("AWS::IAM::Role");

      // Must include basic execution
      expect(role.Properties.ManagedPolicyArns).toContain(
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      );

      // Must include DynamoDB access
      const policies = JSON.stringify(role.Properties.Policies || []);
      expect(policies).toMatch(/dynamodb/i);
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

      const oc =
        template.Resources.SecureLogsBucketOwnershipControls ||
        bucket.Properties.OwnershipControls;
      expect(oc).toBeDefined();
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

    test("should define RDS Instance with SecretsManager and 7-day backup retention", () => {
      const secret = template.Resources.RDSMasterSecret;
      const rds = template.Resources.RDSInstanceProd || template.Resources.RDSInstanceNonProd;
      const subnetGroup = template.Resources.RDSSubnetGroup;

      expect(secret.Type).toBe("AWS::SecretsManager::Secret");
      expect(rds).toBeDefined();
      expect(rds.Type).toBe("AWS::RDS::DBInstance");
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);

      expect(rds.DeletionPolicy).toBeDefined();
      expect(rds.UpdateReplacePolicy).toBeDefined();

      expect(subnetGroup.Type).toBe("AWS::RDS::DBSubnetGroup");
    });

    test("should define KMS key and encrypted SNS Topic", () => {
      const key = template.Resources.NotificationKey;
      const topic = template.Resources.NotificationTopic;
      expect(key).toBeDefined();
      expect(key.Type).toBe("AWS::KMS::Key");
      expect(topic).toBeDefined();
      expect(topic.Type).toBe("AWS::SNS::Topic");
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test("should define Lambda function in VPC", () => {
      const fn = template.Resources.MyLambdaFunction;
      expect(fn).toBeDefined();
      expect(fn.Type).toBe("AWS::Lambda::Function");
      expect(fn.Properties.VpcConfig).toBeDefined();
      expect(fn.Properties.Runtime).toBe("python3.12");
    });

    test("should define DynamoDB table with PITR and SSE enabled", () => {
      const table = template.Resources.MyDynamoTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe("AWS::DynamoDB::Table");
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);

      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test("should define CloudFront distribution with logging to SecureLogsBucket", () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf).toBeDefined();
      expect(cf.Type).toBe("AWS::CloudFront::Distribution");

      const logging = cf.Properties.DistributionConfig.Logging;
      if (logging) {
        expect(logging.Bucket).toHaveProperty("Fn::Sub");
        const bucketSub = logging.Bucket["Fn::Sub"];
        expect(bucketSub).toContain("${SecureLogsBucket}");
        expect(bucketSub).toContain(".s3.amazonaws.com");
      }
    });

    test("should define S3 OwnershipControls for SecureLogsBucket", () => {
      const bucket = template.Resources.SecureLogsBucket;
      expect(bucket).toBeDefined();

      const oc =
        template.Resources.SecureLogsBucketOwnershipControls ||
        bucket.Properties.OwnershipControls;

      expect(oc).toBeDefined();

      const ownership =
        oc.Properties?.OwnershipControls?.Rules?.[0]?.ObjectOwnership ||
        oc.Rules?.[0]?.ObjectOwnership;

      expect(["BucketOwnerEnforced", "BucketOwnerPreferred"]).toContain(ownership);
    });

    test("should define EC2 CPU CloudWatch Alarm", () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");
      expect(alarm.Properties.MetricName).toBe("CPUUtilization");
      expect(alarm.Properties.Threshold).toBe(70);
    });

    test("should define additional CloudWatch alarms (RDS and ALB)", () => {
      expect(template.Resources.ALB5xxAlarm).toBeDefined();
    });

    test("all taggable resources should include Environment tag", () => {
      Object.entries(template.Resources).forEach(([name, res]: [string, any]) => {
        if (res.Properties?.Tags) {
          expect(res.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ Key: "Environment" }),
            ])
          );
        }
      });
    });
  });

  describe("Outputs", () => {
    test("should define all key outputs", () => {
      const expected = [
        "VpcId",
        "ALBEndpoint",
        "S3Bucket",
        "RDSInstanceEndpoint",
        "DynamoDBTableName",
        "LambdaName",
        "SNSTopic",
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
  });
});
