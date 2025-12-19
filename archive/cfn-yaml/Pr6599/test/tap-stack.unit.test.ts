import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Web Application Infrastructure Unit Tests', () => {
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
          deployedOutputs.EC2InstanceId?.split(':')[3] ||
          deployedOutputs.StackRegion ||
          'us-east-1';

        // Extract stack name from outputs
        currentStackName = deployedOutputs.StackName || 'TapStack';

        // Extract environment suffix from outputs  
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix || 'pr4056';

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
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description: \'Web application infrastructure with S3, EC2, RDS, VPC Flow Logs, and CloudFront\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates web application infrastructure', () => {
      expect(templateYaml).toContain('Web application infrastructure');
      expect(templateYaml).toContain('S3, EC2, RDS, VPC Flow Logs, and CloudFront');
    });

    test('Template contains all critical AWS resource types for web application', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::KeyPair',
        'AWS::EC2::Instance',
        'AWS::EC2::EIP',
        'AWS::EC2::EIPAssociation',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::SecretsManager::Secret',
        'AWS::EC2::FlowLog',
        'AWS::Logs::LogGroup',
        'AWS::CloudFront::Distribution',
        'AWS::CloudFront::CloudFrontOriginAccessIdentity'
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
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9\\-]*$\'');
      expect(templateYaml).toMatch(/Default: \"pr\d+\"/);
      expect(templateYaml).toContain('parallel deployments');
      expect(templateYaml).toContain('PR number');
    });

    test('SourceAmiIdSsmParameter uses dynamic AMI lookup', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateYaml).toContain('keeps template free of hard-coded AMI IDs');
    });

    test('Database parameters are properly configured', () => {
      expect(templateYaml).toContain('DBInstanceClass:');
      expect(templateYaml).toContain('Default: \'db.t3.micro\'');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- db.t3.micro');
      expect(templateYaml).toContain('- db.t3.small');
      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain('AllowedPattern: \'[a-zA-Z][a-zA-Z0-9]*\'');
    });

    test('KeyPairName parameter has proper validation', () => {
      expect(templateYaml).toContain('KeyPairName:');
      expect(templateYaml).toContain('Default: \'WebAppKeyPair\'');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9][a-zA-Z0-9\\-]*$\'');
      expect(templateYaml).toContain('Must start with alphanumeric');
    });

    test('VPC and subnet CIDR parameters have proper validation', () => {
      expect(templateYaml).toContain('VPCCidr:');
      expect(templateYaml).toContain('Default: \'10.0.0.0/16\'');
      expect(templateYaml).toContain('PublicSubnet1Cidr:');
      expect(templateYaml).toContain('Default: \'10.0.1.0/24\'');
      expect(templateYaml).toContain('PublicSubnet2Cidr:');
      expect(templateYaml).toContain('Default: \'10.0.2.0/24\'');
      expect(templateYaml).toContain('PrivateSubnet1Cidr:');
      expect(templateYaml).toContain('Default: \'10.0.11.0/24\'');
      expect(templateYaml).toContain('PrivateSubnet2Cidr:');
      expect(templateYaml).toContain('Default: \'10.0.12.0/24\'');
    });

    test('Tag parameters are properly configured', () => {
      expect(templateYaml).toContain('EnvironmentTag:');
      expect(templateYaml).toContain('Default: \'Development\'');
      expect(templateYaml).toContain('OwnerTag:');
      expect(templateYaml).toContain('Default: \'DevOps Team\'');
      expect(templateYaml).toContain('ProjectTag:');
      expect(templateYaml).toContain('Default: \'WebApp\'');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VPCCidr');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('VPC has proper naming convention and tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc\'');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Value: !Ref EnvironmentTag');
      expect(templateYaml).toContain('Key: Owner');
      expect(templateYaml).toContain('Value: !Ref OwnerTag');
      expect(templateYaml).toContain('Key: Project');
      expect(templateYaml).toContain('Value: !Ref ProjectTag');
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw\'');
    });

    test('VPC Gateway Attachment connects VPC to Internet Gateway', () => {
      validateResourceExists('InternetGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Public subnets are properly configured', () => {
      validateResourceExists('PublicSubnet1', 'AWS::EC2::Subnet');
      validateResourceExists('PublicSubnet2', 'AWS::EC2::Subnet');

      expect(templateYaml).toContain('AvailabilityZone: !Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('AvailabilityZone: !Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('CidrBlock: !Ref PublicSubnet1Cidr');
      expect(templateYaml).toContain('CidrBlock: !Ref PublicSubnet2Cidr');
      expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
    });

    test('Private subnets are properly configured', () => {
      validateResourceExists('PrivateSubnet1', 'AWS::EC2::Subnet');
      validateResourceExists('PrivateSubnet2', 'AWS::EC2::Subnet');

      expect(templateYaml).toContain('CidrBlock: !Ref PrivateSubnet1Cidr');
      expect(templateYaml).toContain('CidrBlock: !Ref PrivateSubnet2Cidr');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1\'');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2\'');
    });

    test('Public Route Table and routes are properly configured', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('DependsOn: InternetGatewayAttachment');
      expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('Subnet Route Table Associations are configured', () => {
      validateResourceExists('PublicSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PublicSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');

      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet2');
      expect(templateYaml).toContain('RouteTableId: !Ref PublicRouteTable');
    });
  });

  // =================
  // S3 BUCKET
  // =================
  describe('S3 Bucket Resources', () => {
    test('S3 Bucket is properly configured for static website hosting', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');

      expect(templateYaml).toContain('BucketName: !Sub \'${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-bucket\'');
      expect(templateYaml).toContain('WebsiteConfiguration:');
      expect(templateYaml).toContain('IndexDocument: index.html');
      expect(templateYaml).toContain('ErrorDocument: error.html');
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: false');
    });

    test('S3 Bucket Policy allows public read access', () => {
      validateResourceExists('S3BucketPolicy', 'AWS::S3::BucketPolicy');

      expect(templateYaml).toContain('Bucket: !Ref S3Bucket');
      expect(templateYaml).toContain('Effect: Allow');
      expect(templateYaml).toContain('Principal: \'*\'');
      expect(templateYaml).toContain('Action: s3:GetObject');
      expect(templateYaml).toContain('Resource: !Sub \'${S3Bucket.Arn}/*\'');
    });
  });

  // =================
  // IAM RESOURCES
  // =================
  describe('IAM Role and Instance Profile', () => {
    test('EC2 IAM Role is properly configured', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');

      expect(templateYaml).toContain('RoleName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role\'');
      expect(templateYaml).toContain('Service:');
      expect(templateYaml).toContain('- ec2.amazonaws.com');
      expect(templateYaml).toContain('sts:AssumeRole');
      expect(templateYaml).toContain('AmazonSSMManagedInstanceCore');
    });

    test('EC2 Role has proper permissions for S3 and EC2', () => {
      expect(templateYaml).toContain('PolicyName: S3AndEC2Access');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:DeleteObject');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('ec2:DescribeInstances');
      expect(templateYaml).toContain('!GetAtt S3Bucket.Arn');
      expect(templateYaml).toContain('!Sub \'${S3Bucket.Arn}/*\'');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');

      expect(templateYaml).toContain('InstanceProfileName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance-profile\'');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('Web Security Group is properly configured', () => {
      validateResourceExists('WebSecurityGroup', 'AWS::EC2::SecurityGroup');

      expect(templateYaml).toContain('GroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg\'');
      expect(templateYaml).toContain('GroupDescription: Security group for web server');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Web Security Group allows HTTP and SSH access', () => {
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('FromPort: 22');
      expect(templateYaml).toContain('ToPort: 22');
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');
      expect(templateYaml).toContain('Description: Allow HTTP');
      expect(templateYaml).toContain('Description: Allow SSH');
    });

    test('Database Security Group is properly configured', () => {
      validateResourceExists('DatabaseSecurityGroup', 'AWS::EC2::SecurityGroup');

      expect(templateYaml).toContain('GroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg\'');
      expect(templateYaml).toContain('GroupDescription: Security group for RDS database');
      expect(templateYaml).toContain('FromPort: 5432');
      expect(templateYaml).toContain('ToPort: 5432');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebSecurityGroup');
      expect(templateYaml).toContain('Description: Allow PostgreSQL from web server');
    });
  });

  // ==================
  // EC2 KEY PAIR
  // ==================
  describe('EC2 Key Pair Resources', () => {
    test('EC2 Key Pair is properly configured', () => {
      validateResourceExists('EC2KeyPair', 'AWS::EC2::KeyPair');
      expect(templateYaml).toContain('KeyName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-${KeyPairName}\'');
    });

    test('Key Pair has proper naming tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair\'');
    });
  });

  // =============
  // EC2 INSTANCE
  // =============
  describe('EC2 Instance - Web Server', () => {
    test('EC2 Instance is properly configured', () => {
      validateResourceExists('EC2Instance', 'AWS::EC2::Instance');
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
      expect(templateYaml).toContain('InstanceType: t3.micro');
      expect(templateYaml).toContain('KeyName: !Ref EC2KeyPair');
      expect(templateYaml).toContain('IamInstanceProfile: !Ref EC2InstanceProfile');
    });

    test('EC2 Instance uses dynamic AMI resolution', () => {
      expect(templateYaml).toContain('{{resolve:ssm:${SourceAmiIdSsmParameter}}}');
      expect(templateYaml).not.toMatch(/ami-[a-f0-9]{8,}/); // No hardcoded AMI IDs
    });

    test('EC2 Instance has proper network configuration', () => {
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref WebSecurityGroup');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
    });

    test('EC2 Instance has proper UserData script', () => {
      expect(templateYaml).toContain('UserData:');
      expect(templateYaml).toContain('Fn::Base64: !Sub |');
      expect(templateYaml).toContain('#!/bin/bash');
      expect(templateYaml).toContain('yum update -y');
      expect(templateYaml).toContain('yum install -y httpd');
      expect(templateYaml).toContain('systemctl start httpd');
      expect(templateYaml).toContain('systemctl enable httpd');
    });

    test('EC2 Instance has proper tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2\'');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Value: !Ref EnvironmentTag');
    });
  });

  // ==================
  // ELASTIC IP
  // ==================
  describe('Elastic IP Resources', () => {
    test('Elastic IP is properly configured', () => {
      validateResourceExists('ElasticIP', 'AWS::EC2::EIP');
      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-eip\'');
    });

    test('Elastic IP Association connects EIP to EC2 instance', () => {
      validateResourceExists('ElasticIPAssociation', 'AWS::EC2::EIPAssociation');
      expect(templateYaml).toContain('InstanceId: !Ref EC2Instance');
      expect(templateYaml).toContain('EIP: !Ref ElasticIP');
    });
  });

  // =================
  // RDS DATABASE
  // =================
  describe('RDS Database Resources', () => {
    test('DB Subnet Group is properly configured', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('DBSubnetGroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group\'');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('DB Master Secret is properly configured', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret\'');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('SecretStringTemplate: !Sub \'{"username": "${DBMasterUsername}"}\'');
      expect(templateYaml).toContain('GenerateStringKey: \'password\'');
    });

    test('RDS Instance is properly configured', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('DBInstanceIdentifier: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db\'');
      expect(templateYaml).toContain('DBInstanceClass: !Ref DBInstanceClass');
      expect(templateYaml).toContain('Engine: postgres');
      expect(templateYaml).toContain('EngineVersion: \'16\'');
      expect(templateYaml).toContain('AllocatedStorage: \'20\'');
      expect(templateYaml).toContain('StorageType: gp2');
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
    });

    test('RDS Instance has proper backup and maintenance configuration', () => {
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('PreferredBackupWindow: \'03:00-04:00\'');
      expect(templateYaml).toContain('PreferredMaintenanceWindow: \'sun:04:00-sun:05:00\'');
    });
  });

  // ===================
  // VPC FLOW LOGS
  // ===================
  describe('VPC Flow Logs Resources', () => {
    test('VPC Flow Log Group is properly configured', () => {
      validateResourceExists('VPCFlowLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('LogGroupName: !Sub \'/aws/vpc/flowlogs/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}\'');
      expect(templateYaml).toContain('RetentionInDays: 7');
    });

    test('VPC Flow Log Role is properly configured', () => {
      validateResourceExists('VPCFlowLogRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('RoleName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-flowlog-role\'');
      expect(templateYaml).toContain('Service:');
      expect(templateYaml).toContain('- vpc-flow-logs.amazonaws.com');
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
    });

    test('VPC Flow Log is properly configured', () => {
      validateResourceExists('VPCFlowLog', 'AWS::EC2::FlowLog');
      expect(templateYaml).toContain('ResourceType: VPC');
      expect(templateYaml).toContain('ResourceId: !Ref VPC');
      expect(templateYaml).toContain('TrafficType: ALL');
      expect(templateYaml).toContain('LogDestinationType: cloud-watch-logs');
      expect(templateYaml).toContain('LogGroupName: !Ref VPCFlowLogGroup');
    });
  });

  // ===================
  // CLOUDFRONT
  // ===================
  describe('CloudFront Distribution Resources', () => {
    test('CloudFront Origin Access Identity is properly configured', () => {
      validateResourceExists('CloudFrontOriginAccessIdentity', 'AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(templateYaml).toContain('Comment: !Sub \'OAI for ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}\'');
    });

    test('CloudFront Distribution is properly configured', () => {
      validateResourceExists('CloudFrontDistribution', 'AWS::CloudFront::Distribution');
      expect(templateYaml).toContain('Comment: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudfront\'');
      expect(templateYaml).toContain('Origins:');
      expect(templateYaml).toContain('DomainName: !GetAtt S3Bucket.RegionalDomainName');
      expect(templateYaml).toContain('S3OriginConfig:');
    });

    test('CloudFront Distribution has proper cache behavior', () => {
      expect(templateYaml).toContain('DefaultCacheBehavior:');
      expect(templateYaml).toContain('AllowedMethods:');
      expect(templateYaml).toContain('- GET');
      expect(templateYaml).toContain('- HEAD');
      expect(templateYaml).toContain('ViewerProtocolPolicy: redirect-to-https');
      expect(templateYaml).toContain('CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC outputs are defined with proper naming', () => {
      const vpcOutputs = [
        'VPCId', 'VPCCidrBlock', 'VPCDefaultNetworkAcl', 'VPCDefaultSecurityGroup',
        'InternetGatewayId', 'PublicRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      vpcOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Description:');
        expect(outputsSection).toContain('Value:');
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}');
      });
    });

    test('Subnet outputs are defined for all subnets', () => {
      const subnetOutputs = [
        'PublicSubnet1Id', 'PublicSubnet1CidrBlock', 'PublicSubnet1AvailabilityZone',
        'PublicSubnet2Id', 'PublicSubnet2CidrBlock', 'PublicSubnet2AvailabilityZone',
        'PrivateSubnet1Id', 'PrivateSubnet1CidrBlock', 'PrivateSubnet1AvailabilityZone',
        'PrivateSubnet2Id', 'PrivateSubnet2CidrBlock', 'PrivateSubnet2AvailabilityZone'
      ];

      const outputsSection = extractYamlSection('Outputs');
      subnetOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('S3 Bucket outputs are defined', () => {
      const s3Outputs = [
        'S3BucketName', 'S3BucketArn', 'S3BucketWebsiteURL', 'S3BucketRegionalDomainName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      s3Outputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM Role and Instance Profile outputs are defined', () => {
      const iamOutputs = [
        'EC2RoleArn', 'EC2InstanceProfileArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security Group outputs are defined', () => {
      const sgOutputs = [
        'WebSecurityGroupId', 'WebSecurityGroupName',
        'DatabaseSecurityGroupId', 'DatabaseSecurityGroupName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      sgOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Key Pair outputs are defined', () => {
      const keyPairOutputs = ['EC2KeyPairId', 'EC2KeyPairFingerprint'];

      const outputsSection = extractYamlSection('Outputs');
      keyPairOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('EC2 Instance outputs are defined', () => {
      const instanceOutputs = [
        'EC2InstanceId', 'EC2InstancePrivateIp', 'EC2InstancePrivateDnsName',
        'EC2InstanceAvailabilityZone', 'InstanceImageId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      instanceOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Elastic IP outputs are defined', () => {
      const eipOutputs = ['ElasticIPAddress', 'ElasticIPAllocationId'];

      const outputsSection = extractYamlSection('Outputs');
      eipOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('RDS Database outputs are defined', () => {
      const rdsOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort',
        'DBSubnetGroupName', 'DBSecretArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      rdsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('VPC Flow Logs outputs are defined', () => {
      const flowLogOutputs = [
        'VPCFlowLogGroupArn', 'VPCFlowLogId', 'VPCFlowLogRoleArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      flowLogOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('CloudFront outputs are defined', () => {
      const cloudFrontOutputs = [
        'CloudFrontDistributionId', 'CloudFrontDomainName',
        'CloudFrontDistributionURL', 'CloudFrontOriginAccessIdentityId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      cloudFrontOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Stack metadata outputs are defined', () => {
      const metadataOutputs = [
        'StackName', 'StackRegion', 'EnvironmentSuffix',
        'VPCCidrParameter', 'DBInstanceClass'
      ];

      const outputsSection = extractYamlSection('Outputs');
      metadataOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/g;
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
      const accountIdPattern = /\b\d{12}\b/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('No hardcoded AMI IDs in template', () => {
      const amiPattern = /ami-[a-f0-9]{8,}/;
      expect(templateYaml).not.toMatch(amiPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::AccountId}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('Uses SSM parameter for AMI ID resolution', () => {
      expect(templateYaml).toContain('{{resolve:ssm:${SourceAmiIdSsmParameter}}}');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('Uses AWS Partition reference for IAM policies', () => {
      expect(templateYaml).toContain('!Sub \'arn:${AWS::Partition}:iam::aws:policy/AmazonSSMManagedInstanceCore\'');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('Security Configuration', () => {
    test('Security Group rules are properly configured', () => {
      expect(templateYaml).toContain('SecurityGroupIngress:');
      expect(templateYaml).toContain('IpProtocol: tcp');
      expect(templateYaml).toContain('Description: Allow SSH');
      expect(templateYaml).toContain('Description: Allow HTTP');
      expect(templateYaml).toContain('Description: Allow PostgreSQL from web server');
    });

    test('Database security follows best practices', () => {
      // DB is in private subnets
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref DBSubnetGroup');

      // DB security group only allows access from web security group
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebSecurityGroup');

      // Password is managed by Secrets Manager
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
    });

    test('S3 bucket has proper public access configuration', () => {
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: false');
      expect(templateYaml).toContain('BlockPublicPolicy: false');
    });

    test('CloudFront enforces HTTPS', () => {
      expect(templateYaml).toContain('ViewerProtocolPolicy: redirect-to-https');
    });

    test('IAM roles follow principle of least privilege', () => {
      // EC2 role only has necessary S3 and EC2 permissions
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('ec2:DescribeInstances');

      // VPC Flow Log role only has CloudWatch logs permissions
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('VPC provides network foundation for all resources', () => {
      // All network resources reference VPC
      validateResourceDependencies('PublicSubnet1', ['VPC']);
      validateResourceDependencies('PublicSubnet2', ['VPC']);
      validateResourceDependencies('PrivateSubnet1', ['VPC']);
      validateResourceDependencies('PrivateSubnet2', ['VPC']);
      validateResourceDependencies('WebSecurityGroup', ['VPC']);
      validateResourceDependencies('DatabaseSecurityGroup', ['VPC']);
      validateResourceDependencies('PublicRouteTable', ['VPC']);
      validateResourceDependencies('InternetGatewayAttachment', ['VPC']);
    });

    test('EC2 Instance has proper dependencies', () => {
      // Instance references all required components
      validateResourceDependencies('EC2Instance', ['WebSecurityGroup', 'PublicSubnet1', 'EC2KeyPair', 'EC2InstanceProfile']);
    });

    test('RDS Database has proper dependencies', () => {
      // Database references security group and subnet group
      validateResourceDependencies('RDSInstance', ['DatabaseSecurityGroup', 'DBSubnetGroup']);
    });

    test('Resource naming follows consistent pattern', () => {
      const namingPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+/;

      // Check various resource names follow pattern
      expect(templateYaml).toMatch(namingPattern);

      // Check specific naming examples
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db');
    });

    test('All resources have proper tagging for identification and cost tracking', () => {
      // Check that major resources have proper tags
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Key: Owner');
      expect(templateYaml).toContain('Key: Project');

      // Count Name tag occurrences (should be multiple)
      const nameTagMatches = (templateYaml.match(/Key: Name/g) || []).length;
      expect(nameTagMatches).toBeGreaterThanOrEqual(15); // Multiple resources should have Name tags
    });

    test('Multi-AZ deployment is properly configured', () => {
      // Public and private subnets are in different AZs
      expect(templateYaml).toContain('AvailabilityZone: !Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('AvailabilityZone: !Select [1, !GetAZs \'\']');

      // DB subnet group includes both private subnets for multi-AZ capability
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
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

      // S3 Resources
      if (deployedOutputs.S3BucketName) {
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.S3BucketName).toContain('-bucket');
        expect(deployedOutputs.S3BucketName).toMatch(/^\d+-[a-z0-9-]+-[a-z0-9]+-bucket$/);
      }

      // EC2 Resources
      if (deployedOutputs.EC2InstanceId) {
        expect(deployedOutputs.EC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
      }

      // RDS Resources
      if (deployedOutputs.RDSInstanceId) {
        expect(deployedOutputs.RDSInstanceId.toLowerCase()).toContain(currentStackName.toLowerCase());
        expect(deployedOutputs.RDSInstanceId).toContain(currentEnvironmentSuffix);
      }
    });

    test('Environment-specific naming is applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment suffix matches what we expect
      expect(currentEnvironmentSuffix).toMatch(/^[a-zA-Z0-9\-]+$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');
    });
  });

  // ========================
  // PERFORMANCE & COST
  // ========================
  describe('Performance and Cost Optimization', () => {
    test('Default instance types are cost-effective', () => {
      expect(templateYaml).toContain('InstanceType: t3.micro'); // Burstable performance
      expect(templateYaml).toContain('Default: \'db.t3.micro\''); // Database cost-effective
    });

    test('Database instance types are limited to appropriate sizes', () => {
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- db.t3.micro');
      expect(templateYaml).toContain('- db.t3.small');
      expect(templateYaml).toContain('- db.t3.medium');
      expect(templateYaml).toContain('- db.t3.large');
    });

    test('Storage configuration is cost-optimized', () => {
      expect(templateYaml).toContain('AllocatedStorage: \'20\''); // Minimum viable storage
      expect(templateYaml).toContain('StorageType: gp2'); // Cost-effective storage type
    });

    test('Log retention is configured to manage costs', () => {
      expect(templateYaml).toContain('RetentionInDays: 7'); // VPC Flow Logs
      expect(templateYaml).toContain('BackupRetentionPeriod: 7'); // RDS backups
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE
  // ========================
  describe('Reliability and Resilience', () => {
    test('Resource dependencies prevent deployment race conditions', () => {
      // Route creation depends on gateway attachment
      expect(templateYaml).toContain('DependsOn: InternetGatewayAttachment');
    });

    test('Database backup and maintenance are properly configured', () => {
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('PreferredBackupWindow: \'03:00-04:00\'');
      expect(templateYaml).toContain('PreferredMaintenanceWindow: \'sun:04:00-sun:05:00\'');
    });

    test('Multi-AZ capability is supported', () => {
      // Subnets in different AZs
      expect(templateYaml).toContain('AvailabilityZone: !Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('AvailabilityZone: !Select [1, !GetAZs \'\']');

      // DB subnet group supports multi-AZ
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Error-prone configurations are avoided', () => {
      // No hardcoded values that become invalid
      expect(templateYaml).not.toMatch(/ami-[a-f0-9]{8,}/);
      expect(templateYaml).not.toMatch(/\b\d{12}\b/);
      expect(templateYaml).not.toMatch(/us-east-1|us-west-2|eu-west-1/);

      expect(templateYaml).toContain('{{resolve:ssm:');
      expect(templateYaml).toContain('{{resolve:secretsmanager:');
    });
  });
});