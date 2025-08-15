import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure multi-tier infrastructure with S3 data lake, EC2 compute, RDS database, and comprehensive security controls'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toHaveLength(4);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'VpcCidr',
        'AllowedCidrBlock',
        'DBUsername',
        'InstanceType',
        'KeyPairName',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('VpcCidr parameter should have correct defaults', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
    });

    test('InstanceType should have allowed values', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.AllowedValues).toContain('t3.micro');
      expect(instanceTypeParam.AllowedValues).toContain('t3.small');
      expect(instanceTypeParam.Default).toBe('t3.micro');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('should have S3 KMS key with rotation', () => {
      const s3Key = template.Resources.S3KMSKey;
      expect(s3Key).toBeDefined();
      expect(s3Key.Type).toBe('AWS::KMS::Key');
      expect(s3Key.Properties.EnableKeyRotation).toBe(true);
      expect(s3Key.DeletionPolicy).toBe('Delete');
    });

    test('should have RDS KMS key with rotation', () => {
      const rdsKey = template.Resources.RDSKMSKey;
      expect(rdsKey).toBeDefined();
      expect(rdsKey.Type).toBe('AWS::KMS::Key');
      expect(rdsKey.Properties.EnableKeyRotation).toBe(true);
      expect(rdsKey.DeletionPolicy).toBe('Delete');
    });

    test('should have CloudTrail KMS key with rotation', () => {
      const ctKey = template.Resources.CloudTrailKMSKey;
      expect(ctKey).toBeDefined();
      expect(ctKey.Type).toBe('AWS::KMS::Key');
      expect(ctKey.Properties.EnableKeyRotation).toBe(true);
      expect(ctKey.DeletionPolicy).toBe('Delete');
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.CloudTrailKMSKeyAlias).toBeDefined();
    });
  });

  describe('VPC and Network Configuration', () => {
    test('should have VPC with correct settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.DeletionPolicy).toBe('Delete');
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      const igwAttachment = template.Resources.InternetGatewayAttachment;
      expect(igwAttachment).toBeDefined();
      expect(igwAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have database subnets', () => {
      const dbSubnet1 = template.Resources.DatabaseSubnet1;
      const dbSubnet2 = template.Resources.DatabaseSubnet2;

      expect(dbSubnet1).toBeDefined();
      expect(dbSubnet2).toBeDefined();
      expect(dbSubnet1.Properties.CidrBlock).toBe('10.0.21.0/24');
      expect(dbSubnet2.Properties.CidrBlock).toBe('10.0.22.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      const natEIP = template.Resources.NatGateway1EIP;
      const natGateway = template.Resources.NatGateway1;

      expect(natEIP).toBeDefined();
      expect(natEIP.Type).toBe('AWS::EC2::EIP');
      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables configured correctly', () => {
      const publicRoute = template.Resources.PublicRouteTable;
      const privateRoute = template.Resources.PrivateRouteTable1;

      expect(publicRoute).toBeDefined();
      expect(privateRoute).toBeDefined();

      const defaultPublicRoute = template.Resources.DefaultPublicRoute;
      expect(defaultPublicRoute.Properties.DestinationCidrBlock).toBe(
        '0.0.0.0/0'
      );

      const defaultPrivateRoute = template.Resources.DefaultPrivateRoute1;
      expect(defaultPrivateRoute.Properties.DestinationCidrBlock).toBe(
        '0.0.0.0/0'
      );
    });
  });

  describe('Security Groups', () => {
    test('should have API Gateway security group', () => {
      const apiSG = template.Resources.APIGatewaySecurityGroup;
      expect(apiSG).toBeDefined();
      expect(apiSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(apiSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(apiSG.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
    });

    test('should have Web Server security group', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG).toBeDefined();
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSG.Properties.SecurityGroupIngress).toHaveLength(2);
    });

    test('should have Database security group', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG).toBeDefined();
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(dbSG.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
    });

    test('security groups should reference each other correctly', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      // Web SG should allow from API Gateway SG
      expect(
        webSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId
      ).toEqual({
        Ref: 'APIGatewaySecurityGroup',
      });

      // DB SG should allow from Web Server SG
      expect(
        dbSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId
      ).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should have Data Lake bucket with encryption', () => {
      const bucket = template.Resources.DataLakeBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');

      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'S3KMSKey',
      });
    });

    test('should have Logging bucket with encryption', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');

      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.ExpirationInDays).toBe(90);
    });

    test('should have CloudTrail bucket with policy', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const policy = template.Resources.CloudTrailBucketPolicy;

      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['DataLakeBucket', 'LoggingBucket', 'CloudTrailBucket'];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('Data Lake bucket should have versioning enabled', () => {
      const bucket = template.Resources.DataLakeBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 role with correct policies', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');

      const policies = role.Properties.ManagedPolicyArns;
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('should have S3 access policy with least privilege', () => {
      const policy = template.Resources.S3AccessPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);

      // Check allow statement
      expect(statements[0].Effect).toBe('Allow');
      expect(statements[0].Action).toContain('s3:GetObject');
      expect(statements[0].Action).toContain('s3:PutObject');

      // Check deny statement for IAM policy detachment prevention
      expect(statements[1].Effect).toBe('Deny');
      expect(statements[1].Action).toContain('iam:DetachRolePolicy');
    });

    test('should have RDS enhanced monitoring role', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('EC2 Instances', () => {
    test('should have launch template with monitoring enabled', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');

      const data = launchTemplate.Properties.LaunchTemplateData;
      expect(data.Monitoring.Enabled).toBe(true);
      expect(data.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should have two EC2 instances in private subnets', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1.Type).toBe('AWS::EC2::Instance');
      expect(instance2.Type).toBe('AWS::EC2::Instance');
      expect(instance1.DeletionPolicy).toBe('Delete');
      expect(instance2.DeletionPolicy).toBe('Delete');

      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('launch template should have CloudWatch agent UserData', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData;
      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']['Fn::Sub']).toContain(
        'amazon-cloudwatch-agent'
      );
    });
  });

  describe('RDS Database', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have RDS instance with encryption', () => {
      const db = template.Resources.DBInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');

      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDS should have backup configuration', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.Properties.PreferredMaintenanceWindow).toBe(
        'sun:04:00-sun:05:00'
      );
    });

    test('RDS should have enhanced monitoring', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.MonitoringInterval).toBe(60);
      expect(db.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSEnhancedMonitoringRole', 'Arn'],
      });
    });

    test('RDS should export logs to CloudWatch', () => {
      const db = template.Resources.DBInstance;
      const logExports = db.Properties.EnableCloudwatchLogsExports;

      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail with encryption', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DeletionPolicy).toBe('Delete');

      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'CloudTrailKMSKey' });
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('CloudTrail should monitor S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelector = trail.Properties.EventSelectors[0];

      expect(eventSelector.ReadWriteType).toBe('All');
      expect(eventSelector.IncludeManagementEvents).toBe(true);
      expect(eventSelector.DataResources[0].Type).toBe('AWS::S3::Object');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have RDS log group', () => {
      const logGroup = template.Resources.RDSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('API Gateway', () => {
    test('should have REST API', () => {
      const api = template.Resources.RestApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API resource and method', () => {
      const resource = template.Resources.ApiResource;
      const method = template.Resources.ApiMethod;

      expect(resource).toBeDefined();
      expect(resource.Properties.PathPart).toBe('data');
      expect(method).toBeDefined();
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have API deployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'DataLakeBucketName',
        'LoggingBucketName',
        'CloudTrailBucketName',
        'EC2Instance1Id',
        'EC2Instance2Id',
        'DBInstanceEndpoint',
        'DBInstancePort',
        'ApiGatewayEndpoint',
        'CloudTrailName',
        'EC2RoleArn',
        'S3KMSKeyId',
        'RDSKMSKeyId',
        'CloudTrailKMSKeyId',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });

    test('API Gateway endpoint output should have correct format', () => {
      const apiOutput = template.Outputs.ApiGatewayEndpoint;
      expect(apiOutput.Value).toEqual({
        'Fn::Sub':
          'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/prod',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use environment suffix', () => {
      const resourcesWithNames = [
        'S3KMSKeyAlias',
        'RDSKMSKeyAlias',
        'CloudTrailKMSKeyAlias',
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSubnet1',
        'DatabaseSubnet2',
        'NatGateway1EIP',
        'NatGateway1',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'APIGatewaySecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'DataLakeBucket',
        'LoggingBucket',
        'CloudTrailBucket',
        'EC2Role',
        'EC2InstanceProfile',
        'S3AccessPolicy',
        'LaunchTemplate',
        'EC2Instance1',
        'EC2Instance2',
        'DBSubnetGroup',
        'DBInstance',
        'RDSEnhancedMonitoringRole',
        'CloudTrail',
        'RestApi',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check if resource has a name property that includes environment suffix
        if (resource.Properties) {
          const props = resource.Properties;
          const nameProps = [
            'AliasName',
            'BucketName',
            'RoleName',
            'PolicyName',
            'InstanceProfileName',
            'LaunchTemplateName',
            'DBInstanceIdentifier',
            'DBSubnetGroupName',
            'TrailName',
            'GroupName',
            'Name',
          ];

          const foundNameProp = nameProps.find(prop => props[prop]);
          if (foundNameProp && typeof props[foundNameProp] === 'object') {
            // Check if it's using Fn::Sub with EnvironmentSuffix
            if (props[foundNameProp]['Fn::Sub']) {
              expect(props[foundNameProp]['Fn::Sub']).toContain(
                '${EnvironmentSuffix}'
              );
            }
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete policy (no Retain)', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];

        // Check that if DeletionPolicy exists, it's set to Delete
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }

        // Ensure no Retain policies
        expect(resource.DeletionPolicy).not.toBe('Retain');

        // Check UpdateReplacePolicy as well
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all KMS keys should have key rotation enabled', () => {
      const kmsKeys = ['S3KMSKey', 'RDSKMSKey', 'CloudTrailKMSKey'];

      kmsKeys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });

    test('RDS should use encrypted storage', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('S3 buckets should use KMS encryption', () => {
      const buckets = ['DataLakeBucket', 'LoggingBucket', 'CloudTrailBucket'];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'aws:kms'
        );
      });
    });

    test('EC2 instances should be in private subnets', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;

      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('security groups should follow least privilege principle', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;

      // Database should only accept from web servers
      expect(dbSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(
        dbSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId
      ).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple availability zones', () => {
      // Check subnets are in different AZs
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('RDS should use subnet group with multiple AZs', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({
        Ref: 'DatabaseSubnet1',
      });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({
        Ref: 'DatabaseSubnet2',
      });
    });

    test('should have EC2 instances in different AZs', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;

      // Instances are in different private subnets (which are in different AZs)
      expect(instance1.Properties.SubnetId).not.toEqual(
        instance2.Properties.SubnetId
      );
    });
  });

  describe('Monitoring and Logging', () => {
    test('EC2 instances should have detailed monitoring', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(
        launchTemplate.Properties.LaunchTemplateData.Monitoring.Enabled
      ).toBe(true);
    });

    test('RDS should have enhanced monitoring', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.MonitoringInterval).toBe(60);
    });

    test('CloudTrail should be enabled with validation', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('Data Lake bucket should have access logging', () => {
      const bucket = template.Resources.DataLakeBucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(
        bucket.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({
        Ref: 'LoggingBucket',
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(45);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(16);
    });

    test('should have correct number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(6);
    });
  });
});
