import fs from "fs";
import path from "path";

describe("TapStack CloudFormation Template", () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, "../lib/TapStack.json");
    const templateContent = fs.readFileSync(templatePath, "utf8");
    template = JSON.parse(templateContent);
  });

  // ----------------------------
  // Template Metadata
  // ----------------------------
  test("should have a valid CloudFormation format version", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  test("should have a description", () => {
    expect(template.Description).toMatch(/TapStack - Highly Available, Secure, and Scalable Web Application Stack/);
  });

  // ----------------------------
  // Parameters
  // ----------------------------
  test("should define required parameters", () => {
    const params = template.Parameters;
    expect(params.DomainName).toBeDefined();
    expect(params.HostedZoneId).toBeDefined();
    expect(params.CertificateArn).toBeDefined();
    expect(params.InstanceType).toBeDefined();
    expect(params.KeyPairName).toBeDefined();
    expect(params.LatestAmiId).toBeDefined();
  });

  test("InstanceType parameter should have correct allowed values", () => {
    const param = template.Parameters.InstanceType;
    expect(param.AllowedValues).toEqual(["t3.micro", "t3.small", "t3.medium", "t3.large"]);
    expect(param.Default).toBe("t3.micro");
  });

  // ----------------------------
  // Conditions
  // ----------------------------
  test("should define conditions for optional resources", () => {
    expect(template.Conditions.HasKeyPair).toBeDefined();
    expect(template.Conditions.HasDomain).toBeDefined();
    expect(template.Conditions.HasCertificate).toBeDefined();
  });

  // ----------------------------
  // VPC & Networking
  // ----------------------------
  test("should have a VPC with DNS support and hostnames", () => {
    const vpc = template.Resources.VPC;
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  test("should define 2 public and 2 private subnets", () => {
    expect(template.Resources.PublicSubnet1).toBeDefined();
    expect(template.Resources.PublicSubnet2).toBeDefined();
    expect(template.Resources.PrivateSubnet1).toBeDefined();
    expect(template.Resources.PrivateSubnet2).toBeDefined();
  });

  test("should attach InternetGateway to VPC", () => {
    const attach = template.Resources.AttachGateway;
    expect(attach.Type).toBe("AWS::EC2::VPCGatewayAttachment");
  });

  // ----------------------------
  // S3 Buckets
  // ----------------------------
  test("StaticAssetsBucket should have encryption and versioning enabled", () => {
    const bucket = template.Resources.StaticAssetsBucket;
    expect(bucket.Type).toBe("AWS::S3::Bucket");
    expect(bucket.Properties.BucketEncryption).toBeDefined();
    expect(bucket.Properties.VersioningConfiguration.Status).toBe("Enabled");
  });

  test("CloudFrontLogBucket should block public access and have ownership controls", () => {
    const bucket = template.Resources.CloudFrontLogBucket;
    expect(bucket.Type).toBe("AWS::S3::Bucket");
    expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe("ObjectWriter");
  });

  test("CloudFrontLogBucketPolicy should allow CloudFront service to write logs", () => {
    const policy = template.Resources.CloudFrontLogBucketPolicy;
    const statement = policy.Properties.PolicyDocument.Statement[0];
    expect(statement.Principal.Service).toBe("cloudfront.amazonaws.com");
    expect(statement.Action).toBe("s3:PutObject");
  });

  // ----------------------------
  // CloudFront
  // ----------------------------
  test("CloudFrontDistribution should be configured with default cache behavior", () => {
    const dist = template.Resources.CloudFrontDistribution;
    expect(dist.Type).toBe("AWS::CloudFront::Distribution");
    expect(dist.Properties.DistributionConfig.Enabled).toBe(true);
    expect(dist.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe("redirect-to-https");
  });

  // ----------------------------
  // DynamoDB
  // ----------------------------
  test("AppDataTable should be a DynamoDB table with PITR enabled", () => {
    const table = template.Resources.AppDataTable;
    expect(table.Type).toBe("AWS::DynamoDB::Table");
    expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
  });

  // ----------------------------
  // IAM
  // ----------------------------
  test("EC2Role should allow DynamoDB access with least privilege", () => {
    const role = template.Resources.EC2Role;
    expect(role.Type).toBe("AWS::IAM::Role");
    const policy = role.Properties.Policies[0].PolicyDocument.Statement[0];
    expect(policy.Action).toEqual(expect.arrayContaining(["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"]));
  });

  // ----------------------------
  // AutoScaling & EC2
  // ----------------------------
  test("LaunchTemplate should use LatestAmiId parameter", () => {
    const lt = template.Resources.LaunchTemplate;
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");
    expect(lt.Properties.LaunchTemplateData.ImageId.Ref).toBe("LatestAmiId");
  });

  test("AutoScalingGroup should span two private subnets", () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Type).toBe("AWS::AutoScaling::AutoScalingGroup");
    expect(asg.Properties.VPCZoneIdentifier.length).toBe(2);
  });

  // ----------------------------
  // Load Balancer
  // ----------------------------
  test("ApplicationLoadBalancer should be deployed in public subnets", () => {
    const alb = template.Resources.ApplicationLoadBalancer;
    expect(alb.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");
    expect(alb.Properties.Subnets.length).toBe(2);
  });

  test("TargetGroup should use HTTP on port 80", () => {
    const tg = template.Resources.TargetGroup;
    expect(tg.Type).toBe("AWS::ElasticLoadBalancingV2::TargetGroup");
    expect(tg.Properties.Protocol).toBe("HTTP");
    expect(tg.Properties.Port).toBe(80);
  });

  // ----------------------------
  // CloudWatch
  // ----------------------------
  test("HighCPUAlarm should trigger at 75% CPU utilization", () => {
    const alarm = template.Resources.HighCPUAlarm;
    expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");
    expect(alarm.Properties.Threshold).toBe(75);
  });

  // ----------------------------
  // Route53
  // ----------------------------
  test("DNSRecord should be optional and only created when HasDomain is true", () => {
    const dns = template.Resources.DNSRecord;
    expect(dns.Condition).toBe("HasDomain");
    expect(dns.Type).toBe("AWS::Route53::RecordSet");
  });

  // ----------------------------
  // Outputs
  // ----------------------------
  test("should include critical Outputs", () => {
    const outputs = template.Outputs;
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.StaticAssetsBucketName).toBeDefined();
    expect(outputs.CloudFrontDomain).toBeDefined();
    expect(outputs.DynamoDBTableName).toBeDefined();
    expect(outputs.AutoScalingGroupName).toBeDefined();
    expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
  });

  test("all Outputs should follow naming convention with stack name prefix", () => {
    Object.values(template.Outputs).forEach((output: any) => {
      if (output.Export) {
        expect(output.Export.Name["Fn::Sub"]).toMatch(/^\$\{AWS::StackName\}-/);
      }
    });
  });
});
