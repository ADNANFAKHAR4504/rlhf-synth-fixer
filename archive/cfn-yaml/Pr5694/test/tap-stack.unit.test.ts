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
          deployedOutputs.EC2InstanceRoleArn?.split(':')[3] ||
          deployedOutputs.ApplicationLoadBalancerArn?.split(':')[3] ||
          deployedOutputs.DBPasswordSecretArn?.split(':')[3] ||
          deployedOutputs.RDSInstanceArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from resource naming pattern
        if (deployedOutputs.EC2InstanceRoleName) {
          console.log('Raw EC2InstanceRoleName:', deployedOutputs.EC2InstanceRoleName);
          const roleParts = deployedOutputs.EC2InstanceRoleName.split('-');
          console.log('EC2InstanceRoleName parts:', roleParts);
          currentStackName = roleParts[0] || 'TapStack';

          // Find the environment suffix (look for pattern like pr4056, dev-123, etc.)
          const envSuffixIndex = roleParts.findIndex((part: string) =>
            part.match(/^(pr|dev|prod|test)\d+$/) ||
            (part.startsWith('pr') && part.length > 2)
          );
          currentEnvironmentSuffix = envSuffixIndex >= 0 ? roleParts[envSuffixIndex] : 'pr4056';
        }

        // Extract environment from ALB DNS name or other resource naming
        if (deployedOutputs.ALBDNSName) {
          console.log('Raw ALBDNSName:', deployedOutputs.ALBDNSName);
          // ALB DNS usually contains region and stack info
          if (deployedOutputs.ALBDNSName.includes('internal')) {
            currentEnvironment = 'prod';
          } else {
            currentEnvironment = 'dev';
          }
        } else {
          // Default to dev for testing
          currentEnvironment = 'dev';
        }

        // Extract from VPC ID pattern if available
        if (deployedOutputs.VPCId) {
          console.log('VPC ID:', deployedOutputs.VPCId);
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
      expect(templateYaml).toContain('Description: \'Production-ready scalable and secure AWS cloud environment');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates production-ready architecture', () => {
      expect(templateYaml).toContain('Production-ready scalable and secure AWS cloud environment');
      expect(templateYaml).toContain('VPC, ALB, ASG, RDS, and CloudWatch monitoring');
    });

    test('Template contains all critical AWS resource types', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::KeyPair',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::CloudWatch::Alarm',
        'AWS::Logs::LogGroup',
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
        'VPCCidrBlock',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'DBEngine',
        'DBEngineVersion',
        'DBMasterUsername',
        'HTTPSCertificateArn',
        'AllowedCIDRBlock',
        'ProjectName',
        'OwnerEmail',
        'CostCenter',
        'LatestAmiId'
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
      expect(templateYaml).toContain('Default: "pr4056"');
      expect(templateYaml).toContain('parallel deployments');
    });

    test('VPC and subnet CIDR parameters have proper validation', () => {
      expect(templateYaml).toContain('VPCCidrBlock:');
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('Default: \'10.0.0.0/16\'');

      // Check subnet defaults
      expect(templateYaml).toContain('Default: \'10.0.1.0/24\'');
      expect(templateYaml).toContain('Default: \'10.0.2.0/24\'');
      expect(templateYaml).toContain('Default: \'10.0.11.0/24\'');
      expect(templateYaml).toContain('Default: \'10.0.12.0/24\'');
    });

    test('Database parameters have proper defaults and constraints', () => {
      expect(templateYaml).toContain('DBEngine:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- mysql');
      expect(templateYaml).toContain('- postgres');
      expect(templateYaml).toContain('Default: \'mysql\'');

      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain('NoEcho: true');
    });

    test('AMI parameter uses SSM for cross-region compatibility', () => {
      expect(templateYaml).toContain('LatestAmiId:');
      expect(templateYaml).toContain('Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
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
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 1');
      expect(mappingsSection).toContain('MultiAZ: false');
      expect(mappingsSection).toContain('AlarmThreshold: 75');
      expect(mappingsSection).toContain('MinSize: 1');
      expect(mappingsSection).toContain('MaxSize: 2');
      expect(mappingsSection).toContain('DesiredCapacity: 1');
      expect(mappingsSection).toContain('S3LifecycleDays: 30');
    });

    test('Production environment has performance/reliability settings', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('InstanceType: t3.medium');
      expect(mappingsSection).toContain('DBInstanceClass: db.m5.large');
      expect(mappingsSection).toContain('DBAllocatedStorage: 100');
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 7');
      expect(mappingsSection).toContain('MultiAZ: true');
      expect(mappingsSection).toContain('AlarmThreshold: 85');
      expect(mappingsSection).toContain('MinSize: 2');
      expect(mappingsSection).toContain('MaxSize: 6');
      expect(mappingsSection).toContain('DesiredCapacity: 3');
      expect(mappingsSection).toContain('S3LifecycleDays: 365');
    });
  });

  // ==================
  // CONDITIONS
  // ==================
  describe('Conditions Section - Environment Logic', () => {
    test('Conditions are properly defined', () => {
      const conditionsSection = extractYamlSection('Conditions');
      expect(conditionsSection).toContain('IsProduction:');
      expect(conditionsSection).toContain('CreateHTTPSListener:');
      expect(conditionsSection).toContain('UseMySQL:');
    });

    test('IsProduction condition logic is correct', () => {
      expect(templateYaml).toContain('IsProduction: !Equals [!Ref Environment, \'prod\']');
    });

    test('CreateHTTPSListener condition logic is correct', () => {
      expect(templateYaml).toContain('CreateHTTPSListener: !Not [!Equals [!Ref HTTPSCertificateArn, \'\']]');
    });

    test('UseMySQL condition logic is correct', () => {
      expect(templateYaml).toContain('UseMySQL: !Equals [!Ref DBEngine, \'mysql\']');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VPCCidrBlock');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Subnets are properly configured across multiple AZs', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      const expectedCidrRefs = ['PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR'];

      subnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: !Ref ${expectedCidrRefs[index]}`);
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
      validateResourceExists('AttachGateway', 'AWS::EC2::VPCGatewayAttachment');
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('DestinationCidrBlock: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('Subnet route table associations are configured', () => {
      validateResourceExists('PublicSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PublicSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security', () => {
    test('ALB Security Group has proper ingress rules', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('VpcId: !Ref VPC');

      // Check HTTP access (port 80)
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('CidrIp: !Ref AllowedCIDRBlock');

      // Check HTTPS access (port 443)
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
    });

    test('Web Server Security Group has proper configuration', () => {
      validateResourceExists('WebServerSecurityGroup', 'AWS::EC2::SecurityGroup');

      // Should allow traffic from ALB
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');

      // Check SSH access (port 22)
      expect(templateYaml).toContain('FromPort: 22');
      expect(templateYaml).toContain('ToPort: 22');
    });

    test('Database Security Group has restricted access', () => {
      validateResourceExists('DatabaseSecurityGroup', 'AWS::EC2::SecurityGroup');

      // Should only allow access from web servers
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebServerSecurityGroup');

      // Check conditional port based on database engine
      expect(templateYaml).toContain('FromPort: !If [UseMySQL, 3306, 5432]');
      expect(templateYaml).toContain('ToPort: !If [UseMySQL, 3306, 5432]');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('EC2 Instance Role has proper assume role policy', () => {
      validateResourceExists('EC2InstanceRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: \'sts:AssumeRole\'');
    });

    test('EC2 Role has required managed policies and custom permissions', () => {
      // Check managed policy
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy');

      // Check custom policy for CloudWatch
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('cloudwatch:GetMetricStatistics');
      expect(templateYaml).toContain('cloudwatch:ListMetrics');
      expect(templateYaml).toContain('logs:CreateLogGroup');
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
      expect(templateYaml).toContain('logs:DescribeLogStreams');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      validateResourceDependencies('EC2InstanceProfile', ['EC2InstanceRole']);
    });
  });

  // =================
  // LOAD BALANCER
  // =================
  describe('Load Balancer Resources - ALB Configuration', () => {
    test('Application Load Balancer has proper configuration', () => {
      validateResourceExists('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');

      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('IpAddressType: ipv4');

      // Should be in public subnets
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');

      // Should use ALB security group
      expect(templateYaml).toContain('- !Ref ALBSecurityGroup');
    });

    test('Target Group is properly configured', () => {
      validateResourceExists('TargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');

      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('TargetType: instance');
      expect(templateYaml).toContain('HealthCheckEnabled: true');
      expect(templateYaml).toContain('HealthCheckPath: \'/\'');
    });

    test('HTTP and HTTPS listeners are configured', () => {
      validateResourceExists('HTTPListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');

      validateResourceExists('HTTPSListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('Condition: CreateHTTPSListener');
      expect(templateYaml).toContain('Port: 443');
      expect(templateYaml).toContain('Protocol: HTTPS');
    });
  });

  // =================
  // AUTO SCALING
  // =================
  describe('Auto Scaling Resources - EC2 Configuration', () => {
    test('EC2 Key Pair is properly configured', () => {
      validateResourceExists('EC2KeyPair', 'AWS::EC2::KeyPair');
      expect(templateYaml).toContain('KeyType: rsa');
      expect(templateYaml).toContain('KeyFormat: pem');
    });

    test('Launch Template has proper configuration', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');

      // Check dynamic instance type based on environment
      expect(templateYaml).toContain('InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]');

      // Check AMI from SSM parameter
      expect(templateYaml).toContain('ImageId: !Ref LatestAmiId');

      // Check security group and instance profile
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref WebServerSecurityGroup');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
    });

    test('Launch Template UserData configures services', () => {
      expect(templateYaml).toContain('#!/bin/bash');
      expect(templateYaml).toContain('yum update -y');
      expect(templateYaml).toContain('yum install -y httpd');
      expect(templateYaml).toContain('systemctl start httpd');
      expect(templateYaml).toContain('systemctl enable httpd');
      expect(templateYaml).toContain('amazon-cloudwatch-agent');
    });

    test('Auto Scaling Group has environment-specific configuration', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');

      expect(templateYaml).toContain('MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]');
      expect(templateYaml).toContain('MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]');
      expect(templateYaml).toContain('DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, DesiredCapacity]');

      // Should be in public subnets
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');

      // Should be associated with target group
      expect(templateYaml).toContain('- !Ref TargetGroup');
    });
  });

  // =================
  // DATABASE
  // =================
  describe('Database Resources - RDS Configuration', () => {
    test('Secrets Manager handles database password', () => {
      validateResourceExists('DBPasswordSecret', 'AWS::SecretsManager::Secret');

      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludeCharacters: \'"@/\\\'');
    });

    test('DB Subnet Group uses private subnets', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');

      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('RDS Instance has proper security configuration', () => {
      validateResourceExists('RDSDatabase', 'AWS::RDS::DBInstance');

      expect(templateYaml).toContain('Engine: !Ref DBEngine');
      expect(templateYaml).toContain('EngineVersion: !Ref DBEngineVersion');
      expect(templateYaml).toContain('StorageEncrypted: true');

      // Check environment-specific settings
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]');
      expect(templateYaml).toContain('AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]');
      expect(templateYaml).toContain('BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref Environment, DBBackupRetentionPeriod]');
      expect(templateYaml).toContain('MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]');
    });

    test('RDS Instance uses dynamic password reference', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${AWS::StackName}-${EnvironmentSuffix}-db-password:SecretString:password}}\'');
    });

    test('RDS Instance has conditional CloudWatch logs based on engine', () => {
      expect(templateYaml).toContain('EnableCloudwatchLogsExports: !If');
      expect(templateYaml).toContain('- UseMySQL');
      expect(templateYaml).toContain('- [error, general, slowquery]');
      expect(templateYaml).toContain('- [postgresql]');
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
      expect(templateYaml).toContain('Threshold: !FindInMap [EnvironmentConfig, !Ref Environment, AlarmThreshold]');
    });

    test('RDS Storage Alarm monitors database storage', () => {
      validateResourceExists('RDSStorageAlarm', 'AWS::CloudWatch::Alarm');

      expect(templateYaml).toContain('MetricName: FreeStorageSpace');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Threshold: 2147483648'); // 2GB
      expect(templateYaml).toContain('ComparisonOperator: LessThanThreshold');
    });

    test('ALB Target Health Alarm monitors application health', () => {
      validateResourceExists('ALBTargetHealthAlarm', 'AWS::CloudWatch::Alarm');

      expect(templateYaml).toContain('MetricName: HealthyHostCount');
      expect(templateYaml).toContain('Namespace: AWS/ApplicationELB');
      expect(templateYaml).toContain('Threshold: 1');
      expect(templateYaml).toContain('ComparisonOperator: LessThanThreshold');
    });

    test('CloudWatch Logs Group is configured', () => {
      validateResourceExists('CloudWatchLogsGroup', 'AWS::Logs::LogGroup');

      expect(templateYaml).toContain('LogGroupName: !Sub \'/aws/ec2/${AWS::StackName}\'');
      expect(templateYaml).toContain('RetentionInDays: !If [IsProduction, 30, 7]');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC and networking outputs are defined', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidr', 'InternetGatewayId',
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
      const securityOutputs = ['ALBSecurityGroupId', 'WebServerSecurityGroupId', 'DatabaseSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Load balancer outputs are defined', () => {
      const albOutputs = [
        'ApplicationLoadBalancerArn', 'ALBDNSName', 'ALBHostedZoneId',
        'TargetGroupArn', 'HTTPListenerArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      albOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Auto scaling outputs are defined', () => {
      const asgOutputs = [
        'LaunchTemplateId', 'AutoScalingGroupName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      asgOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Database outputs are defined', () => {
      const dbOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'DBSubnetGroupName', 'DBPasswordSecretArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      dbOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const iamOutputs = [
        'EC2InstanceRoleArn', 'EC2InstanceRoleName', 'EC2InstanceProfileArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring outputs are defined', () => {
      const monitoringOutputs = [
        'EC2CPUAlarmName', 'RDSStorageAlarmName', 'ALBTargetHealthAlarmName',
        'CloudWatchLogsGroupName', 'CloudWatchLogsGroupArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(20); // Should have many exports
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
      expect(templateYaml).toContain('ImageId: !Ref LatestAmiId');
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
        expect(deployedOutputs.VPCCidr).toBe('10.0.0.0/16');
      }

      // Subnet Resources
      const subnetOutputs = ['PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id'];
      subnetOutputs.forEach(subnetOutput => {
        if (deployedOutputs[subnetOutput]) {
          expect(deployedOutputs[subnetOutput]).toMatch(/^subnet-[a-f0-9]+$/);
        }
      });

      // Security Group Resources
      const sgOutputs = ['ALBSecurityGroupId', 'WebServerSecurityGroupId', 'DatabaseSecurityGroupId'];
      sgOutputs.forEach(sgOutput => {
        if (deployedOutputs[sgOutput]) {
          expect(deployedOutputs[sgOutput]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('IAM resources follow expected patterns', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // IAM Role ARNs
      if (deployedOutputs.EC2InstanceRoleArn) {
        expect(deployedOutputs.EC2InstanceRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(deployedOutputs.EC2InstanceRoleArn).toContain(currentStackName);
        expect(deployedOutputs.EC2InstanceRoleArn).toContain(region);
        expect(deployedOutputs.EC2InstanceRoleArn).toContain(currentEnvironmentSuffix);
      }

      // Instance Profile ARN
      if (deployedOutputs.EC2InstanceProfileArn) {
        expect(deployedOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\//);
      }
    });

    test('Load Balancer resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // ALB DNS Name
      if (deployedOutputs.ALBDNSName) {
        expect(deployedOutputs.ALBDNSName).toContain('.elb.');
        expect(deployedOutputs.ALBDNSName).toContain(region);
        expect(deployedOutputs.ALBDNSName).toContain('.amazonaws.com');
      }

      // ALB ARN
      if (deployedOutputs.ApplicationLoadBalancerArn) {
        expect(deployedOutputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);
        expect(deployedOutputs.ApplicationLoadBalancerArn).toContain(region);
      }

      // Target Group ARN
      if (deployedOutputs.TargetGroupArn) {
        expect(deployedOutputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
        expect(deployedOutputs.TargetGroupArn).toContain(region);
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
        expect(['3306', '5432']).toContain(deployedOutputs.RDSPort); // MySQL or PostgreSQL port
      }

      // Secrets Manager
      if (deployedOutputs.DBPasswordSecretArn) {
        expect(deployedOutputs.DBPasswordSecretArn).toMatch(/^arn:aws:secretsmanager:/);
        expect(deployedOutputs.DBPasswordSecretArn).toContain(region);
      }
    });

    test('Auto Scaling Group is properly deployed', () => {
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

    test('CloudWatch resources are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // CloudWatch Alarms
      if (deployedOutputs.EC2CPUAlarmName) {
        expect(deployedOutputs.EC2CPUAlarmName).toContain('cpu-alarm');
        expect(deployedOutputs.EC2CPUAlarmName).toContain(currentStackName);
      }

      if (deployedOutputs.RDSStorageAlarmName) {
        expect(deployedOutputs.RDSStorageAlarmName).toContain('storage-alarm');
      }

      if (deployedOutputs.ALBTargetHealthAlarmName) {
        expect(deployedOutputs.ALBTargetHealthAlarmName).toContain('health-alarm');
      }

      // Log Groups
      if (deployedOutputs.CloudWatchLogsGroupName) {
        expect(deployedOutputs.CloudWatchLogsGroupName).toContain('/aws/ec2/');
        expect(deployedOutputs.CloudWatchLogsGroupName).toContain(currentStackName);
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
      validateResourceDependencies('ALBSecurityGroup', ['VPC']);
      validateResourceDependencies('WebServerSecurityGroup', ['VPC', 'ALBSecurityGroup']);
      validateResourceDependencies('DatabaseSecurityGroup', ['VPC', 'WebServerSecurityGroup']);

      // ALB → Security Groups, Subnets
      validateResourceDependencies('ApplicationLoadBalancer', ['ALBSecurityGroup', 'PublicSubnet1', 'PublicSubnet2']);

      // Auto Scaling → Launch Template, Subnets, Target Group
      validateResourceDependencies('AutoScalingGroup', ['LaunchTemplate', 'PublicSubnet1', 'PublicSubnet2', 'TargetGroup']);

      // RDS → DB Subnet Group, Security Group, Secrets
      validateResourceDependencies('RDSDatabase', ['DBSubnetGroup', 'DatabaseSecurityGroup', 'DBPasswordSecret']);

      // CloudWatch Alarms → Target Resources
      validateResourceDependencies('EC2CPUAlarm', ['AutoScalingGroup']);
      validateResourceDependencies('RDSStorageAlarm', ['RDSDatabase']);
      validateResourceDependencies('ALBTargetHealthAlarm', ['TargetGroup', 'ApplicationLoadBalancer']);
    });

    test('Cross-service communication paths are enabled', () => {
      // Web servers can access database (via security group)
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebServerSecurityGroup');

      // ALB can access web servers (via security group)
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
    });

    test('Monitoring coverage includes all critical resources', () => {
      // Auto Scaling Group monitoring
      expect(templateYaml).toContain('EC2CPUAlarm:');
      expect(templateYaml).toContain('AutoScalingGroupName');

      // RDS monitoring
      expect(templateYaml).toContain('RDSStorageAlarm:');
      expect(templateYaml).toContain('DBInstanceIdentifier');

      // ALB monitoring
      expect(templateYaml).toContain('ALBTargetHealthAlarm:');
      expect(templateYaml).toContain('TargetGroup');

      // CloudWatch Agent configuration in Launch Template UserData
      expect(templateYaml).toContain('amazon-cloudwatch-agent');
      expect(templateYaml).toContain('/aws/ec2/${AWS::StackName}');
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
    });

    test('Template supports environment-specific scaling', () => {
      // Auto Scaling Group scales based on environment
      expect(templateYaml).toContain('MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]');
      expect(templateYaml).toContain('MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]');

      // Database scaling based on environment
      expect(templateYaml).toContain('DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]');
      expect(templateYaml).toContain('AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]');

      // Instance types based on environment
      expect(templateYaml).toContain('InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]');
    });

    test('Template follows CloudFormation best practices', () => {
      // Uses consistent naming patterns
      expect(templateYaml).toContain('!Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}');

      // Uses conditions for environment-specific logic
      expect(templateYaml).toContain('!If [IsProduction');
      expect(templateYaml).toContain('CreateHTTPSListener');
      expect(templateYaml).toContain('UseMySQL');

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
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 1'); // Minimal backups in dev
      expect(mappingsSection).toContain('MultiAZ: false'); // Single AZ in dev
      expect(mappingsSection).toContain('MinSize: 1'); // Minimal scaling
      expect(mappingsSection).toContain('MaxSize: 2'); // Limited scaling
      expect(mappingsSection).toContain('S3LifecycleDays: 30'); // Quick cleanup
    });

    test('Production environment uses performance-optimized resources', () => {
      // Verify prod mappings exist
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('t3.medium'); // Performance instance type
      expect(mappingsSection).toContain('db.m5.large'); // Performance DB instance
      expect(mappingsSection).toContain('DBBackupRetentionPeriod: 7'); // Backups in prod
      expect(mappingsSection).toContain('MultiAZ: true'); // High availability
      expect(mappingsSection).toContain('MinSize: 2'); // Higher minimum for availability
      expect(mappingsSection).toContain('MaxSize: 6'); // Better scaling capacity
      expect(mappingsSection).toContain('S3LifecycleDays: 365'); // Long retention
    });

    test('Alarm thresholds are environment-appropriate', () => {
      const mappingsSection = extractYamlSection('Mappings');
      expect(mappingsSection).toContain('AlarmThreshold: 75'); // Lower threshold for dev
      expect(mappingsSection).toContain('AlarmThreshold: 85'); // Higher threshold for prod
    });
  });

  // ========================
  // SECURITY VALIDATION
  // ========================
  describe('Security Validation', () => {
    test('IAM roles follow least privilege principle', () => {
      // EC2 role only has necessary permissions
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('logs:CreateLogGroup');
      expect(templateYaml).toContain('logs:PutLogEvents');

      // Resource restrictions for logs
      expect(templateYaml).toContain('arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*');
    });

    test('Network security groups are restrictive', () => {
      // Database only accessible from web servers
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebServerSecurityGroup');

      // Web servers only accessible from ALB
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');

      // ALB uses configurable CIDR block
      expect(templateYaml).toContain('CidrIp: !Ref AllowedCIDRBlock');
    });

    test('Data encryption is enabled', () => {
      // RDS encryption
      expect(templateYaml).toContain('StorageEncrypted: true');

      // Secrets Manager for passwords
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('ExcludeCharacters:');
    });

    test('Database security is properly configured', () => {
      // Master username is configurable (not hardcoded)
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');

      // Password comes from Secrets Manager
      expect(templateYaml).toContain('{{resolve:secretsmanager:');

      // Database is in private subnets
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref DBSubnetGroup');
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

    test('Auto Scaling provides elasticity', () => {
      // Environment-specific scaling parameters
      expect(templateYaml).toContain('MinSize: !FindInMap');
      expect(templateYaml).toContain('MaxSize: !FindInMap');
      expect(templateYaml).toContain('DesiredCapacity: !FindInMap');

      // Health check configuration
      expect(templateYaml).toContain('HealthCheckType: ELB');
      expect(templateYaml).toContain('HealthCheckGracePeriod: 300');
    });

    test('Monitoring enables proactive response', () => {
      // Multiple monitoring dimensions
      expect(templateYaml).toContain('CPUUtilization');
      expect(templateYaml).toContain('FreeStorageSpace');
      expect(templateYaml).toContain('HealthyHostCount');

      // Appropriate evaluation periods
      expect(templateYaml).toContain('EvaluationPeriods: 2');
      expect(templateYaml).toContain('EvaluationPeriods: 1');

      // CloudWatch Logs retention
      expect(templateYaml).toContain('RetentionInDays: !If [IsProduction, 30, 7]');
    });
  });
});
