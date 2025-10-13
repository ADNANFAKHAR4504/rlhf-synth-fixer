import * as fs from "fs";

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

    // Other base expectations
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
