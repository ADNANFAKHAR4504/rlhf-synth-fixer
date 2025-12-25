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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready multi-region security configuration template'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();

      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toHaveLength(3);

      const groupLabels = parameterGroups.map(
        (group: any) => group.Label.default
      );
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('Network Configuration');
      expect(groupLabels).toContain('Security Configuration');
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'ProjectName',
      'Environment',
      'PrimaryRegion',
      'SecondaryRegion',
      'VpcCidr',
      'PublicSubnetCidr1',
      'PublicSubnetCidr2',
      'PrivateSubnetCidr1',
      'PrivateSubnetCidr2',
      'DatabaseSubnetCidr1',
      'DatabaseSubnetCidr2',
      'AllowedIPRanges',
      'KMSKeyAlias',
      'NotificationEmail',
      'EnableVPCFlowLogs',
      'EnableNATGateway',
      'EnableGuardDuty',
      'EnableCloudTrail',
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secureapp');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$');
      expect(param.Description).toBe('Project name for resource naming');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(63);
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['dev', 'test', 'staging', 'prod']);
      expect(param.Default).toBe('prod');
    });

    test('VpcCidr parameter should have CIDR pattern validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe(
        '^(([0-9]{1,3}\\.){3}[0-9]{1,3})/(1[6-9]|2[0-8])$'
      );
    });

    test('NotificationEmail parameter should have email pattern validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe(
        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
    });

    test('AllowedIPRanges parameter should be CommaDelimitedList', () => {
      const param = template.Parameters.AllowedIPRanges;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('10.0.0.0/8,172.16.0.0/12,192.168.0.0/16');
    });
  });

  describe('Conditions', () => {
    test('should have IsPrimaryRegion condition', () => {
      expect(template.Conditions.IsPrimaryRegion).toBeDefined();
      expect(template.Conditions.IsPrimaryRegion).toEqual({
        'Fn::Equals': [{ Ref: 'AWS::Region' }, { Ref: 'PrimaryRegion' }],
      });
    });

    test('should have IsProductionEnvironment condition', () => {
      expect(template.Conditions.IsProductionEnvironment).toBeDefined();
      expect(template.Conditions.IsProductionEnvironment).toEqual({
        'Fn::Equals': [{ Ref: 'Environment' }, 'prod'],
      });
    });

    test('should have EnableNATGatewayCondition condition', () => {
      expect(template.Conditions.EnableNATGatewayCondition).toBeDefined();
      expect(template.Conditions.EnableNATGatewayCondition).toEqual({
        'Fn::Equals': [{ Ref: 'EnableNATGateway' }, 'true'],
      });
    });

    test('should have EnableVPCFlowLogsCondition condition', () => {
      expect(template.Conditions.EnableVPCFlowLogsCondition).toBeDefined();
      expect(template.Conditions.EnableVPCFlowLogsCondition).toEqual({
        'Fn::Equals': [{ Ref: 'EnableVPCFlowLogs' }, 'true'],
      });
    });

    test('should have EnableGuardDutyCondition condition', () => {
      expect(template.Conditions.EnableGuardDutyCondition).toBeDefined();
      expect(template.Conditions.EnableGuardDutyCondition).toEqual({
        'Fn::And': [
          { 'Fn::Equals': [{ Ref: 'EnableGuardDuty' }, 'true'] },
          { Condition: 'IsPrimaryRegion' },
        ],
      });
    });

    test('should have EnableCloudTrailCondition condition', () => {
      expect(template.Conditions.EnableCloudTrailCondition).toBeDefined();
      expect(template.Conditions.EnableCloudTrailCondition).toEqual({
        'Fn::And': [
          { 'Fn::Equals': [{ Ref: 'EnableCloudTrail' }, 'true'] },
          { Condition: 'IsPrimaryRegion' },
        ],
      });
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have public subnets with correct properties', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');

      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });

      expect(subnet1.Properties.CidrBlock).toEqual({
        Ref: 'PublicSubnetCidr1',
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        Ref: 'PublicSubnetCidr2',
      });

      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets with correct properties', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');

      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });

      expect(subnet1.Properties.CidrBlock).toEqual({
        Ref: 'PrivateSubnetCidr1',
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        Ref: 'PrivateSubnetCidr2',
      });
    });

    test('should have database subnets with correct properties', () => {
      const subnet1 = template.Resources.DatabaseSubnet1;
      const subnet2 = template.Resources.DatabaseSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');

      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });

      expect(subnet1.Properties.CidrBlock).toEqual({
        Ref: 'DatabaseSubnetCidr1',
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        Ref: 'DatabaseSubnetCidr2',
      });
    });

    test('should have NAT Gateways with conditions', () => {
      const natGateway1 = template.Resources.NATGateway1;
      const natGateway2 = template.Resources.NATGateway2;
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(natGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');

      expect(natGateway1.Condition).toBe('EnableNATGatewayCondition');
      expect(natGateway2.Condition).toBe('EnableNATGatewayCondition');
      expect(eip1.Condition).toBe('EnableNATGatewayCondition');
      expect(eip2.Condition).toBe('EnableNATGatewayCondition');
    });

    test('should have route tables and associations', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;
      const databaseRT = template.Resources.DatabaseRouteTable;

      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT2.Type).toBe('AWS::EC2::RouteTable');
      expect(databaseRT.Type).toBe('AWS::EC2::RouteTable');

      // Check route table associations
      const publicAssoc1 =
        template.Resources.PublicSubnet1RouteTableAssociation;
      const publicAssoc2 =
        template.Resources.PublicSubnet2RouteTableAssociation;

      expect(publicAssoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(publicAssoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have VPC Flow Logs with conditions', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      const flowLogsGroup = template.Resources.VPCFlowLogsGroup;
      const flowLogsRole = template.Resources.VPCFlowLogsRole;

      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(flowLogsRole.Type).toBe('AWS::IAM::Role');

      expect(flowLogs.Condition).toBe('EnableVPCFlowLogsCondition');
      expect(flowLogsGroup.Condition).toBe('EnableVPCFlowLogsCondition');
      expect(flowLogsRole.Condition).toBe('EnableVPCFlowLogsCondition');
    });

    test('should have database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'DatabaseSubnet1' },
        { Ref: 'DatabaseSubnet2' },
      ]);
    });
  });

  describe('Security Groups', () => {
    test('should have web security group with correct ingress rules', () => {
      const webSG = template.Resources.WebSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = webSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // HTTPS rule
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(443);
      expect(ingressRules[0].ToPort).toBe(443);
      expect(ingressRules[0].CidrIp).toBe('0.0.0.0/0');

      // HTTP rule
      expect(ingressRules[1].IpProtocol).toBe('tcp');
      expect(ingressRules[1].FromPort).toBe(80);
      expect(ingressRules[1].ToPort).toBe(80);
      expect(ingressRules[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have database security group with restricted access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // MySQL rule
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({
        Ref: 'WebSecurityGroup',
      });

      // PostgreSQL rule
      expect(ingressRules[1].IpProtocol).toBe('tcp');
      expect(ingressRules[1].FromPort).toBe(5432);
      expect(ingressRules[1].ToPort).toBe(5432);
      expect(ingressRules[1].SourceSecurityGroupId).toEqual({
        Ref: 'WebSecurityGroup',
      });
    });

    test('should have lambda security group with HTTPS egress only', () => {
      const lambdaSG = template.Resources.LambdaSecurityGroup;
      expect(lambdaSG.Type).toBe('AWS::EC2::SecurityGroup');

      const egressRules = lambdaSG.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].IpProtocol).toBe('tcp');
      expect(egressRules[0].FromPort).toBe(443);
      expect(egressRules[0].ToPort).toBe(443);
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have management security group using allowed IP ranges', () => {
      const mgmtSG = template.Resources.ManagementSecurityGroup;
      expect(mgmtSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = mgmtSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // SSH rule
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      expect(ingressRules[0].CidrIp).toEqual({
        'Fn::Select': [0, { Ref: 'AllowedIPRanges' }],
      });

      // RDP rule
      expect(ingressRules[1].IpProtocol).toBe('tcp');
      expect(ingressRules[1].FromPort).toBe(3389);
      expect(ingressRules[1].ToPort).toBe(3389);
      expect(ingressRules[1].CidrIp).toEqual({
        'Fn::Select': [0, { Ref: 'AllowedIPRanges' }],
      });
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with proper policy and security features', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');

      // Check security features
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(kmsKey.Properties.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(kmsKey.Properties.MultiRegion).toBe(false);

      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(6); // Updated to include all services

      // Check for IAM root permissions
      const rootStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'EnableIAMUserPermissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');

      // Check for CloudTrail permissions
      const cloudTrailStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowCloudTrail'
      );
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe(
        'cloudtrail.amazonaws.com'
      );

      // Check for RDS permissions
      const rdsStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowRDS'
      );
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');

      // Check for additional services
      const dynamoDBStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowDynamoDB'
      );
      expect(dynamoDBStatement).toBeDefined();

      const s3Statement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowS3'
      );
      expect(s3Statement).toBeDefined();

      const secretsManagerStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowSecretsManager'
      );
      expect(secretsManagerStatement).toBeDefined();
    });

    test('should have KMS alias', () => {
      const alias = template.Resources.KMSKeyAliasResource;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Resources', () => {
    test('should have secure S3 bucket with encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      // Ensure bucket optionally depends on Lambda permission (may be array or undefined at synth time)
      if (bucket.DependsOn) {
        if (Array.isArray(bucket.DependsOn)) {
          expect(bucket.DependsOn).toContain('SecurityLambdaPermission');
        } else {
          expect(bucket.DependsOn).toBe('SecurityLambdaPermission');
        }
      }

      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'KMSKey',
      });
      expect(encryption.BucketKeyEnabled).toBe(true);

      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have secure S3 bucket policy denying insecure transport', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'SecureS3Bucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('should have CloudTrail S3 bucket with conditions', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Condition).toBe('EnableCloudTrailCondition');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have MFA enforced role', () => {
      const role = template.Resources.MFAEnforcedRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(true);

      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/ReadOnlyAccess'
      );
    });

    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');

      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(4); // Updated to include all policies

      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('CloudWatchLogsPolicy');
      expect(policyNames).toContain('SNSPublishPolicy');
      expect(policyNames).toContain('SQSPolicy');
      expect(policyNames).toContain('KMSPolicy');
    });
  });

  describe('CloudWatch Logs', () => {
    const logGroups = ['S3LogGroup', 'LambdaLogGroup', 'SecurityLogGroup'];

    test('should have all required log groups', () => {
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });
    });

    test('should have conditional retention periods', () => {
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toEqual({
          'Fn::If': ['IsProductionEnvironment', 365, 30],
        });
      });
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS secret', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      const generateString = secret.Properties.GenerateSecretString;
      expect(generateString.SecretStringTemplate).toBe('{"username":"admin"}');
      expect(generateString.GenerateStringKey).toBe('password');
      expect(generateString.PasswordLength).toBe(32);
      expect(generateString.ExcludeCharacters).toBe('"@/\\');
    });

    test('should have RDS instance with security features', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');

      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.VPCSecurityGroups).toEqual([
        { Ref: 'DatabaseSecurityGroup' },
      ]);
      expect(rds.Properties.DBSubnetGroupName).toEqual({
        Ref: 'DatabaseSubnetGroup',
      });

      // Conditional properties
      expect(rds.Properties.BackupRetentionPeriod).toEqual({
        'Fn::If': ['IsProductionEnvironment', 7, 1],
      });
      expect(rds.Properties.MultiAZ).toEqual({
        'Fn::If': ['IsProductionEnvironment', true, false],
      });
      expect(rds.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('DynamoDB', () => {
    test('should have DynamoDB table with encryption', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' },
      ]);
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' },
      ]);

      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({
        Ref: 'KMSKey',
      });
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });
  });

  describe('Lambda', () => {
    test('should have security Lambda function with updated configuration', () => {
      const lambda = template.Resources.SecurityLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(512);

      const vpcConfig = lambda.Properties.VpcConfig;
      expect(vpcConfig.SecurityGroupIds).toEqual([
        { Ref: 'LambdaSecurityGroup' },
      ]);
      expect(vpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);

      expect(lambda.Properties.Environment.Variables.LOG_LEVEL).toBe('INFO');
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'SecurityNotificationTopic',
      });
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'Environment',
      });
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['LambdaDeadLetterQueue', 'Arn'],
      });
    });

    test('should have Lambda permission for S3 notifications', () => {
      const permission = template.Resources.SecurityLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'SecurityLambdaFunction',
      });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceAccount).toEqual({
        Ref: 'AWS::AccountId',
      });
    });

    test('should have SNS topic for notifications', () => {
      const topic = template.Resources.SecurityNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });

      const subscription = template.Resources.SecurityNotificationSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({
        Ref: 'NotificationEmail',
      });
    });

    test('should have Dead Letter Queue for Lambda', () => {
      const dlq = template.Resources.LambdaDeadLetterQueue;
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
      expect(dlq.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('WAF', () => {
    test('should have WebACL with managed rules', () => {
      const webACL = template.Resources.WebACL;
      expect(webACL.Type).toBe('AWS::WAFv2::WebACL');

      expect(webACL.Properties.Scope).toBe('REGIONAL');
      expect(webACL.Properties.DefaultAction).toEqual({ Allow: {} });

      const rules = webACL.Properties.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Name).toBe('AWSManagedRulesCommonRuleSet');
      expect(rules[0].Priority).toBe(1);
      expect(rules[0].Statement.ManagedRuleGroupStatement.VendorName).toBe(
        'AWS'
      );
      expect(rules[0].Statement.ManagedRuleGroupStatement.Name).toBe(
        'AWSManagedRulesCommonRuleSet'
      );
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail with conditional creation', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Condition).toBe('EnableCloudTrailCondition');

      expect(trail.Properties.S3BucketName).toEqual({
        Ref: 'CloudTrailS3Bucket',
      });
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('GuardDuty', () => {
    test('should have GuardDuty detector with conditional creation', () => {
      const detector = template.Resources.GuardDutyDetector;
      expect(detector.Type).toBe('AWS::GuardDuty::Detector');
      expect(detector.Condition).toBe('EnableGuardDutyCondition');
      expect(detector.Properties.Enable).toBe(true);
      expect(detector.Properties.FindingPublishingFrequency).toBe(
        'FIFTEEN_MINUTES'
      );
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'KMSKeyId',
      'KMSKeyArn',
      'WebSecurityGroupId',
      'DatabaseSecurityGroupId',
      'LambdaSecurityGroupId',
      'SecureS3BucketName',
      'CloudTrailS3BucketName',
      'DynamoDBTableName',
      'RDSSecretName',
      'RDSEndpoint',
      'RDSPort',
      'LambdaFunctionArn',
      'LambdaFunctionName',
      'GuardDutyDetectorId',
      'CloudTrailArn',
      'WebACLArn',
      'SecurityNotificationTopicArn',
      'VPCFlowLogsGroup',
      'Environment',
      'ProjectName',
      'SecondaryRegion',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(typeof template.Outputs[outputName].Description).toBe('string');
      });
    });

    test('network outputs should have exports', () => {
      const networkOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
      ];
      networkOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('RDSEndpoint output should use GetAtt', () => {
      expect(template.Outputs.RDSEndpoint.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });

    test('conditional outputs should handle conditions', () => {
      expect(template.Outputs.CloudTrailS3BucketName.Value).toEqual({
        'Fn::If': [
          'EnableCloudTrailCondition',
          { Ref: 'CloudTrailS3Bucket' },
          'N/A - CloudTrail Disabled or Not Primary Region',
        ],
      });
      expect(template.Outputs.VPCFlowLogsGroup.Value).toEqual({
        'Fn::If': [
          'EnableVPCFlowLogsCondition',
          { Ref: 'VPCFlowLogsGroup' },
          'N/A - VPC Flow Logs Disabled',
        ],
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce HTTPS only for S3 buckets', () => {
      const bucketPolicies = [
        'SecureS3BucketPolicy',
        'CloudTrailS3BucketPolicy',
      ];

      bucketPolicies.forEach(policyName => {
        if (template.Resources[policyName]) {
          const policy = template.Resources[policyName];
          const statements = policy.Properties.PolicyDocument.Statement;
          const httpsStatement = statements.find(
            (stmt: any) =>
              stmt.Sid === 'DenyInsecureTransport' || stmt.Effect === 'Deny'
          );
          expect(httpsStatement).toBeDefined();
        }
      });
    });

    test('should have encryption enabled for all storage resources', () => {
      // S3 encryption
      expect(
        template.Resources.SecureS3Bucket.Properties.BucketEncryption
      ).toBeDefined();
      expect(
        template.Resources.CloudTrailS3Bucket.Properties.BucketEncryption
      ).toBeDefined();

      // RDS encryption
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(
        true
      );

      // DynamoDB encryption
      expect(
        template.Resources.DynamoDBTable.Properties.SSESpecification.SSEEnabled
      ).toBe(true);
    });

    test('should have proper network isolation', () => {
      // Database should not be publicly accessible
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(
        false
      );

      // Security groups should follow principle of least privilege
      const dbSG = template.Resources.DatabaseSecurityGroup;
      dbSG.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.CidrIp).toBeUndefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(45); // Even more resources now with ManagementSG
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(18); // Updated parameter count after removing CloudTrailBucketName
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(26); // Updated output count with SecondaryRegion
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = [
      'VPC',
      'DatabaseSubnet1',
      'DatabaseSubnet2',
      'DatabaseSubnetGroup',
      'WebSecurityGroup',
      'DatabaseSecurityGroup',
      'LambdaSecurityGroup',
      'SecureS3Bucket',
    ];

    test('should have proper tags on resources', () => {
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);

        const nameTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use consistent naming patterns', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];

        // Check if resource has a name property that uses Sub function
        if (
          resource.Properties.TableName ||
          resource.Properties.BucketName ||
          resource.Properties.GroupName ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName ||
          resource.Properties.TrailName
        ) {
          const nameProperty =
            resource.Properties.TableName ||
            resource.Properties.BucketName ||
            resource.Properties.GroupName ||
            resource.Properties.RoleName ||
            resource.Properties.FunctionName ||
            resource.Properties.TrailName;

          if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${ProjectName}');
            expect(nameProperty['Fn::Sub']).toContain('${Environment}');
          }
        }
      });
    });
  });
});
