import fs from 'fs';
import path from 'path';

describe('E-Commerce Platform CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('E-Commerce Platform Infrastructure Template');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'test', 'prod']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have ConfigBucket parameter', () => {
      expect(template.Parameters.ConfigBucket).toBeDefined();
      const param = template.Parameters.ConfigBucket;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ecommerce-config-bucket');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('our-ecomm-store.com');
    });

    test('should have LatestAmiId parameter with SSM type', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentSecrets mapping', () => {
      expect(template.Mappings.EnvironmentSecrets).toBeDefined();
    });

    test('should have secrets for all environments', () => {
      const secrets = template.Mappings.EnvironmentSecrets;
      expect(secrets.dev).toBeDefined();
      expect(secrets.test).toBeDefined();
      expect(secrets.prod).toBeDefined();
    });

    test('each environment should have DatabaseSecretPath and PaymentProcessorKeyPath', () => {
      ['dev', 'test', 'prod'].forEach(env => {
        const secrets = template.Mappings.EnvironmentSecrets[env];
        expect(secrets.DatabaseSecretPath).toContain(`/ecommerce/${env}/DatabaseCredentials`);
        expect(secrets.PaymentProcessorKeyPath).toContain(`/ecommerce/${env}/PaymentProcessorKey`);
      });
    });
  });

  describe('Conditions', () => {
    test('should have HasDomainName condition', () => {
      expect(template.Conditions.HasDomainName).toBeDefined();
      const condition = template.Conditions.HasDomainName;
      expect(condition['Fn::Not']).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have two Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('EIPs should have correct domain', () => {
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS from internet', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServer security group should allow traffic from ALB', () => {
      const ingress = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress.length).toBeGreaterThanOrEqual(2);
    });

    test('should have DB security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Database Resources', () => {
    test('should have DatabaseSecret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should generate password', () => {
      const secret = template.Resources.DatabaseSecret.Properties;
      expect(secret.GenerateSecretString).toBeDefined();
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('should have DatabaseSubnetGroup', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS Database', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Database should have deletion policies', () => {
      expect(template.Resources.Database.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Database.UpdateReplacePolicy).toBe('Delete');
    });

    test('Database should be encrypted', () => {
      const db = template.Resources.Database.Properties;
      expect(db.StorageEncrypted).toBe(true);
    });

    test('Database should have DeletionProtection disabled', () => {
      const db = template.Resources.Database.Properties;
      expect(db.DeletionProtection).toBe(false);
    });
  });

  describe('Lambda and Custom Resources', () => {
    test('should have ConfigFetcherRole', () => {
      expect(template.Resources.ConfigFetcherRole).toBeDefined();
      expect(template.Resources.ConfigFetcherRole.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigFetcherRole should have Lambda assume role policy', () => {
      const role = template.Resources.ConfigFetcherRole.Properties;
      const statement = role.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have ConfigFetcherFunction', () => {
      expect(template.Resources.ConfigFetcherFunction).toBeDefined();
      expect(template.Resources.ConfigFetcherFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('ConfigFetcherFunction should use Python runtime', () => {
      const func = template.Resources.ConfigFetcherFunction.Properties;
      expect(func.Runtime).toBe('python3.9');
      expect(func.Handler).toBe('index.handler');
      expect(func.Timeout).toBe(30);
    });

    test('should have ConfigFetcher custom resource', () => {
      expect(template.Resources.ConfigFetcher).toBeDefined();
      expect(template.Resources.ConfigFetcher.Type).toBe('Custom::S3ConfigFetcher');
    });
  });

  describe('KMS Encryption', () => {
    test('should have EncryptionKey', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have key rotation enabled', () => {
      const key = template.Resources.EncryptionKey.Properties;
      expect(key.EnableKeyRotation).toBe(true);
    });

    test('EncryptionKey should have deletion policies', () => {
      expect(template.Resources.EncryptionKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.EncryptionKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have EncryptionKeyAlias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key policy should allow CloudTrail', () => {
      const policy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      const statements = policy.Statement;
      const cloudtrailStatement = statements.find((s: any) =>
        s.Principal?.Service === 'cloudtrail.amazonaws.com'
      );
      expect(cloudtrailStatement).toBeDefined();
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have WebServerRole', () => {
      expect(template.Resources.WebServerRole).toBeDefined();
      expect(template.Resources.WebServerRole.Type).toBe('AWS::IAM::Role');
    });

    test('WebServerRole should have required managed policies', () => {
      const role = template.Resources.WebServerRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have WebServerProfile', () => {
      expect(template.Resources.WebServerProfile).toBeDefined();
      expect(template.Resources.WebServerProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should have encrypted EBS volume', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const blockDevice = lt.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have WebServerAutoScalingGroup', () => {
      expect(template.Resources.WebServerAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebServerAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have health check configured', () => {
      const asg = template.Resources.WebServerAutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('should have ScaleUpPolicy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('ScaleUpPolicy should use target tracking', () => {
      const policy = template.Resources.ScaleUpPolicy.Properties;
      expect(policy.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('Load Balancer', () => {
    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('should have ALBListener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALBListener should listen on port 80', () => {
      const listener = template.Resources.ALBListener.Properties;
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
    });

    test('should have ALBTargetGroup', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALBTargetGroup should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(5);
    });
  });

  describe('Route53', () => {
    test('should have HostedZone with condition', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(template.Resources.HostedZone.Condition).toBe('HasDomainName');
    });

    test('should have DNSRecord with condition', () => {
      expect(template.Resources.DNSRecord).toBeDefined();
      expect(template.Resources.DNSRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(template.Resources.DNSRecord.Condition).toBe('HasDomainName');
    });

    test('DNSRecord should be an A record with alias', () => {
      const record = template.Resources.DNSRecord.Properties;
      expect(record.Type).toBe('A');
      expect(record.AliasTarget).toBeDefined();
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrailBucket', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CloudTrailBucket should have encryption enabled', () => {
      const bucket = template.Resources.CloudTrailBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('CloudTrailBucket should block public access', () => {
      const bucket = template.Resources.CloudTrailBucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudTrailBucketPolicy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have CloudTrail', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have logging enabled', () => {
      const trail = template.Resources.CloudTrail.Properties;
      expect(trail.IsLogging).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
    });
  });

  describe('Monitoring', () => {
    test('should have AlertTopic', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlertTopic should be encrypted', () => {
      const topic = template.Resources.AlertTopic.Properties;
      expect(topic.KmsMasterKeyId).toBeDefined();
    });

    test('should have CPUAlarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPUAlarm should monitor CPU utilization', () => {
      const alarm = template.Resources.CPUAlarm.Properties;
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CPUAlarm should have both alarm and OK actions', () => {
      const alarm = template.Resources.CPUAlarm.Properties;
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.OKActions).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs', () => {
      const expectedOutputs = [
        'VPCID',
        'PublicSubnets',
        'PrivateSubnets',
        'ApplicationLoadBalancerDNSName',
        'ApplicationURL',
        'DatabaseEndpoint',
        'EncryptionKeyARN',
        'AlertTopicARN',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('should have detailed networking outputs', () => {
      expect(template.Outputs.VPCCidr).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.DBSecurityGroupId).toBeDefined();
    });

    test('should have database outputs', () => {
      expect(template.Outputs.DatabaseInstanceId).toBeDefined();
      expect(template.Outputs.DatabasePort).toBeDefined();
      expect(template.Outputs.DatabaseName).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should use EnvironmentSuffix in names where applicable', () => {
      const resourcesWithNaming = [
        'DatabaseSecret',
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'Database',
        'ApplicationLoadBalancer',
        'CloudTrail'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const props = JSON.stringify(resource.Properties);
          expect(props).toContain('EnvironmentSuffix');
        }
      });
    });

    test('security groups should have GroupName property', () => {
      ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DBSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toBeDefined();
      });
    });
  });

  describe('Dependencies and References', () => {
    test('InternetGatewayAttachment should depend on proper resources', () => {
      const attachment = template.Resources.InternetGatewayAttachment.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NAT Gateways should depend on Internet Gateway', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('CloudTrail should depend on bucket policy', () => {
      expect(template.Resources.CloudTrail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('Database should reference security group', () => {
      const db = template.Resources.Database.Properties;
      expect(db.VPCSecurityGroups).toContainEqual({ Ref: 'DBSecurityGroup' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resource types should be valid CloudFormation types', () => {
      const validTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::ScalingPolicy',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::Route53::HostedZone',
        'AWS::Route53::RecordSet',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::CloudTrail::Trail',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::Lambda::Function',
        'AWS::SecretsManager::Secret',
        'Custom::S3ConfigFetcher'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(validTypes).toContain(resource.Type);
      });
    });
  });
});
