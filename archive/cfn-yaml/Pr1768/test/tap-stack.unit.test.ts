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
        'Secure AWS Infrastructure Template - Enterprise Security Best Practices'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toHaveLength(2);
      expect(paramGroups[0].Label.default).toBe('Environment Configuration');
      expect(paramGroups[1].Label.default).toBe('Security Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'VpcCidr',
        'PublicSubnetCidr',
        'PrivateSubnetCidr',
        'TrustedAmiId',
        'AdminUserArn'
      ];

      expectedParams.forEach(param => {
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
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('VPC CIDR parameters should have correct patterns', () => {
      const cidrParams = ['VpcCidr', 'PublicSubnetCidr', 'PrivateSubnetCidr'];
      cidrParams.forEach(param => {
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].AllowedPattern).toBe(
          '^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$'
        );
      });
    });

    test('TrustedAmiId should be an EC2 Image ID type', () => {
      expect(template.Parameters.TrustedAmiId.Type).toBe('AWS::EC2::Image::Id');
      expect(template.Parameters.TrustedAmiId.Default).toBe('ami-00ca32bbc84273381');
    });

    test('AdminUserArn should have default empty value', () => {
      expect(template.Parameters.AdminUserArn.Type).toBe('String');
      expect(template.Parameters.AdminUserArn.Default).toBe('');
      expect(template.Parameters.AdminUserArn.AllowedPattern).toContain('^$|');
    });
  });

  describe('KMS Resources', () => {
    test('should have SecureKMSKey resource', () => {
      expect(template.Resources.SecureKMSKey).toBeDefined();
      expect(template.Resources.SecureKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have FIPS compliant configuration', () => {
      const kmsKey = template.Resources.SecureKMSKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
      expect(kmsKey.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(kmsKey.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(kmsKey.MultiRegion).toBe(false);
    });

    test('KMS Key policy should have correct statements', () => {
      const keyPolicy = template.Resources.SecureKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(4);
      
      // Check root account permissions
      const rootStatement = keyPolicy.Statement[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.SecureKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecureKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with DNS enabled', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables properly configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      const securityGroups = [
        'WebServerSecurityGroup',
        'LoadBalancerSecurityGroup',
        'DatabaseSecurityGroup'
      ];

      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('WebServerSecurityGroup should have restricted ingress', () => {
      const webSG = template.Resources.WebServerSecurityGroup.Properties;
      expect(webSG.SecurityGroupIngress).toHaveLength(2);
      
      // Check that ingress is only from load balancer
      webSG.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.CidrIp).toBeUndefined();
      });
    });

    test('LoadBalancerSecurityGroup should allow HTTP/HTTPS from internet', () => {
      const lbSG = template.Resources.LoadBalancerSecurityGroup.Properties;
      expect(lbSG.SecurityGroupIngress).toHaveLength(2);
      
      const ports = lbSG.SecurityGroupIngress.map((r: any) => r.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('DatabaseSecurityGroup should only allow access from web servers', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      expect(dbSG.SecurityGroupIngress).toHaveLength(1);
      expect(dbSG.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(dbSG.SecurityGroupIngress[0].SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have SecureS3Bucket with encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('SecureS3Bucket should have versioning and public access blocked', () => {
      const bucket = template.Resources.SecureS3Bucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have AccessLogsBucket', () => {
      const logBucket = template.Resources.AccessLogsBucket;
      expect(logBucket).toBeDefined();
      expect(logBucket.Type).toBe('AWS::S3::Bucket');
      
      // Check lifecycle configuration
      const lifecycle = logBucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.ExpirationInDays).toBe(90);
    });

    test('should have ConfigBucket for AWS Config', () => {
      const configBucket = template.Resources.ConfigBucket;
      expect(configBucket).toBeDefined();
      expect(configBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have SecureDynamoDBTable with encryption', () => {
      const table = template.Resources.SecureDynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct configuration', () => {
      const tableProps = template.Resources.SecureDynamoDBTable.Properties;
      expect(tableProps.BillingMode).toBe('PAY_PER_REQUEST');
      expect(tableProps.DeletionProtectionEnabled).toBe(false);
      
      // Check SSE
      expect(tableProps.SSESpecification.SSEEnabled).toBe(true);
      expect(tableProps.SSESpecification.SSEType).toBe('KMS');
      
      // Check PITR
      expect(tableProps.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have correct key schema', () => {
      const tableProps = template.Resources.SecureDynamoDBTable.Properties;
      
      // Check attributes
      expect(tableProps.AttributeDefinitions).toHaveLength(2);
      expect(tableProps.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(tableProps.AttributeDefinitions[1].AttributeName).toBe('timestamp');
      
      // Check key schema
      expect(tableProps.KeySchema).toHaveLength(2);
      expect(tableProps.KeySchema[0].KeyType).toBe('HASH');
      expect(tableProps.KeySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Lambda Function', () => {
    test('should have SecureLambdaFunction', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct configuration', () => {
      const lambdaProps = template.Resources.SecureLambdaFunction.Properties;
      expect(lambdaProps.Runtime).toBe('python3.11');
      expect(lambdaProps.Handler).toBe('index.lambda_handler');
      expect(lambdaProps.KmsKeyArn).toBeDefined();
    });

    test('Lambda should have VPC configuration', () => {
      const vpcConfig = template.Resources.SecureLambdaFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(vpcConfig.SubnetIds).toHaveLength(1);
    });

    test('should have LambdaExecutionRole with policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('DynamoDBAccess');
    });
  });

  describe('EC2 Instance', () => {
    test('should have SecureEC2Instance', () => {
      const instance = template.Resources.SecureEC2Instance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instance should have encrypted EBS volume', () => {
      const blockDevices = template.Resources.SecureEC2Instance.Properties.BlockDeviceMappings[0];
      expect(blockDevices.Ebs.Encrypted).toBe(true);
      expect(blockDevices.Ebs.VolumeType).toBe('gp3');
      expect(blockDevices.Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have EC2ServiceRole with managed policies', () => {
      const role = template.Resources.EC2ServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });
  });

  describe('AWS Config', () => {
    test('should have Config resources', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigServiceRole).toBeDefined();
    });

    test('ConfigurationRecorder should record all resources', () => {
      const recorder = template.Resources.ConfigurationRecorder.Properties;
      expect(recorder.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('ConfigDeliveryChannel should have correct S3 configuration', () => {
      const channel = template.Resources.ConfigDeliveryChannel.Properties;
      expect(channel.S3KeyPrefix).toBe('config-logs');
      expect(channel.S3KeyPrefix).not.toContain('/');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have log groups for Lambda and S3', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
    });

    test('Log groups should have retention periods', () => {
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.S3AccessLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'KMSKeyId',
        'KMSKeyAlias',
        'SecureS3BucketName',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'LambdaFunctionArn',
        'EC2InstanceId',
        'WebServerSecurityGroupId',
        'LoadBalancerSecurityGroupId',
        'ConfigBucketName',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('All outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Description).toBeDefined();
      });
    });

    test('All outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('All named resources should include environment suffix', () => {
      const namedResources = [
        'SecureS3Bucket',
        'AccessLogsBucket',
        'ConfigBucket',
        'SecureDynamoDBTable',
        'SecureLambdaFunction',
        'LambdaExecutionRole',
        'EC2ServiceRole'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.BucketName) {
          expect(JSON.stringify(resource.Properties.BucketName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.FunctionName) {
          expect(JSON.stringify(resource.Properties.FunctionName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.RoleName) {
          expect(JSON.stringify(resource.Properties.RoleName)).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('No resources should have retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('All IAM roles should have specific trust relationships', () => {
      const iamRoles = ['LambdaExecutionRole', 'EC2ServiceRole', 'ConfigServiceRole'];
      
      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBeDefined();
      });
    });

    test('No security groups should allow unrestricted ingress except LoadBalancer', () => {
      const securityGroups = ['WebServerSecurityGroup', 'DatabaseSecurityGroup'];
      
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.CidrIp === '0.0.0.0/0') {
              expect(sgName).toBe('LoadBalancerSecurityGroup');
            }
          });
        }
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have correct number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(6);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15);
    });
  });
});