import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - LocalStack Compatible Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'us-east-1'; // LocalStack default
  let currentStackName = 'TapStack-LocalStack';
  let currentEnvironmentSuffix = 'localstack';
  let accountId = '000000000000'; // LocalStack fixed account ID

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract values from outputs
        region = deployedOutputs.Region || 'us-east-1';
        currentStackName = deployedOutputs.StackName || 'TapStack-LocalStack';
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix || 'localstack';
        accountId = '000000000000'; // LocalStack always uses this account ID

        console.log('=== LocalStack Test Configuration ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('Account ID:', accountId);
        console.log('=====================================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Running template-only validation tests.');
    }
  });

  // Helper function to validate resource exists in template
  const validateResourceExists = (resourceName: string, resourceType: string) => {
    expect(templateYaml).toContain(`${resourceName}:`);
    expect(templateYaml).toContain(`Type: ${resourceType}`);
  };

  // Helper function to validate resource does NOT exist
  const validateResourceDoesNotExist = (resourceName: string) => {
    const resourcePattern = new RegExp(`^\\s+${resourceName}:\\s*$`, 'm');
    expect(templateYaml).not.toMatch(resourcePattern);
  };

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required sections', () => {
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description:');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates LocalStack compatible setup', () => {
      expect(templateYaml).toContain('VPC');
      expect(templateYaml).toContain('EC2');
      expect(templateYaml).toContain('RDS');
      expect(templateYaml).toContain('S3');
    });

    test('Template contains LocalStack-supported AWS resource types', () => {
      const supportedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::S3::Bucket',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::IAM::Role',
        'AWS::IAM::ManagedPolicy',
        'AWS::IAM::InstanceProfile',
        'AWS::Logs::LogGroup',
        'AWS::SecretsManager::Secret'
      ];

      supportedResourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });

    test('Template does NOT contain unsupported CloudTrail resources', () => {
      // CloudTrail is not fully supported in LocalStack Pro
      expect(templateYaml).not.toContain('Type: AWS::CloudTrail::Trail');
      validateResourceDoesNotExist('CloudTrail');
      validateResourceDoesNotExist('CloudTrailBucket');
      validateResourceDoesNotExist('CloudTrailBucketPolicy');
      validateResourceDoesNotExist('CloudTrailRole');
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section - LocalStack Compatibility', () => {
    test('EnvironmentSuffix parameter exists', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('AllowedPattern:');
    });

    test('Direct AMI ID parameter is used (not SSM resolution)', () => {
      expect(templateYaml).toContain('LatestAmiId:');
      expect(templateYaml).toContain('Type: AWS::EC2::Image::Id');
      // Should NOT use SSM parameter resolution
      expect(templateYaml).not.toContain('resolve:ssm:');
    });

    test('CIDR blocks are parameterized', () => {
      const cidrParameters = [
        'VpcCidrBlock',
        'PublicSubnet1CidrBlock',
        'PrivateSubnet1CidrBlock',
        'PrivateSubnet2CidrBlock'
      ];

      cidrParameters.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('Type: String');
        expect(templateYaml).toContain('AllowedPattern:');
      });
    });

    test('Database parameters are configurable', () => {
      expect(templateYaml).toContain('DBInstanceClass:');
      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain('DBMasterPassword:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('db.t3.micro');
    });

    test('EC2 instance type is parameterized', () => {
      expect(templateYaml).toContain('EC2InstanceType:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('t2.micro');
      expect(templateYaml).toContain('t3.micro');
    });

    test('DBMasterPassword uses NoEcho for security', () => {
      expect(templateYaml).toMatch(/DBMasterPassword:[\s\S]*?NoEcho: true/);
    });
  });

  // ==================
  // NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is defined with DNS support', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidrBlock');
    });

    test('Internet Gateway is created and attached', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('InternetGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('NAT Gateway is created with EIP', () => {
      validateResourceExists('NatGateway', 'AWS::EC2::NatGateway');
      validateResourceExists('NatGatewayEIP', 'AWS::EC2::EIP');
      expect(templateYaml).toContain('AllocationId: !GetAtt NatGatewayEIP.AllocationId');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
    });

    test('Public subnet is created correctly', () => {
      validateResourceExists('PublicSubnet1', 'AWS::EC2::Subnet');
      expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
      expect(templateYaml).toContain('CidrBlock: !Ref PublicSubnet1CidrBlock');
    });

    test('Private subnets are created for multi-AZ', () => {
      validateResourceExists('PrivateSubnet1', 'AWS::EC2::Subnet');
      validateResourceExists('PrivateSubnet2', 'AWS::EC2::Subnet');
      // Uses dynamic AZ selection
      expect(templateYaml).toContain('!Select [0, !GetAZs');
      expect(templateYaml).toContain('!Select [1, !GetAZs');
    });

    test('Route tables are configured correctly', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('DefaultPublicRoute', 'AWS::EC2::Route');
      validateResourceExists('DefaultPrivateRoute', 'AWS::EC2::Route');
    });

    test('Public route points to Internet Gateway', () => {
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
    });

    test('Private route points to NAT Gateway', () => {
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway');
    });

    test('Subnet route table associations exist', () => {
      validateResourceExists('PublicSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PrivateSubnet1RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      validateResourceExists('PrivateSubnet2RouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  // ==================
  // SECURITY GROUPS
  // ==================
  describe('Security Groups Configuration', () => {
    test('EC2 Security Group is defined', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for EC2 instances - HTTPS only');
    });

    test('EC2 Security Group allows HTTPS inbound', () => {
      expect(templateYaml).toMatch(/FromPort: 443[\s\S]*?ToPort: 443/);
      expect(templateYaml).toContain('IpProtocol: tcp');
    });

    test('RDS Security Group is defined', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for RDS instance');
    });

    test('RDS Security Group allows MySQL from EC2', () => {
      expect(templateYaml).toMatch(/FromPort: 3306[\s\S]*?ToPort: 3306/);
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });
  });

  // ==================
  // S3 RESOURCES
  // ==================
  describe('S3 Bucket Configuration', () => {
    test('S3 Bucket is created with proper naming for LocalStack', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');
      // LocalStack-compatible naming (no AWS::AccountId)
      expect(templateYaml).toContain('BucketName: !Sub "localstack-${EnvironmentSuffix}-bucket"');
    });

    test('S3 Bucket has versioning enabled', () => {
      expect(templateYaml).toMatch(/VersioningConfiguration:[\s\S]*?Status: Enabled/);
    });

    test('S3 Bucket has encryption configured', () => {
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('ServerSideEncryptionByDefault:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });

    test('S3 Bucket has public access blocked', () => {
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('CloudTrail bucket does NOT exist (removed for LocalStack)', () => {
      validateResourceDoesNotExist('CloudTrailBucket');
      validateResourceDoesNotExist('CloudTrailBucketPolicy');
    });
  });

  // ==================
  // IAM RESOURCES
  // ==================
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM Role is created', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: sts:AssumeRole');
    });

    test('EC2 Instance Profile is created', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });

    test('S3 Read Access Policy is defined', () => {
      validateResourceExists('S3ReadAccessPolicy', 'AWS::IAM::ManagedPolicy');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');
    });

    test('S3 Read Access Policy targets the correct bucket', () => {
      expect(templateYaml).toContain('!GetAtt S3Bucket.Arn');
      expect(templateYaml).toContain('!Sub "${S3Bucket.Arn}/*"');
    });

    test('CloudTrail IAM Role does NOT exist (removed for LocalStack)', () => {
      validateResourceDoesNotExist('CloudTrailRole');
    });
  });

  // ==================
  // RDS DATABASE
  // ==================
  describe('RDS Database Configuration', () => {
    test('RDS DB Subnet Group is created', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('RDS Instance is created with MySQL', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('Engine: mysql');
      expect(templateYaml).toContain('DBInstanceClass: !Ref DBInstanceClass');
      expect(templateYaml).toContain('AllocatedStorage: 20');
      expect(templateYaml).toContain('StorageType: gp2');
    });

    test('RDS Instance uses direct password parameter (LocalStack compatible)', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Ref DBMasterPassword');
    });

    test('RDS Instance has encryption enabled', () => {
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKMSKey');
    });

    test('RDS Instance is in private subnets', () => {
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref DBSubnetGroup');
      expect(templateYaml).toContain('VPCSecurityGroups:');
      expect(templateYaml).toContain('- !Ref RDSSecurityGroup');
    });

    test('RDS Instance has MultiAZ disabled for LocalStack', () => {
      expect(templateYaml).toContain('MultiAZ: false');
    });
  });

  // ==================
  // KMS ENCRYPTION
  // ==================
  describe('KMS Key Configuration', () => {
    test('KMS Key for RDS is created', () => {
      validateResourceExists('RDSKMSKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Description: KMS key for RDS encryption');
    });

    test('KMS Key has proper key policy', () => {
      // Uses dynamic account ID reference
      expect(templateYaml).toContain('arn:aws:iam::${AWS::AccountId}:root');
      expect(templateYaml).toContain('Action: kms:*');
    });

    test('KMS Key Alias is created', () => {
      validateResourceExists('RDSKMSKeyAlias', 'AWS::KMS::Alias');
      expect(templateYaml).toContain('TargetKeyId: !Ref RDSKMSKey');
    });
  });

  // ==================
  // SECRETS MANAGER
  // ==================
  describe('Secrets Manager Configuration', () => {
    test('RDS Secret is created', () => {
      validateResourceExists('RDSSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('Description: RDS master password');
    });

    test('RDS Secret stores credentials', () => {
      expect(templateYaml).toMatch(/SecretString:.*username.*password/s);
    });
  });

  // ==================
  // EC2 & AUTO SCALING
  // ==================
  describe('EC2 and Auto Scaling Configuration', () => {
    test('Launch Template is created', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('ImageId: !Ref LatestAmiId');
      expect(templateYaml).toContain('InstanceType: !Ref EC2InstanceType');
    });

    test('Launch Template uses IAM Instance Profile', () => {
      expect(templateYaml).toContain('IamInstanceProfile:');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
    });

    test('Launch Template uses correct Security Group', () => {
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref EC2SecurityGroup');
    });

    test('Auto Scaling Group is created', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('MinSize: 1');
      expect(templateYaml).toContain('MaxSize: 3');
      expect(templateYaml).toContain('DesiredCapacity: 1');
    });

    test('Auto Scaling Group uses $Latest version (LocalStack compatible)', () => {
      expect(templateYaml).toContain('Version: "$Latest"');
      // Should NOT use !GetAtt LaunchTemplate.LatestVersionNumber
      expect(templateYaml).not.toContain('!GetAtt LaunchTemplate.LatestVersionNumber');
    });

    test('Auto Scaling Group is in private subnets', () => {
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });
  });

  // ==================
  // CLOUDWATCH LOGS
  // ==================
  describe('CloudWatch Logs Configuration', () => {
    test('CloudWatch Log Group is created', () => {
      validateResourceExists('CloudWatchLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('RetentionInDays: 7');
    });

    test('CloudTrail resources do NOT exist', () => {
      validateResourceDoesNotExist('CloudTrail');
      expect(templateYaml).not.toContain('Type: AWS::CloudTrail::Trail');
    });
  });

  // ==================
  // OUTPUTS
  // ==================
  describe('Outputs Section', () => {
    test('VPC outputs are defined', () => {
      expect(templateYaml).toContain('VPCId:');
      expect(templateYaml).toContain('VPCCidrBlock:');
      expect(templateYaml).toContain('Value: !Ref VPC');
      expect(templateYaml).toContain('Value: !GetAtt VPC.CidrBlock');
    });

    test('Subnet outputs are defined', () => {
      expect(templateYaml).toContain('PublicSubnet1Id:');
      expect(templateYaml).toContain('PrivateSubnet1Id:');
      expect(templateYaml).toContain('PrivateSubnet2Id:');
    });

    test('Security Group outputs are defined', () => {
      expect(templateYaml).toContain('EC2SecurityGroupId:');
      expect(templateYaml).toContain('RDSSecurityGroupId:');
    });

    test('S3 Bucket outputs are defined', () => {
      expect(templateYaml).toContain('S3BucketName:');
      expect(templateYaml).toContain('S3BucketArn:');
      expect(templateYaml).toContain('Value: !Ref S3Bucket');
      expect(templateYaml).toContain('Value: !GetAtt S3Bucket.Arn');
    });

    test('RDS outputs are defined', () => {
      expect(templateYaml).toContain('RDSInstanceId:');
      expect(templateYaml).toContain('RDSEndpoint:');
      expect(templateYaml).toContain('RDSPort:');
      expect(templateYaml).toContain('RDSSecretArn:');
      expect(templateYaml).toContain('Value: !GetAtt RDSInstance.Endpoint.Address');
      expect(templateYaml).toContain('Value: !GetAtt RDSInstance.Endpoint.Port');
    });

    test('IAM outputs are defined', () => {
      expect(templateYaml).toContain('EC2RoleArn:');
      expect(templateYaml).toContain('EC2InstanceProfileArn:');
      expect(templateYaml).toContain('Value: !GetAtt EC2Role.Arn');
    });

    test('Auto Scaling Group outputs are defined', () => {
      expect(templateYaml).toContain('AutoScalingGroupName:');
      expect(templateYaml).toContain('LaunchTemplateId:');
      expect(templateYaml).toContain('Value: !Ref AutoScalingGroup');
    });

    test('CloudTrail outputs do NOT exist', () => {
      expect(templateYaml).not.toContain('CloudTrailName:');
      expect(templateYaml).not.toContain('CloudTrailArn:');
      expect(templateYaml).not.toContain('CloudTrailBucketName:');
    });

    test('LaunchTemplateVersion output does NOT exist (removed for LocalStack)', () => {
      expect(templateYaml).not.toContain('LaunchTemplateVersion:');
      expect(templateYaml).not.toContain('!GetAtt LaunchTemplate.LatestVersionNumber');
    });

    test('Outputs have Export names for cross-stack references', () => {
      expect(templateYaml).toMatch(/Export:[\s\S]*?Name: !Sub/);
    });
  });

  // ==================
  // LOCALSTACK COMPATIBILITY
  // ==================
  describe('LocalStack Compatibility Validations', () => {
    test('Template uses dynamic account ID reference', () => {
      // Uses AWS::AccountId for portability
      expect(templateYaml).toContain('${AWS::AccountId}');
    });

    test('Template uses dynamic availability zones', () => {
      // Uses !GetAZs for region-agnostic deployment
      expect(templateYaml).toContain('!GetAZs');
      expect(templateYaml).toContain('!Select [0, !GetAZs');
      expect(templateYaml).toContain('!Select [1, !GetAZs');
    });

    test('Template uses simplified S3 bucket naming', () => {
      expect(templateYaml).not.toMatch(/BucketName:.*AccountId/);
      expect(templateYaml).toContain('localstack-');
    });

    test('Template does not use SSM parameter resolution', () => {
      expect(templateYaml).not.toContain('{{resolve:ssm:');
    });

    test('Template does not use Secrets Manager dynamic resolution (LocalStack compatible)', () => {
      // LocalStack does not fully support {{resolve:secretsmanager:...}}
      expect(templateYaml).not.toContain('{{resolve:secretsmanager:');
      // Uses direct password parameter reference instead
      expect(templateYaml).toContain('MasterUserPassword: !Ref DBMasterPassword');
    });

    test('Template has EnableRDS parameter for LocalStack Community compatibility', () => {
      // EnableRDS parameter allows disabling RDS for LocalStack Community (which doesn't support RDS)
      expect(templateYaml).toContain('EnableRDS:');
      expect(templateYaml).toContain("Default: 'false'");
    });

    test('Template has Conditions section for conditional RDS resources', () => {
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('CreateRDSResources:');
    });

    test('RDS resources are conditional (for LocalStack Community compatibility)', () => {
      // RDS resources should have Condition: CreateRDSResources
      expect(templateYaml).toMatch(/DBSubnetGroup:[\s\S]*?Condition: CreateRDSResources/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?Condition: CreateRDSResources/);
    });

    test('Template has EnableNATGateway parameter for LocalStack Community compatibility', () => {
      // EnableNATGateway parameter allows disabling NAT Gateway for LocalStack Community
      expect(templateYaml).toContain('EnableNATGateway:');
      expect(templateYaml).toContain('CreateNATGateway:');
    });

    test('NAT Gateway resources are conditional (for LocalStack Community compatibility)', () => {
      // NAT Gateway resources should have Condition: CreateNATGateway
      expect(templateYaml).toMatch(/NatGatewayEIP:[\s\S]*?Condition: CreateNATGateway/);
      expect(templateYaml).toMatch(/NatGateway:[\s\S]*?Condition: CreateNATGateway/);
    });

    test('Template has EnableAutoScaling parameter for LocalStack Community compatibility', () => {
      // EnableAutoScaling parameter allows disabling Auto Scaling for LocalStack Community
      expect(templateYaml).toContain('EnableAutoScaling:');
      expect(templateYaml).toContain('CreateAutoScaling:');
    });

    test('Auto Scaling resources are conditional (for LocalStack Community compatibility)', () => {
      // Auto Scaling resources should have Condition: CreateAutoScaling
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?Condition: CreateAutoScaling/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?Condition: CreateAutoScaling/);
    });
  });

  // ==================
  // RESOURCE TAGGING
  // ==================
  describe('Resource Tagging', () => {
    test('Resources have consistent naming tags', () => {
      expect(templateYaml).toMatch(/Name: !Sub.*EnvironmentSuffix/);
    });

    test('VPC has Name tag', () => {
      expect(templateYaml).toMatch(/VPC:[\s\S]*?Tags:[\s\S]*?Key: Name/);
    });

    test('Subnets have Name tags', () => {
      expect(templateYaml).toMatch(/PublicSubnet1:[\s\S]*?Tags:[\s\S]*?Key: Name/);
      expect(templateYaml).toMatch(/PrivateSubnet1:[\s\S]*?Tags:[\s\S]*?Key: Name/);
    });
  });
});
