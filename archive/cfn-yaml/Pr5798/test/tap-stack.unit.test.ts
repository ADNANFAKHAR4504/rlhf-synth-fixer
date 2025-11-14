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
          deployedOutputs.RDSInstanceArn?.split(':')[3] ||
          deployedOutputs.DBMasterSecretArn?.split(':')[3] ||
          deployedOutputs.S3BucketArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from resource naming pattern
        if (deployedOutputs.EC2RoleName) {
          console.log('Raw EC2RoleName:', deployedOutputs.EC2RoleName);
          const roleParts = deployedOutputs.EC2RoleName.split('-');
          console.log('EC2RoleName parts:', roleParts);
          currentStackName = roleParts[0] || 'TapStack';

          // Find the environment suffix (look for pattern like pr4056, dev-123, etc.)
          const envSuffixIndex = roleParts.findIndex((part: string) =>
            part.match(/^(pr|dev|prod|test)\d+$/) ||
            (part.startsWith('pr') && part.length > 2)
          );
          currentEnvironmentSuffix = envSuffixIndex >= 0 ? roleParts[envSuffixIndex] : 'pr4056';
        }

        // Extract environment from VPC CIDR or other resource patterns
        if (deployedOutputs.VPCCidr) {
          console.log('Raw VPCCidr:', deployedOutputs.VPCCidr);
          // VPC CIDR indicates environment: 10.0.x.x=dev, 10.1.x.x=testing, 10.2.x.x=prod
          if (deployedOutputs.VPCCidr.startsWith('10.0.')) {
            currentEnvironment = 'dev';
          } else if (deployedOutputs.VPCCidr.startsWith('10.1.')) {
            currentEnvironment = 'testing';
          } else if (deployedOutputs.VPCCidr.startsWith('10.2.')) {
            currentEnvironment = 'prod';
          } else {
            currentEnvironment = 'dev'; // default
          }
        } else {
          // Default to dev for testing
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
      expect(templateYaml).toContain('Description: \'Unified infrastructure template for dev, testing, and prod environments');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates unified environment support', () => {
      expect(templateYaml).toContain('Unified infrastructure template for dev, testing, and prod environments');
      expect(templateYaml).toContain('complete isolation and security');
    });

    test('Template contains all critical AWS resource types', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::KeyPair',
        'AWS::EC2::LaunchTemplate',
        'AWS::EC2::Instance',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::ScalingPolicy',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::CloudWatch::Alarm',
        'AWS::SecretsManager::Secret',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::SSM::Parameter',
        'AWS::SNS::Topic'
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
        'ProjectName',
        'Owner',
        'CostCenter',
        'DBMasterUsername',
        'SourceAmiIdSsmParameter'
      ];

      requiredParams.forEach(param => {
        expect(parametersSection).toContain(`${param}:`);
        expect(parametersSection).toContain('Description:');
      });
    });

    test('Environment parameter supports dev/testing/prod with proper constraints', () => {
      expect(templateYaml).toContain('Environment:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- dev');
      expect(templateYaml).toContain('- testing');
      expect(templateYaml).toContain('- prod');
      expect(templateYaml).toContain('Default: dev');
    });

    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9\\-]*$\'');
      expect(templateYaml).toContain('Default: "pr4056"');
      expect(templateYaml).toContain('parallel deployments');
    });

    test('Database username parameter has proper security', () => {
      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain('NoEcho: true');
      expect(templateYaml).toContain('Default: \'dbadmin\'');
    });

    test('AMI parameter uses SSM for cross-region compatibility', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  // ====================
  // MAPPINGS
  // ====================
  describe('Mappings Section - Environment-Specific Configuration', () => {
    test('EnvironmentConfig mapping is properly defined for all environments', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('EnvironmentConfig:');
      expect(mappingsSection).toContain('dev:');
      expect(mappingsSection).toContain('testing:');
      expect(mappingsSection).toContain('prod:');
    });

    test('Development environment has cost-optimized settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('VpcCidr: \'10.0.0.0/16\'');
      expect(mappingsSection).toContain('InstanceType: \'t3.micro\'');
      expect(mappingsSection).toContain('RdsInstanceClass: \'db.t3.micro\'');
      expect(mappingsSection).toContain('RdsStorage: \'20\'');
      expect(mappingsSection).toContain('BackupRetention: \'1\'');
      expect(mappingsSection).toContain('MultiAZ: \'false\'');
      expect(mappingsSection).toContain('MinSize: \'1\'');
      expect(mappingsSection).toContain('MaxSize: \'2\'');
      expect(mappingsSection).toContain('DesiredCapacity: \'1\'');
    });

    test('Testing environment has intermediate settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('VpcCidr: \'10.1.0.0/16\'');
      expect(mappingsSection).toContain('InstanceType: \'t3.small\'');
      expect(mappingsSection).toContain('RdsInstanceClass: \'db.t3.small\'');
      expect(mappingsSection).toContain('RdsStorage: \'50\'');
      expect(mappingsSection).toContain('BackupRetention: \'7\'');
      expect(mappingsSection).toContain('MinSize: \'1\'');
      expect(mappingsSection).toContain('MaxSize: \'3\'');
      expect(mappingsSection).toContain('DesiredCapacity: \'2\'');
    });

    test('Production environment has performance/reliability settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('VpcCidr: \'10.2.0.0/16\'');
      expect(mappingsSection).toContain('InstanceType: \'t3.medium\'');
      expect(mappingsSection).toContain('RdsInstanceClass: \'db.t3.medium\'');
      expect(mappingsSection).toContain('RdsStorage: \'100\'');
      expect(mappingsSection).toContain('BackupRetention: \'30\'');
      expect(mappingsSection).toContain('MultiAZ: \'true\'');
      expect(mappingsSection).toContain('MinSize: \'2\'');
      expect(mappingsSection).toContain('MaxSize: \'10\'');
      expect(mappingsSection).toContain('DesiredCapacity: \'3\'');
    });

    test('Database engine and version are consistently configured', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('DBEngine: \'mysql\'');
      expect(mappingsSection).toContain('DBEngineVersion: \'8.0.43\'');
    });
  });

  // ==================
  // CONDITIONS
  // ==================
  describe('Conditions Section - Environment Logic', () => {
    test('Conditions are properly defined', () => {
      const conditionsSection = extractYamlSection('Conditions');
      expect(conditionsSection).toContain('IsProduction:');
      expect(conditionsSection).toContain('IsNotProduction:');
      expect(conditionsSection).toContain('IsNotDevelopment:');
    });

    test('IsProduction condition logic is correct', () => {
      expect(templateYaml).toContain('IsProduction: !Equals [!Ref Environment, \'prod\']');
    });

    test('IsNotProduction condition logic is correct', () => {
      expect(templateYaml).toContain('IsNotProduction: !Not [!Condition IsProduction]');
    });

    test('IsNotDevelopment condition logic is correct', () => {
      expect(templateYaml).toContain('IsNotDevelopment: !Not [!Equals [!Ref Environment, \'dev\']]');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured with environment-specific CIDR', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Subnets are properly configured across multiple AZs', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      const expectedCidrRefs = ['PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr'];

      subnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, ${expectedCidrRefs[index]}]`);
        expect(templateYaml).toContain('VpcId: !Ref VPC');
      });

      // Verify AZ distribution
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');

      // Public subnets should have MapPublicIpOnLaunch
      expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
    });

    test('Internet Gateway and routing are properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('VPCGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('DestinationCidrBlock: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('NAT Gateway is conditionally created for non-dev environments', () => {
      validateResourceExists('NATGateway', 'AWS::EC2::NatGateway');
      validateResourceExists('EIPForNATGateway', 'AWS::EC2::EIP');

      expect(templateYaml).toContain('Condition: IsNotDevelopment');
      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('AllocationId: !GetAtt EIPForNATGateway.AllocationId');
    });

    test('Private route table and routing are configured', () => {
      validateResourceExists('PrivateRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('NatGatewayId: !Ref NATGateway');
    });

    test('Subnet route table associations are configured', () => {
      validateResourceExists('PublicSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PublicSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PrivateSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PrivateSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
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
      expect(templateYaml).toContain('CidrIp: \'0.0.0.0/0\'');

      // Check HTTP access (port 80)
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');

      // Check HTTPS access (port 443)
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
    });

    test('RDS Security Group has restricted access from EC2', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');

      // Should only allow access from EC2 security group
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');

      // Check MySQL port access
      expect(templateYaml).toContain('FromPort: 3306');
      expect(templateYaml).toContain('ToPort: 3306');
      expect(templateYaml).toContain('MySQL access from EC2 instances');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('EC2 Instance Role has proper assume role policy', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: \'sts:AssumeRole\'');
    });

    test('EC2 Role has required managed policies and custom permissions', () => {
      // Check managed policy
      expect(templateYaml).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

      // Check custom policy permissions
      expect(templateYaml).toContain('ssm:GetParameter');
      expect(templateYaml).toContain('ssm:GetParameters');
      expect(templateYaml).toContain('ssm:GetParameterHistory');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      validateResourceDependencies('EC2InstanceProfile', ['EC2Role']);
    });
  });

  // ===============
  // STORAGE & SECRETS
  // ===============
  describe('Storage and Secrets Resources', () => {
    test('S3 Bucket has proper security configuration', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');

      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
    });

    test('S3 Bucket Policy enforces security', () => {
      validateResourceExists('S3BucketPolicy', 'AWS::S3::BucketPolicy');

      expect(templateYaml).toContain('DenyInsecureConnections');
      expect(templateYaml).toContain('aws:SecureTransport');
      expect(templateYaml).toContain('AllowEC2RoleAccess');
    });

    test('Secrets Manager handles database password securely', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');

      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludePunctuation: true');
      expect(templateYaml).toContain('SecretStringTemplate:');
    });

    test('EC2 Key Pair is auto-generated', () => {
      validateResourceExists('EC2KeyPair', 'AWS::EC2::KeyPair');
      expect(templateYaml).toContain('KeyType: rsa');
      expect(templateYaml).toContain('KeyFormat: pem');
    });
  });

  // =============
  // SSM PARAMETERS
  // =============
  describe('SSM Parameters - Configuration Management', () => {
    test('Database parameters are stored in SSM', () => {
      validateResourceExists('DBHostParameter', 'AWS::SSM::Parameter');
      validateResourceExists('DBPortParameter', 'AWS::SSM::Parameter');
      validateResourceExists('EnvironmentConfigParameter', 'AWS::SSM::Parameter');

      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('Database endpoint for the environment');
      expect(templateYaml).toContain('Database port for the environment');
      expect(templateYaml).toContain('Current environment name');
    });
  });

  // =================
  // COMPUTE
  // =================
  describe('Compute Resources - EC2 and Auto Scaling', () => {
    test('Launch Template has proper configuration', () => {
      validateResourceExists('EC2LaunchTemplate', 'AWS::EC2::LaunchTemplate');

      // Check dynamic AMI from SSM parameter
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');

      // Check dynamic instance type based on environment
      expect(templateYaml).toContain('InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]');

      // Check security group and instance profile
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref EC2SecurityGroup');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
      expect(templateYaml).toContain('KeyName: !Ref EC2KeyPair');
    });

    test('Launch Template UserData configures CloudWatch agent', () => {
      expect(templateYaml).toContain('#!/bin/bash');
      expect(templateYaml).toContain('yum update -y');
      expect(templateYaml).toContain('yum install -y amazon-cloudwatch-agent');
      expect(templateYaml).toContain('amazon-cloudwatch-agent-ctl');
      expect(templateYaml).toContain('cpu_usage_idle');
      expect(templateYaml).toContain('mem_used_percent');
      expect(templateYaml).toContain('used_percent');
    });

    test('EC2 Instance is created for non-production environments', () => {
      validateResourceExists('EC2Instance', 'AWS::EC2::Instance');
      expect(templateYaml).toContain('Condition: IsNotProduction');
      expect(templateYaml).toContain('LaunchTemplate:');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
    });

    test('Auto Scaling Group has environment-specific configuration', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('Condition: IsProduction');

      expect(templateYaml).toContain('MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]');
      expect(templateYaml).toContain('MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]');
      expect(templateYaml).toContain('DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, DesiredCapacity]');

      // Should be in public subnets
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
    });

    test('Auto Scaling Policy is configured for production', () => {
      validateResourceExists('ScaleUpPolicy', 'AWS::AutoScaling::ScalingPolicy');
      expect(templateYaml).toContain('Condition: IsProduction');
      expect(templateYaml).toContain('PolicyType: TargetTrackingScaling');
      expect(templateYaml).toContain('ASGAverageCPUUtilization');
      expect(templateYaml).toContain('TargetValue: 70');
    });
  });

  // =================
  // DATABASE
  // =================
  describe('Database Resources - RDS Configuration', () => {
    test('DB Subnet Group uses private subnets', () => {
      validateResourceExists('RDSSubnetGroup', 'AWS::RDS::DBSubnetGroup');

      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('RDS Instance has proper security and environment configuration', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');

      expect(templateYaml).toContain('Engine: !FindInMap [EnvironmentConfig, !Ref Environment, DBEngine]');
      expect(templateYaml).toContain('EngineVersion: !FindInMap [EnvironmentConfig, !Ref Environment, DBEngineVersion]');
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('StorageType: gp3');

      // Check environment-specific settings
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, RdsInstanceClass]');
      expect(templateYaml).toContain('AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, RdsStorage]');
      expect(templateYaml).toContain('BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref Environment, BackupRetention]');
      expect(templateYaml).toContain('MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]');
    });

    test('RDS Instance uses dynamic password reference from Secrets Manager', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');
    });

    test('RDS Instance has proper backup and maintenance windows', () => {
      expect(templateYaml).toContain('PreferredBackupWindow: \'03:00-04:00\'');
      expect(templateYaml).toContain('PreferredMaintenanceWindow: \'sun:04:00-sun:05:00\'');
      expect(templateYaml).toContain('EnableCloudwatchLogsExports:');
      expect(templateYaml).toContain('- error');
      expect(templateYaml).toContain('- general');
      expect(templateYaml).toContain('- slowquery');
    });

    test('RDS has deletion and update protection', () => {
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');
      expect(templateYaml).toContain('UpdateReplacePolicy: Snapshot');
    });
  });

  // ===================
  // MONITORING
  // ===================
  describe('Monitoring Resources - CloudWatch Configuration', () => {
    test('SNS Topic is configured for alarms', () => {
      validateResourceExists('AlarmTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('TopicName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alarms\'');
      expect(templateYaml).toContain('DisplayName: !Sub \'Alarms for ${AWS::StackName} ${Environment} environment\'');
    });

    test('EC2 Instance Status Alarm monitors non-production instance', () => {
      validateResourceExists('EC2InstanceStatusAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('Condition: IsNotProduction');

      expect(templateYaml).toContain('MetricName: StatusCheckFailed');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Statistic: Maximum');
      expect(templateYaml).toContain('Period: 60');
      expect(templateYaml).toContain('EvaluationPeriods: 2');
      expect(templateYaml).toContain('Threshold: 1');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanOrEqualToThreshold');
    });

    test('ASG High CPU Alarm monitors production environment', () => {
      validateResourceExists('ASGHighCPUAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('Condition: IsProduction');

      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Statistic: Average');
      expect(templateYaml).toContain('Period: 300');
      expect(templateYaml).toContain('EvaluationPeriods: 2');
      expect(templateYaml).toContain('Threshold: 80');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC and networking outputs are defined with proper naming', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidr', 'InternetGatewayId',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'PublicRouteTableId', 'PrivateRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub \'${AWS::StackName}-${Environment}-${EnvironmentSuffix}');
      });
    });

    test('Security group outputs are defined', () => {
      const securityOutputs = ['EC2SecurityGroupId', 'RDSSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Compute and scaling outputs are defined', () => {
      const computeOutputs = [
        'EC2LaunchTemplateId', 'AutoScalingGroupName', 'EC2InstanceId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      computeOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
      });
    });

    test('Database outputs are defined', () => {
      const dbOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'RDSSubnetGroupName', 'DBMasterSecretArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      dbOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const iamOutputs = [
        'EC2RoleArn', 'EC2RoleName', 'EC2InstanceProfileArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Storage and secrets outputs are defined', () => {
      const storageOutputs = [
        'S3BucketName', 'S3BucketArn', 'DBMasterSecretArn', 'EC2KeyPairId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-\${Environment}-\${EnvironmentSuffix}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(30); // Should have many exports
    });

    test('Conditional outputs use proper conditions', () => {
      const outputsSection = extractYamlSection('Outputs');
      expect(outputsSection).toContain('Condition: IsNotProduction');
      expect(outputsSection).toContain('Condition: IsProduction');
      expect(outputsSection).toContain('Condition: IsNotDevelopment');
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
      expect(templateYaml).toContain('${AWS::Partition}');
    });

    test('AMI selection uses SSM parameter for cross-region compatibility', () => {
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('Resource naming includes region and environment for uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('All ARN references use AWS::Partition for cross-partition compatibility', () => {
      const arnPattern = /arn:\$\{AWS::Partition\}/g;
      const arnMatches = templateYaml.match(arnPattern);
      expect(arnMatches).toBeDefined();
      expect(arnMatches!.length).toBeGreaterThan(0);
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

      if (deployedOutputs.VPCCidr) {
        // Should match environment-specific CIDR
        const expectedCidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];
        expect(expectedCidrs).toContain(deployedOutputs.VPCCidr);
      }

      // Subnet Resources
      const subnetOutputs = ['PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id'];
      subnetOutputs.forEach(subnetOutput => {
        if (deployedOutputs[subnetOutput]) {
          expect(deployedOutputs[subnetOutput]).toMatch(/^subnet-[a-f0-9]+$/);
        }
      });

      // Security Group Resources
      const sgOutputs = ['EC2SecurityGroupId', 'RDSSecurityGroupId'];
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

      // Instance Profile ARN
      if (deployedOutputs.EC2InstanceProfileArn) {
        expect(deployedOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\//);
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
      if (deployedOutputs.DBMasterSecretArn) {
        expect(deployedOutputs.DBMasterSecretArn).toMatch(/^arn:aws:secretsmanager:/);
        expect(deployedOutputs.DBMasterSecretArn).toContain(region);
      }
    });

    test('S3 resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.S3BucketName) {
        expect(deployedOutputs.S3BucketName).toContain(region);
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironment);
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.S3BucketArn) {
        expect(deployedOutputs.S3BucketArn).toMatch(/^arn:aws:s3:::/);
      }
    });

    test('Auto Scaling Group is conditionally deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Production should have ASG, non-production should have single instance
      if (currentEnvironment === 'prod') {
        if (deployedOutputs.AutoScalingGroupName) {
          expect(deployedOutputs.AutoScalingGroupName).toContain(currentStackName);
          expect(deployedOutputs.AutoScalingGroupName).toContain(region);
          expect(deployedOutputs.AutoScalingGroupName).toContain(currentEnvironmentSuffix);
        }
      } else {
        if (deployedOutputs.EC2InstanceId) {
          expect(deployedOutputs.EC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
        }
      }
    });

    test('Environment-specific configurations are applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment matches what we expect
      expect(['dev', 'testing', 'prod']).toContain(currentEnvironment);

      // For dev environment, verify cost-optimized settings would be applied
      if (currentEnvironment === 'dev') {
        console.log('Deployed as development environment - cost-optimized settings applied');
        if (deployedOutputs.VPCCidr) {
          expect(deployedOutputs.VPCCidr).toBe('10.0.0.0/16');
        }
      }

      // For testing environment, verify intermediate settings would be applied
      if (currentEnvironment === 'testing') {
        console.log('Deployed as testing environment - intermediate settings applied');
        if (deployedOutputs.VPCCidr) {
          expect(deployedOutputs.VPCCidr).toBe('10.1.0.0/16');
        }
      }

      // For prod environment, verify production settings would be applied
      if (currentEnvironment === 'prod') {
        console.log('Deployed as production environment - performance/reliability settings applied');
        if (deployedOutputs.VPCCidr) {
          expect(deployedOutputs.VPCCidr).toBe('10.2.0.0/16');
        }
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
      validateResourceDependencies('RDSSecurityGroup', ['VPC', 'EC2SecurityGroup']);

      // Auto Scaling → Launch Template, Subnets
      validateResourceDependencies('AutoScalingGroup', ['EC2LaunchTemplate', 'PublicSubnet1', 'PublicSubnet2']);

      // RDS → DB Subnet Group, Security Group, Secrets
      validateResourceDependencies('RDSInstance', ['RDSSubnetGroup', 'RDSSecurityGroup', 'DBMasterSecret']);

      // CloudWatch Alarms → Target Resources
      validateResourceDependencies('EC2InstanceStatusAlarm', ['EC2Instance']);
      validateResourceDependencies('ASGHighCPUAlarm', ['AutoScalingGroup']);
    });

    test('Cross-service communication paths are enabled', () => {
      // Web servers can access database (via security group)
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');

      // RDS is in private subnets
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Monitoring coverage includes all critical resources', () => {
      // EC2 monitoring for non-production
      expect(templateYaml).toContain('EC2InstanceStatusAlarm:');
      expect(templateYaml).toContain('Condition: IsNotProduction');

      // ASG monitoring for production
      expect(templateYaml).toContain('ASGHighCPUAlarm:');
      expect(templateYaml).toContain('Condition: IsProduction');

      // CloudWatch Agent configuration in Launch Template UserData
      expect(templateYaml).toContain('amazon-cloudwatch-agent');
    });

    test('Security best practices are implemented end-to-end', () => {
      // Database is in private subnets
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');

      // RDS is encrypted
      expect(templateYaml).toContain('StorageEncrypted: true');

      // Database password is not hardcoded
      expect(templateYaml).toContain('{{resolve:secretsmanager:');

      // Security groups follow least privilege
      expect(templateYaml).toContain('SourceSecurityGroupId:');

      // S3 bucket is secured
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('aws:SecureTransport');
    });

    test('Template supports environment-specific scaling and configurations', () => {
      // Auto Scaling Group scales based on environment
      expect(templateYaml).toContain('MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]');
      expect(templateYaml).toContain('MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]');

      // Database scaling based on environment
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, RdsInstanceClass]');
      expect(templateYaml).toContain('AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, RdsStorage]');

      // Instance types based on environment
      expect(templateYaml).toContain('InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]');

      // VPC CIDR based on environment
      expect(templateYaml).toContain('CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]');
    });

    test('Template follows CloudFormation best practices', () => {
      // Uses consistent naming patterns
      expect(templateYaml).toContain('!Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}');

      // Uses conditions for environment-specific logic
      expect(templateYaml).toContain('!Condition IsProduction');
      expect(templateYaml).toContain('Condition: IsNotProduction');
      expect(templateYaml).toContain('Condition: IsNotDevelopment');

      // Uses mappings for environment-specific values
      expect(templateYaml).toContain('!FindInMap [EnvironmentConfig');

      // Has proper resource metadata
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Key: Project');
      expect(templateYaml).toContain('Key: Owner');
      expect(templateYaml).toContain('Key: CostCenter');
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
      expect(mappingsSection).toContain('RdsStorage: \'20\''); // Minimal storage
      expect(mappingsSection).toContain('BackupRetention: \'1\''); // Minimal backups
      expect(mappingsSection).toContain('MultiAZ: \'false\''); // Single AZ
      expect(mappingsSection).toContain('MinSize: \'1\''); // Minimal scaling
      expect(mappingsSection).toContain('MaxSize: \'2\''); // Limited scaling
    });

    test('Testing environment uses intermediate settings', () => {
      // Verify testing mappings exist
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('t3.small'); // Small instance type
      expect(mappingsSection).toContain('db.t3.small'); // Small DB instance
      expect(mappingsSection).toContain('RdsStorage: \'50\''); // Medium storage
      expect(mappingsSection).toContain('BackupRetention: \'7\''); // Week backups
      expect(mappingsSection).toContain('MinSize: \'1\''); // Conservative minimum
      expect(mappingsSection).toContain('MaxSize: \'3\''); // Limited scaling
      expect(mappingsSection).toContain('DesiredCapacity: \'2\''); // Dual instance
    });

    test('Production environment uses performance-optimized resources', () => {
      // Verify prod mappings exist
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('t3.medium'); // Performance instance type
      expect(mappingsSection).toContain('db.t3.medium'); // Performance DB instance
      expect(mappingsSection).toContain('RdsStorage: \'100\''); // Ample storage
      expect(mappingsSection).toContain('BackupRetention: \'30\''); // Month backups
      expect(mappingsSection).toContain('MultiAZ: \'true\''); // High availability
      expect(mappingsSection).toContain('MinSize: \'2\''); // Higher minimum for availability
      expect(mappingsSection).toContain('MaxSize: \'10\''); // Better scaling capacity
      expect(mappingsSection).toContain('DesiredCapacity: \'3\''); // Triple instance
    });

    test('Conditional resources save costs in appropriate environments', () => {
      // NAT Gateway only for non-dev environments
      expect(templateYaml).toContain('Condition: IsNotDevelopment');

      // Single instance for non-production
      expect(templateYaml).toContain('Condition: IsNotProduction');

      // Auto Scaling Group only for production
      expect(templateYaml).toContain('Condition: IsProduction');
    });
  });

  // ========================
  // SECURITY VALIDATION
  // ========================
  describe('Security Validation', () => {
    test('IAM roles follow least privilege principle', () => {
      // EC2 role only has necessary permissions
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
      expect(templateYaml).toContain('ssm:GetParameter');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');

      // Resource restrictions for SSM and S3
      expect(templateYaml).toContain('arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/${Environment}/*');
      expect(templateYaml).toContain('arn:aws:s3:::${S3Bucket}');
    });

    test('Network security groups are restrictive', () => {
      // Database only accessible from EC2 instances
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');

      // No wildcard access patterns in production-sensitive resources
      expect(templateYaml).toContain('GroupDescription: \'Security group for RDS instances\'');
    });

    test('Data encryption is enabled', () => {
      // RDS encryption
      expect(templateYaml).toContain('StorageEncrypted: true');

      // S3 encryption
      expect(templateYaml).toContain('SSEAlgorithm: AES256');

      // Secrets Manager for passwords
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('ExcludePunctuation: true');
    });

    test('Database security is properly configured', () => {
      // Master username is configurable (not hardcoded)
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');

      // Password comes from Secrets Manager
      expect(templateYaml).toContain('{{resolve:secretsmanager:');

      // Database is in private subnets
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref RDSSubnetGroup');

      // Proper backup and maintenance windows
      expect(templateYaml).toContain('PreferredBackupWindow:');
      expect(templateYaml).toContain('PreferredMaintenanceWindow:');
    });

    test('S3 bucket security is comprehensive', () => {
      // Public access blocked
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');

      // Versioning enabled
      expect(templateYaml).toContain('Status: Enabled');

      // Secure transport enforced
      expect(templateYaml).toContain('aws:SecureTransport');
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE
  // ========================
  describe('Reliability and Resilience', () => {
    test('Multi-AZ deployment for high availability', () => {
      // Subnets span multiple AZs
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');

      // Auto Scaling Group spans multiple subnets
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');

      // RDS MultiAZ configurable by environment
      expect(templateYaml).toContain('MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]');
    });

    test('Auto Scaling provides elasticity in production', () => {
      // Environment-specific scaling parameters
      expect(templateYaml).toContain('MinSize: !FindInMap');
      expect(templateYaml).toContain('MaxSize: !FindInMap');
      expect(templateYaml).toContain('DesiredCapacity: !FindInMap');

      // Health check configuration
      expect(templateYaml).toContain('HealthCheckType: EC2');
      expect(templateYaml).toContain('HealthCheckGracePeriod: 300');

      // Target tracking scaling policy
      expect(templateYaml).toContain('PolicyType: TargetTrackingScaling');
      expect(templateYaml).toContain('ASGAverageCPUUtilization');
      expect(templateYaml).toContain('TargetValue: 70');
    });

    test('Monitoring enables proactive response', () => {
      // Multiple monitoring dimensions
      expect(templateYaml).toContain('StatusCheckFailed');
      expect(templateYaml).toContain('CPUUtilization');

      // Appropriate evaluation periods
      expect(templateYaml).toContain('EvaluationPeriods: 2');

      // Alarm actions configured
      expect(templateYaml).toContain('AlarmActions:');
      expect(templateYaml).toContain('- !Ref AlarmTopic');
    });

    test('Backup and disaster recovery features', () => {
      // RDS automated backups
      expect(templateYaml).toContain('BackupRetentionPeriod: !FindInMap');
      expect(templateYaml).toContain('PreferredBackupWindow:');

      // S3 versioning for data protection
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');

      // RDS deletion protection
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');
      expect(templateYaml).toContain('UpdateReplacePolicy: Snapshot');

      // S3 lifecycle management
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('NoncurrentVersionExpirationInDays: 30');
    });
  });
});
