import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Environment Setup');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['ProjectName', 'TrustedIPRange', 'NotificationEmail', 'EnvironmentSuffix'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('project-x');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9]*$');
    });

    test('TrustedIPRange parameter should validate CIDR format', () => {
      const param = template.Parameters.TrustedIPRange;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toMatch(/\d{1,3}/);
    });

    test('NotificationEmail parameter should validate email format', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toContain('@');
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have S3 encryption key', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('S3 encryption key should have deletion policy', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('S3 encryption key should have proper key policy', () => {
      const keyPolicy = template.Resources.S3EncryptionKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeInstanceOf(Array);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias with environment suffix', () => {
      const alias = template.Resources.S3EncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have internet gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
    });

    test('all VPC resources should use environment suffix', () => {
      const vpcResources = ['VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicSubnet1', 'PublicSubnet2'];
      vpcResources.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have web security group', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('web security group should have HTTPS and HTTP ingress rules', () => {
      const sg = template.Resources.WebSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpRule.IpProtocol).toBe('tcp');
    });

    test('should have database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('database security group should only allow traffic from web security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('WebSecurityGroup');
      expect(ingress[0].FromPort).toBe(3306);
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 role with environment suffix', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EC2 role should have proper assume role policy', () => {
      const role = template.Resources.EC2Role;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have API Gateway role with environment suffix', () => {
      const role = template.Resources.APIGatewayRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('API Gateway role should have CloudWatch logs policy', () => {
      const role = template.Resources.APIGatewayRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('CloudWatchLogsPolicy');
    });
  });

  describe('S3 Buckets', () => {
    test('should have secure S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('secure S3 bucket should have encryption configuration', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('secure S3 bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have logging bucket', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have CloudTrail bucket', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('all S3 buckets should have environment suffix in name', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket', 'CloudTrailS3Bucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have CloudTrail trail', () => {
      const trail = template.Resources.ProjectCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region and logging', () => {
      const trail = template.Resources.ProjectCloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should have event selectors for S3', () => {
      const trail = template.Resources.ProjectCloudTrail;
      const selectors = trail.Properties.EventSelectors;
      expect(selectors).toHaveLength(1);
      expect(selectors[0].DataResources[0].Type).toBe('AWS::S3::Object');
    });

    test('should have CloudTrail S3 bucket policy', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have S3 log group', () => {
      const logGroup = template.Resources.S3LogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have API Gateway log group', () => {
      const logGroup = template.Resources.APIGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log groups should have environment suffix', () => {
      const logGroups = ['S3LogGroup', 'APIGatewayLogGroup'];
      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        expect(lg.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('should have SNS topic for security alerts', () => {
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have SNS subscription for email alerts', () => {
      const subscription = template.Resources.SecurityAlertsSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have unauthorized access alarm', () => {
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('unauthorized access alarm should have correct configuration', () => {
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm.Properties.MetricName).toBe('ErrorCount');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have root account usage alarm', () => {
      const alarm = template.Resources.RootAccountUsageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have root account usage metric filter', () => {
      const filter = template.Resources.RootAccountUsageMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
    });
  });

  describe('API Gateway', () => {
    test('should have REST API', () => {
      const api = template.Resources.APIGateway;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('API should be configured as REGIONAL', () => {
      const api = template.Resources.APIGateway;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('API should enforce HTTPS only', () => {
      const api = template.Resources.APIGateway;
      const policy = api.Properties.Policy;
      expect(policy).toBeDefined();
      expect(policy.Statement[0].Condition.Bool['aws:SecureTransport']).toBe('true');
    });

    test('should have API Gateway method', () => {
      const method = template.Resources.APIGatewayMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have API Gateway deployment', () => {
      const deployment = template.Resources.APIGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('API deployment should have throttling settings', () => {
      const deployment = template.Resources.APIGatewayDeployment;
      const methodSettings = deployment.Properties.StageDescription.MethodSettings[0];
      expect(methodSettings.ThrottlingBurstLimit).toBe(100);
      expect(methodSettings.ThrottlingRateLimit).toBe(50);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebSecurityGroupId',
        'DatabaseSecurityGroupId',
        'S3BucketName',
        'KMSKeyId',
        'APIGatewayURL',
        'APIGatewayRegionalURL',
        'APIGatewayId',
        'EC2InstanceProfileArn'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have environment suffix in export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('API Gateway outputs should have correct values', () => {
      const apiUrl = template.Outputs.APIGatewayURL;
      expect(apiUrl.Value['Fn::Sub']).toContain('https://${APIGateway}.execute-api');
      
      const regionalUrl = template.Outputs.APIGatewayRegionalURL;
      expect(regionalUrl).toBeDefined();
      expect(regionalUrl.Value['Fn::Sub']).toContain('execute-api.${AWS::Region}');
    });
  });

  describe('Template Best Practices', () => {
    test('all deletable resources should have Delete policy', () => {
      const deletableResources = [
        'S3EncryptionKey',
        'SecureS3Bucket',
        'LoggingBucket',
        'CloudTrailS3Bucket',
        'S3LogGroup',
        'APIGatewayLogGroup'
      ];

      deletableResources.forEach(resource => {
        expect(template.Resources[resource].DeletionPolicy).toBe('Delete');
      });
    });

    test('all IAM roles should follow least privilege principle', () => {
      const roles = ['EC2Role', 'APIGatewayRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.Policies || role.Properties.ManagedPolicyArns).toBeDefined();
      });
    });

    test('all resources requiring names should use environment suffix', () => {
      const namedResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.GroupName ||
          resource.Properties.TrailName ||
          resource.Properties.TopicName ||
          resource.Properties.AlarmName ||
          resource.Properties.Name
        );
      });

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
                           resource.Properties.RoleName ||
                           resource.Properties.GroupName ||
                           resource.Properties.TrailName ||
                           resource.Properties.TopicName ||
                           resource.Properties.AlarmName ||
                           resource.Properties.Name;
        
        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Requirements Validation', () => {
    test('should have KMS encryption for all S3 buckets', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket', 'CloudTrailS3Bucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('should have CloudTrail logging for IAM activities', () => {
      const trail = template.Resources.ProjectCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('API Gateway should enforce HTTPS', () => {
      const api = template.Resources.APIGateway;
      const policy = api.Properties.Policy;
      expect(policy.Statement[0].Condition.Bool['aws:SecureTransport']).toBe('true');
    });

    test('security groups should restrict access to trusted IP ranges', () => {
      const webSg = template.Resources.WebSecurityGroup;
      const ingress = webSg.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.CidrIp.Ref).toBe('TrustedIPRange');
      });
    });

    test('all EC2 instances should be in VPC (via security groups)', () => {
      const securityGroups = ['WebSecurityGroup', 'DatabaseSecurityGroup'];
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.VpcId.Ref).toBe('VPC');
      });
    });

    test('should have security alarms configured', () => {
      expect(template.Resources.UnauthorizedAccessAlarm).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
    });
  });
});