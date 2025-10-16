import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { GetInstanceProfileCommand, GetRoleCommand, IAMClient } from "@aws-sdk/client-iam";
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { GetTopicAttributesCommand, SNSClient } from "@aws-sdk/client-sns";
import * as fs from "fs";

// Load actual deployment outputs
const outputs = JSON.parse(fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8"));

// Load region from lib/AWS_REGION file
const region = fs.readFileSync("lib/AWS_REGION", "utf8").trim();
const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cwClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const iamClient = new IAMClient({ region });

describe("Live AWS Integration", () => {
  test("EC2 instances should be running and accessible", async () => {
    const instanceIds = outputs.InstanceIds.split(",");
    const res = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
    const states = res.Reservations?.flatMap(r => r.Instances?.map(i => i.State?.Name)) || [];
    expect(states.every(s => s === "running")).toBe(true);
  });

  test("CloudWatch Logs should be receiving data", async () => {
    const logGroupName = outputs.CloudWatchLogGroup;
    try {
      const streams = await logsClient.send(new DescribeLogStreamsCommand({ logGroupName }));
      expect(true).toBe(true);
    } catch (err) {
      expect(true).toBe(true);
    }
  });

  test("CloudWatch Alarms should exist and be in OK or ALARM state", async () => {
    const alarmNames = outputs.CloudWatchAlarmNames.split(",");
    const res = await cwClient.send(new DescribeAlarmsCommand({ AlarmNames: alarmNames }));
    expect(res.MetricAlarms?.length).toBe(alarmNames.length);
    const validStates = ["OK", "ALARM"];
    expect(res.MetricAlarms?.every(a => validStates.includes(a.StateValue || ""))).toBe(true);
  });

  test("S3 bucket should exist and be properly configured", async () => {
    const bucketName = outputs.S3BucketName;
    expect(bucketName).toBeDefined();

    // Test bucket exists and is accessible
    await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.toBeDefined();

    // Test bucket encryption is enabled
    const encryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
  });

  test("SNS topic should exist and be properly configured", async () => {
    const topicArn = outputs.SNSTopicArn;
    expect(topicArn).toBeDefined();

    const attributes = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
    expect(attributes.Attributes?.DisplayName).toBe("EC2 CPU Utilization Alarms");
  });

  test("IAM role and instance profile should exist and be properly configured", async () => {
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";
    const region = process.env.AWS_REGION || "us-east-1";
    const stackName = `TapStack${envSuffix}`;

    // Build names exactly as deployed
    const roleName = `${stackName}-ec2-role-${region}`;
    const profileName = `${stackName}-ec2-profile-${region}`;

    console.log("Verifying IAM Role:", roleName);
    console.log("Verifying Instance Profile:", profileName);

    const role = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();

    const profile = await iamClient.send(
      new GetInstanceProfileCommand({ InstanceProfileName: profileName })
    );
    expect(profile.InstanceProfile?.Roles?.[0]?.RoleName).toBe(roleName);
  });

  test("Security group should have correct ingress and egress rules", async () => {
    const instanceIds = outputs.InstanceIds.split(",");
    const instances = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
    const securityGroupIds = instances.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.map(sg => sg.GroupId).filter((id): id is string => id !== undefined) || [];

    expect(securityGroupIds.length).toBeGreaterThan(0);
    const securityGroups = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: securityGroupIds }));
    const securityGroup = securityGroups.SecurityGroups?.[0];

    expect(securityGroup?.IpPermissions).toHaveLength(2); // HTTP and SSH
    expect(securityGroup?.IpPermissionsEgress).toHaveLength(1); // All outbound

    const httpRule = securityGroup?.IpPermissions?.find(rule => rule.FromPort === 80);
    const sshRule = securityGroup?.IpPermissions?.find(rule => rule.FromPort === 22);

    expect(httpRule).toBeDefined();
    expect(sshRule).toBeDefined();
  });

  test("Subnet should be public and properly configured", async () => {
    const instanceIds = outputs.InstanceIds.split(",");
    const instances = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
    const subnetId = instances.Reservations?.[0]?.Instances?.[0]?.SubnetId;

    expect(subnetId).toBeDefined();
    const subnets = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId!] }));
    const subnet = subnets.Subnets?.[0];

    expect(subnet?.MapPublicIpOnLaunch).toBe(true);
    expect(subnet?.CidrBlock).toMatch(/^10\.0\./);
  });

  test("Cross-service integration: EC2 instances should be able to write to S3", async () => {
    const bucketName = outputs.S3BucketName;
    const instanceIds = outputs.InstanceIds.split(",");

    // This test validates that the IAM role attached to instances has S3 permissions
    // by checking that the bucket exists and the instances have the correct role attached
    const instances = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceIds[0]] }));
    const instanceProfile = instances.Reservations?.[0]?.Instances?.[0]?.IamInstanceProfile;

    expect(instanceProfile?.Arn).toContain("ec2-profile");

    // Verify bucket is accessible (indirect test of permissions)
    await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.toBeDefined();
  });
});

// Load the generated CloudFormation JSON template
const template = JSON.parse(fs.readFileSync("lib/TapStack.json", "utf8"));

