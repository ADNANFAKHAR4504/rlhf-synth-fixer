import * as fs from 'fs';
import * as path from 'path';

// Load the CloudFormation JSON template
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('CloudFormation Template', () => {
  test('should have a VPC', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
  });

  test('should have a KeyPair with correct properties', () => {
    const keyPair = template.Resources.MyKeyPair;
    expect(keyPair).toBeDefined();
    expect(keyPair.Type).toBe('AWS::EC2::KeyPair');


    // Check Fn::Sub exists and has the correct value
    expect(keyPair.Properties.KeyName).toHaveProperty('Fn::Sub', '${AWS::StackName}-keypair');
  });

  test('should have public subnet configured', () => {
    const subnet = template.Resources.PublicSubnet;
    expect(subnet).toBeDefined();
    expect(subnet.Type).toBe('AWS::EC2::Subnet');
    expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
  });

  test('should have Internet Gateway attached to VPC', () => {
    const attach = template.Resources.AttachGateway;
    expect(attach.Properties.VpcId.Ref).toBe('VPC');
    expect(attach.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
  });

  test('should have Security Group for EC2 with ingress and egress rules', () => {
    const sg = template.Resources.EC2SecurityGroup;
    expect(sg).toBeDefined();
    expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
    expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
  });

  test('should have LaunchTemplate and EC2 Instances', () => {
    const lt = template.Resources.EC2LaunchTemplate;
    expect(lt).toBeDefined();
    for (let i = 1; i <= 10; i++) {
      const instance = template.Resources[`EC2Instance${i}`];
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.LaunchTemplate.LaunchTemplateId.Ref).toBe('EC2LaunchTemplate');
    }
  });

  test('should have CloudWatch Alarms configured correctly', () => {
    for (let i = 1; i <= 10; i++) {
      const alarm = template.Resources[`CPUAlarm${i}`];
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      const props = alarm.Properties;
      expect(props.MetricName).toBe('CPUUtilization');
      expect(props.Namespace).toBe('AWS/EC2');
      expect(props.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(props.Period).toBe(300);
      expect(props.Threshold).toBeDefined();
      expect(props.AlarmActions[0].Ref).toBe('AlarmTopic');
    }
  });

  test('should have S3 Logs Bucket with encryption and lifecycle rules', () => {
    const bucket = template.Resources.LogsBucket;
    expect(bucket).toBeDefined();
    expect(bucket.Type).toBe('AWS::S3::Bucket');
    const props = bucket.Properties;
    // Encryption
    expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    // Lifecycle
    expect(props.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
    expect(props.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    // Public access block
    expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
  });

  // IAM Role and Policies
  test('should have IAM Role with correct inline policies and managed policies', () => {
    const role = template.Resources.EC2Role;
    expect(role).toBeDefined();
    const props = role.Properties;

    // Managed Policy
    expect(props.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

    // Inline Policy
    const policy = props.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsS3Policy');
    expect(policy).toBeDefined();

    const statements = policy.PolicyDocument.Statement;
    const hasCloudWatchActions = statements.some((s: any) =>
      s.Action.includes('cloudwatch:PutMetricData')
    );
    const hasS3Access = statements.some((s: any) =>
      s.Action.includes('s3:PutObject')
    );

    expect(hasCloudWatchActions).toBe(true);
    expect(hasS3Access).toBe(true);
  });

  test('should have CloudWatch LogGroup with retention period and tags', () => {
    const logGroup = template.Resources.EC2LogGroup;
    expect(logGroup).toBeDefined();

    const props = logGroup.Properties;

    // Handle Fn::Sub structure
    if (props.LogGroupName['Fn::Sub']) {
      expect(props.LogGroupName['Fn::Sub']).toContain('/aws/ec2/');
    } else {
      expect(props.LogGroupName).toContain('/aws/ec2/');
    }

    expect(props.RetentionInDays).toBe(30);
    expect(props.Tags).toBeDefined();
    expect(props.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
  });

  test('should have SNS Topic for Alarm notifications', () => {
    const sns = template.Resources.AlarmTopic;
    expect(sns).toBeDefined();
    expect(sns.Type).toBe('AWS::SNS::Topic');

    const topicName = sns.Properties.TopicName;

    // Handle Fn::Sub structure
    if (topicName['Fn::Sub']) {
      expect(topicName['Fn::Sub']).toContain('cpu-alarms');
    } else {
      expect(topicName).toContain('cpu-alarms');
    }

    expect(sns.Properties.DisplayName).toBeDefined();
  });
});
