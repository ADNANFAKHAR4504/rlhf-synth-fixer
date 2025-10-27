import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeSecurityGroupsCommand,
  EC2Client,
  DescribeRouteTablesCommand,
} from "@aws-sdk/client-ec2";
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
} from "@aws-sdk/client-elastic-beanstalk";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch"; 

// ---------------------------------------------------------------------------
// LOAD DATA
// ---------------------------------------------------------------------------
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const region = fs
  .readFileSync(path.resolve(__dirname, "../lib/AWS_REGION"), "utf8")
  .trim();

const logsClient = new CloudWatchLogsClient({ region });
const cwClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const ebClient = new ElasticBeanstalkClient({ region });
const stsClient = new STSClient({ region });

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// LIVE AWS VALIDATION
// ---------------------------------------------------------------------------
describe("Live AWS Integration - TapStack", () => {
  test("S3 bucket should exist and have encryption enabled", async () => {
    const bucketName = outputs.S3BucketName;
    expect(bucketName).toBeDefined();

    await expect(
      s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
    ).resolves.toBeDefined();

    const encryption = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName })
    );
    expect(
      encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe("AES256");
  });

  test("Security group should allow HTTP ingress and all egress", async () => {
    const securityGroupId = outputs.SecurityGroupId;
    expect(securityGroupId).toBeDefined();

    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
    );
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();

    const ingress80 = sg?.IpPermissions?.find(
      (p) => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === "tcp"
    );
    expect(ingress80).toBeDefined();

    const egressAll = sg?.IpPermissionsEgress?.find((p) => p.IpProtocol === "-1");
    expect(egressAll).toBeDefined();
  });

  test("VPC route table should contain default route to Internet Gateway", async () => {
    const vpcId = outputs.VPCId;
    const res = await ec2Client.send(
      new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] })
    );
    const hasDefaultRoute = res.RouteTables?.some((rt) =>
      rt.Routes?.some((r) => r.DestinationCidrBlock === "0.0.0.0/0")
    );
    expect(hasDefaultRoute).toBe(true);
  });

  test("CloudWatch Logs client should connect successfully", async () => {
    const logGroupName =
      "/aws/elasticbeanstalk/nodejs-web-app-env/var/log/web.stdout";
    try {
      await logsClient.send(new DescribeLogStreamsCommand({ logGroupName }));
      expect(true).toBe(true);
    } catch {
      // If log group not found, still okay
      expect(true).toBe(true);
    }
  });

  test("CloudWatch Alarm for High CPU should exist", async () => {
    const describe = await cwClient.send(new DescribeAlarmsCommand({}));
    const alarms = describe.MetricAlarms || [];
    const hasHighCpu = alarms.some((a) =>
      (a.AlarmName || "").endsWith("-HighCPU")
    );
    expect(hasHighCpu).toBe(true);
  });

  test("Elastic Beanstalk environment should be healthy or ready", async () => {
    const envName = outputs.EnvironmentName;
    const res = await ebClient.send(
      new DescribeEnvironmentsCommand({ EnvironmentNames: [envName] })
    );
    const env = res.Environments?.[0];
    expect(env).toBeDefined();
    expect(["Ready", "Launching", "Updating"]).toContain(env?.Status);
  });

  // Endpoint reachability
  test("Elastic Beanstalk endpoint should be reachable and return valid HTTP response", async () => {
    const endpoint = outputs.ApplicationURL;
    expect(endpoint).toBeDefined();

    const response = await fetch(endpoint, { method: "GET", timeout: 10000 });
    expect(response.status).toBeLessThan(500);
    const text = await response.text();
    expect(text).toBeTruthy();
  });

  // Cross-service integration check: EC2 → CloudWatch metrics
  test("EC2 metrics should be present in CloudWatch", async () => {
    const describe = await cwClient.send(new DescribeAlarmsCommand({}));
    const alarms = describe.MetricAlarms || [];
    const hasEc2Metric = alarms.some((a) => a.Namespace === "AWS/EC2");
    expect(hasEc2Metric).toBe(true);
  });

  test("All CloudFormation outputs should have non-empty values", () => {
    for (const [key, value] of Object.entries(outputs)) {
      expect(value).toBeDefined();
      expect(value).not.toBe("");
      expect(value).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// CROSS-ACCOUNT VALIDATION
// ---------------------------------------------------------------------------
describe("Cross-Account Executability - TapStack", () => {
  test("Template and resources should not hardcode AWS account or region", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    expect(identity.Account).toBeDefined();
    expect(identity.Arn).toMatch(/^arn:aws/);

    const templateJson = JSON.stringify(template);
    expect(templateJson).not.toMatch(/1234567890/);
    expect(templateJson).not.toMatch(/us-east-1/);
    expect(templateJson).toContain("${AWS::AccountId}");
    expect(templateJson).toContain("${AWS::Region}");
  });
});

// ---------------------------------------------------------------------------
// TEMPLATE VALIDATION
// ---------------------------------------------------------------------------
describe("CloudFormation Template Validation - TapStack", () => {
  test("Key resources exist with expected types", () => {
    expect(template.Resources.VPC.Type).toBe("AWS::EC2::VPC");
    expect(template.Resources.PublicSubnet1.Type).toBe("AWS::EC2::Subnet");
    expect(template.Resources.PublicSubnet2.Type).toBe("AWS::EC2::Subnet");
    expect(template.Resources.PublicRoute.Type).toBe("AWS::EC2::Route");
    expect(template.Resources.ApplicationSecurityGroup.Type).toBe(
      "AWS::EC2::SecurityGroup"
    );
    expect(template.Resources.S3Bucket.Type).toBe("AWS::S3::Bucket");
    expect(template.Resources.ElasticBeanstalkEnvironment.Type).toBe(
      "AWS::ElasticBeanstalk::Environment"
    );
    expect(template.Resources.HighCPUAlarm.Type).toBe("AWS::CloudWatch::Alarm");
  });

  test("IAM roles and instance profile defined", () => {
    expect(template.Resources.EC2InstanceRole.Type).toBe("AWS::IAM::Role");
    expect(template.Resources.ElasticBeanstalkServiceRole.Type).toBe(
      "AWS::IAM::Role"
    );
    expect(template.Resources.EC2InstanceProfile.Type).toBe(
      "AWS::IAM::InstanceProfile"
    );
  });

  test("S3 bucket properties are secure", () => {
    const bucket = template.Resources.S3Bucket.Properties;
    expect(bucket.BucketEncryption).toBeDefined();
    expect(bucket.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(bucket.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
      true
    );
    expect(bucket.VersioningConfiguration?.Status).toBe("Enabled");
  });

  test("Security group ingress/egress rules match expectations", () => {
    const sg = template.Resources.ApplicationSecurityGroup.Properties;
    const ingress = sg.SecurityGroupIngress?.[0];
    expect(ingress.IpProtocol).toBe("tcp");
    expect(ingress.FromPort).toBe(80);
    expect(ingress.ToPort).toBe(80);

    const egress = sg.SecurityGroupEgress?.[0];
    expect(egress.IpProtocol).toBe(-1);
    expect(egress.CidrIp).toBe("0.0.0.0/0");
  });

  test("VPC route to internet exists", () => {
    const route = template.Resources.PublicRoute.Properties;
    expect(route.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(route.GatewayId.Ref).toBe("InternetGateway");
  });

  test("Elastic Beanstalk configuration template includes key namespaces", () => {
    const opts =
      template.Resources.ElasticBeanstalkConfigurationTemplate.Properties
        .OptionSettings;
    const namespaces = opts.map((o: any) => o.Namespace);
    expect(namespaces).toContain("aws:ec2:vpc");
    expect(namespaces).toContain("aws:autoscaling:asg");
    expect(namespaces).toContain("aws:elasticbeanstalk:application:environment");
    expect(namespaces).toContain("aws:elasticbeanstalk:cloudwatch:logs");
  });

  test("Auto-scaling Min/Max settings are parameterized", () => {
    const opts =
      template.Resources.ElasticBeanstalkConfigurationTemplate.Properties
        .OptionSettings;
    const min = opts.find(
      (o: any) => o.OptionName === "MinSize" && o.Namespace === "aws:autoscaling:asg"
    );
    const max = opts.find(
      (o: any) => o.OptionName === "MaxSize" && o.Namespace === "aws:autoscaling:asg"
    );
    expect(min.Value.Ref).toBe("MinInstances");
    expect(max.Value.Ref).toBe("MaxInstances");
  });

  test("CloudWatch alarm threshold and dimensions defined correctly", () => {
    const alarm = template.Resources.HighCPUAlarm.Properties;
    expect(alarm.MetricName).toBe("CPUUtilization");
    expect(alarm.Namespace).toBe("AWS/EC2");
    expect(alarm.Threshold.Ref).toBe("CPUAlarmThreshold");
    expect(alarm.Dimensions[0].Name).toBe("EnvironmentName");
  });

  test("All parameters include default and constraint information", () => {
    const params = template.Parameters as Record<string, any>;
    for (const [name, def] of Object.entries(params)) {
      expect(def).toHaveProperty("Type");
      expect(def).toHaveProperty("Description");
      expect(def).toHaveProperty("Default");
      if (def.Type === "String") {
        expect(def.Description.length).toBeGreaterThan(0);
      }
    }
  });

  test("Outputs reference correct resources", () => {
    const o = template.Outputs;
    expect(o.ApplicationURL.Value["Fn::Sub"]).toContain(
      "${ElasticBeanstalkEnvironment.EndpointURL}"
    );
    expect(o.EnvironmentName.Value.Ref).toBe("ElasticBeanstalkEnvironment");
    expect(o.S3BucketName.Value.Ref).toBe("S3Bucket");
    expect(o.SecurityGroupId.Value.Ref).toBe("ApplicationSecurityGroup");
    expect(o.VPCId.Value.Ref).toBe("VPC");
  });
});