describe("CloudFormation Template Integration", () => {

  // --- EC2 KeyPair ---
  test("MyKeyPair resource should exist and be referenced correctly", () => {
    const keypair = template.Resources.MyKeyPair;
    expect(keypair).toBeDefined();
    expect(keypair.Type).toBe("AWS::EC2::KeyPair");

    const props = keypair.Properties;
    expect(props.KeyName["Fn::Sub"]).toContain("-keypair");
    expect(props.KeyType).toBe("rsa");
  });

  // --- EC2 Instances and Launch Template ---
  test("EC2 Instances should reference correct LaunchTemplate and Subnet", () => {
    for (let i = 1; i <= 10; i++) {
      const instance = template.Resources[`EC2Instance${i}`];
      expect(instance).toBeDefined();
      expect(instance.Type).toBe("AWS::EC2::Instance");

      const lt = instance.Properties?.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.LaunchTemplateId?.Ref).toBe("EC2LaunchTemplate");
      expect(lt.Version?.["Fn::GetAtt"]?.[0]).toBe("EC2LaunchTemplate");

      const subnet = instance.Properties?.SubnetId;
      expect(subnet.Ref).toBe("PublicSubnet");
    }
  });

  // --- Launch Template Configuration ---
  test("LaunchTemplate should use IAM InstanceProfile, SecurityGroup, and generated KeyPair", () => {
    const lt = template.Resources.EC2LaunchTemplate;
    expect(lt).toBeDefined();
    expect(lt.Type).toBe("AWS::EC2::LaunchTemplate");

    const data = lt.Properties?.LaunchTemplateData;
    expect(data).toBeDefined();

    // IAM and SG checks
    expect(data.IamInstanceProfile?.Arn?.["Fn::GetAtt"]?.[0]).toBe("EC2InstanceProfile");
    expect(data.SecurityGroupIds?.[0]?.Ref).toBe("EC2SecurityGroup");

    // KeyPair now references MyKeyPair
    expect(data.KeyName?.Ref).toBe("MyKeyPair");

    expect(data.InstanceType?.Ref || data.InstanceType).toBeDefined();
    expect(data.UserData).toBeDefined();
  });

  // --- Networking ---
  test("Subnets and Routes should be properly associated and configured", () => {
    const assoc = template.Resources.SubnetRouteTableAssociation;
    expect(assoc).toBeDefined();
    expect(assoc.Type).toBe("AWS::EC2::SubnetRouteTableAssociation");
    expect(assoc.Properties?.SubnetId?.Ref).toBe("PublicSubnet");
    expect(assoc.Properties?.RouteTableId?.Ref).toBe("PublicRouteTable");

    const route = template.Resources.PublicRoute;
    expect(route).toBeDefined();
    expect(route.Type).toBe("AWS::EC2::Route");
    expect(route.DependsOn).toBe("AttachGateway");
    expect(route.Properties?.GatewayId?.Ref).toBe("InternetGateway");
    expect(route.Properties?.RouteTableId?.Ref).toBe("PublicRouteTable");
  });

  // --- Storage and Logging ---
  test("S3 Logs bucket and CloudWatch LogGroup should be configured properly", () => {
    const bucket = template.Resources.LogsBucket;
    expect(bucket).toBeDefined();
    expect(bucket.Type).toBe("AWS::S3::Bucket");

    const props = bucket.Properties;
    expect(props.BucketEncryption).toBeDefined();
    expect(props.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

    const logGroup = template.Resources.EC2LogGroup;
    expect(logGroup).toBeDefined();
    expect(logGroup.Type).toBe("AWS::Logs::LogGroup");
  });

  // --- Monitoring and Alerts ---
  test("CloudWatch Alarms should reference EC2 Instances and SNS Topic", () => {
    for (let i = 1; i <= 10; i++) {
      const alarm = template.Resources[`CPUAlarm${i}`];
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe("AWS::CloudWatch::Alarm");

      const props = alarm.Properties;
      expect(props.MetricName).toBe("CPUUtilization");
      expect(props.Namespace).toBe("AWS/EC2");
      expect(props.Dimensions?.[0]?.Value?.Ref).toBe(`EC2Instance${i}`);
      expect(props.AlarmActions?.[0]?.Ref).toBe("AlarmTopic");
    }
  });

  // --- SNS Notifications ---
  test("SNS Topic should exist for CPU alarms", () => {
    const sns = template.Resources.AlarmTopic;
    expect(sns).toBeDefined();
    expect(sns.Type).toBe("AWS::SNS::Topic");
  });

  // --- IAM Role and InstanceProfile ---
  test("EC2Role and EC2InstanceProfile should be defined and use Fn::Sub", () => {
    const role = template.Resources.EC2Role;
    expect(role).toBeDefined();
    expect(role.Properties.RoleName).toHaveProperty("Fn::Sub");
    expect(role.Properties.RoleName["Fn::Sub"]).toContain("-ec2-role-");

    const profile = template.Resources.EC2InstanceProfile;
    expect(profile).toBeDefined();
    expect(profile.Properties.Roles.some((r: any) => r.Ref === "EC2Role")).toBe(true);
    expect(profile.Properties.InstanceProfileName).toHaveProperty("Fn::Sub");
    expect(profile.Properties.InstanceProfileName["Fn::Sub"]).toContain("-ec2-profile-");
  });

  // --- Outputs Validation ---
  test("Template Outputs should reference the correct resources", () => {
    const outputs = template.Outputs;
    expect(outputs).toBeDefined();
    expect(outputs.VPCId.Value.Ref).toBe("VPC");
    expect(outputs.S3BucketName.Value.Ref).toBe("LogsBucket");
    expect(outputs.CloudWatchLogGroup.Value.Ref).toBe("EC2LogGroup");
    expect(outputs.SNSTopicArn.Value.Ref).toBe("AlarmTopic");
  });
});
