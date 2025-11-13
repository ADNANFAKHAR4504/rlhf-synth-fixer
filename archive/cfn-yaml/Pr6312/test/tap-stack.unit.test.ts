import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Multi-Environment Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';
  let currentEnvironment = 'unknown-env';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.Region ||
          deployedOutputs.ALBArn?.split(':')[3] ||
          deployedOutputs.VPCId?.split(':')[3] ||
          deployedOutputs.RDSInstanceId?.split(':')[3] ||
          'us-east-1';

        // Extract stack name and environment suffix from resource naming pattern
        if (deployedOutputs.StackName) {
          currentStackName = deployedOutputs.StackName;
        } else {
          // Try different resource names to extract stack name
          const resourceNames = [
            deployedOutputs.AutoScalingGroupName,
            deployedOutputs.RDSInstanceId,
            deployedOutputs.S3BucketName,
            deployedOutputs.ALBArn?.split('/')[1] // Extract ALB name from ARN
          ].filter(Boolean);

          for (const resourceName of resourceNames) {
            if (resourceName) {
              console.log('Analyzing resource name:', resourceName);
              const nameParts = resourceName.split('-');
              console.log('Name parts:', nameParts);

              // First part is typically the stack name
              currentStackName = nameParts[0] || 'TapStack';

              // Find the environment suffix (look for pattern like pr8888, pr4056, etc.)
              const envSuffixIndex = nameParts.findIndex((part: string) =>
                part.match(/^(pr|dev|prod|test)\d*$/) ||
                (part.startsWith('pr') && part.length > 2)
              );

              if (envSuffixIndex >= 0) {
                currentEnvironmentSuffix = nameParts[envSuffixIndex];
                break; // Found a valid pattern, use this
              }
            }
          }
        }

        // Extract environment from outputs or default
        currentEnvironment = deployedOutputs.Environment || 'prod';

        // Extract environment suffix from outputs or resource names
        if (deployedOutputs.EnvironmentSuffix) {
          currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix;
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
      expect(templateYaml).toContain('Description: \'Multi-environment infrastructure with automated replication capabilities\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates multi-environment capabilities', () => {
      expect(templateYaml).toContain('Multi-environment infrastructure with automated replication capabilities');
    });

    test('Template contains all critical AWS resource types for multi-environment infrastructure', () => {
      const criticalResourceTypes = [
        'AWS::SecretsManager::Secret',
        'AWS::EC2::KeyPair',
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::EC2::LaunchTemplate',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudWatch::Dashboard',
        'AWS::Lambda::Function'
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
    test('Environment parameter supports multi-environment deployments', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('Environment:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Default: "prod"');
      expect(parametersSection).toContain('AllowedValues:');
      expect(parametersSection).toContain('- dev');
      expect(parametersSection).toContain('- staging');
      expect(parametersSection).toContain('- prod');
    });

    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern: "^[a-zA-Z0-9\\\\-]*$"');
      // Dynamic check - should have a Default value that matches the allowed pattern
      const defaultMatch = templateYaml.match(/Default: "([a-zA-Z0-9\-]+)"/);
      expect(defaultMatch).toBeTruthy();
      if (defaultMatch) {
        expect(defaultMatch[1]).toMatch(/^[a-zA-Z0-9\-]+$/);
      }
      expect(templateYaml).toContain('parallel deployments');
    });

    test('ProjectName parameter has proper configuration', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('ProjectName:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Default: "MultiEnvProject"');
    });

    test('DBMasterUsername parameter is properly configured', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('DBMasterUsername:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Default: "dbadmin"');
    });

    test('AlertEmail parameter has proper validation', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('AlertEmail:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('AllowedPattern:');
      expect(parametersSection).toContain('ConstraintDescription: "Must be a valid email address"');
    });
  });

  // ===========
  // MAPPINGS
  // ===========
  describe('Environment Mappings - Multi-Environment Configuration', () => {
    test('EnvConfig mapping contains all required environments', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('EnvConfig:');
      expect(mappingsSection).toContain('dev:');
      expect(mappingsSection).toContain('staging:');
      expect(mappingsSection).toContain('prod:');
    });

    test('Environment-specific VPC CIDR ranges are non-overlapping', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('VpcCidr: 10.0.0.0/16'); // dev
      expect(mappingsSection).toContain('VpcCidr: 10.1.0.0/16'); // staging
      expect(mappingsSection).toContain('VpcCidr: 10.2.0.0/16'); // prod
    });

    test('Environment-specific database configurations are properly sized', () => {
      const mappingsSection = extractYamlSection('Mappings');
      // Dev environment
      expect(mappingsSection).toContain('DBInstanceClass: db.t3.micro');
      // Staging environment  
      expect(mappingsSection).toContain('DBInstanceClass: db.t3.small');
      // Production environment
      expect(mappingsSection).toContain('DBInstanceClass: db.m5.large');
    });

    test('Auto Scaling configurations are environment-appropriate', () => {
      const mappingsSection = extractYamlSection('Mappings');
      // Dev: smaller scale
      expect(mappingsSection).toContain('ASGMinSize: "1"');
      expect(mappingsSection).toContain('ASGMaxSize: "2"');
      // Staging: medium scale
      expect(mappingsSection).toContain('ASGMinSize: "2"');
      expect(mappingsSection).toContain('ASGMaxSize: "4"');
      // Prod: larger scale
      expect(mappingsSection).toContain('ASGMinSize: "4"');
      expect(mappingsSection).toContain('ASGMaxSize: "8"');
    });

    test('Health check intervals are environment-tuned', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('ALBHealthInterval: "30"'); // dev
      expect(mappingsSection).toContain('ALBHealthInterval: "15"'); // staging
      expect(mappingsSection).toContain('ALBHealthInterval: "5"'); // prod
    });

    test('Backup and lifecycle policies vary by environment', () => {
      const mappingsSection = extractYamlSection('Mappings');
      // S3 lifecycle
      expect(mappingsSection).toContain('S3LifecycleDays: "7"'); // dev
      expect(mappingsSection).toContain('S3LifecycleDays: "30"'); // staging
      expect(mappingsSection).toContain('S3LifecycleDays: "90"'); // prod

      // RDS backup retention
      expect(mappingsSection).toContain('BackupRetention: "1"'); // dev
      expect(mappingsSection).toContain('BackupRetention: "7"'); // staging
      expect(mappingsSection).toContain('BackupRetention: "30"'); // prod
    });

    test('Production-specific protection settings are configured', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('MultiAZ: "true"'); // prod only
      expect(mappingsSection).toContain('DeletionProtection: "true"'); // prod only
    });
  });

  // =============
  // CONDITIONS
  // =============
  describe('Conditions - Environment-Specific Logic', () => {
    test('Conditional logic is properly defined', () => {
      const conditionsSection = extractYamlSection('Conditions');
      expect(conditionsSection).toContain('IsProd: !Equals [!Ref Environment, prod]');
      expect(conditionsSection).toContain('EnableMultiAZ: !Equals [!FindInMap [EnvConfig, !Ref Environment, MultiAZ], "true"]');
      expect(conditionsSection).toContain('EnableDeletionProtection: !Equals [!FindInMap [EnvConfig, !Ref Environment, DeletionProtection], "true"]');
    });

    test('Conditions reference environment mappings correctly', () => {
      expect(templateYaml).toContain('!FindInMap [EnvConfig, !Ref Environment, MultiAZ]');
      expect(templateYaml).toContain('!FindInMap [EnvConfig, !Ref Environment, DeletionProtection]');
    });
  });

  // ==================
  // SECRETS MANAGER
  // ==================
  describe('Secrets Manager - Secure Credential Management', () => {
    test('DB Master Secret is properly configured', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret\'');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('SecretStringTemplate: !Sub \'{"username": "${DBMasterUsername}"}\'');
      expect(templateYaml).toContain('GenerateStringKey: \'password\'');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludePunctuation: true');
    });

    test('Secret follows proper naming convention', () => {
      expect(templateYaml).toContain('Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-secret"');
    });
  });

  // ==================
  // KEY PAIR
  // ==================
  describe('EC2 Key Pair - Dynamic Key Management', () => {
    test('EC2 Key Pair is dynamically created', () => {
      validateResourceExists('EC2KeyPair', 'AWS::EC2::KeyPair');
      expect(templateYaml).toContain('KeyName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair"');
      expect(templateYaml).toContain('KeyType: rsa');
      expect(templateYaml).toContain('KeyFormat: pem');
    });

    test('Key Pair follows proper naming convention and tagging', () => {
      expect(templateYaml).toContain('Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair"');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources - Multi-Environment Architecture', () => {
    test('VPC is properly configured with dynamic CIDR', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !FindInMap [EnvConfig, !Ref Environment, VpcCidr]');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('AttachGateway', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
    });

    test('Public subnets are properly configured across multiple AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];

      publicSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain('VpcId: !Ref VPC');
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
      });

      // Verify AZ distribution using dynamic CIDR calculation
      expect(templateYaml).toContain('CidrBlock: !Select [0, !Cidr [!FindInMap [EnvConfig, !Ref Environment, VpcCidr], 6, 8]]');
      expect(templateYaml).toContain('CidrBlock: !Select [1, !Cidr [!FindInMap [EnvConfig, !Ref Environment, VpcCidr], 6, 8]]');
      expect(templateYaml).toContain('AvailabilityZone: !Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('AvailabilityZone: !Select [1, !GetAZs \'\']');
    });

    test('Private subnets are properly configured', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2'];

      privateSubnets.forEach(subnet => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain('VpcId: !Ref VPC');
      });

      // Verify private subnet CIDR blocks
      expect(templateYaml).toContain('CidrBlock: !Select [2, !Cidr [!FindInMap [EnvConfig, !Ref Environment, VpcCidr], 6, 8]]');
      expect(templateYaml).toContain('CidrBlock: !Select [3, !Cidr [!FindInMap [EnvConfig, !Ref Environment, VpcCidr], 6, 8]]');
    });

    test('NAT Gateways are properly configured for outbound access', () => {
      validateResourceExists('NATGateway1EIP', 'AWS::EC2::EIP');
      validateResourceExists('NATGateway2EIP', 'AWS::EC2::EIP');
      validateResourceExists('NATGateway1', 'AWS::EC2::NatGateway');
      validateResourceExists('NATGateway2', 'AWS::EC2::NatGateway');

      expect(templateYaml).toContain('DependsOn: AttachGateway');
      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('AllocationId: !GetAtt NATGateway1EIP.AllocationId');
      expect(templateYaml).toContain('AllocationId: !GetAtt NATGateway2EIP.AllocationId');
    });

    test('Route tables and associations are properly configured', () => {
      const routeTables = ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'];
      const routes = ['PublicRoute', 'PrivateRoute1', 'PrivateRoute2'];

      routeTables.forEach(routeTable => {
        validateResourceExists(routeTable, 'AWS::EC2::RouteTable');
        expect(templateYaml).toContain('VpcId: !Ref VPC');
      });

      routes.forEach(route => {
        validateResourceExists(route, 'AWS::EC2::Route');
        expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
      });

      // Verify associations
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet2');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet1');
      expect(templateYaml).toContain('SubnetId: !Ref PrivateSubnet2');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('ALB Security Group allows appropriate traffic', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for Application Load Balancer');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');
    });

    test('Web Server Security Group has restricted access', () => {
      validateResourceExists('WebServerSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for web servers');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
    });

    test('RDS Security Group allows database access from web servers', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for RDS database');
      expect(templateYaml).toContain('FromPort: 5432');
      expect(templateYaml).toContain('ToPort: 5432');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebServerSecurityGroup');
    });
  });

  // ==================
  // RDS DATABASE
  // ==================
  describe('RDS Database - Multi-Environment Configuration', () => {
    test('DB Subnet Group is properly configured', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('DBSubnetGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('RDS Instance uses Secrets Manager for credentials', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('Engine: postgres');
      expect(templateYaml).toContain('EngineVersion: \'14\'');
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
    });

    test('RDS Instance has environment-specific configuration', () => {
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvConfig, !Ref Environment, DBInstanceClass]');
      expect(templateYaml).toContain('BackupRetentionPeriod: !FindInMap [EnvConfig, !Ref Environment, BackupRetention]');
      expect(templateYaml).toContain('MultiAZ: !If [EnableMultiAZ, true, false]');
      expect(templateYaml).toContain('DeletionProtection: !If [EnableDeletionProtection, true, false]');
    });

    test('RDS Instance has proper security and backup configuration', () => {
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('VPCSecurityGroups:');
      expect(templateYaml).toContain('- !Ref RDSSecurityGroup');
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref DBSubnetGroup');
      expect(templateYaml).toContain('DeletionPolicy: !If [EnableDeletionProtection, Retain, Delete]');
      expect(templateYaml).toContain('UpdateReplacePolicy: !If [EnableDeletionProtection, Retain, Delete]');
    });

    test('RDS snapshot Lambda function is configured', () => {
      validateResourceExists('RDSSnapshotLambda', 'AWS::Lambda::Function');
      expect(templateYaml).toContain('Runtime: python3.9');
      expect(templateYaml).toContain('Handler: index.handler');
      expect(templateYaml).toContain('import boto3');
      expect(templateYaml).toContain('rds_client = boto3.client(\'rds\')');
      expect(templateYaml).toContain('create_db_snapshot');
    });
  });

  // ===============
  // STORAGE
  // ===============
  describe('S3 Storage - Environment-Specific Configuration', () => {
    test('S3 Bucket has comprehensive security configuration', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-bucket"');

      // Encryption
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');

      // Versioning
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');

      // Public access blocked
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('S3 Bucket has environment-specific lifecycle policies', () => {
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays: !FindInMap [EnvConfig, !Ref Environment, S3LifecycleDays]');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('EC2 Role has proper configuration', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');
      expect(templateYaml).toContain('AssumeRolePolicyDocument:');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: sts:AssumeRole');
      expect(templateYaml).toContain('ManagedPolicyArns:');
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 Role has S3 access policies', () => {
      expect(templateYaml).toContain('PolicyName: S3Access');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:DeleteObject');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('!GetAtt S3Bucket.Arn');
      expect(templateYaml).toContain('!Sub "${S3Bucket.Arn}/*"');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });

    test('Lambda Execution Role is properly configured', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: lambda.amazonaws.com');
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(templateYaml).toContain('rds:CreateDBSnapshot');
      expect(templateYaml).toContain('rds:DescribeDBSnapshots');
      expect(templateYaml).toContain('rds:DescribeDBInstances');
    });
  });

  // =================
  // COMPUTE RESOURCES
  // =================
  describe('Compute Resources - Auto Scaling Configuration', () => {
    test('Launch Template is properly configured', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('LaunchTemplateName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lt"');
      expect(templateYaml).toContain('ImageId: \'{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}\'');
      expect(templateYaml).toContain('InstanceType: !If [IsProd, t3.medium, t3.micro]');
      expect(templateYaml).toContain('KeyName: !Ref EC2KeyPair');
    });

    test('Launch Template has proper security configuration', () => {
      expect(templateYaml).toContain('IamInstanceProfile:');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref WebServerSecurityGroup');
    });

    test('Auto Scaling Group has environment-specific configuration', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('MinSize: !FindInMap [EnvConfig, !Ref Environment, ASGMinSize]');
      expect(templateYaml).toContain('MaxSize: !FindInMap [EnvConfig, !Ref Environment, ASGMaxSize]');
      expect(templateYaml).toContain('DesiredCapacity: !FindInMap [EnvConfig, !Ref Environment, ASGDesiredSize]');
    });

    test('Auto Scaling Group is properly integrated with load balancer', () => {
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('TargetGroupARNs:');
      expect(templateYaml).toContain('- !Ref TargetGroup');
      expect(templateYaml).toContain('HealthCheckType: ELB');
    });
  });

  // ==================
  // LOAD BALANCING
  // ==================
  describe('Load Balancing - Traffic Distribution', () => {
    test('Target Group is properly configured', () => {
      validateResourceExists('TargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateYaml).toContain('Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-tg"');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Target Group has environment-specific health checks', () => {
      expect(templateYaml).toContain('HealthCheckIntervalSeconds: !FindInMap [EnvConfig, !Ref Environment, ALBHealthInterval]');
      expect(templateYaml).toContain('HealthCheckPath: /');
      expect(templateYaml).toContain('HealthCheckProtocol: HTTP');
    });

    test('Application Load Balancer is properly configured', () => {
      validateResourceExists('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateYaml).toContain('Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-alb"');
      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('SecurityGroups:');
      expect(templateYaml).toContain('- !Ref ALBSecurityGroup');
      expect(templateYaml).toContain('Subnets:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
    });

    test('ALB Listener is properly configured', () => {
      validateResourceExists('ALBListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('LoadBalancerArn: !Ref ApplicationLoadBalancer');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('Type: forward');
      expect(templateYaml).toContain('TargetGroupArn: !Ref TargetGroup');
    });
  });

  // ===================
  // MONITORING & ALERTS
  // ===================
  describe('Monitoring and Alerting - CloudWatch Integration', () => {
    test('SNS Topic is configured for alerts', () => {
      validateResourceExists('SNSTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('TopicName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alerts"');
      expect(templateYaml).toContain('Subscription:');
      expect(templateYaml).toContain('Endpoint: !Ref AlertEmail');
      expect(templateYaml).toContain('Protocol: email');
    });

    test('CloudWatch Alarms are configured with environment-specific thresholds', () => {
      validateResourceExists('CPUAlarmHigh', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Threshold: !FindInMap [EnvConfig, !Ref Environment, CPUAlarmThreshold]');
      expect(templateYaml).toContain('AlarmActions:');
      expect(templateYaml).toContain('- !Ref SNSTopic');
    });

    test('RDS monitoring alarms are configured', () => {
      validateResourceExists('RDSStorageAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: FreeStorageSpace');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Dimensions:');
      expect(templateYaml).toContain('DBInstanceIdentifier');
      expect(templateYaml).toContain('Value: !Ref RDSInstance');
    });

    test('CloudWatch Dashboard provides comprehensive monitoring', () => {
      validateResourceExists('Dashboard', 'AWS::CloudWatch::Dashboard');
      expect(templateYaml).toContain('DashboardName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-dashboard"');
      expect(templateYaml).toContain('DashboardBody: !Sub');
      expect(templateYaml).toContain('CPUUtilization');
      expect(templateYaml).toContain('RequestCount');
      expect(templateYaml).toContain('TargetResponseTime');
    });

    test('Stack Policy Lambda for production protection', () => {
      expect(templateYaml).toContain('StackPolicyLambda:');
      expect(templateYaml).toContain('Condition: IsProd');
      expect(templateYaml).toContain('AWS::RDS::DBInstance');
      expect(templateYaml).toContain('AWS::S3::Bucket');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('Secrets Manager and Key Pair outputs are defined', () => {
      const secretsOutputs = ['DBSecretArn', 'DBSecretName', 'EC2KeyPairId', 'EC2KeyPairName'];
      const outputsSection = extractYamlSection('Outputs');

      secretsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub "${AWS::StackName}-');
      });
    });

    test('VPC and networking outputs are comprehensive', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidr', 'InternetGatewayId',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'NATGateway1Id', 'NATGateway2Id', 'PublicRouteTableId', 'PrivateRouteTable1Id', 'PrivateRouteTable2Id'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security group outputs are defined', () => {
      const securityOutputs = ['ALBSecurityGroupId', 'WebServerSecurityGroupId', 'RDSSecurityGroupId'];
      const outputsSection = extractYamlSection('Outputs');

      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Database and storage outputs are comprehensive', () => {
      const storageOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'DBSubnetGroupName',
        'S3BucketName', 'S3BucketArn', 'S3BucketDomainName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Compute and load balancing outputs are defined', () => {
      const computeOutputs = [
        'LaunchTemplateId', 'AutoScalingGroupName', 'ALBArn', 'ALBDNSName', 'TargetGroupArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      computeOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring and metadata outputs are defined', () => {
      const monitoringOutputs = [
        'SNSTopicArn', 'CPUAlarmName', 'DashboardName', 'Environment', 'EnvironmentSuffix',
        'ProjectName', 'StackName', 'Region'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        if (output !== 'DashboardURL') {
          expect(outputsSection).toContain('Export:');
        }
      });
    }); test('Outputs follow consistent naming convention', () => {
      const exportPattern = /Name: !Sub "\${AWS::StackName}-([\w-]+)"/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(30); // Should have many exports
    });
  });

  // ====================
  // CROSS-ACCOUNT/REGION
  // ====================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /(?<!AWS::AccountId[^}]*)\b\d{12}\b/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('Dynamic CIDR calculation supports any region', () => {
      expect(templateYaml).toContain('!Cidr [!FindInMap [EnvConfig, !Ref Environment, VpcCidr], 6, 8]');
      expect(templateYaml).toContain('!GetAZs \'\'');
    });

    test('AMI resolution uses dynamic SSM parameter', () => {
      expect(templateYaml).toContain('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });
  });

  // ======================
  // ENVIRONMENT VALIDATION
  // ======================
  describe('Multi-Environment Deployment Validation', () => {
    test('Template supports all three target environments', () => {
      const environments = ['dev', 'staging', 'prod'];
      environments.forEach(env => {
        expect(templateYaml).toContain(`${env}:`);
      });
    });

    test('Environment-specific resource scaling is properly implemented', () => {
      // Verify that mapping values are used throughout the template
      expect(templateYaml).toContain('!FindInMap [EnvConfig, !Ref Environment, DBInstanceClass]');
      expect(templateYaml).toContain('!FindInMap [EnvConfig, !Ref Environment, ASGMinSize]');
      expect(templateYaml).toContain('!FindInMap [EnvConfig, !Ref Environment, ALBHealthInterval]');
    });

    test('Conditional resources are properly configured', () => {
      expect(templateYaml).toContain('!If [EnableMultiAZ, true, false]');
      expect(templateYaml).toContain('!If [EnableDeletionProtection, true, false]');
      expect(templateYaml).toContain('!If [IsProd, t3.medium, t3.micro]');
    });

    test('Production safeguards are conditionally applied', () => {
      expect(templateYaml).toContain('Condition: IsProd');
      expect(templateYaml).toContain('DeletionPolicy: !If [EnableDeletionProtection, Retain, Delete]');
      expect(templateYaml).toContain('UpdateReplacePolicy: !If [EnableDeletionProtection, Retain, Delete]');
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

      // Verify dynamic environment-based CIDR
      if (deployedOutputs.VPCCidr && currentEnvironment) {
        const expectedCidrs = {
          'dev': '10.0.0.0/16',
          'staging': '10.1.0.0/16',
          'prod': '10.2.0.0/16'
        };
        const expectedCidr = expectedCidrs[currentEnvironment as keyof typeof expectedCidrs];
        if (expectedCidr) {
          expect(deployedOutputs.VPCCidr).toBe(expectedCidr);
        }
      }

      // Security Group Resources
      const sgOutputs = ['ALBSecurityGroupId', 'WebServerSecurityGroupId', 'RDSSecurityGroupId'];
      sgOutputs.forEach(sgOutput => {
        if (deployedOutputs[sgOutput]) {
          expect(deployedOutputs[sgOutput]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('Database configuration matches environment', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSEndpoint && deployedOutputs.RDSInstanceId) {
        expect(deployedOutputs.RDSEndpoint).toContain(region);
        // Use case-insensitive check for stack name as AWS may lowercase resource names
        expect(deployedOutputs.RDSInstanceId.toLowerCase()).toContain(currentStackName.toLowerCase());
        expect(deployedOutputs.RDSInstanceId).toContain(region);
        expect(deployedOutputs.RDSInstanceId).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.RDSPort) {
        expect(deployedOutputs.RDSPort).toBe('5432'); // PostgreSQL default port
      }
    });

    test('Load balancer is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.ALBDNSName) {
        // AWS ALB DNS names have the format: name-randomnumber.region.elb.amazonaws.com
        expect(deployedOutputs.ALBDNSName).toMatch(/^[a-zA-Z0-9\-]+-\d+\.[a-z0-9\-]+\.elb\.amazonaws\.com$/);
      }

      if (deployedOutputs.ALBArn) {
        expect(deployedOutputs.ALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
        expect(deployedOutputs.ALBArn).toContain(region);
      }
    });

    test('Storage resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // S3 Bucket
      if (deployedOutputs.S3BucketName) {
        expect(deployedOutputs.S3BucketName).toContain(region);
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.S3BucketName).toContain('bucket');
      }

      if (deployedOutputs.S3BucketArn) {
        expect(deployedOutputs.S3BucketArn).toMatch(/^arn:aws:s3:::/);
      }
    });

    test('Auto Scaling and compute resources are deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.AutoScalingGroupName) {
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentStackName);
        expect(deployedOutputs.AutoScalingGroupName).toContain(region);
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.LaunchTemplateId) {
        expect(deployedOutputs.LaunchTemplateId).toMatch(/^lt-[a-f0-9]+$/);
      }
    });

    test('Environment-specific naming is applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment and suffix match deployment
      if (deployedOutputs.Environment) {
        expect(deployedOutputs.Environment).toMatch(/^(dev|staging|prod)$/);
        currentEnvironment = deployedOutputs.Environment;
      }

      if (deployedOutputs.EnvironmentSuffix) {
        expect(deployedOutputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9\-]+$/);
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix;
      }

      console.log('Deployed Environment:', currentEnvironment);
      console.log('Deployed Environment Suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain these values for proper isolation');
    });

    test('Secrets Manager resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.DBSecretArn) {
        expect(deployedOutputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);
        expect(deployedOutputs.DBSecretArn).toContain(region);
      }

      if (deployedOutputs.DBSecretName) {
        expect(deployedOutputs.DBSecretName).toContain(currentStackName);
        expect(deployedOutputs.DBSecretName).toContain(region);
        expect(deployedOutputs.DBSecretName).toContain(currentEnvironmentSuffix);
      }
    });

    test('Key Pair is dynamically created', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.EC2KeyPairName) {
        expect(deployedOutputs.EC2KeyPairName).toContain(currentStackName);
        expect(deployedOutputs.EC2KeyPairName).toContain(region);
        expect(deployedOutputs.EC2KeyPairName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.EC2KeyPairName).toContain('keypair');
      }
    });
  });

  // ========================
  // PERFORMANCE & RELIABILITY
  // ========================
  describe('Performance and Reliability Features', () => {
    test('Multi-AZ deployment provides high availability', () => {
      // Subnets span multiple AZs
      expect(templateYaml).toContain('AvailabilityZone: !Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('AvailabilityZone: !Select [1, !GetAZs \'\']');

      // Auto Scaling Group uses multiple subnets
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Data protection features are enabled', () => {
      // S3 versioning
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');

      // RDS backup and encryption
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('BackupRetentionPeriod:');

      // Secrets Manager for credentials
      expect(templateYaml).toContain('AWS::SecretsManager::Secret');
    });

    test('Environment-appropriate scaling and performance settings', () => {
      // Instance types conditional on environment
      expect(templateYaml).toContain('InstanceType: !If [IsProd, t3.medium, t3.micro]');

      // Health check intervals tuned per environment
      expect(templateYaml).toContain('HealthCheckIntervalSeconds: !FindInMap [EnvConfig, !Ref Environment, ALBHealthInterval]');
    });

    test('Cost optimization features are implemented', () => {
      // Environment-appropriate instance classes
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvConfig, !Ref Environment, DBInstanceClass]');

      // Lifecycle policies for S3
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays');
    });
  });
});
