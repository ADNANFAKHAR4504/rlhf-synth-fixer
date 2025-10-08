import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;

    // Create cfn-outputs directory if it doesn't exist
    const outputDir = path.join(__dirname, '../cfn-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate flat-outputs.json for test reference
    const flatOutputs = {
      templateVersion: template.AWSTemplateFormatVersion,
      description: template.Description,
      parameterCount: Object.keys(parameters).length,
      resourceCount: Object.keys(resources).length,
      outputCount: Object.keys(outputs).length,
      parameters: Object.keys(parameters),
      resources: Object.keys(resources),
      outputs: Object.keys(outputs),
      resourceTypes: Object.keys(resources).reduce((acc: any, key: string) => {
        const type = resources[key].Type;
        acc[key] = type;
        return acc;
      }, {}),
    };

    fs.writeFileSync(
      path.join(outputDir, 'flat-outputs.json'),
      JSON.stringify(flatOutputs, null, 2)
    );
  });

  describe('Template Basic Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Discourse Forum');
    });

    test('should have Metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have Parameters section', () => {
      expect(parameters).toBeDefined();
      expect(Object.keys(parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section with at least 15 resources', () => {
      expect(resources).toBeDefined();
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(15);
    });

    test('should have Outputs section', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.EnvironmentSuffix.Type).toBe('String');
      expect(parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have DomainName parameter', () => {
      expect(parameters.DomainName).toBeDefined();
      expect(parameters.DomainName.Type).toBe('String');
      expect(parameters.DomainName.AllowedPattern).toBeDefined();
    });

    test('should have SSHKeyName parameter', () => {
      expect(parameters.SSHKeyName).toBeDefined();
      expect(parameters.SSHKeyName.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });

    test('should have EC2InstanceType parameter with default t3.small', () => {
      expect(parameters.EC2InstanceType).toBeDefined();
      expect(parameters.EC2InstanceType.Default).toBe('t3.small');
      expect(parameters.EC2InstanceType.AllowedValues).toContain('t3.small');
    });

    test('should have DBInstanceClass parameter with default db.t3.small', () => {
      expect(parameters.DBInstanceClass).toBeDefined();
      expect(parameters.DBInstanceClass.Default).toBe('db.t3.small');
      expect(parameters.DBInstanceClass.AllowedValues).toContain('db.t3.small');
    });

    test('should have DBUsername parameter', () => {
      expect(parameters.DBUsername).toBeDefined();
      expect(parameters.DBUsername.Type).toBe('String');
      expect(parameters.DBUsername.MinLength).toBe(1);
    });

    test('should have DBPassword parameter with NoEcho', () => {
      expect(parameters.DBPassword).toBeDefined();
      expect(parameters.DBPassword.NoEcho).toBe(true);
      expect(parameters.DBPassword.MinLength).toBe(8);
    });

    test('should have CacheNodeType parameter with default cache.t3.small', () => {
      expect(parameters.CacheNodeType).toBeDefined();
      expect(parameters.CacheNodeType.Default).toBe('cache.t3.small');
    });

    test('should have AdminEmail parameter', () => {
      expect(parameters.AdminEmail).toBeDefined();
      expect(parameters.AdminEmail.AllowedPattern).toBeDefined();
    });

    test('should have SMTP configuration parameters', () => {
      expect(parameters.SMTPServer).toBeDefined();
      expect(parameters.SMTPPort).toBeDefined();
      expect(parameters.SMTPUsername).toBeDefined();
      expect(parameters.SMTPPassword).toBeDefined();
      expect(parameters.SMTPPassword.NoEcho).toBe(true);
    });
  });

  describe('Network Layer Resources', () => {
    test('should have VPC with correct CIDR block 10.42.0.0/16', () => {
      expect(resources.ForumVPC).toBeDefined();
      expect(resources.ForumVPC.Type).toBe('AWS::EC2::VPC');
      expect(resources.ForumVPC.Properties.CidrBlock).toBe('10.42.0.0/16');
      expect(resources.ForumVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(resources.ForumVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(resources.AttachGateway).toBeDefined();
      expect(resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(resources.AttachGateway.Properties.VpcId.Ref).toBe('ForumVPC');
      expect(resources.AttachGateway.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });

    test('should have two public subnets across different AZs', () => {
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PublicSubnet1.Properties.CidrBlock).toBe('10.42.1.0/24');
      expect(resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PublicSubnet2.Properties.CidrBlock).toBe('10.42.2.0/24');
      expect(resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets across different AZs', () => {
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.42.10.0/24');

      expect(resources.PrivateSubnet2).toBeDefined();
      expect(resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.42.11.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(resources.NATGatewayEIP).toBeDefined();
      expect(resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(resources.NATGatewayEIP.Properties.Domain).toBe('vpc');
      expect(resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');

      expect(resources.NATGateway).toBeDefined();
      expect(resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(resources.NATGateway.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have public route table with internet gateway route', () => {
      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(resources.PublicRoute).toBeDefined();
      expect(resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(resources.PublicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    test('should have private route table with NAT gateway route', () => {
      expect(resources.PrivateRouteTable).toBeDefined();
      expect(resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(resources.PrivateRoute).toBeDefined();
      expect(resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
      expect(resources.PrivateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(resources.PrivateRoute.Properties.NatGatewayId.Ref).toBe('NATGateway');
    });

    test('should have route table associations for all subnets', () => {
      expect(resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 security group with HTTP/HTTPS ingress rules', () => {
      expect(resources.EC2SecurityGroup).toBeDefined();
      expect(resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules.length).toBeGreaterThanOrEqual(2);

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');

      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.IpProtocol).toBe('tcp');

      const egressRules = resources.EC2SecurityGroup.Properties.SecurityGroupEgress;
      expect(egressRules).toBeDefined();
      expect(egressRules[0].IpProtocol).toBe(-1);
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have RDS security group with PostgreSQL ingress from EC2', () => {
      expect(resources.RDSSecurityGroup).toBeDefined();
      expect(resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = resources.RDSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules[0].FromPort).toBe(5432);
      expect(ingressRules[0].ToPort).toBe(5432);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].SourceSecurityGroupId.Ref).toBe('EC2SecurityGroup');
    });

    test('should have ElastiCache security group with Redis ingress from EC2', () => {
      expect(resources.ElastiCacheSecurityGroup).toBeDefined();
      expect(resources.ElastiCacheSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = resources.ElastiCacheSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules[0].FromPort).toBe(6379);
      expect(ingressRules[0].ToPort).toBe(6379);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].SourceSecurityGroupId.Ref).toBe('EC2SecurityGroup');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role with appropriate policies', () => {
      expect(resources.EC2Role).toBeDefined();
      expect(resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(resources.EC2Role.Properties.AssumeRolePolicyDocument).toBeDefined();

      const policies = resources.EC2Role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThanOrEqual(3);

      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('S3AccessPolicy');
      expect(policyNames).toContain('SecretsManagerAccessPolicy');
      expect(policyNames).toContain('CloudWatchLogsPolicy');
    });

    test('should have EC2 instance profile', () => {
      expect(resources.EC2InstanceProfile).toBeDefined();
      expect(resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(resources.EC2InstanceProfile.Properties.Roles[0].Ref).toBe('EC2Role');
    });

    test('should have Backup IAM role', () => {
      expect(resources.BackupRole).toBeDefined();
      expect(resources.BackupRole.Type).toBe('AWS::IAM::Role');
      expect(resources.BackupRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(resources.BackupRole.Properties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret with proper structure', () => {
      expect(resources.DBSecret).toBeDefined();
      expect(resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(resources.DBSecret.Properties.Description).toContain('RDS PostgreSQL');
      expect(resources.DBSecret.Properties.SecretString).toBeDefined();
    });
  });

  describe('Database Layer', () => {
    test('should have RDS subnet group spanning both AZs', () => {
      expect(resources.DBSubnetGroup).toBeDefined();
      expect(resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnetIds = resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toBeDefined();
      expect(subnetIds.length).toBe(2);
      expect(subnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('should have RDS PostgreSQL instance with correct configuration', () => {
      expect(resources.ForumDatabase).toBeDefined();
      expect(resources.ForumDatabase.Type).toBe('AWS::RDS::DBInstance');
      expect(resources.ForumDatabase.DeletionPolicy).toBe('Snapshot');

      const props = resources.ForumDatabase.Properties;
      expect(props.Engine).toBe('postgres');
      expect(props.DBInstanceClass.Ref).toBe('DBInstanceClass');
      expect(props.MultiAZ).toBe(false);
      expect(props.StorageEncrypted).toBe(true);
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.PubliclyAccessible).toBe(false);
    });

    test('should have RDS instance in private subnet', () => {
      const props = resources.ForumDatabase.Properties;
      expect(props.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
      expect(props.VPCSecurityGroups[0].Ref).toBe('RDSSecurityGroup');
    });

    test('should have automated backups enabled', () => {
      const props = resources.ForumDatabase.Properties;
      expect(props.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(props.PreferredBackupWindow).toBeDefined();
      expect(props.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('Caching Layer', () => {
    test('should have ElastiCache subnet group', () => {
      expect(resources.CacheSubnetGroup).toBeDefined();
      expect(resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');

      const subnetIds = resources.CacheSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toBeDefined();
      expect(subnetIds.length).toBe(2);
    });

    test('should have Redis cluster with correct configuration', () => {
      expect(resources.RedisCluster).toBeDefined();
      expect(resources.RedisCluster.Type).toBe('AWS::ElastiCache::CacheCluster');

      const props = resources.RedisCluster.Properties;
      expect(props.Engine).toBe('redis');
      expect(props.CacheNodeType.Ref).toBe('CacheNodeType');
      expect(props.NumCacheNodes).toBe(1);
      expect(props.CacheSubnetGroupName.Ref).toBe('CacheSubnetGroup');
      expect(props.VpcSecurityGroupIds[0].Ref).toBe('ElastiCacheSecurityGroup');
    });
  });

  describe('Storage Layer', () => {
    test('should have uploads S3 bucket with encryption', () => {
      expect(resources.UploadsBucket).toBeDefined();
      expect(resources.UploadsBucket.Type).toBe('AWS::S3::Bucket');

      const props = resources.UploadsBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have uploads bucket with lifecycle policy', () => {
      const props = resources.UploadsBucket.Properties;
      expect(props.LifecycleConfiguration).toBeDefined();

      const rules = props.LifecycleConfiguration.Rules;
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);

      const rule = rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toBeDefined();
      expect(rule.Transitions[0].TransitionInDays).toBe(30);
      expect(rule.Transitions[0].StorageClass).toBe('GLACIER');
      expect(rule.ExpirationInDays).toBe(90);
    });

    test('should have backups S3 bucket with encryption', () => {
      expect(resources.BackupsBucket).toBeDefined();
      expect(resources.BackupsBucket.Type).toBe('AWS::S3::Bucket');

      const props = resources.BackupsBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have backups bucket with lifecycle policy', () => {
      const props = resources.BackupsBucket.Properties;
      expect(props.LifecycleConfiguration).toBeDefined();

      const rules = props.LifecycleConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('should have bucket policies restricting access', () => {
      expect(resources.UploadsBucketPolicy).toBeDefined();
      expect(resources.UploadsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(resources.UploadsBucketPolicy.Properties.Bucket.Ref).toBe('UploadsBucket');

      expect(resources.BackupsBucketPolicy).toBeDefined();
      expect(resources.BackupsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(resources.BackupsBucketPolicy.Properties.Bucket.Ref).toBe('BackupsBucket');
    });

    test('should have public access block configured', () => {
      const uploadsProps = resources.UploadsBucket.Properties;
      expect(uploadsProps.PublicAccessBlockConfiguration).toBeDefined();
      expect(uploadsProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(uploadsProps.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);

      const backupsProps = resources.BackupsBucket.Properties;
      expect(backupsProps.PublicAccessBlockConfiguration).toBeDefined();
      expect(backupsProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('CDN and Distribution', () => {
    test('should have CloudFront Origin Access Identity', () => {
      expect(resources.CloudFrontOAI).toBeDefined();
      expect(resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFront distribution with S3 origin', () => {
      expect(resources.CloudFrontDistribution).toBeDefined();
      expect(resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');

      const config = resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
      expect(config.Origins).toBeDefined();
      expect(config.Origins.length).toBeGreaterThan(0);
      expect(config.Origins[0].S3OriginConfig).toBeDefined();
    });

    test('should have CloudFront distribution with HTTPS redirect', () => {
      const config = resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have CloudFront distribution with image cache behavior', () => {
      const config = resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.CacheBehaviors).toBeDefined();
      expect(config.CacheBehaviors.length).toBeGreaterThan(0);

      const imageBehavior = config.CacheBehaviors.find((b: any) => b.PathPattern === 'images/*');
      expect(imageBehavior).toBeDefined();
      expect(imageBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(imageBehavior.Compress).toBe(true);
    });

    test('should have CloudFront distribution with SSL certificate', () => {
      const config = resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(config.ViewerCertificate).toBeDefined();
      expect(config.ViewerCertificate.AcmCertificateArn.Ref).toBe('SSLCertificate');
      expect(config.ViewerCertificate.SslSupportMethod).toBe('sni-only');
    });
  });

  describe('DNS and Certificate', () => {
    test('should have Route 53 hosted zone', () => {
      expect(resources.HostedZone).toBeDefined();
      expect(resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(resources.HostedZone.Properties.Name.Ref).toBe('DomainName');
    });

    test('should have ACM SSL certificate with DNS validation', () => {
      expect(resources.SSLCertificate).toBeDefined();
      expect(resources.SSLCertificate.Type).toBe('AWS::CertificateManager::Certificate');
      expect(resources.SSLCertificate.Properties.ValidationMethod).toBe('DNS');
      expect(resources.SSLCertificate.Properties.DomainValidationOptions).toBeDefined();
    });

    test('should have Route 53 A record pointing to CloudFront', () => {
      expect(resources.DNSRecord).toBeDefined();
      expect(resources.DNSRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(resources.DNSRecord.Properties.Type).toBe('A');
      expect(resources.DNSRecord.Properties.AliasTarget).toBeDefined();
      expect(resources.DNSRecord.Properties.AliasTarget.DNSName['Fn::GetAtt'][0]).toBe('CloudFrontDistribution');
    });
  });

  describe('Compute Layer', () => {
    test('should have EC2 instance with correct instance type', () => {
      expect(resources.DiscourseEC2Instance).toBeDefined();
      expect(resources.DiscourseEC2Instance.Type).toBe('AWS::EC2::Instance');
      expect(resources.DiscourseEC2Instance.Properties.InstanceType.Ref).toBe('EC2InstanceType');
    });

    test('should have EC2 instance in public subnet', () => {
      const props = resources.DiscourseEC2Instance.Properties;
      expect(props.NetworkInterfaces).toBeDefined();
      expect(props.NetworkInterfaces[0].SubnetId.Ref).toBe('PublicSubnet1');
      expect(props.NetworkInterfaces[0].AssociatePublicIpAddress).toBe(true);
    });

    test('should have EC2 instance with IAM instance profile', () => {
      const props = resources.DiscourseEC2Instance.Properties;
      expect(props.IamInstanceProfile.Ref).toBe('EC2InstanceProfile');
    });

    test('should have EC2 instance with encrypted EBS volume', () => {
      const props = resources.DiscourseEC2Instance.Properties;
      expect(props.BlockDeviceMappings).toBeDefined();
      expect(props.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(props.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });

    test('should have EC2 instance with UserData script', () => {
      const props = resources.DiscourseEC2Instance.Properties;
      expect(props.UserData).toBeDefined();
      expect(props.UserData['Fn::Base64']).toBeDefined();
    });

    test('should have EC2 instance with DependsOn', () => {
      expect(resources.DiscourseEC2Instance.DependsOn).toBeDefined();
      expect(Array.isArray(resources.DiscourseEC2Instance.DependsOn)).toBe(true);
      expect(resources.DiscourseEC2Instance.DependsOn).toContain('ForumDatabase');
      expect(resources.DiscourseEC2Instance.DependsOn).toContain('RedisCluster');
    });

    test('should have EC2 instance with CreationPolicy', () => {
      expect(resources.DiscourseEC2Instance.CreationPolicy).toBeDefined();
      expect(resources.DiscourseEC2Instance.CreationPolicy.ResourceSignal).toBeDefined();
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log group', () => {
      expect(resources.DiscourseLogGroup).toBeDefined();
      expect(resources.DiscourseLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(resources.DiscourseLogGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('should have SNS topic for alarms', () => {
      expect(resources.AlarmSNSTopic).toBeDefined();
      expect(resources.AlarmSNSTopic.Type).toBe('AWS::SNS::Topic');
      expect(resources.AlarmSNSTopic.Properties.Subscription).toBeDefined();
      expect(resources.AlarmSNSTopic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have EC2 CPU alarm with 80% threshold', () => {
      expect(resources.EC2CPUAlarm).toBeDefined();
      expect(resources.EC2CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resources.EC2CPUAlarm.Properties.Threshold).toBe(80);
      expect(resources.EC2CPUAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(resources.EC2CPUAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have EC2 disk alarm with 80% threshold', () => {
      expect(resources.EC2DiskAlarm).toBeDefined();
      expect(resources.EC2DiskAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resources.EC2DiskAlarm.Properties.Threshold).toBe(80);
      expect(resources.EC2DiskAlarm.Properties.MetricName).toBe('disk_used_percent');
    });

    test('should have EC2 memory alarm with 80% threshold', () => {
      expect(resources.EC2MemoryAlarm).toBeDefined();
      expect(resources.EC2MemoryAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resources.EC2MemoryAlarm.Properties.Threshold).toBe(80);
      expect(resources.EC2MemoryAlarm.Properties.MetricName).toBe('mem_used_percent');
    });

    test('should have RDS CPU alarm', () => {
      expect(resources.RDSCPUAlarm).toBeDefined();
      expect(resources.RDSCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resources.RDSCPUAlarm.Properties.Threshold).toBe(80);
    });

    test('should have all alarms configured with SNS topic', () => {
      expect(resources.EC2CPUAlarm.Properties.AlarmActions[0].Ref).toBe('AlarmSNSTopic');
      expect(resources.EC2DiskAlarm.Properties.AlarmActions[0].Ref).toBe('AlarmSNSTopic');
      expect(resources.EC2MemoryAlarm.Properties.AlarmActions[0].Ref).toBe('AlarmSNSTopic');
      expect(resources.RDSCPUAlarm.Properties.AlarmActions[0].Ref).toBe('AlarmSNSTopic');
    });
  });

  describe('Backup Configuration', () => {
    test('should have backup vault', () => {
      expect(resources.BackupVault).toBeDefined();
      expect(resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('should have backup plan with 7-day retention', () => {
      expect(resources.BackupPlan).toBeDefined();
      expect(resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');

      const planRule = resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(planRule).toBeDefined();
      expect(planRule.Lifecycle.DeleteAfterDays).toBe(7);
      expect(planRule.TargetBackupVault.Ref).toBe('BackupVault');
    });

    test('should have backup plan with daily schedule', () => {
      const planRule = resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(planRule.ScheduleExpression).toBeDefined();
      expect(planRule.ScheduleExpression).toContain('cron');
    });

    test('should have backup selection', () => {
      expect(resources.BackupSelection).toBeDefined();
      expect(resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
      expect(resources.BackupSelection.Properties.BackupPlanId.Ref).toBe('BackupPlan');
    });

    test('should have backup selection with tag-based selection', () => {
      const selection = resources.BackupSelection.Properties.BackupSelection;
      expect(selection.ListOfTags).toBeDefined();
      expect(selection.ListOfTags.length).toBeGreaterThan(0);
      expect(selection.ListOfTags[0].ConditionKey).toBe('BackupEnabled');
      expect(selection.ListOfTags[0].ConditionValue).toBe('true');
    });
  });

  describe('Resource Tags', () => {
    const resourcesWithTags = [
      'ForumVPC',
      'InternetGateway',
      'PublicSubnet1',
      'EC2SecurityGroup',
      'DiscourseEC2Instance',
      'ForumDatabase',
      'UploadsBucket',
    ];

    resourcesWithTags.forEach((resourceName) => {
      test(`should have required tags on ${resourceName}`, () => {
        const resource = resources[resourceName];
        expect(resource).toBeDefined();

        const tags = resource.Properties.Tags || resource.Properties.BackupVaultTags;
        expect(tags).toBeDefined();

        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Application');
        expect(tagKeys).toContain('ManagedBy');

        const appTag = tags.find((t: any) => t.Key === 'Application');
        expect(appTag.Value).toBe('HobbyForum');

        const managedByTag = tags.find((t: any) => t.Key === 'ManagedBy');
        expect(managedByTag.Value).toBe('CloudFormation');
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Value.Ref).toBe('ForumVPC');
      expect(outputs.VPCId.Export).toBeDefined();
    });

    test('should have EC2 public IP output', () => {
      expect(outputs.EC2PublicIP).toBeDefined();
      expect(outputs.EC2PublicIP.Value['Fn::GetAtt']).toBeDefined();
      expect(outputs.EC2PublicIP.Export).toBeDefined();
    });

    test('should have RDS endpoint output', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should have Redis endpoint output', () => {
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should have S3 bucket names outputs', () => {
      expect(outputs.UploadsBucketName).toBeDefined();
      expect(outputs.UploadsBucketName.Value.Ref).toBe('UploadsBucket');

      expect(outputs.BackupsBucketName).toBeDefined();
      expect(outputs.BackupsBucketName.Value.Ref).toBe('BackupsBucket');
    });

    test('should have CloudFront URL output', () => {
      expect(outputs.CloudFrontURL).toBeDefined();
      expect(outputs.CloudFrontURL.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should have domain name output', () => {
      expect(outputs.DomainName).toBeDefined();
      expect(outputs.DomainName.Value.Ref).toBe('DomainName');
    });

    test('should have hosted zone ID output', () => {
      expect(outputs.HostedZoneId).toBeDefined();
      expect(outputs.HostedZoneId.Value.Ref).toBe('HostedZone');
    });

    test('should have SSL certificate ARN output', () => {
      expect(outputs.SSLCertificateArn).toBeDefined();
      expect(outputs.SSLCertificateArn.Value.Ref).toBe('SSLCertificate');
    });

    test('should have CloudWatch log group output', () => {
      expect(outputs.LogGroupName).toBeDefined();
      expect(outputs.LogGroupName.Value.Ref).toBe('DiscourseLogGroup');
    });

    test('should have SNS topic ARN output', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn.Value.Ref).toBe('AlarmSNSTopic');
    });

    test('should have backup vault name output', () => {
      expect(outputs.BackupVaultName).toBeDefined();
      expect(outputs.BackupVaultName.Value.Ref).toBe('BackupVault');
    });

    test('should have all outputs with exports', () => {
      const outputKeys = Object.keys(outputs);
      outputKeys.forEach((key) => {
        expect(outputs[key].Export).toBeDefined();
        expect(outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper VPC gateway attachment dependency', () => {
      expect(resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
      expect(resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have EC2 instance dependencies on database and cache', () => {
      const deps = resources.DiscourseEC2Instance.DependsOn;
      expect(deps).toContain('ForumDatabase');
      expect(deps).toContain('RedisCluster');
      expect(deps).toContain('DBSecret');
    });
  });

  describe('Template Completeness', () => {
    test('should have all required network resources', () => {
      expect(resources.ForumVPC).toBeDefined();
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.NATGateway).toBeDefined();
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet2).toBeDefined();
    });

    test('should have all required compute resources', () => {
      expect(resources.DiscourseEC2Instance).toBeDefined();
      expect(resources.EC2SecurityGroup).toBeDefined();
      expect(resources.EC2Role).toBeDefined();
      expect(resources.EC2InstanceProfile).toBeDefined();
    });

    test('should have all required database resources', () => {
      expect(resources.ForumDatabase).toBeDefined();
      expect(resources.DBSubnetGroup).toBeDefined();
      expect(resources.RDSSecurityGroup).toBeDefined();
      expect(resources.DBSecret).toBeDefined();
    });

    test('should have all required cache resources', () => {
      expect(resources.RedisCluster).toBeDefined();
      expect(resources.CacheSubnetGroup).toBeDefined();
      expect(resources.ElastiCacheSecurityGroup).toBeDefined();
    });

    test('should have all required storage resources', () => {
      expect(resources.UploadsBucket).toBeDefined();
      expect(resources.BackupsBucket).toBeDefined();
      expect(resources.UploadsBucketPolicy).toBeDefined();
      expect(resources.BackupsBucketPolicy).toBeDefined();
    });

    test('should have all required CDN resources', () => {
      expect(resources.CloudFrontOAI).toBeDefined();
      expect(resources.CloudFrontDistribution).toBeDefined();
    });

    test('should have all required DNS resources', () => {
      expect(resources.HostedZone).toBeDefined();
      expect(resources.SSLCertificate).toBeDefined();
      expect(resources.DNSRecord).toBeDefined();
    });

    test('should have all required monitoring resources', () => {
      expect(resources.DiscourseLogGroup).toBeDefined();
      expect(resources.AlarmSNSTopic).toBeDefined();
      expect(resources.EC2CPUAlarm).toBeDefined();
      expect(resources.EC2DiskAlarm).toBeDefined();
      expect(resources.EC2MemoryAlarm).toBeDefined();
    });

    test('should have all required backup resources', () => {
      expect(resources.BackupVault).toBeDefined();
      expect(resources.BackupPlan).toBeDefined();
      expect(resources.BackupSelection).toBeDefined();
      expect(resources.BackupRole).toBeDefined();
    });

    test('should have total resource count of at least 50', () => {
      const resourceCount = Object.keys(resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(50);
    });
  });
});
