import fs from 'fs';
import path from 'path';

let template: any;

beforeAll(() => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  template = JSON.parse(templateContent);
});

describe('TapStack CloudFormation Template', () => {
  describe('Conditions', () => {
    test('defines key feature toggles for stack behavior', () => {
      expect(template.Conditions).toBeDefined();
      expect(Object.keys(template.Conditions)).toEqual(
        expect.arrayContaining(['HasKeyPair', 'IsProduction', 'EnableMonitoring'])
      );
    });
  });

  describe('Metadata and structure', () => {
    test('defines the correct template version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Enterprise-ready foundational infrastructure for modern application deployment with comprehensive monitoring and security controls'
      );
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('EnvironmentName enforces lowercase naming convention', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
    });

    test('EnvironmentType drives environment sizing choices', () => {
      const param = template.Parameters.EnvironmentType;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });

    test('InstanceType parameter restricts supported EC2 types', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
        't3.large',
      ]);
    });

    test('AllowedSSHIP enforces CIDR formatting', () => {
      const param = template.Parameters.AllowedSSHIP;
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toContain('([0-9]|[1-9][0-9]');
      expect(param.ConstraintDescription).toContain('x.x.x.x/x');
    });
  });

  describe('Mappings', () => {
    test('SubnetConfig defines deterministic CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
    });

    test('EnvironmentConfig provides sizing metadata', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig.production.InstanceType).toBe('t3.medium');
      expect(envConfig.production.LogRetention).toBe(30);
    });
  });

  describe('Networking resources', () => {
    test('VPC resource sets DNS features and tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets derive CIDRs from SubnetConfig mapping', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet1.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'PublicSubnet1', 'CIDR'],
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'PublicSubnet2', 'CIDR'],
      });
    });

    test('WebServerSecurityGroup limits SSH to AllowedSSHIP parameter', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHIP' });
    });
  });

  describe('Compute resources', () => {
    test('WebServerInstance attaches encrypted gp3 storage', () => {
      const instance = template.Resources.WebServerInstance;
      const blockDevice = instance.Properties.BlockDeviceMappings[0].Ebs;
      expect(blockDevice.VolumeType).toBe('gp3');
      expect(blockDevice.Encrypted).toBe(true);
      expect(blockDevice.DeleteOnTermination).toBe(true);
    });

    test('WebServerInstance enforces detailed monitoring flag', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.Monitoring).toEqual({
        'Fn::If': ['EnableMonitoring', true, false],
      });
    });

    test('EC2Role provides CloudWatch and S3 access', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        ])
      );
    });

    test('UserData installs CloudWatch agent and signals stack completion', () => {
      const instance = template.Resources.WebServerInstance;
      const userData = instance.Properties.UserData['Fn::Base64']['Fn::Sub'];
      const script = Array.isArray(userData) ? userData[0] : userData;
      expect(script).toContain('amazon-cloudwatch-agent.rpm');
      expect(script).toContain('/opt/aws/bin/cfn-signal');
    });
  });

  describe('Storage and logging', () => {
    test('GeneralPurposeBucket enforces encryption and versioning', () => {
      const bucket = template.Resources.GeneralPurposeBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('LoggingBucketPolicy blocks non-SSL access', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowSSLRequestsOnly'
      );
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('CloudWatch logs stream through Firehose to S3', () => {
      const subscription = template.Resources.LogsToS3ExportTask;
      expect(subscription.Properties.DestinationArn).toEqual({
        'Fn::GetAtt': ['LogsToS3DeliveryStream', 'Arn'],
      });
      const role = template.Resources.LogsRole;
      const statement = role.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toEqual(
        expect.arrayContaining(['firehose:PutRecord', 'firehose:PutRecordBatch'])
      );
    });

    test('LoggingBucket lifecycle rules delete and archive logs on schedule', () => {
      const bucket = template.Resources.LoggingBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Id: 'DeleteOldLogs', ExpirationInDays: expect.any(Object) }),
          expect.objectContaining({
            Id: 'TransitionOldLogs',
            Transitions: [{ TransitionInDays: 7, StorageClass: 'GLACIER' }],
          }),
        ])
      );
    });
  });

  describe('IAM and access controls', () => {
    test('EC2InstanceProfile attaches the EC2 role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('Logging bucket policy allows CloudWatch Logs service to write objects', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      const logsStatement = policy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowCloudWatchLogs'
      );
      expect(logsStatement.Principal).toEqual({ Service: 'logs.amazonaws.com' });
      expect(logsStatement.Action).toEqual(
        expect.arrayContaining(['s3:GetBucketAcl', 's3:PutObject'])
      );
    });

    test('Firehose delivery role is permitted to manage S3 uploads', () => {
      const role = template.Resources.FirehoseDeliveryRole;
      const statement = role.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toEqual(
        expect.arrayContaining([
          's3:AbortMultipartUpload',
          's3:GetBucketLocation',
          's3:GetObject',
          's3:ListBucket',
          's3:PutObject',
        ])
      );
      expect(statement.Resource).toEqual(
        expect.arrayContaining([
          { 'Fn::GetAtt': ['LoggingBucket', 'Arn'] },
          { 'Fn::Sub': '${LoggingBucket.Arn}/*' },
        ])
      );
    });
  });

  describe('Log destinations and retention', () => {
    test('ApplicationLogGroup retention uses environment-aware mapping', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'LogRetention'],
      });
    });

    test('HTTP log subscription uses LogsRole for permissions', () => {
      const subscription = template.Resources.LogsToS3ExportTask;
      expect(subscription.Properties.RoleArn).toEqual({ 'Fn::GetAtt': ['LogsRole', 'Arn'] });
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'EC2InstanceId',
      'ElasticIPAddress',
      'GeneralPurposeBucketName',
      'LoggingBucketName',
      'SNSTopicArn',
    ];
    const exportNameOverrides: Record<string, string> = {
      VPCId: '${AWS::StackName}-VPC-ID',
      PublicSubnet1Id: '${AWS::StackName}-PublicSubnet1-ID',
      PublicSubnet2Id: '${AWS::StackName}-PublicSubnet2-ID',
      EC2InstanceId: '${AWS::StackName}-EC2Instance-ID',
      ElasticIPAddress: '${AWS::StackName}-ElasticIP',
      GeneralPurposeBucketName: '${AWS::StackName}-GeneralPurposeBucket',
      LoggingBucketName: '${AWS::StackName}-LoggingBucket',
      SNSTopicArn: '${AWS::StackName}-SNSTopic-ARN',
    };

    test.each(requiredOutputs)('%s output exposes stack metadata', outputName => {
      expect(template.Outputs[outputName]).toBeDefined();
      expect(template.Outputs[outputName].Export.Name).toEqual({
        'Fn::Sub': exportNameOverrides[outputName] ?? `\${AWS::StackName}-${outputName}`,
      });
    });

    test('WebServerURL output references ElasticIP', () => {
      const output = template.Outputs.WebServerURL;
      expect(output.Value).toEqual({ 'Fn::Sub': 'http://${ElasticIP}' });
    });

    test('bucket outputs expose resource references', () => {
      expect(template.Outputs.GeneralPurposeBucketName.Value).toEqual({ Ref: 'GeneralPurposeBucket' });
      expect(template.Outputs.LoggingBucketName.Value).toEqual({ Ref: 'LoggingBucket' });
    });

    test('networking outputs resolve to concrete resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.PublicSubnet2Id.Value).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Outputs.ElasticIPAddress.Value).toEqual({ Ref: 'ElasticIP' });
    });
  });

  describe('Monitoring and alerting', () => {
    test('AlarmNotificationTopic subscribes the alert email parameter', () => {
      const topic = template.Resources.AlarmNotificationTopic;
      expect(topic.Properties.Subscription).toEqual([
        {
          Endpoint: { Ref: 'AlertEmail' },
          Protocol: 'email',
        },
      ]);
    });

    test('HighCPUAlarm references EC2 instance and parameterized threshold', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toEqual({ Ref: 'CPUAlarmThreshold' });
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'AlarmNotificationTopic' }]);
      expect(alarm.Properties.Dimensions).toEqual([
        { Name: 'InstanceId', Value: { Ref: 'WebServerInstance' } },
      ]);
    });
  });

  describe('Log delivery pipeline', () => {
    test('LogsToS3DeliveryStream writes compressed data into the logging bucket', () => {
      const stream = template.Resources.LogsToS3DeliveryStream;
      const destination = stream.Properties.ExtendedS3DestinationConfiguration;
      expect(destination.BucketARN).toEqual({ 'Fn::GetAtt': ['LoggingBucket', 'Arn'] });
      expect(destination.CompressionFormat).toBe('GZIP');
      expect(destination.Prefix).toBe('cloudwatch-logs/');
      expect(destination.RoleARN).toEqual({ 'Fn::GetAtt': ['FirehoseDeliveryRole', 'Arn'] });
    });

    test('LogsRole can put records into the Firehose delivery stream', () => {
      const role = template.Resources.LogsRole;
      const statement = role.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toEqual(
        expect.arrayContaining(['firehose:PutRecord', 'firehose:PutRecordBatch'])
      );
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['LogsToS3DeliveryStream', 'Arn'] });
    });
  });
});
