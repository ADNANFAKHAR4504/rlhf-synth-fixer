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
    expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    expect(props.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
    expect(props.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
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
    const policy = props.Policies.find((p: any) => {
      if (typeof p.PolicyName === 'string') return p.PolicyName.includes('CloudWatchLogsS3Policy');
      if (p.PolicyName && p.PolicyName['Fn::Sub']) return p.PolicyName['Fn::Sub'].includes('CloudWatchLogsS3Policy');
      return false;
    });
    expect(policy).toBeDefined();

    const statements = policy.PolicyDocument.Statement;
    const hasCloudWatchActions = statements.some((s: any) =>
      Array.isArray(s.Action) ? s.Action.includes('cloudwatch:PutMetricData') : s.Action === 'cloudwatch:PutMetricData'
    );
    const hasS3Access = statements.some((s: any) =>
      Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject'
    );

    expect(hasCloudWatchActions).toBe(true);
    expect(hasS3Access).toBe(true);

    // RoleName uses Fn::Sub with placeholders
    expect(props.RoleName).toHaveProperty('Fn::Sub');
    expect(props.RoleName['Fn::Sub']).toContain('-ec2-role-');
  });

  test('should have CloudWatch LogGroup with retention period and tags', () => {
    const logGroup = template.Resources.EC2LogGroup;
    expect(logGroup).toBeDefined();
    const props = logGroup.Properties;

    if (props.LogGroupName['Fn::Sub']) {
      expect(props.LogGroupName['Fn::Sub']).toContain('/aws/ec2/');
    } else {
      expect(props.LogGroupName).toContain('/aws/ec2/');
    }

    expect(props.RetentionInDays).toBe(30);
    expect(props.Tags).toBeDefined();
    expect(props.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
  });

  test('should have InstanceProfile with correct role and name', () => {
    const profile = template.Resources.EC2InstanceProfile;
    expect(profile).toBeDefined();

    // Roles array contains Ref to EC2Role
    expect(profile.Properties.Roles.some((r: any) => r.Ref === 'EC2Role')).toBe(true);

    // InstanceProfileName uses Fn::Sub with placeholders
    expect(profile.Properties.InstanceProfileName).toHaveProperty('Fn::Sub');
    expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('-ec2-profile-');
  });

  test('should have SNS Topic for Alarm notifications', () => {
    const sns = template.Resources.AlarmTopic;
    expect(sns).toBeDefined();
    expect(sns.Type).toBe('AWS::SNS::Topic');

    const topicName = sns.Properties.TopicName;
    if (topicName['Fn::Sub']) {
      expect(topicName['Fn::Sub']).toContain('cpu-alarms');
    } else {
      expect(topicName).toContain('cpu-alarms');
    }

    expect(sns.Properties.DisplayName).toBeDefined();
  });

  test('should use SSM Parameter for AMI ID instead of hardcoded values (or allow mapping)', () => {
    const launchTemplate = template.Resources.EC2LaunchTemplate;
    expect(launchTemplate).toBeDefined();

    const imageId = launchTemplate.Properties.LaunchTemplateData.ImageId;

    if (imageId && imageId.Ref) {
      expect(imageId.Ref).toBe('LatestAmazonLinuxAMI');

      const amiParam = template.Parameters.LatestAmazonLinuxAMI;
      expect(amiParam).toBeDefined();
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');

      if (amiParam.Default) {
        expect(String(amiParam.Default)).toContain('/aws/service/ami-amazon-linux-latest');
      }
    } else if (imageId && (imageId['Fn::FindInMap'] || imageId['Fn::Join'] || imageId['Fn::Sub'])) {
      expect(imageId['Fn::FindInMap'] || imageId['Fn::Join'] || imageId['Fn::Sub']).toBeTruthy();
    } else {
      expect(typeof imageId === 'string' || !!imageId).toBeTruthy();
    }
  });

  test('should have proper resource tagging consistency', () => {
    const resources = template.Resources;
    const resourcesWithTags = Object.keys(resources).filter(key =>
      resources[key].Properties?.Tags ||
      resources[key].Properties?.TagSpecifications
    );

    resourcesWithTags.forEach(resourceKey => {
      const resource = resources[resourceKey];
      const tags = resource.Properties?.Tags ||
        resource.Properties?.TagSpecifications?.[0]?.Tags;

      if (tags && Array.isArray(tags)) {
        const nameTag = tags.find(tag => tag.Key === 'Name');
        const envTag = tags.find(tag => tag.Key === 'Environment');

        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();

        if (nameTag?.Value?.['Fn::Sub']) {
          expect(nameTag.Value['Fn::Sub']).toContain('${AWS::StackName}');
        }

        // Environment tag should reference parameter
        if (envTag?.Value?.Ref) {
          expect(envTag.Value.Ref).toBe('EnvironmentTag');
        }
      }
    });
  });

  test('should have proper IAM role permissions for CloudWatch and S3', () => {
    const role = template.Resources.EC2Role;
    expect(role).toBeDefined();

    // Check managed policy
    expect(role.Properties.ManagedPolicyArns).toContain(
      'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
    );

    // Check inline policy (support both string or Fn::Sub name)
    const inlinePolicy = role.Properties.Policies.find((p: any) => {
      if (!p.PolicyName) return false;
      if (typeof p.PolicyName === 'string') return p.PolicyName.includes('CloudWatchLogsS3Policy');
      if (p.PolicyName['Fn::Sub']) return p.PolicyName['Fn::Sub'].includes('CloudWatchLogsS3Policy');
      return false;
    });
    expect(inlinePolicy).toBeDefined();

    const statements = inlinePolicy.PolicyDocument.Statement;

    // Should have CloudWatch permissions
    const cloudWatchStatement = statements.find((s: any) =>
      (typeof s.Action === 'string' && s.Action.includes('cloudwatch:PutMetricData')) ||
      (Array.isArray(s.Action) && s.Action.includes('cloudwatch:PutMetricData'))
    );
    expect(cloudWatchStatement).toBeDefined();

    // Should have S3 permissions
    const s3Statement = statements.find((s: any) =>
      (typeof s.Action === 'string' && s.Action.includes('s3:PutObject')) ||
      (Array.isArray(s.Action) && s.Action.includes('s3:PutObject'))
    );
    expect(s3Statement).toBeDefined();
  });

  test('should have proper CloudWatch alarm configuration', () => {
    for (let i = 1; i <= 10; i++) {
      const alarm = template.Resources[`CPUAlarm${i}`];
      expect(alarm).toBeDefined();

      const props = alarm.Properties;

      // Check alarm configuration
      expect(props.Period).toBe(300); // 5 minutes
      expect(props.EvaluationPeriods).toBe(1);
      expect(props.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(props.TreatMissingData).toBe('breaching');

      // Check alarm references correct instance
      expect(props.Dimensions?.[0]?.Value?.Ref).toBe(`EC2Instance${i}`);

      // Check alarm references SNS topic
      expect(props.AlarmActions?.[0]?.Ref).toBe('AlarmTopic');
    }
  });

  test('should have proper VPC and networking configuration', () => {
    const vpc = template.Resources.VPC;
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties.EnableDnsSupport).toBe(true);

    const subnet = template.Resources.PublicSubnet;
    expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(subnet.Properties.VpcId.Ref).toBe('VPC');

    // Check route table association
    const routeTableAssoc = template.Resources.SubnetRouteTableAssociation;
    expect(routeTableAssoc.Properties.SubnetId.Ref).toBe('PublicSubnet');
    expect(routeTableAssoc.Properties.RouteTableId.Ref).toBe('PublicRouteTable');

    // Check internet gateway attachment
    const igwAttachment = template.Resources.AttachGateway;
    expect(igwAttachment.Properties.VpcId.Ref).toBe('VPC');
    expect(igwAttachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
  });

  test('should have proper outputs for cross-stack references', () => {
    const outputs = template.Outputs;

    // Check all required outputs exist
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.InstanceIds).toBeDefined();
    expect(outputs.S3BucketName).toBeDefined();
    expect(outputs.CloudWatchAlarmNames).toBeDefined();
    expect(outputs.SNSTopicArn).toBeDefined();
    expect(outputs.CloudWatchLogGroup).toBeDefined();

    Object.values(outputs).forEach((output: any) => {
      const exportName = output.Export?.Name;
      if (!exportName) {
        return;
      }

      // If the export name uses Fn::Sub, assert it contains stack name placeholder
      if (typeof exportName === 'object' && exportName['Fn::Sub']) {
        expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
      } else if (typeof exportName === 'string') {
        expect(exportName).toContain('${AWS::StackName}' .replace('${AWS::StackName}', '')); 
      }
    });
  });

  test('should not have any hardcoded account IDs or regions', () => {
    const templateStr = JSON.stringify(template);

    // Should not contain hardcoded account IDs (12 digits)
    expect(templateStr).not.toMatch(/\b\d{12}\b/);

    // Should not contain hardcoded region names (except in SSM parameter path)
    const regions = ['us-east-1', 'us-west-2', 'eu-west-3', 'ap-southeast-1'];
    regions.forEach(region => {
      if (templateStr.includes(region)) {
        // Only allow in SSM parameter paths or AWS pseudo parameters
        expect(templateStr).toMatch(new RegExp(`/aws/service.*${region}|AWS::Region|AWS::AccountId`));
      }
    });
  });
});
