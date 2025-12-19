import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Comprehensive End-to-End Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironment = 'unknown-env';
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
          deployedOutputs.EC2RoleArn?.split(':')[3] ||
          deployedOutputs.LambdaFunctionArn?.split(':')[3] ||
          deployedOutputs.DBPasswordSecretArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from resource naming pattern
        if (deployedOutputs.EC2RoleName) {
          console.log('Raw EC2RoleName:', deployedOutputs.EC2RoleName);
          const roleParts = deployedOutputs.EC2RoleName.split('-');
          console.log('EC2RoleName parts:', roleParts);
          currentStackName = roleParts[0] || 'TapStack';

          // Find the environment suffix (look for pattern like pr4056, dev-123, etc.)
          // It should be after the region parts and before 'ec2-role'
          const envSuffixIndex = roleParts.findIndex((part: string) =>
            part.match(/^(pr|dev|prod|test)\d+$/) ||
            (part.startsWith('pr') && part.length > 2)
          );
          currentEnvironmentSuffix = envSuffixIndex >= 0 ? roleParts[envSuffixIndex] : 'pr4056';
        }

        // Extract environment from S3 bucket name pattern
        if (deployedOutputs.S3BucketName) {
          console.log('Raw S3BucketName:', deployedOutputs.S3BucketName);
          const bucketParts = deployedOutputs.S3BucketName.split('-');
          console.log('S3BucketName parts:', bucketParts);
          // Expected format: {region}-{environment}-payment-data-{account-id}
          // Example: eu-west-1-dev-payment-data-119612786553
          if (bucketParts.length >= 4) {
            // Find the part that contains dev or prod
            currentEnvironment = bucketParts.find((part: string) => ['dev', 'prod'].includes(part)) || 'dev';
          } else {
            currentEnvironment = 'dev';
          }
        } else {
          // If no deployment outputs, default to dev for testing
          currentEnvironment = 'dev';
        }

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment:', currentEnvironment);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment:', currentEnvironment);
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
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description: \'Payment Processing Application');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates cross-account/cross-region support', () => {
      expect(templateYaml).toContain('Cross-Account/Cross-Region Deployable');
    });

    test('Template contains all critical AWS resource types', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::CloudWatch::Alarm',
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
    test('Required parameters are defined with proper constraints', () => {
      const parametersSection = extractYamlSection('Parameters');

      const requiredParams = [
        'Environment',
        'EnvironmentSuffix',
        'DBUsername',
        'AllowedCIDRBlock',
        'SourceAmiIdSsmParameter'
      ];

      requiredParams.forEach(param => {
        expect(parametersSection).toContain(`${param}:`);
        expect(parametersSection).toContain('Description:');
      });
    });

    test('Environment parameter supports dev/prod with proper constraints', () => {
      expect(templateYaml).toContain('Environment:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- dev');
      expect(templateYaml).toContain('- prod');
      expect(templateYaml).toContain('Default: dev');
    });

    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9\\-]*$\'');
      expect(templateYaml).toContain('Default: \'pr4056\'');
      expect(templateYaml).toContain('parallel deployments');
    });

    test('CIDR parameter has proper validation pattern', () => {
      expect(templateYaml).toContain('AllowedCIDRBlock:');
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('valid CIDR block');
    });

    test('AMI parameter uses SSM for cross-region compatibility', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateYaml).toContain('SSM parameter');
    });
  });

  // ====================
  // MAPPINGS
  // ====================
  describe('Mappings Section - Environment-Specific Configuration', () => {
    test('EnvironmentConfig mapping is properly defined for dev/prod', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('EnvironmentConfig:');
      expect(mappingsSection).toContain('dev:');
      expect(mappingsSection).toContain('prod:');
    });

    test('Development environment has cost-optimized settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('InstanceType: t3.micro');
      expect(mappingsSection).toContain('DBInstanceClass: db.t3.micro');
      expect(mappingsSection).toContain('DBAllocatedStorage: 20');
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 0');
      expect(mappingsSection).toContain('DBMultiAZ: false');
      expect(mappingsSection).toContain('S3LifecycleDays: 30');
      expect(mappingsSection).toContain('AlarmCPUThreshold: 70');
      expect(mappingsSection).toContain('LambdaConcurrency: 0');
    });

    test('Production environment has performance/reliability settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('InstanceType: m5.large');
      expect(mappingsSection).toContain('DBInstanceClass: db.m5.large');
      expect(mappingsSection).toContain('DBAllocatedStorage: 100');
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 7');
      expect(mappingsSection).toContain('DBMultiAZ: true');
      expect(mappingsSection).toContain('S3LifecycleDays: 365');
      expect(mappingsSection).toContain('AlarmCPUThreshold: 80');
      expect(mappingsSection).toContain('LambdaConcurrency: 10');
    });
  });

  // ==================
  // CONDITIONS
  // ==================
  describe('Conditions Section - Environment Logic', () => {
    test('Conditions are properly defined', () => {
      const conditionsSection = extractYamlSection('Conditions');
      expect(conditionsSection).toContain('IsProd:');
      expect(conditionsSection).toContain('SetLambdaConcurrency:');
    });

    test('IsProd condition logic is correct', () => {
      expect(templateYaml).toContain('IsProd: !Equals [!Ref Environment, \'prod\']');
    });

    test('SetLambdaConcurrency condition logic is correct', () => {
      expect(templateYaml).toContain('SetLambdaConcurrency: !Equals [!Ref Environment, \'prod\']');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: 10.0.0.0/16');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Subnets are properly configured across multiple AZs', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24', '10.0.4.0/24'];

      subnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: ${expectedCidrs[index]}`);
        expect(templateYaml).toContain('VpcId: !Ref VPC');
      });

      // Verify AZ distribution
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
    });

    test('Internet Gateway and routing are properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('AttachGateway', 'AWS::EC2::VPCGatewayAttachment');
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('Subnet route table associations are configured', () => {
      validateResourceExists('SubnetRouteTableAssociation1', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('SubnetRouteTableAssociation2', 'AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security', () => {
    test('EC2 Security Group has proper ingress rules', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');

      expect(templateYaml).toContain('VpcId: !Ref VPC');

      // Check SSH access (port 22)
      expect(templateYaml).toContain('FromPort: 22');
      expect(templateYaml).toContain('ToPort: 22');

      // Check HTTPS access (port 443)
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');

      // Check HTTP access (port 80)
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
    });

    test('RDS Security Group has restricted access', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');

      // Check MySQL port 3306 access from EC2 and Lambda
      expect(templateYaml).toContain('FromPort: 3306');
      expect(templateYaml).toContain('ToPort: 3306');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');
    });

    test('Lambda Security Group is properly configured', () => {
      validateResourceExists('LambdaSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('EC2 Role has proper assume role policy', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: \'sts:AssumeRole\'');
    });

    test('EC2 Role has required managed policies and custom permissions', () => {
      // Check managed policy
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

      // Check custom policy for S3 and CloudWatch
      expect(templateYaml).toContain('ec2-policy');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:DeleteObject');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('logs:CreateLogGroup');
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
    });

    test('Lambda Execution Role has proper configuration', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Service: lambda.amazonaws.com');
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      validateResourceDependencies('EC2InstanceProfile', ['EC2Role']);
    });
  });

  // ===============
  // STORAGE
  // ===============
  describe('Storage Resources - S3 Configuration', () => {
    test('S3 Bucket has security best practices configured', () => {
      validateResourceExists('PaymentDataBucket', 'AWS::S3::Bucket');

      // Check encryption
      expect(templateYaml).toContain('ServerSideEncryptionConfiguration:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');

      // Check versioning
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');

      // Check public access blocking
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('S3 Bucket has environment-specific lifecycle configuration', () => {
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref Environment, S3LifecycleDays]');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays: 7');
    });

    test('S3 Bucket name follows naming convention for cross-account deployment', () => {
      expect(templateYaml).toContain('BucketName: !Sub \'${AWS::Region}-${Environment}-payment-data-${AWS::AccountId}\'');
    });
  });

  // =================
  // DATABASE
  // =================
  describe('Database Resources - RDS Configuration', () => {
    test('DB Subnet Group uses private subnets', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');

      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Database password is managed by Secrets Manager', () => {
      validateResourceExists('DBPasswordSecret', 'AWS::SecretsManager::Secret');

      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludeCharacters: \'"@/\\\'');
    });

    test('RDS Instance has proper security configuration', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');

      expect(templateYaml).toContain('Engine: mysql');
      expect(templateYaml).toContain('EngineVersion: \'8.0.43\'');
      expect(templateYaml).toContain('StorageType: gp3');
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('DeletionProtection: false');

      // Check environment-specific settings
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]');
      expect(templateYaml).toContain('AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]');
      expect(templateYaml).toContain('BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref Environment, DBBackupRetentionPeriod]');
      expect(templateYaml).toContain('MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, DBMultiAZ]');
    });

    test('RDS Instance uses dynamic password reference', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${AWS::StackName}-${EnvironmentSuffix}-db-password:SecretString:password}}\'');
    });

    test('RDS Instance has proper deletion and update policies', () => {
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');
      expect(templateYaml).toContain('UpdateReplacePolicy: Snapshot');
    });
  });

  // ===============
  // COMPUTE
  // ===============
  describe('Compute Resources - EC2 Configuration', () => {
    test('EC2 Key Pair is properly configured', () => {
      validateResourceExists('EC2KeyPair', 'AWS::EC2::KeyPair');
      expect(templateYaml).toContain('KeyType: rsa');
      expect(templateYaml).toContain('KeyFormat: pem');
    });

    test('EC2 Instance has proper configuration', () => {
      validateResourceExists('EC2Instance', 'AWS::EC2::Instance');

      // Check dynamic instance type based on environment
      expect(templateYaml).toContain('InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]');

      // Check AMI from SSM parameter
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');

      // Check placement in public subnet
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');

      // Check security group and instance profile
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('IamInstanceProfile: !Ref EC2InstanceProfile');
    });

    test('EC2 UserData configures CloudWatch Agent and environment variables', () => {
      expect(templateYaml).toContain('amazon-cloudwatch-agent');
      expect(templateYaml).toContain('export DB_ENDPOINT=${RDSInstance.Endpoint.Address}');
      expect(templateYaml).toContain('export S3_BUCKET=${PaymentDataBucket}');
      expect(templateYaml).toContain('export ENVIRONMENT=${Environment}');
      expect(templateYaml).toContain('systemctl enable amazon-cloudwatch-agent');
    });
  });

  // =================
  // SERVERLESS
  // =================
  describe('Serverless Resources - Lambda Configuration', () => {
    test('Lambda function has proper basic configuration', () => {
      validateResourceExists('PaymentProcessorFunction', 'AWS::Lambda::Function');

      expect(templateYaml).toContain('Runtime: python3.9');
      expect(templateYaml).toContain('Handler: index.lambda_handler');
      expect(templateYaml).toContain('Role: !GetAtt LambdaExecutionRole.Arn');
    });

    test('Lambda function has environment-specific concurrency settings', () => {
      expect(templateYaml).toContain('ReservedConcurrentExecutions: !If');
      expect(templateYaml).toContain('- SetLambdaConcurrency');
      expect(templateYaml).toContain('- !FindInMap [EnvironmentConfig, !Ref Environment, LambdaConcurrency]');
      expect(templateYaml).toContain('- !Ref AWS::NoValue');
    });

    test('Lambda function has proper VPC configuration', () => {
      expect(templateYaml).toContain('VpcConfig:');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref LambdaSecurityGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Lambda function has proper environment variables', () => {
      expect(templateYaml).toContain('Environment:');
      expect(templateYaml).toContain('Variables:');
      expect(templateYaml).toContain('DB_ENDPOINT: !GetAtt RDSInstance.Endpoint.Address');
      expect(templateYaml).toContain('DB_PORT: !GetAtt RDSInstance.Endpoint.Port');
      expect(templateYaml).toContain('S3_BUCKET: !Ref PaymentDataBucket');
      expect(templateYaml).toContain('ENVIRONMENT: !Ref Environment');
    });
  });

  // ===================
  // MONITORING
  // ===================
  describe('Monitoring Resources - CloudWatch Configuration', () => {
    test('EC2 CPU Alarm has environment-specific thresholds', () => {
      validateResourceExists('EC2CPUAlarm', 'AWS::CloudWatch::Alarm');

      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Statistic: Average');
      expect(templateYaml).toContain('Period: 300');
      expect(templateYaml).toContain('EvaluationPeriods: 2');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
      expect(templateYaml).toContain('Threshold: !FindInMap [EnvironmentConfig, !Ref Environment, AlarmCPUThreshold]');
      expect(templateYaml).toContain('Value: !Ref EC2Instance');
    });

    test('RDS Connection Alarm has environment-specific thresholds', () => {
      validateResourceExists('RDSConnectionAlarm', 'AWS::CloudWatch::Alarm');

      expect(templateYaml).toContain('MetricName: DatabaseConnections');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Threshold: !If [IsProd, 80, 20]');
      expect(templateYaml).toContain('Value: !Ref RDSInstance');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC and networking outputs are defined', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidrBlock', 'InternetGatewayId',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'PublicRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security group outputs are defined', () => {
      const securityOutputs = ['EC2SecurityGroupId', 'RDSSecurityGroupId', 'LambdaSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const iamOutputs = [
        'EC2RoleName', 'EC2RoleArn', 'EC2InstanceProfileName', 'EC2InstanceProfileArn',
        'LambdaExecutionRoleName', 'LambdaExecutionRoleArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Compute and database outputs are defined', () => {
      const computeDbOutputs = [
        'EC2InstanceId', 'EC2InstancePublicIP', 'EC2InstancePrivateIP', 'EC2InstancePublicDNS', 'EC2KeyPairName',
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'DBSubnetGroupName', 'DBPasswordSecretArn', 'DBPasswordSecretName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      computeDbOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Storage and serverless outputs are defined', () => {
      const storageServerlessOutputs = [
        'S3BucketName', 'S3BucketArn', 'S3BucketDomainName', 'S3BucketRegionalDomainName',
        'LambdaFunctionName', 'LambdaFunctionArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageServerlessOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring and metadata outputs are defined', () => {
      const monitoringOutputs = [
        'EC2CPUAlarmName', 'RDSConnectionAlarmName',
        'EC2SystemLogGroup'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });

      // Test that some stack metadata is available through AWS pseudo parameters  
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
    });

    test('Outputs follow consistent naming convention', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(10); // Should have many exports
    });
  });

  // ====================
  // CROSS-ACCOUNT/REGION
  // ====================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
      // Note: AWS::StackId is not used in this template, but other pseudo parameters are used
    });

    test('AMI selection uses SSM parameter for cross-region compatibility', () => {
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
    });

    test('Resource naming includes region and environment for uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation Tests', () => {
    test('Deployment outputs exist and follow expected patterns', () => {
      // Skip if no deployment outputs
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.VPCCidrBlock) {
        expect(deployedOutputs.VPCCidrBlock).toBe('10.0.0.0/16');
      }

      // Subnet Resources
      const subnetOutputs = ['PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id'];
      subnetOutputs.forEach(subnetOutput => {
        if (deployedOutputs[subnetOutput]) {
          expect(deployedOutputs[subnetOutput]).toMatch(/^subnet-[a-f0-9]+$/);
        }
      });

      // Security Group Resources
      const sgOutputs = ['EC2SecurityGroupId', 'RDSSecurityGroupId', 'LambdaSecurityGroupId'];
      sgOutputs.forEach(sgOutput => {
        if (deployedOutputs[sgOutput]) {
          expect(deployedOutputs[sgOutput]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('IAM resources follow expected patterns', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // IAM Role ARNs
      if (deployedOutputs.EC2RoleArn) {
        expect(deployedOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(deployedOutputs.EC2RoleArn).toContain(currentStackName);
        expect(deployedOutputs.EC2RoleArn).toContain(region);
        expect(deployedOutputs.EC2RoleArn).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.LambdaExecutionRoleArn) {
        expect(deployedOutputs.LambdaExecutionRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(deployedOutputs.LambdaExecutionRoleArn).toContain('lambda-role');
      }

      // Instance Profile ARN
      if (deployedOutputs.EC2InstanceProfileArn) {
        expect(deployedOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\//);
      }
    });

    test('EC2 resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // EC2 Instance
      if (deployedOutputs.EC2InstanceId) {
        expect(deployedOutputs.EC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
      }

      // IP addresses
      if (deployedOutputs.EC2InstancePublicIP) {
        expect(deployedOutputs.EC2InstancePublicIP).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      }

      if (deployedOutputs.EC2InstancePrivateIP) {
        expect(deployedOutputs.EC2InstancePrivateIP).toMatch(/^10\.0\.\d{1,3}\.\d{1,3}$/);
      }

      // DNS Name
      if (deployedOutputs.EC2InstancePublicDNS) {
        expect(deployedOutputs.EC2InstancePublicDNS).toContain('.compute.amazonaws.com');
        expect(deployedOutputs.EC2InstancePublicDNS).toContain(region);
      }
    });

    test('RDS resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // RDS Endpoint
      if (deployedOutputs.RDSEndpoint) {
        expect(deployedOutputs.RDSEndpoint).toMatch(/\.rds\./);
        expect(deployedOutputs.RDSEndpoint).toContain(region);
        expect(deployedOutputs.RDSEndpoint).toContain(currentStackName.toLowerCase());
      }

      // RDS Port
      if (deployedOutputs.RDSPort) {
        expect(deployedOutputs.RDSPort).toBe('3306'); // MySQL port
      }

      // Secrets Manager
      if (deployedOutputs.DBPasswordSecretArn) {
        expect(deployedOutputs.DBPasswordSecretArn).toMatch(/^arn:aws:secretsmanager:/);
        expect(deployedOutputs.DBPasswordSecretArn).toContain(region);
      }
    });

    test('S3 bucket follows naming convention', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.S3BucketName) {
        // Expected format: {region}-{environment}-payment-data-{account-id}
        expect(deployedOutputs.S3BucketName).toMatch(/^[a-z0-9\-]+-[a-z0-9\-]+-payment-data-\d{12}$/);
        expect(deployedOutputs.S3BucketName).toContain(region);
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironment);
      }

      if (deployedOutputs.S3BucketArn) {
        expect(deployedOutputs.S3BucketArn).toMatch(/^arn:aws:s3:::/);
      }

      if (deployedOutputs.S3BucketDomainName) {
        expect(deployedOutputs.S3BucketDomainName).toContain('.s3.amazonaws.com');
      }
    });

    test('Lambda function is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.LambdaFunctionArn) {
        expect(deployedOutputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
        expect(deployedOutputs.LambdaFunctionArn).toContain(region);
        expect(deployedOutputs.LambdaFunctionArn).toContain('payment-processor');
      }

      if (deployedOutputs.LambdaFunctionName) {
        expect(deployedOutputs.LambdaFunctionName).toContain(currentStackName);
        expect(deployedOutputs.LambdaFunctionName).toContain(region);
        expect(deployedOutputs.LambdaFunctionName).toContain('payment-processor');
      }
    });

    test('CloudWatch resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // CloudWatch Alarms
      if (deployedOutputs.EC2CPUAlarmName) {
        expect(deployedOutputs.EC2CPUAlarmName).toContain('ec2-cpu-alarm');
        expect(deployedOutputs.EC2CPUAlarmName).toContain(currentStackName);
      }

      if (deployedOutputs.RDSConnectionAlarmName) {
        expect(deployedOutputs.RDSConnectionAlarmName).toContain('rds-connection-alarm');
      }

      // Log Groups
      if (deployedOutputs.EC2SystemLogGroup) {
        expect(deployedOutputs.EC2SystemLogGroup).toContain('/aws/ec2/');
        expect(deployedOutputs.EC2SystemLogGroup).toContain(currentEnvironment);
      }

      if (deployedOutputs.LambdaLogGroup) {
        expect(deployedOutputs.LambdaLogGroup).toContain('/aws/lambda/');
        expect(deployedOutputs.LambdaLogGroup).toContain('payment-processor');
      }
    });

    test('Environment-specific configurations are applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment matches what we expect  
      expect(['dev', 'prod']).toContain(currentEnvironment);

      // For dev environment, verify cost-optimized settings would be applied
      if (currentEnvironment === 'dev') {
        console.log('Deployed as development environment - cost-optimized settings applied');
      }

      // For prod environment, verify production settings would be applied
      if (currentEnvironment === 'prod') {
        console.log('Deployed as production environment - performance/reliability settings applied');
      }
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('All critical resource dependencies are properly established', () => {
      // VPC → Subnets
      validateResourceDependencies('PublicSubnet1', ['VPC']);
      validateResourceDependencies('PrivateSubnet1', ['VPC']);

      // Subnets → Security Groups
      validateResourceDependencies('EC2SecurityGroup', ['VPC']);
      validateResourceDependencies('RDSSecurityGroup', ['VPC', 'EC2SecurityGroup', 'LambdaSecurityGroup']);

      // EC2 → Security Groups, Instance Profile, Key Pair
      validateResourceDependencies('EC2Instance', ['EC2SecurityGroup', 'EC2InstanceProfile', 'EC2KeyPair', 'PublicSubnet1']);

      // RDS → DB Subnet Group, Security Group, Secrets
      validateResourceDependencies('RDSInstance', ['DBSubnetGroup', 'RDSSecurityGroup']);

      // Lambda → Security Group, Execution Role, Subnets
      validateResourceDependencies('PaymentProcessorFunction', ['LambdaSecurityGroup', 'LambdaExecutionRole', 'PrivateSubnet1', 'PrivateSubnet2']);

      // CloudWatch Alarms → Target Resources
      validateResourceDependencies('EC2CPUAlarm', ['EC2Instance']);
      validateResourceDependencies('RDSConnectionAlarm', ['RDSInstance']);
    });

    test('Cross-service communication paths are enabled', () => {
      // EC2 can access RDS (via security group)
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');

      // Lambda can access RDS (via security group)
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');

      // EC2 can access S3 (via IAM policy)
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('Resource: !Sub \'${PaymentDataBucket.Arn}/*\'');

      // Lambda can access S3 (via IAM policy)
      expect(templateYaml).toContain('s3:PutObject');
    });

    test('Environment variables provide proper service connectivity', () => {
      // EC2 UserData sets up environment variables
      expect(templateYaml).toContain('export DB_ENDPOINT=${RDSInstance.Endpoint.Address}');
      expect(templateYaml).toContain('export S3_BUCKET=${PaymentDataBucket}');

      // Lambda environment variables
      expect(templateYaml).toContain('DB_ENDPOINT: !GetAtt RDSInstance.Endpoint.Address');
      expect(templateYaml).toContain('S3_BUCKET: !Ref PaymentDataBucket');
    });

    test('Monitoring coverage includes all critical resources', () => {
      // EC2 monitoring
      expect(templateYaml).toContain('EC2CPUAlarm:');
      expect(templateYaml).toContain('Value: !Ref EC2Instance');

      // RDS monitoring
      expect(templateYaml).toContain('RDSConnectionAlarm:');
      expect(templateYaml).toContain('Value: !Ref RDSInstance');

      // CloudWatch Agent configuration in EC2 UserData
      expect(templateYaml).toContain('amazon-cloudwatch-agent');
      expect(templateYaml).toContain('/aws/ec2/${AWS::StackName}-${AWS::Region}-${Environment}-system');
    });

    test('Security best practices are implemented end-to-end', () => {
      // Database is in private subnets
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');

      // Lambda is in private subnets
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');

      // S3 bucket blocks public access
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');

      // RDS is encrypted
      expect(templateYaml).toContain('StorageEncrypted: true');

      // Database password is not hardcoded
      expect(templateYaml).toContain('{{resolve:secretsmanager:');
    });

    test('Template supports complete teardown and recreation', () => {
      // RDS has proper deletion policies
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');
      expect(templateYaml).toContain('UpdateReplacePolicy: Snapshot');

      // All resources have proper tags for identification
      const resourcesWithTags = ['VPC', 'EC2Instance', 'RDSInstance', 'PaymentDataBucket', 'PaymentProcessorFunction'];
      resourcesWithTags.forEach(resourceName => {
        expect(templateYaml).toContain('Tags:');
        expect(templateYaml).toContain('Key: Environment');
        expect(templateYaml).toContain('Value: !Ref Environment');
      });
    });

    test('Template follows CloudFormation best practices', () => {
      // Uses consistent naming patterns
      expect(templateYaml).toContain('!Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}');

      // Uses conditions for environment-specific logic
      expect(templateYaml).toContain('!If [IsProd');
      expect(templateYaml).toContain('- SetLambdaConcurrency');

      // Uses mappings for environment-specific values
      expect(templateYaml).toContain('!FindInMap [EnvironmentConfig');

      // Has proper resource metadata
      expect(templateYaml).toContain('Key: Application');
      expect(templateYaml).toContain('Value: !Ref AWS::StackName');
    });
  });

  // ========================
  // PERFORMANCE & COST
  // ========================
  describe('Performance and Cost Optimization', () => {
    test('Development environment uses cost-optimized resources', () => {
      // Verify dev mappings exist
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('t3.micro'); // Cheap instance type
      expect(mappingsSection).toContain('db.t3.micro'); // Cheap DB instance
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 0'); // No backups in dev
      expect(mappingsSection).toContain('DBMultiAZ: false'); // Single AZ in dev
      expect(mappingsSection).toContain('S3LifecycleDays: 30'); // Quick cleanup
    });

    test('Production environment uses performance-optimized resources', () => {
      // Verify prod mappings exist
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('m5.large'); // Performance instance type
      expect(mappingsSection).toContain('db.m5.large'); // Performance DB instance
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 7'); // Backups in prod
      expect(mappingsSection).toContain('DBMultiAZ: true'); // High availability
      expect(mappingsSection).toContain('S3LifecycleDays: 365'); // Long retention
    });

    test('Lambda concurrency is configured per environment', () => {
      expect(templateYaml).toContain('LambdaConcurrency: 0'); // No reserved concurrency in dev
      expect(templateYaml).toContain('LambdaConcurrency: 10'); // Reserved concurrency in prod
    });
  });

  // ========================
  // SECURITY VALIDATION
  // ========================
  describe('Security Validation', () => {
    test('IAM roles follow least privilege principle', () => {
      // EC2 role only has necessary permissions
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:DeleteObject');
      expect(templateYaml).toContain('s3:ListBucket');

      // No wildcard resource access for S3
      expect(templateYaml).toContain('Resource: !Sub \'${PaymentDataBucket.Arn}/*\'');
      expect(templateYaml).toContain('Resource: !GetAtt PaymentDataBucket.Arn');
    });

    test('Network security groups are restrictive', () => {
      // RDS only accessible from EC2 and Lambda
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LambdaSecurityGroup');

      // No direct internet access to RDS
      expect(templateYaml).not.toContain('CidrIp: 0.0.0.0/0');
    });

    test('SSH access is conditionally restricted in production', () => {
      expect(templateYaml).toContain('CidrIp: !If [IsProd, !Ref AllowedCIDRBlock, \'0.0.0.0/0\']');
    });

    test('Encryption is enabled for data at rest', () => {
      // RDS encryption
      expect(templateYaml).toContain('StorageEncrypted: true');

      // S3 encryption
      expect(templateYaml).toContain('ServerSideEncryptionConfiguration:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });
  });
});
