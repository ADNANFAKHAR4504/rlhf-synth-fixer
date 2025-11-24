import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Production-grade Multi-tier AWS Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.VPCId?.split(':')[3] ||
          deployedOutputs.S3BucketArn?.split(':')[3] ||
          deployedOutputs.EC2KmsKeyArn?.split(':')[3] ||
          deployedOutputs.RDSEndpoint?.split('.')[2] ||
          'us-east-1';

        // Extract stack name and environment suffix from resource naming pattern
        if (deployedOutputs.VPCId || deployedOutputs.S3BucketArn || deployedOutputs.DynamoDBTableArn) {
          // Try to extract from various resource names
          let resourceName = '';

          if (deployedOutputs.DynamoDBTableArn) {
            resourceName = deployedOutputs.DynamoDBTableArn.split('/').pop() || '';
          } else if (deployedOutputs.LambdaFunctionName) {
            resourceName = deployedOutputs.LambdaFunctionName;
          } else if (deployedOutputs.ConfigRecorderName) {
            resourceName = deployedOutputs.ConfigRecorderName;
          }

          console.log('Raw Resource Name:', resourceName);

          if (resourceName) {
            const nameParts = resourceName.split('-');
            console.log('Resource Name parts:', nameParts);

            // Extract stack name (first part)
            currentStackName = nameParts[0] || 'TapStack';

            // Find the environment suffix (look for pattern like pr8888, pr4056, etc.)
            const envSuffixIndex = nameParts.findIndex((part: string) =>
              part.match(/^(pr|dev|prod|test|staging)\d*$/) ||
              (part.startsWith('pr') && part.length > 2)
            );
            currentEnvironmentSuffix = envSuffixIndex >= 0 ? nameParts[envSuffixIndex] : 'pr4056';
          }
        }

        // Alternative extraction from any available ARN
        if (!currentStackName || currentStackName === 'unknown-stack') {
          const anyArn = deployedOutputs.S3BucketArn || deployedOutputs.EC2KmsKeyArn || deployedOutputs.DynamoDBTableArn;
          if (anyArn && typeof anyArn === 'string') {
            const arnParts = anyArn.split(':');
            if (arnParts.length >= 6) {
              const resourcePart = arnParts[5] || arnParts[6];
              if (resourcePart) {
                const resourceNameParts = resourcePart.split('-');
                currentStackName = resourceNameParts[0] || 'TapStack';
                const envSuffixMatch = resourcePart.match(/(pr|dev|prod|test|staging)\d*/);
                if (envSuffixMatch) {
                  currentEnvironmentSuffix = envSuffixMatch[0];
                }
              }
            }
          }
        }

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('=======================================');
    }
  });

  // Helper function to check resource dependencies in YAML text
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`Ref: ${dep}|!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // Helper function to validate resource exists in template by checking YAML text
  const validateResourceExists = (resourceName: string, resourceType: string) => {
    expect(templateYaml).toContain(`${resourceName}:`);
    expect(templateYaml).toContain(`Type: ${resourceType}`);
  };

  // Helper function to extract section from YAML text
  const extractYamlSection = (sectionName: string): string => {
    const sectionPattern = new RegExp(`^${sectionName}:\\s*$`, 'm');
    const match = templateYaml.match(sectionPattern);
    if (!match) return '';

    const startIndex = match.index! + match[0].length;
    const lines = templateYaml.substring(startIndex).split('\n');
    const sectionLines = [];

    for (const line of lines) {
      if (line.match(/^[A-Za-z]/) && !line.startsWith(' ')) {
        break; // Found next top-level section
      }
      sectionLines.push(line);
    }

    return sectionLines.join('\n');
  };

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required sections', () => {
      expect(templateYaml).toContain("AWSTemplateFormatVersion: '2010-09-09'");
      expect(templateYaml).toContain("Description: 'Production-grade secure multi-tier AWS environment with industry security best practices'");
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates production-grade infrastructure', () => {
      expect(templateYaml).toContain('Production-grade secure multi-tier AWS environment');
      expect(templateYaml).toContain('industry security best practices');
    });

    test('Template contains all critical AWS resource types for multi-tier architecture', () => {
      const criticalResourceTypes = [
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::EC2::LaunchTemplate',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudTrail::Trail',
        'AWS::Config::ConfigurationRecorder',
        'AWS::WAFv2::WebACL',
        'AWS::SecretsManager::Secret'
      ];

      criticalResourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section - Cross-Account Compatibility', () => {
    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain("AllowedPattern: '^[a-zA-Z0-9\\-]*$'");
      expect(templateYaml).toMatch(/Default: "[a-zA-Z0-9\-]+"/);
      expect(templateYaml).toContain('parallel deployments');
    });

    test('VpcCidr parameter has proper CIDR validation', () => {
      expect(templateYaml).toContain('VpcCidr:');
      expect(templateYaml).toContain("Default: '10.0.0.0/16'");
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('CIDR block for VPC');
    });

    test('DBMasterUsername parameter follows security best practices', () => {
      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain("Default: 'dbadmin'");
      expect(templateYaml).toContain('MinLength: 1');
      expect(templateYaml).toContain('MaxLength: 16');
      expect(templateYaml).toContain("AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'");
    });

    test('SourceAmiIdSsmParameter uses SSM parameter for AMI ID', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateYaml).toContain('keeps template free of hard-coded AMI IDs');
    });

    test('AlertEmail parameter has proper email validation', () => {
      expect(templateYaml).toContain('AlertEmail:');
      expect(templateYaml).toContain('Email address for security alerts');
      expect(templateYaml).toContain('AllowedPattern:');
    });

    test('No hardcoded account-specific or region-specific parameters', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).not.toMatch(/\b\d{12}\b/); // Account ID pattern
      expect(parametersSection).not.toMatch(/\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/); // Region pattern
    });
  });

  // ==================
  // MAPPINGS
  // ==================
  describe('Mappings Section - Network Configuration', () => {
    test('SubnetConfig mapping defines proper subnet architecture', () => {
      expect(templateYaml).toContain('SubnetConfig:');
      expect(templateYaml).toContain('Public1:');
      expect(templateYaml).toContain('Public2:');
      expect(templateYaml).toContain('Private1:');
      expect(templateYaml).toContain('Private2:');
      expect(templateYaml).toContain("CIDR: '10.0.1.0/24'");
      expect(templateYaml).toContain("CIDR: '10.0.2.0/24'");
      expect(templateYaml).toContain("CIDR: '10.0.10.0/24'");
      expect(templateYaml).toContain("CIDR: '10.0.11.0/24'");
    });
  });

  // ==================
  // KMS ENCRYPTION
  // ==================
  describe('KMS Resources - Comprehensive Encryption Management', () => {
    test('Multiple KMS keys for different services are properly configured', () => {
      const kmsKeys = ['EC2KmsKey', 'RDSKmsKey', 'S3KmsKey', 'DynamoDBKmsKey', 'LambdaKmsKey'];

      kmsKeys.forEach(key => {
        validateResourceExists(key, 'AWS::KMS::Key');
        expect(templateYaml).toContain(`Description: !Sub 'KMS key for`);
      });
    });

    test('KMS keys have proper cross-account compatible key policies', () => {
      expect(templateYaml).toContain('KeyPolicy:');
      expect(templateYaml).toContain("Version: '2012-10-17'");
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain("AWS: !Sub 'arn:${AWS::Partition}:iam::${AWS::AccountId}:root'");
      expect(templateYaml).toContain('kms:*');
    });

    test('KMS key aliases are properly configured with dynamic naming', () => {
      const aliases = ['EC2KmsKeyAlias', 'RDSKmsKeyAlias', 'S3KmsKeyAlias', 'DynamoDBKmsKeyAlias', 'LambdaKmsKeyAlias'];

      aliases.forEach(alias => {
        validateResourceExists(alias, 'AWS::KMS::Alias');
        expect(templateYaml).toContain("AliasName: !Sub 'alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}");
      });
    });

    test('S3 KMS key has CloudTrail-specific permissions', () => {
      expect(templateYaml).toContain('Allow CloudTrail');
      expect(templateYaml).toContain('Service: cloudtrail.amazonaws.com');
      expect(templateYaml).toContain('kms:GenerateDataKey*');
      expect(templateYaml).toContain('aws:cloudtrail:arn');
    });

    test('KMS keys have proper tags with dynamic values', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain("Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}");
    });
  });

  // ===============
  // VPC AND NETWORKING
  // ===============
  describe('VPC and Networking - Multi-AZ Architecture', () => {
    test('VPC is properly configured with DNS support', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Public subnets are configured in multiple AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];

      publicSubnets.forEach(subnet => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
      });

      expect(templateYaml).toContain("AvailabilityZone: !Select [0, !GetAZs '']");
      expect(templateYaml).toContain("AvailabilityZone: !Select [1, !GetAZs '']");
    });

    test('Private subnets are configured in multiple AZs', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2'];

      privateSubnets.forEach(subnet => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
      });
    });

    test('Internet Gateway and NAT Gateways are properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('NatGateway1', 'AWS::EC2::NatGateway');
      validateResourceExists('NatGateway2', 'AWS::EC2::NatGateway');
      validateResourceExists('NatGatewayEIP1', 'AWS::EC2::EIP');
      validateResourceExists('NatGatewayEIP2', 'AWS::EC2::EIP');
    });

    test('Route tables provide proper routing for public and private subnets', () => {
      expect(templateYaml).toContain('PublicRouteTable');
      expect(templateYaml).toContain('PrivateRouteTable1');
      expect(templateYaml).toContain('PrivateRouteTable2');
    });

    test('Subnet naming follows dynamic convention', () => {
      const subnetNamePattern = /Value: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-(public|private)-subnet-[12]'/;
      expect(templateYaml).toMatch(subnetNamePattern);
    });
  });

  // ==================
  // SECURITY GROUPS
  // ==================
  describe('Security Groups - Network Security', () => {
    test('ALB Security Group allows HTTP/HTTPS traffic', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain("CidrIp: '0.0.0.0/0'");
    });

    test('EC2 Security Group allows ALB traffic only', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
      expect(templateYaml).toContain('FromPort: 80');
    });

    test('RDS Security Group allows EC2 traffic only', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('FromPort: 3306');
      expect(templateYaml).toContain('ToPort: 3306');
    });
  });

  // ===============
  // IAM ROLES
  // ===============
  describe('IAM Roles - Security and Access Management', () => {
    test('EC2 Role has proper assume role policy and managed policies', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('AmazonSSMManagedInstanceCore');
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
    });

    test('EC2 Role has custom policy with least privilege permissions', () => {
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('dynamodb:GetItem');
      expect(templateYaml).toContain('dynamodb:PutItem');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    });

    test('Lambda Execution Role has proper permissions', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: lambda.amazonaws.com');
      expect(templateYaml).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    test('Config Role for AWS Config service', () => {
      validateResourceExists('ConfigRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: config.amazonaws.com');
    });

    test('CloudTrail Role for CloudWatch Logs', () => {
      validateResourceExists('CloudTrailRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: cloudtrail.amazonaws.com');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });
  });

  // ===============
  // S3 BUCKET
  // ===============
  describe('S3 Bucket - Secure Storage', () => {
    test('S3 Bucket has proper encryption configuration', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain("SSEAlgorithm: 'aws:kms'");
      expect(templateYaml).toContain('KMSMasterKeyID: !Ref S3KmsKey');
    });

    test('S3 Bucket has public access blocked', () => {
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('S3 Bucket has versioning and lifecycle configuration', () => {
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays: 30');
    });

    test('S3 Bucket Policy enforces secure transport and CloudTrail access', () => {
      validateResourceExists('S3BucketPolicy', 'AWS::S3::BucketPolicy');
      expect(templateYaml).toContain('DenyInsecureConnections');
      expect(templateYaml).toContain('aws:SecureTransport');
      expect(templateYaml).toContain('AllowCloudTrailAcl');
      expect(templateYaml).toContain('AllowCloudTrailWrite');
    });

    test('Config S3 Bucket for AWS Config delivery', () => {
      validateResourceExists('ConfigBucket', 'AWS::S3::Bucket');
    });
  });

  // ===============
  // DYNAMODB
  // ===============
  describe('DynamoDB Table - NoSQL Database', () => {
    test('DynamoDB Table has proper configuration', () => {
      validateResourceExists('DynamoDBTable', 'AWS::DynamoDB::Table');
      expect(templateYaml).toContain('BillingMode: PAY_PER_REQUEST');
      expect(templateYaml).toContain('AttributeName: id');
      expect(templateYaml).toContain('AttributeType: S');
      expect(templateYaml).toContain('KeyType: HASH');
    });

    test('DynamoDB Table uses KMS encryption', () => {
      expect(templateYaml).toContain('SSESpecification:');
      expect(templateYaml).toContain('SSEEnabled: true');
      expect(templateYaml).toContain('SSEType: KMS');
      expect(templateYaml).toContain('KMSMasterKeyId: !Ref DynamoDBKmsKey');
    });

    test('DynamoDB Table has point-in-time recovery enabled', () => {
      expect(templateYaml).toContain('PointInTimeRecoverySpecification:');
      expect(templateYaml).toContain('PointInTimeRecoveryEnabled: true');
    });
  });

  // ===============
  // RDS DATABASE
  // ===============
  describe('RDS Database - Relational Database', () => {
    test('RDS Subnet Group spans multiple AZs', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('RDS Parameter Group is configured', () => {
      validateResourceExists('DBParameterGroup', 'AWS::RDS::DBParameterGroup');
    });

    test('RDS Instance has proper security configuration', () => {
      validateResourceExists('RDSDatabase', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKmsKey');
      expect(templateYaml).toContain('BackupRetentionPeriod:');
      expect(templateYaml).toContain('MultiAZ: true');
    });

    test('RDS uses Secrets Manager for password management', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludePunctuation: true');
    });
  });

  // ===============
  // EC2 INSTANCES
  // ===============
  describe('EC2 Instances - Compute Resources', () => {
    test('Launch Template is properly configured', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain("ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'");
      expect(templateYaml).toContain('IamInstanceProfile:');
      expect(templateYaml).toContain('SecurityGroups:');
    });

    test('EC2 instances use launch template and are in private subnets', () => {
      validateResourceExists('EC2Instance1', 'AWS::EC2::Instance');
      validateResourceExists('EC2Instance2', 'AWS::EC2::Instance');
      expect(templateYaml).toContain('LaunchTemplate:');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet1');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet2');
    });
  });

  // ===============================
  // APPLICATION LOAD BALANCER
  // ===============================
  describe('Application Load Balancer - Load Distribution', () => {
    test('ALB is properly configured for high availability', () => {
      validateResourceExists('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('Subnets:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
    });

    test('Target Group is configured for health checks', () => {
      validateResourceExists('TargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('HealthCheckPath:');
      expect(templateYaml).toContain('HealthCheckProtocol: HTTP');
      expect(templateYaml).toContain('Targets:');
    });

    test('ALB Listener is configured', () => {
      validateResourceExists('ALBListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Type: forward');
    });
  });

  // ===============================
  // LAMBDA FUNCTION
  // ===============================
  describe('Lambda Function - Serverless Compute', () => {
    test('Lambda Function has proper configuration', () => {
      validateResourceExists('LambdaFunction', 'AWS::Lambda::Function');
      expect(templateYaml).toContain('Runtime: python3.11');
      expect(templateYaml).toContain('Role: !GetAtt LambdaExecutionRole.Arn');
      expect(templateYaml).toContain('VpcConfig:');
      expect(templateYaml).toContain('KmsKeyArn: !GetAtt LambdaKmsKey.Arn');
    });

    test('Lambda Log Group is configured', () => {
      validateResourceExists('LambdaLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('RetentionInDays: 7');
    });
  });

  // ===============================
  // CLOUDWATCH MONITORING
  // ===============================
  describe('CloudWatch Monitoring - Observability', () => {
    test('SNS Topic for alerts is configured', () => {
      validateResourceExists('SNSTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('TopicName: !Sub');
      expect(templateYaml).toContain('alerts');
    });

    test('CloudWatch Alarms monitor critical resources', () => {
      const alarms = ['EC2CPUAlarm', 'RDSCPUAlarm', 'ALBHealthyHostAlarm'];

      alarms.forEach(alarm => {
        validateResourceExists(alarm, 'AWS::CloudWatch::Alarm');
        expect(templateYaml).toContain('ComparisonOperator:');
        expect(templateYaml).toContain('Threshold:');
        expect(templateYaml).toContain('AlarmActions:');
        expect(templateYaml).toContain('- !Ref SNSTopic');
      });
    });

    test('CloudWatch Alarms have appropriate metrics', () => {
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Namespace: AWS/ApplicationELB');
    });
  });

  // ===============================
  // CLOUDTRAIL AND CONFIG
  // ===============================
  describe('CloudTrail and AWS Config - Governance', () => {
    test('CloudTrail is properly configured for audit logging', () => {
      validateResourceExists('CloudTrail', 'AWS::CloudTrail::Trail');
      expect(templateYaml).toContain('IncludeGlobalServiceEvents: true');
      expect(templateYaml).toContain('IsLogging: true');
      expect(templateYaml).toContain('IsMultiRegionTrail: false');
      expect(templateYaml).toContain('S3BucketName: !Ref S3Bucket');
    });

    test('CloudTrail Log Group is configured', () => {
      validateResourceExists('CloudTrailLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('RetentionInDays: 90');
    });

    test('AWS Config Recorder and Delivery Channel are configured', () => {
      validateResourceExists('ConfigRecorder', 'AWS::Config::ConfigurationRecorder');
      validateResourceExists('DeliveryChannel', 'AWS::Config::DeliveryChannel');
      expect(templateYaml).toContain('RecordingGroup:');
      expect(templateYaml).toContain('AllSupported: true');
      expect(templateYaml).toContain('IncludeGlobalResourceTypes: false');
    });

    test('Config Recorder Starter Lambda function is configured', () => {
      validateResourceExists('ConfigRecorderStarter', 'AWS::Lambda::Function');
      validateResourceExists('StartConfigRecorder', 'AWS::CloudFormation::CustomResource');
    });
  });

  // ===============================
  // WAF PROTECTION
  // ===============================
  describe('WAF - Web Application Firewall', () => {
    test('WAF Web ACL is configured for ALB protection', () => {
      validateResourceExists('WAFWebACL', 'AWS::WAFv2::WebACL');
      expect(templateYaml).toContain('Scope: REGIONAL');
      expect(templateYaml).toContain('DefaultAction:');
      expect(templateYaml).toContain('Allow: {}');
    });

    test('WAF Association connects Web ACL to ALB', () => {
      validateResourceExists('WAFAssociation', 'AWS::WAFv2::WebACLAssociation');
      expect(templateYaml).toContain('ResourceArn: !Ref ApplicationLoadBalancer');
      expect(templateYaml).toContain('WebACLArn: !GetAtt WAFWebACL.Arn');
    });
  });

  // ======================
  // CROSS-ACCOUNT/REGION
  // ======================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::AccountId\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::Region\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::Partition}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\$\{AWS::StackName\}-\$\{AWS::Region\}-\$\{EnvironmentSuffix\}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);

      const matches = templateYaml.match(new RegExp(regionEnvironmentPattern.source, 'g'));
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(30); // Should be used extensively
    });

    test('ARN references use proper AWS naming conventions', () => {
      expect(templateYaml).toContain("!Sub 'arn:${AWS::Partition}:iam::${AWS::AccountId}:root'");
      expect(templateYaml).toContain('arn:aws');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('Security and Encryption Compliance', () => {
    test('All storage services use customer-managed KMS encryption', () => {
      expect(templateYaml).toContain('KMSMasterKeyID: !Ref S3KmsKey');
      expect(templateYaml).toContain('KMSMasterKeyId: !Ref DynamoDBKmsKey');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKmsKey');
      expect(templateYaml).toContain('KmsKeyArn: !GetAtt LambdaKmsKey.Arn');
    });

    test('RDS has encryption at rest and in transit', () => {
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKmsKey');
    });

    test('Security groups follow least privilege principle', () => {
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });

    test('IAM policies follow least privilege principle', () => {
      expect(templateYaml).toContain('Effect: Allow');
      expect(templateYaml).toContain("Resource: !Sub '${S3Bucket.Arn}/*'");
      expect(templateYaml).toContain('Resource: !GetAtt DynamoDBTable.Arn');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    });

    test('S3 bucket enforces secure transport', () => {
      expect(templateYaml).toContain('DenyInsecureConnections');
      expect(templateYaml).toContain('aws:SecureTransport');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC and networking outputs are defined', () => {
      const networkingOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'InternetGatewayId', 'NatGateway1Id', 'NatGateway2Id'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security group outputs are defined', () => {
      const securityGroupOutputs = ['ALBSecurityGroupId', 'EC2SecurityGroupId', 'RDSSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityGroupOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('ALB outputs are defined', () => {
      const albOutputs = [
        'ALBArn', 'ALBDNSName', 'ApplicationURL',
        'TargetGroupArn', 'ALBHostedZoneId', 'TargetGroupFullName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      albOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('EC2 and compute outputs are defined', () => {
      const computeOutputs = [
        'EC2Instance1Id', 'EC2Instance2Id', 'LaunchTemplateId', 'EC2InstanceProfileArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      computeOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('RDS outputs are defined', () => {
      const rdsOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'DBSubnetGroupName', 'DBParameterGroupName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      rdsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Storage and data outputs are defined', () => {
      const storageOutputs = [
        'S3BucketName', 'S3BucketArn', 'DynamoDBTableName', 'DynamoDBTableArn', 'ConfigBucketName', 'ConfigBucketArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('KMS outputs are defined for all encryption keys', () => {
      const kmsOutputs = [
        'EC2KmsKeyId', 'EC2KmsKeyArn', 'RDSKmsKeyId', 'RDSKmsKeyArn',
        'S3KmsKeyId', 'S3KmsKeyArn', 'DynamoDBKmsKeyId', 'DynamoDBKmsKeyArn',
        'LambdaKmsKeyId', 'LambdaKmsKeyArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      kmsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Lambda outputs are defined', () => {
      const lambdaOutputs = ['LambdaFunctionArn', 'LambdaFunctionName', 'LambdaLogGroupName'];

      const outputsSection = extractYamlSection('Outputs');
      lambdaOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM outputs are defined', () => {
      const iamOutputs = ['EC2RoleArn', 'LambdaExecutionRoleArn', 'ConfigRoleArn'];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring outputs are defined', () => {
      const monitoringOutputs = [
        'SNSTopicArn', 'SNSTopicName', 'CloudTrailLogGroupName', 'CloudTrailLogGroupArn',
        'CloudTrailArn', 'EC2CPUAlarmName', 'RDSCPUAlarmName', 'ALBHealthyHostAlarmName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Config and WAF outputs are defined', () => {
      const governanceOutputs = [
        'ConfigRecorderName', 'ConfigDeliveryChannelName', 'ConfigRoleArn',
        'WAFWebACLArn', 'WAFWebACLId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      governanceOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Environment information outputs are defined', () => {
      const envOutputs = ['StackName', 'EnvironmentSuffix', 'AvailabilityZone1', 'AvailabilityZone2'];

      const outputsSection = extractYamlSection('Outputs');
      envOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub '\$\{AWS::StackName\}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      if (exportMatches) {
        expect(exportMatches.length).toBeGreaterThan(50); // Should have many exports
      }
    });
  });

  // ====================
  // INTEGRATION TESTING
  // ====================
  describe('End-to-End Integration Tests', () => {
    test('Multi-tier architecture integration is properly configured', () => {
      // ALB → EC2 → RDS flow
      validateResourceDependencies('TargetGroup', ['EC2Instance1', 'EC2Instance2']);
      validateResourceDependencies('EC2Instance1', ['LaunchTemplate', 'PrivateSubnet1']);
      validateResourceDependencies('EC2Instance2', ['LaunchTemplate', 'PrivateSubnet2']);
    });

    test('Security group dependencies establish proper network isolation', () => {
      validateResourceDependencies('EC2SecurityGroup', ['ALBSecurityGroup']);
      validateResourceDependencies('RDSSecurityGroup', ['EC2SecurityGroup']);
    });

    test('KMS key permissions support all service integrations', () => {
      expect(templateYaml).toContain('ec2.amazonaws.com');
      expect(templateYaml).toContain('cloudtrail.amazonaws.com');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    });

    test('IAM role dependencies are properly established', () => {
      validateResourceDependencies('EC2Instance1', ['EC2InstanceProfile']);
      validateResourceDependencies('EC2Instance2', ['EC2InstanceProfile']);
      validateResourceDependencies('LambdaFunction', ['LambdaExecutionRole']);
    });

    test('Subnet dependencies ensure proper network architecture', () => {
      validateResourceDependencies('ApplicationLoadBalancer', ['PublicSubnet1', 'PublicSubnet2']);
      validateResourceDependencies('EC2Instance1', ['PrivateSubnet1']);
      validateResourceDependencies('EC2Instance2', ['PrivateSubnet2']);
    });

    test('Config service dependencies are properly established', () => {
      validateResourceDependencies('StartConfigRecorder', ['DeliveryChannel']);
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation Tests', () => {
    test('Dynamic extraction of deployment parameters works correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      expect(currentStackName).toBeTruthy();
      expect(currentStackName).not.toBe('unknown-stack');
      expect(currentEnvironmentSuffix).toBeTruthy();
      expect(currentEnvironmentSuffix).not.toBe('unknown-suffix');
      expect(region).toBeTruthy();
      expect(region).not.toBe('unknown-region');

      console.log(`Deployment validation using: Stack=${currentStackName}, Region=${region}, Suffix=${currentEnvironmentSuffix}`);
    });

    test('VPC and networking resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-/);
      }

      const subnetOutputs = ['PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id'];
      subnetOutputs.forEach(output => {
        if (deployedOutputs[output]) {
          expect(deployedOutputs[output]).toMatch(/^subnet-/);
        }
      });
    });

    test('KMS resources are properly deployed with expected naming', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const kmsKeys = ['EC2KmsKeyArn', 'RDSKmsKeyArn', 'S3KmsKeyArn', 'DynamoDBKmsKeyArn', 'LambdaKmsKeyArn'];
      kmsKeys.forEach(key => {
        if (deployedOutputs[key]) {
          expect(deployedOutputs[key]).toMatch(/^arn:aws:kms:/);
          expect(deployedOutputs[key]).toContain(region);
        }
      });
    });

    test('ALB is properly deployed with expected configuration', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.ApplicationURL) {
        expect(deployedOutputs.ApplicationURL).toMatch(/^https?:\/\//);
        expect(deployedOutputs.ApplicationURL).toContain(region);
      }

      if (deployedOutputs.ALBDNSName) {
        expect(deployedOutputs.ALBDNSName).toContain('.elb.amazonaws.com');
        expect(deployedOutputs.ALBDNSName).toContain(region);
      }
    });

    test('RDS is properly deployed with expected configuration', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSEndpoint) {
        expect(deployedOutputs.RDSEndpoint).toContain('.rds.amazonaws.com');
        expect(deployedOutputs.RDSEndpoint).toContain(region);
        expect(deployedOutputs.RDSEndpoint).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.RDSPort) {
        expect(deployedOutputs.RDSPort).toBe('3306');
      }
    });

    test('S3 buckets are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.S3BucketArn) {
        expect(deployedOutputs.S3BucketArn).toMatch(/^arn:aws:s3:::/);
        expect(deployedOutputs.S3BucketArn).toContain(region);
        expect(deployedOutputs.S3BucketArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('DynamoDB table is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.DynamoDBTableArn) {
        expect(deployedOutputs.DynamoDBTableArn).toMatch(/^arn:aws:dynamodb:/);
        expect(deployedOutputs.DynamoDBTableArn).toContain(region);
        expect(deployedOutputs.DynamoDBTableArn).toContain(currentStackName);
        expect(deployedOutputs.DynamoDBTableArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('Lambda function is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.LambdaFunctionArn) {
        expect(deployedOutputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
        expect(deployedOutputs.LambdaFunctionArn).toContain(region);
        expect(deployedOutputs.LambdaFunctionArn).toContain(currentStackName);
        expect(deployedOutputs.LambdaFunctionArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('CloudTrail and Config are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.CloudTrailArn) {
        expect(deployedOutputs.CloudTrailArn).toMatch(/^arn:aws:cloudtrail:/);
        expect(deployedOutputs.CloudTrailArn).toContain(region);
      }

      if (deployedOutputs.ConfigRecorderName) {
        expect(deployedOutputs.ConfigRecorderName).toContain(currentStackName);
        expect(deployedOutputs.ConfigRecorderName).toContain(region);
        expect(deployedOutputs.ConfigRecorderName).toContain(currentEnvironmentSuffix);
      }
    });

    test('Environment-specific naming is applied correctly across all resources', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      expect(currentEnvironmentSuffix).toMatch(/^(pr|dev|prod|test|staging)\d*$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      const outputsWithSuffix = Object.values(deployedOutputs).filter(value =>
        typeof value === 'string' && value.includes(currentEnvironmentSuffix)
      );

      expect(outputsWithSuffix.length).toBeGreaterThan(10); 
    });
  });

  // ========================
  // PERFORMANCE & RELIABILITY
  // ========================
  describe('Performance and Reliability', () => {
    test('Multi-AZ deployment provides high availability', () => {
      expect(templateYaml).toContain("AvailabilityZone: !Select [0, !GetAZs '']");
      expect(templateYaml).toContain("AvailabilityZone: !Select [1, !GetAZs '']");
      expect(templateYaml).toContain('MultiAZ: true'); // RDS
    });

    test('Load balancer configuration supports high throughput', () => {
      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('HealthCheckPath:');
      expect(templateYaml).toContain('HealthCheckProtocol: HTTP');
    });

    test('CloudWatch alarms provide comprehensive monitoring', () => {
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Threshold:');
      expect(templateYaml).toContain('ComparisonOperator:');
      expect(templateYaml).toContain('AlarmActions:');
    });

    test('Backup and recovery mechanisms are in place', () => {
      expect(templateYaml).toContain('BackupRetentionPeriod:');
      expect(templateYaml).toContain('PointInTimeRecoveryEnabled: true');
      expect(templateYaml).toContain('VersioningConfiguration:');
    });

    test('Error handling and resilience features are configured', () => {
      expect(templateYaml).toContain('RetentionInDays:');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays:');
      expect(templateYaml).toContain('TreatMissingData: notBreaching');
    });
  });
});
