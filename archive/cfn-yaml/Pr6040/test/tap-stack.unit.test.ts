import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;
  let resources: Record<string, any>;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    resources = template.Resources;
  });

  describe('Template metadata', () => {
    test('exposes format version and production description', () => {
      const formatVersion = template.AWSTemplateFormatVersion;
      const description = template.Description;

      expect(formatVersion).toBe('2010-09-09');
      expect(description).toBe(
        'Production-ready infrastructure with HA, security, and compliance features for PCI DSS payment processing application'
      );
    });

    test('groups parameters for console usability', () => {
      const interfaceMetadata = template.Metadata['AWS::CloudFormation::Interface'];
      const labels = interfaceMetadata.ParameterGroups.map(
        (group: any) => group.Label.default
      );

      expect(labels).toEqual(
        expect.arrayContaining([
          'Environment Configuration',
          'Network Configuration - IMPORTANT',
          'Application Configuration',
          'Database Configuration',
          'Security & Compliance',
          'Monitoring & Alerts',
        ])
      );
    });
  });

  describe('Parameters', () => {
    test('enforces environment selection boundaries', () => {
      const environmentParam = template.Parameters.Environment;
      const allowed = environmentParam.AllowedValues;

      expect(allowed).toContain('Development');
      expect(allowed).toContain('Staging');
      expect(allowed).toContain('Production');
      expect(environmentParam.Default).toBe('Production');
    });

    test('validates VPC CIDR pattern using allowed regex', () => {
      const vpcParam = template.Parameters.VPCCIDR;
      const regex = new RegExp(vpcParam.AllowedPattern);

      expect(regex.test('10.0.0.0/16')).toBe(true);
      expect(regex.test('10.0.0.0/24')).toBe(false);
    });

    test('enforces multi-az configuration defaults and documentation', () => {
      const numberOfAzs = template.Parameters.NumberOfAvailabilityZones;

      expect(numberOfAzs.Default).toBe(2);
      expect(numberOfAzs.AllowedValues).toEqual([1, 2, 3]);
      if (template.Parameters.AvailabilityZones) {
        expect(template.Parameters.AvailabilityZones.Type).toBe('CommaDelimitedList');
        expect(template.Parameters.AvailabilityZones.Description).toContain('REQUIRED when NumberOfAvailabilityZones is 2 or 3');
      }
    });

    test('secures certificate and credential parameters', () => {
      const certificateParam = template.Parameters.SSLCertificateArn;
      const passwordParam = template.Parameters.DBMasterPassword;
      const certificateRegex = new RegExp(certificateParam.AllowedPattern);

      expect(certificateRegex.test('arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(certificateRegex.test('invalid-arn')).toBe(false);
      expect(passwordParam.NoEcho).toBe(true);
      expect(passwordParam.MinLength).toBe(8);
    });

    test('keeps alerting contact information validated', () => {
      const notificationEmail = template.Parameters.NotificationEmail;
      const regex = new RegExp(notificationEmail.AllowedPattern);

      expect(notificationEmail.Default).toBe('admin@example.com');
      expect(regex.test('ops@example.com')).toBe(true);
      expect(regex.test('invalid-email')).toBe(false);
    });
  });

  describe('Conditions', () => {
    test('requires multi-az configuration for resource creation', () => {
      // Verify HasThreeAZs condition exists
      expect(template.Conditions.HasThreeAZs).toBeDefined();
      expect(template.Conditions.HasThreeAZs['Fn::Equals']).toEqual([
        { Ref: 'NumberOfAvailabilityZones' },
        3
      ]);
    });

    test('enables third AZ NAT only when HA and AZ3 are available', () => {
      const condition = template.Conditions.EnableHighAvailabilityNATInAZ3['Fn::And'];

      expect(condition).toEqual(
        expect.arrayContaining([
          { Condition: 'EnableHighAvailabilityNAT' },
          { Condition: 'UseAZ3' },
        ])
      );
    });
  });

  describe('Networking resources', () => {
    test('creates VPC with DNS support and owner tagging', () => {
      const vpc = resources.VPC;
      const tags = vpc.Properties.Tags;
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');

      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
    });

    test('applies conditional creation to optional public subnets', () => {
      const publicSubnet2 = resources.PublicSubnet2;
      const publicSubnet3 = resources.PublicSubnet3;

      expect(publicSubnet2.Condition).toBe('UseAZ2');
      expect(publicSubnet3.Condition).toBe('UseAZ3');
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::If']).toBeDefined();
      expect(publicSubnet3.Properties.AvailabilityZone['Fn::If']).toBeDefined();
    });

    test('ties NAT gateways to the correct subnets with HA controls', () => {
      const nat1 = resources.NATGateway1;
      const nat2 = resources.NATGateway2;
      const nat3 = resources.NATGateway3;

      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat2.Condition).toBe('EnableHighAvailabilityNAT');
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(nat3.Condition).toBe('EnableHighAvailabilityNATInAZ3');
      expect(nat3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });

    test('secures load balancer ingress to HTTPS and HTTP', () => {
      const albSecurityGroup = resources.ALBSecurityGroup;
      const ingressPorts = albSecurityGroup.Properties.SecurityGroupIngress.map(
        (rule: any) => rule.FromPort
      );

      expect(ingressPorts).toEqual(expect.arrayContaining([80, 443]));
      albSecurityGroup.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).toBe('0.0.0.0/0');
      });
    });
  });

  describe('Compute and scaling', () => {
    test('launch template installs application stack and health endpoint', () => {
      const launchTemplate = resources.LaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];

      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('/var/www/html/health');
    });

    test('auto scaling group integrates with ALB target group', () => {
      const asg = resources.AutoScalingGroup;

      expect(asg.Condition).toBeUndefined();
      expect(asg.Properties.TargetGroupARNs['Fn::If']).toBeDefined();
      expect(asg.Properties.HealthCheckType['Fn::If']).toBeDefined();
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('target tracking policy references CPU alarm threshold parameter', () => {
      const policy = resources.TargetTrackingScalingPolicy;
      const targetValue = policy.Properties.TargetTrackingConfiguration.TargetValue;

      expect(targetValue).toEqual({ Ref: 'CPUAlarmThreshold' });
    });
  });

  describe('Data services', () => {
    test('aurora cluster uses secrets manager and encryption', () => {
      const cluster = resources.AuroraCluster;
      const username = cluster.Properties.MasterUsername;
      const password = cluster.Properties.MasterUserPassword;

      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineVersion).toBe('8.0.mysql_aurora.3.10.0');
      expect(username['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'DBKMSKey' });
      expect(cluster.Properties.EnableIAMDatabaseAuthentication).toBe(true);
    });

    test('database subnet group spans conditional private subnets', () => {
      const subnetGroup = resources.DBSubnetGroup;
      const [, threeAzSubnets, twoAzSubnets] = subnetGroup.Properties.SubnetIds['Fn::If'];

      expect(subnetGroup.Condition).toBe('UseAZ2');
      expect(threeAzSubnets).toEqual([
        { Ref: 'PrivateDBSubnet1' },
        { Ref: 'PrivateDBSubnet2' },
        { Ref: 'PrivateDBSubnet3' },
      ]);
      expect(twoAzSubnets).toEqual([{ Ref: 'PrivateDBSubnet1' }, { Ref: 'PrivateDBSubnet2' }]);
    });
  });

  describe('Storage and logging', () => {
    test('application logs bucket enforces encryption and glacier retention', () => {
      const bucket = resources.ApplicationLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(encryption.SSEAlgorithm).toBe('AES256');
      const glacierRule = lifecycleRules.find((rule: any) => rule.Id === 'TransitionToGlacier');
      expect(glacierRule.Transitions[0].StorageClass).toBe('GLACIER');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('database backup bucket uses KMS and deep archive transitions', () => {
      const bucket = resources.DatabaseBackupBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      const transitions = bucket.Properties.LifecycleConfiguration.Rules[0].Transitions.map(
        (transition: any) => transition.StorageClass
      );

      expect(encryption.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.KMSMasterKeyID).toEqual({ Ref: 'S3KMSKey' });
      expect(transitions).toEqual(expect.arrayContaining(['STANDARD_IA', 'GLACIER', 'DEEP_ARCHIVE']));
    });
  });

  describe('Observability and governance', () => {
    test('cloudwatch alarms fan out to SNS topic', () => {
      const cpuAlarm = resources.HighCPUAlarm;

      expect(cpuAlarm.Condition).toBeUndefined();
      expect(cpuAlarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
      expect(cpuAlarm.Properties.Threshold).toEqual({ Ref: 'CPUAlarmThreshold' });
    });

    test('config starter lambda is permitted to pass config role', () => {
      const role = resources.ConfigRecorderStarterRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      const passRoleStatement = statements.find(
        (statement: any) =>
          Array.isArray(statement.Action)
            ? statement.Action.includes('iam:PassRole')
            : statement.Action === 'iam:PassRole'
      );

      expect(passRoleStatement.Resource).toEqual({
        'Fn::GetAtt': ['ConfigRole', 'Arn'],
      });
    });

    test('config custom resource waits on bucket policy and injects dependencies', () => {
      const customResource = resources.ConfigRecorderStarter;
      const dependsOn = Array.isArray(customResource.DependsOn)
        ? customResource.DependsOn
        : [customResource.DependsOn];

      expect(dependsOn).toEqual(['ConfigBucketPolicy']);
      expect(customResource.Properties.ConfigBucketName).toEqual({ Ref: 'ConfigBucket' });
      expect(customResource.Properties.ConfigRoleArn).toEqual({
        'Fn::GetAtt': ['ConfigRole', 'Arn'],
      });
    });
  });

  describe('Outputs', () => {
    test('exposes conditional ALB outputs only when multi-az is enabled', () => {
      const albDnsOutput = template.Outputs.ALBDNSName;
      const albArnOutput = template.Outputs.ALBArn;

      expect(albDnsOutput.Condition).toBe('UseAZ2');
      expect(albArnOutput.Condition).toBe('UseAZ2');
      expect(albDnsOutput.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
      expect(albArnOutput.Value.Ref).toBe('ApplicationLoadBalancer');
    });

    test('exports bucket identifiers for downstream stacks', () => {
      const appLogsBucket = template.Outputs.ApplicationLogsBucketName;
      const dbBackupBucket = template.Outputs.DatabaseBackupBucketName;

      expect(appLogsBucket.Value).toEqual({ Ref: 'ApplicationLogsBucket' });
      expect(dbBackupBucket.Value).toEqual({ Ref: 'DatabaseBackupBucket' });
      expect(appLogsBucket.Export.Name['Fn::Sub']).toContain('-AppLogs-Bucket');
      expect(dbBackupBucket.Export.Name['Fn::Sub']).toContain('-DBBackup-Bucket');
    });
  });
});
