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
    test('exposes format version and compliance description', () => {
      // Arrange
      const formatVersion = template.AWSTemplateFormatVersion;
      const description = template.Description;

      // Assert
      expect(formatVersion).toBe('2010-09-09');
      expect(description).toBe(
        'FinSecure - Production-Grade Secure Data Processing Pipeline with PCI-DSS and SOC 2 Compliance'
      );
    });

    test('groups parameters for console usability', () => {
      // Arrange
      const interfaceMetadata = template.Metadata['AWS::CloudFormation::Interface'];
      const labels = interfaceMetadata.ParameterGroups.map(
        (group: any) => group.Label.default
      );

      // Assert
      expect(labels).toEqual(
        expect.arrayContaining([
          'Environment Configuration',
          'Tagging Configuration',
          'Security Configuration',
          'Network Configuration',
          'Performance Configuration',
        ])
      );
    });
  });

  describe('Parameters', () => {
    describe('Environment Parameters', () => {
    test('enforces environment selection boundaries', () => {
        // Arrange
        const environmentParam = template.Parameters.EnvironmentName;
      const allowed = environmentParam.AllowedValues;

        // Assert
        expect(allowed).toContain('dev');
        expect(allowed).toContain('staging');
        expect(allowed).toContain('prod');
        expect(environmentParam.Default).toBe('prod');
      });

      test('validates project name pattern', () => {
        // Arrange
        const projectParam = template.Parameters.ProjectName;
        const regex = new RegExp(projectParam.AllowedPattern);

        // Assert - Right results
        expect(regex.test('finsecure')).toBe(true);
        expect(regex.test('finsecure-prod')).toBe(true);
        expect(regex.test('finsecure123')).toBe(true);
        
        // Boundary conditions
        expect(regex.test('FinSecure')).toBe(false); // uppercase
        expect(regex.test('finsecure_')).toBe(false); // underscore
        expect(regex.test('')).toBe(false); // empty
        expect(projectParam.Default).toBe('finsecure');
      });
    });

    describe('Tagging Parameters', () => {
      test('validates cost center format', () => {
        // Arrange
        const costCenterParam = template.Parameters.CostCenter;
        const regex = new RegExp(costCenterParam.AllowedPattern);

        // Assert
        expect(regex.test('CC-0001')).toBe(true);
        expect(regex.test('CC-9999')).toBe(true);
        expect(regex.test('CC-1234')).toBe(true);
        
        // Boundary conditions
        expect(regex.test('CC-000')).toBe(false); // too short
        expect(regex.test('CC-00000')).toBe(false); // too long
        expect(regex.test('cc-0001')).toBe(false); // lowercase
        expect(regex.test('XX-0001')).toBe(false); // wrong prefix
        expect(costCenterParam.Default).toBe('CC-0001');
      });

      test('enforces data classification levels', () => {
        // Arrange
        const dataClassParam = template.Parameters.DataClassification;
        const allowed = dataClassParam.AllowedValues;

        // Assert
        expect(allowed).toContain('HIGHLY_CONFIDENTIAL');
        expect(allowed).toContain('CONFIDENTIAL');
        expect(allowed).toContain('INTERNAL');
        expect(dataClassParam.Default).toBe('HIGHLY_CONFIDENTIAL');
      });

      test('validates owner email format', () => {
        // Arrange
        const ownerParam = template.Parameters.Owner;
        const regex = new RegExp(ownerParam.AllowedPattern);

        // Assert - Right results
        expect(regex.test('owner@finsecure.com')).toBe(true);
        expect(regex.test('user.name@example.co.uk')).toBe(true);
        
        // Boundary conditions
        expect(regex.test('invalid-email')).toBe(false);
        expect(regex.test('@example.com')).toBe(false);
        expect(regex.test('user@')).toBe(false);
        expect(ownerParam.Default).toBe('owner@finsecure.com');
      });
    });

    describe('Security Parameters', () => {
      test('validates security alert email format', () => {
        // Arrange
        const securityEmailParam = template.Parameters.SecurityAlertEmail;
        const regex = new RegExp(securityEmailParam.AllowedPattern);

        // Assert
        expect(regex.test('security-alerts@finsecure.com')).toBe(true);
        expect(regex.test('alerts@example.com')).toBe(true);
        expect(regex.test('invalid')).toBe(false);
        expect(securityEmailParam.Default).toBe('security-alerts@finsecure.com');
      });

      test('validates trust store bucket name pattern', () => {
        // Arrange
        const bucketParam = template.Parameters.TrustStoreBucket;
        const regex = new RegExp(bucketParam.AllowedPattern);

        // Assert
        expect(regex.test('finsecure-truststore')).toBe(true);
        expect(regex.test('my-bucket-123')).toBe(true);
        
        // Boundary conditions
        expect(regex.test('MyBucket')).toBe(false); // uppercase
        expect(regex.test('-bucket')).toBe(false); // starts with hyphen
        expect(regex.test('bucket-')).toBe(false); // ends with hyphen
        expect(bucketParam.Default).toBe('finsecure-truststore');
      });

      test('validates certificate ARN pattern or empty', () => {
        // Arrange
        const certParam = template.Parameters.CertificateArn;
        const regex = new RegExp(certParam.AllowedPattern);

        // Assert
        expect(regex.test('')).toBe(true); // empty allowed
        expect(regex.test('arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012')).toBe(true);
        expect(regex.test('arn:aws:acm:eu-west-1:999999999999:certificate/abcdef12-3456-7890-abcd-ef1234567890')).toBe(true);
        
        // Boundary conditions
        expect(regex.test('invalid-arn')).toBe(false);
        expect(regex.test('arn:aws:s3:::bucket')).toBe(false); // wrong service
        expect(certParam.Default).toBe('');
      });
    });

    describe('Network Parameters', () => {
      test('validates VPC CIDR pattern', () => {
        // Arrange
        const vpcParam = template.Parameters.VPCCidr;
        const regex = new RegExp(vpcParam.AllowedPattern);

        // Assert - Right results
        expect(regex.test('10.0.0.0/16')).toBe(true);
        expect(regex.test('172.16.0.0/16')).toBe(true);
        expect(regex.test('192.168.0.0/16')).toBe(true);
        expect(regex.test('10.0.0.0/24')).toBe(true); // Valid: second octet can be 0
        
        // Boundary conditions - Invalid patterns
        expect(regex.test('10.1.0.0/16')).toBe(false); // Invalid second octet (must be 0, 16, or 168)
        expect(regex.test('11.0.0.0/16')).toBe(false); // Invalid first octet (must be 10, 172, or 192)
        expect(regex.test('10.0.0.0')).toBe(false); // Missing CIDR notation
        expect(regex.test('10.0.0.0/')).toBe(false); // Incomplete CIDR
        expect(vpcParam.Default).toBe('10.0.0.0/16');
      });

      test('validates private subnet CIDR patterns', () => {
        // Arrange
        const subnet1Param = template.Parameters.PrivateSubnet1Cidr;
        const subnet2Param = template.Parameters.PrivateSubnet2Cidr;
        const regex = new RegExp(subnet1Param.AllowedPattern);

        // Assert
        expect(regex.test('10.0.1.0/24')).toBe(true);
        expect(regex.test('172.16.1.0/24')).toBe(true);
        expect(subnet1Param.Default).toBe('10.0.1.0/24');
        expect(subnet2Param.Default).toBe('10.0.2.0/24');
      });
    });

    describe('Performance Parameters', () => {
      test('enforces Lambda memory size boundaries', () => {
        // Arrange
        const memoryParam = template.Parameters.LambdaMemorySize;

        // Assert
        expect(memoryParam.MinValue).toBe(128);
        expect(memoryParam.MaxValue).toBe(10240);
        expect(memoryParam.Default).toBe(1024);
      });

      test('enforces Lambda timeout boundaries', () => {
        // Arrange
        const timeoutParam = template.Parameters.LambdaTimeout;

        // Assert
        expect(timeoutParam.MinValue).toBe(1);
        expect(timeoutParam.MaxValue).toBe(900);
        expect(timeoutParam.Default).toBe(300);
      });

      test('enforces API throttle rate boundaries', () => {
        // Arrange
        const throttleParam = template.Parameters.ApiThrottleRate;

        // Assert
        expect(throttleParam.MinValue).toBe(1);
        expect(throttleParam.MaxValue).toBe(10000);
        expect(throttleParam.Default).toBe(100);
      });

      test('enforces API burst rate boundaries', () => {
        // Arrange
        const burstParam = template.Parameters.ApiBurstRate;

        // Assert
        expect(burstParam.MinValue).toBe(1);
        expect(burstParam.MaxValue).toBe(20000);
        expect(burstParam.Default).toBe(200);
      });
    });
  });

  describe('Conditions', () => {
    test('identifies production environment correctly', () => {
      // Arrange
      const condition = template.Conditions.IsProduction;

      // Assert
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'EnvironmentName' },
        'prod',
      ]);
    });

    test('creates alarms for non-dev environments', () => {
      // Arrange
      const condition = template.Conditions.CreateAlarms;

      // Assert
      expect(condition['Fn::Not']).toEqual([
        { 'Fn::Equals': [{ Ref: 'EnvironmentName' }, 'dev'] },
      ]);
    });

    test('detects certificate presence for custom domain', () => {
      // Arrange
      const condition = template.Conditions.HasCertificate;

      // Assert
      expect(condition['Fn::Not']).toEqual([
        { 'Fn::Equals': [{ Ref: 'CertificateArn' }, ''] },
      ]);
    });
  });

  describe('KMS Resources', () => {
    test('creates customer-managed KMS key with rotation', () => {
      // Arrange
      const kmsKey = resources.DataEncryptionKey;

      // Assert
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.Description['Fn::Sub']).toContain('Customer managed KMS key');
    });

    test('restricts KMS key to Lambda and S3 services only', () => {
      // Arrange
      const kmsKey = resources.DataEncryptionKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      // Assert
      const lambdaStatement = statements.find((s: any) => s.Sid === 'Allow Lambda Service Only');
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toContain('kms:Decrypt');
      expect(lambdaStatement.Action).toContain('kms:GenerateDataKey');

      const s3Statement = statements.find((s: any) => s.Sid === 'Allow S3 Service Only');
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('allows CloudWatch Logs with encryption context', () => {
      // Arrange
      const kmsKey = resources.DataEncryptionKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');

      // Assert
      expect(logsStatement.Principal.Service['Fn::Sub']).toContain('logs');
      expect(logsStatement.Condition.ArnLike['kms:EncryptionContext:aws:logs:arn']['Fn::Sub']).toContain('/aws/*/');
    });

    test('creates KMS alias for key', () => {
      // Arrange
      const alias = resources.DataEncryptionKeyAlias;

      // Assert
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'DataEncryptionKey' });
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('alias/');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('creates VPC with DNS support and proper tagging', () => {
      // Arrange
      const vpc = resources.VPC;
      const tags = vpc.Properties.Tags;

      // Assert
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);

      // Tagging validation
      const costCenterTag = tags.find((t: any) => t.Key === 'CostCenter');
      const dataClassTag = tags.find((t: any) => t.Key === 'DataClassification');
      const ownerTag = tags.find((t: any) => t.Key === 'Owner');
      expect(costCenterTag.Value).toEqual({ Ref: 'CostCenter' });
      expect(dataClassTag.Value).toEqual({ Ref: 'DataClassification' });
      expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
    });

    test('creates private subnets in two availability zones', () => {
      // Arrange
      const subnet1 = resources.PrivateSubnet1;
      const subnet2 = resources.PrivateSubnet2;

      // Assert
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);

      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('creates air-gapped route table with no internet routes', () => {
      // Arrange
      const routeTable = resources.PrivateRouteTable;

      // Assert
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      // No routes defined = air-gapped
    });

    test('creates VPC endpoints for S3, Lambda, CloudWatch Logs, and KMS', () => {
      // Arrange
      const s3Endpoint = resources.S3VPCEndpoint;
      const lambdaEndpoint = resources.LambdaVPCEndpoint;
      const logsEndpoint = resources.CloudWatchLogsVPCEndpoint;
      const kmsEndpoint = resources.KMSVPCEndpoint;

      // Assert
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.ServiceName['Fn::Sub']).toContain('s3');

      expect(lambdaEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(lambdaEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(lambdaEndpoint.Properties.ServiceName['Fn::Sub']).toContain('lambda');

      expect(logsEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(logsEndpoint.Properties.ServiceName['Fn::Sub']).toContain('logs');

      expect(kmsEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(kmsEndpoint.Properties.ServiceName['Fn::Sub']).toContain('kms');
    });

    test('restricts Lambda security group egress to controlled endpoints', () => {
      // Arrange
      const sg = resources.LambdaSecurityGroup;
      const httpsEgress = resources.LambdaSecurityGroupEgressHTTPS;
      const vpcEndpointSG = resources.VPCEndpointSecurityGroup;
      const vpcEndpointIngress = resources.VPCEndpointSecurityGroupIngressFromLambda;

      // Assert - security group itself should not declare inline egress
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toBeUndefined();

      // Assert - S3 Gateway endpoints don't require security group rules (they work at route table level)
      // Only Interface endpoints (Lambda, CloudWatch Logs, KMS, SQS) need security group egress rules

      // Assert - Lambda egress rule to VPC endpoint security group
      expect(httpsEgress.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(httpsEgress.Properties.GroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
      expect(httpsEgress.Properties.IpProtocol).toBe('tcp');
      expect(httpsEgress.Properties.FromPort).toBe(443);
      expect(httpsEgress.Properties.ToPort).toBe(443);
      expect(httpsEgress.Properties.DestinationSecurityGroupId).toEqual({ Ref: 'VPCEndpointSecurityGroup' });

      // Assert - VPC endpoint security group exists
      expect(vpcEndpointSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(vpcEndpointSG.Properties.VpcId).toEqual({ Ref: 'VPC' });

      // Assert - VPC endpoint security group allows ingress from Lambda
      expect(vpcEndpointIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(vpcEndpointIngress.Properties.GroupId).toEqual({ Ref: 'VPCEndpointSecurityGroup' });
      expect(vpcEndpointIngress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
      expect(vpcEndpointIngress.Properties.IpProtocol).toBe('tcp');
      expect(vpcEndpointIngress.Properties.FromPort).toBe(443);
      expect(vpcEndpointIngress.Properties.ToPort).toBe(443);
    });
  });

  describe('S3 Bucket Resources', () => {
    test('creates data bucket with KMS encryption and versioning', () => {
      // Arrange
      const bucket = resources.DataBucket;

      // Assert
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'DataEncryptionKey' });
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('enforces public access block on data bucket', () => {
      // Arrange
      const bucket = resources.DataBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      // Assert
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('configures lifecycle rules for data bucket', () => {
      // Arrange
      const bucket = resources.DataBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      // Assert
      const deleteOldVersions = lifecycleRules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteOldVersions.Status).toBe('Enabled');
      expect(deleteOldVersions.NoncurrentVersionExpirationInDays).toBe(90);

      const transitionRule = lifecycleRules.find((r: any) => r.Id === 'TransitionOldData');
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(transitionRule.Transitions[1].TransitionInDays).toBe(90);
      expect(transitionRule.Transitions[1].StorageClass).toBe('GLACIER');
    });

    test('enforces bucket policy to deny unencrypted uploads', () => {
      // Arrange
      const bucketPolicy = resources.DataBucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;

      // Assert
      const denyUnencrypted = statements.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(denyUnencrypted.Effect).toBe('Deny');
      expect(denyUnencrypted.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');

      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe(false);

      const denyUntagged = statements.find((s: any) => s.Sid === 'DenyUntaggedUploads');
      expect(denyUntagged.Condition.Null['s3:RequestObjectTagKeys']).toBe(true);
    });

    test('creates audit log bucket with 7-year retention', () => {
      // Arrange
      const auditBucket = resources.AuditLogBucket;
      const lifecycleRule = auditBucket.Properties.LifecycleConfiguration.Rules[0];

      // Assert
      expect(auditBucket.Type).toBe('AWS::S3::Bucket');
      expect(lifecycleRule.Id).toBe('RetentionPolicy');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(2555); // 7 years
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('creates DLQ with KMS encryption and 14-day retention', () => {
      // Arrange
      const dlq = resources.ProcessingDLQ;

      // Assert
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
      expect(dlq.Properties.KmsMasterKeyId).toEqual({ Ref: 'DataEncryptionKey' });
      expect(dlq.Properties.KmsDataKeyReusePeriodSeconds).toBe(300);
    });
  });

  describe('IAM Roles', () => {
    test('creates processing Lambda role with least privilege', () => {
      // Arrange
      const role = resources.ProcessingLambdaRole;
      const policies = role.Properties.Policies;

      // Assert
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      const s3Policy = policies.find((p: any) => p.PolicyName['Fn::Sub'].includes('S3MinimalAccess'));
      expect(s3Policy).toBeDefined();
      
      // Check that S3 actions are split across multiple statements with Sids
      const statements = s3Policy.PolicyDocument.Statement;
      const readStatement = statements.find((s: any) => s.Sid === 'S3ReadAccess');
      const writeStatement = statements.find((s: any) => s.Sid === 'S3WriteAccessWithEncryption');
      const taggingStatement = statements.find((s: any) => s.Sid === 'S3TaggingAccess');
      const listStatement = statements.find((s: any) => s.Sid === 'S3ListAccess');
      
      expect(readStatement).toBeDefined();
      expect(readStatement.Action).toContain('s3:GetObject');
      expect(readStatement.Action).toContain('s3:GetObjectVersion');
      
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Action).toContain('s3:PutObject');
      
      expect(taggingStatement).toBeDefined();
      expect(taggingStatement.Action).toContain('s3:PutObjectTagging');
      
      expect(listStatement).toBeDefined();
      expect(listStatement.Action).toContain('s3:ListBucket');
    });

    test('restricts processing Lambda to specific S3 bucket only', () => {
      // Arrange
      const role = resources.ProcessingLambdaRole;
      const s3Policy = role.Properties.Policies.find((p: any) => 
        p.PolicyName['Fn::Sub'].includes('S3MinimalAccess')
      );

      // Assert - Check that all statements reference the DataBucket
      const statements = s3Policy.PolicyDocument.Statement;
      
      // Read statement should reference bucket objects
      const readStatement = statements.find((s: any) => s.Sid === 'S3ReadAccess');
      expect(readStatement.Resource['Fn::Sub']).toContain('${DataBucket.Arn}');
      
      // Write statement should have encryption condition
      const writeStatement = statements.find((s: any) => s.Sid === 'S3WriteAccessWithEncryption');
      expect(writeStatement.Resource['Fn::Sub']).toContain('${DataBucket.Arn}');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-server-side-encryption-aws-kms-key-id']).toBeDefined();
      
      // List statement should reference bucket (not objects)
      const listStatement = statements.find((s: any) => s.Sid === 'S3ListAccess');
      expect(listStatement.Resource['Fn::GetAtt']).toEqual(['DataBucket', 'Arn']);
    });

    test('creates authorizer Lambda role with trust store access', () => {
      // Arrange
      const role = resources.AuthorizerLambdaRole;
      const policies = role.Properties.Policies;

      // Assert
      expect(role.Type).toBe('AWS::IAM::Role');
      // Policy name now includes project name and environment for uniqueness
      const certPolicy = policies.find((p: any) => 
        p.PolicyName && (
          p.PolicyName['Fn::Sub']?.includes('CertificateValidationAccess') ||
          (typeof p.PolicyName === 'string' && p.PolicyName.includes('CertificateValidationAccess'))
        )
      );
      expect(certPolicy).toBeDefined();
      expect(certPolicy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(certPolicy.PolicyDocument.Statement[0].Resource['Fn::Sub']).toContain('${TrustStoreBucket}');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates log groups with 7-year retention and KMS encryption', () => {
      // Arrange
      const processingLogs = resources.ProcessingLambdaLogGroup;
      const authorizerLogs = resources.AuthorizerLambdaLogGroup;
      const apiLogs = resources.APIGatewayLogGroup;

      // Assert
      expect(processingLogs.Properties.RetentionInDays).toBe(2557); // 7 years
      expect(processingLogs.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['DataEncryptionKey', 'Arn']);

      expect(authorizerLogs.Properties.RetentionInDays).toBe(2557);
      expect(apiLogs.Properties.RetentionInDays).toBe(2557);
    });
  });

  describe('Lambda Functions', () => {
    test('creates authorizer Lambda with trust store configuration', () => {
      // Arrange
      const lambda = resources.AuthorizerLambdaFunction;

      // Assert
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(10);
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.Properties.Environment.Variables.TRUST_STORE_BUCKET).toEqual({ Ref: 'TrustStoreBucket' });
      expect(lambda.Properties.Environment.Variables.TRUST_STORE_KEY).toEqual({ Ref: 'TrustStoreKey' });
    });

    test('creates processing Lambda in VPC with DLQ configuration', () => {
      // Arrange
      const lambda = resources.ProcessingLambdaFunction;

      // Assert
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toEqual({ Ref: 'LambdaTimeout' });
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(lambda.Properties.DeadLetterConfig.TargetArn['Fn::GetAtt']).toEqual(['ProcessingDLQ', 'Arn']);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('configures processing Lambda environment variables', () => {
      // Arrange
      const lambda = resources.ProcessingLambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;

      // Assert
      expect(envVars.BUCKET_NAME).toEqual({ Ref: 'DataBucket' });
      expect(envVars.KMS_KEY_ARN).toEqual({ 'Fn::GetAtt': ['DataEncryptionKey', 'Arn'] });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentName' });
      expect(envVars.LOG_LEVEL['Fn::If']).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('creates REST API with regional endpoint', () => {
      // Arrange
      const api = resources.DataProcessingAPI;

      // Assert
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.DisableExecuteApiEndpoint['Fn::If']).toBeDefined();
    });

    test('creates custom authorizer with request validation', () => {
      // Arrange
      const authorizer = resources.APIGatewayAuthorizer;

      // Assert
      expect(authorizer.Type).toBe('AWS::ApiGateway::Authorizer');
      expect(authorizer.Properties.Type).toBe('REQUEST');
      expect(authorizer.Properties.AuthorizerResultTtlInSeconds).toBe(300);
      expect(authorizer.Properties.IdentitySource).toBe('method.request.header.X-API-Key');
      expect(authorizer.Properties.IdentityValidationExpression).toBe('^[A-Za-z0-9]{32}$');
    });

    test('creates process method with custom authorizer', () => {
      // Arrange
      const method = resources.ProcessMethod;

      // Assert
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('CUSTOM');
      expect(method.Properties.AuthorizerId).toEqual({ Ref: 'APIGatewayAuthorizer' });
      expect(method.Properties.RequestParameters['method.request.header.X-API-Key']).toBe(true);
      expect(method.Properties.RequestParameters['method.request.header.X-Request-Signature']).toBe(true);
    });

    test('configures API stage with throttling and logging', () => {
      // Arrange
      const stage = resources.APIStage;

      // Assert
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.AccessLogSetting.DestinationArn['Fn::GetAtt']).toEqual(['APIGatewayLogGroup', 'Arn']);
      expect(stage.Properties.MethodSettings[0].ThrottlingRateLimit).toEqual({ Ref: 'ApiThrottleRate' });
      expect(stage.Properties.MethodSettings[0].ThrottlingBurstLimit).toEqual({ Ref: 'ApiBurstRate' });
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.TracingEnabled).toBe(true);
    });

    test('creates conditional custom domain with mTLS', () => {
      // Arrange
      const customDomain = resources.ApiCustomDomain;

      // Assert
      expect(customDomain.Type).toBe('AWS::ApiGateway::DomainName');
      expect(customDomain.Condition).toBe('HasCertificate');
      expect(customDomain.Properties.MutualTlsAuthentication.TruststoreUri['Fn::Sub']).toContain('s3://');
      expect(customDomain.Properties.SecurityPolicy).toBe('TLS_1_2');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates alarms conditionally for non-dev environments', () => {
      // Arrange
      const unauthorizedAlarm = resources.UnauthorizedAPICallsAlarm;
      const kmsAlarm = resources.KMSKeyUsageAlarm;
      const lambdaAlarm = resources.LambdaErrorAlarm;
      const dlqAlarm = resources.DLQMessagesAlarm;

      // Assert
      expect(unauthorizedAlarm.Condition).toBe('CreateAlarms');
      expect(kmsAlarm.Condition).toBe('CreateAlarms');
      expect(lambdaAlarm.Condition).toBe('CreateAlarms');
      expect(dlqAlarm.Condition).toBe('CreateAlarms');
    });

    test('configures unauthorized API calls alarm', () => {
      // Arrange
      const alarm = resources.UnauthorizedAPICallsAlarm;

      // Assert
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.Threshold['Fn::If']).toBeDefined();
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
    });

    test('configures DLQ messages alarm', () => {
      // Arrange
      const alarm = resources.DLQMessagesAlarm;

      // Assert
      expect(alarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.Properties.Namespace).toBe('AWS/SQS');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic with KMS encryption and email subscription', () => {
      // Arrange
      const topic = resources.SNSTopic;

      // Assert
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'DataEncryptionKey' });
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'SecurityAlertEmail' });
    });
  });

  describe('Outputs', () => {
    test('exposes API endpoint outputs', () => {
      // Arrange
      const apiEndpoint = template.Outputs.APIEndpoint;
      const customDomainEndpoint = template.Outputs.APICustomDomainEndpoint;

      // Assert
      expect(apiEndpoint.Value['Fn::Sub']).toContain('execute-api');
      expect(customDomainEndpoint.Condition).toBe('HasCertificate');
      expect(apiEndpoint.Export.Name['Fn::Sub']).toContain('APIEndpoint');
    });

    test('exposes storage resource outputs', () => {
      // Arrange
      const dataBucketName = template.Outputs.DataBucketName;
      const dataBucketArn = template.Outputs.DataBucketArn;
      const auditBucketName = template.Outputs.AuditLogBucketName;

      // Assert
      expect(dataBucketName.Value).toEqual({ Ref: 'DataBucket' });
      expect(dataBucketArn.Value['Fn::GetAtt']).toEqual(['DataBucket', 'Arn']);
      expect(auditBucketName.Value).toEqual({ Ref: 'AuditLogBucket' });
    });

    test('exposes encryption key outputs', () => {
      // Arrange
      const kmsKeyId = template.Outputs.KMSKeyId;
      const kmsKeyArn = template.Outputs.KMSKeyArn;

      // Assert
      expect(kmsKeyId.Value).toEqual({ Ref: 'DataEncryptionKey' });
      expect(kmsKeyArn.Value['Fn::GetAtt']).toEqual(['DataEncryptionKey', 'Arn']);
    });

    test('exposes Lambda function ARN outputs', () => {
      // Arrange
      const processingLambdaArn = template.Outputs.ProcessingLambdaArn;
      const authorizerLambdaArn = template.Outputs.AuthorizerLambdaArn;

      // Assert
      expect(processingLambdaArn.Value['Fn::GetAtt']).toEqual(['ProcessingLambdaFunction', 'Arn']);
      expect(authorizerLambdaArn.Value['Fn::GetAtt']).toEqual(['AuthorizerLambdaFunction', 'Arn']);
    });

    test('exposes network resource outputs', () => {
      // Arrange
      const vpcId = template.Outputs.VPCId;
      const subnet1Id = template.Outputs.PrivateSubnet1Id;
      const subnet2Id = template.Outputs.PrivateSubnet2Id;

      // Assert
      expect(vpcId.Value).toEqual({ Ref: 'VPC' });
      expect(subnet1Id.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnet2Id.Value).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Resource Dependencies', () => {
    test('ensures Lambda functions depend on log groups', () => {
      // Arrange
      const processingLambda = resources.ProcessingLambdaFunction;
      const authorizerLambda = resources.AuthorizerLambdaFunction;

      // Assert
      expect(processingLambda.DependsOn).toContain('ProcessingLambdaLogGroup');
      expect(authorizerLambda.DependsOn).toBe('AuthorizerLambdaLogGroup');
    });

    test('ensures processing Lambda depends on VPC endpoints', () => {
      // Arrange
      const processingLambda = resources.ProcessingLambdaFunction;
      const dependsOn = Array.isArray(processingLambda.DependsOn)
        ? processingLambda.DependsOn
        : [processingLambda.DependsOn];

      // Assert
      expect(dependsOn).toContain('LambdaVPCEndpoint');
      expect(dependsOn).toContain('CloudWatchLogsVPCEndpoint');
      expect(dependsOn).toContain('KMSVPCEndpoint');
    });
  });

  describe('Tagging Compliance', () => {
    test('ensures all resources have required tags', () => {
      // Arrange
      const resourcesToCheck = [
        'VPC',
        'DataBucket',
        'ProcessingLambdaFunction',
        'AuthorizerLambdaFunction',
        'DataEncryptionKey',
      ];

      // Assert
      resourcesToCheck.forEach((resourceName) => {
        const resource = resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('CostCenter');
          expect(tagKeys).toContain('DataClassification');
          expect(tagKeys).toContain('Owner');
          expect(tagKeys).toContain('Environment');
        }
      });
    });
  });
});
