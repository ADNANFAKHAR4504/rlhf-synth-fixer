import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Secure Environment Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';
  let accountId = 'unknown-account';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region, stack name, and environment suffix dynamically from outputs
        region = deployedOutputs.Region ||
          process.env.AWS_REGION ||
          deployedOutputs.VPCId?.split(':')[3] ||
          deployedOutputs.EC2RoleArn?.split(':')[3] ||
          deployedOutputs.RDSKMSKeyArn?.split(':')[3] ||
          'us-east-1';

        currentStackName = deployedOutputs.StackName ||
          deployedOutputs.VPCId?.split('-')[0] ||
          'TapStack';

        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix ||
          'pr4056';

        // Extract account ID from any ARN
        accountId = deployedOutputs.EC2RoleArn?.split(':')[4] ||
          deployedOutputs.RDSKMSKeyArn?.split(':')[4] ||
          deployedOutputs.S3BucketArn?.split(':')[4] ||
          'unknown-account';

        // Debug logging for extracted values
        console.log('=== Dynamic Extraction Results ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('Account ID:', accountId);
        console.log('================================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Running template-only validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('Account ID:', accountId);
      console.log('====================================');
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
      expect(templateYaml).toContain('Description: \'Secure environment setup with VPC, EC2, RDS, S3, and monitoring\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates secure infrastructure setup', () => {
      expect(templateYaml).toContain('Secure environment setup');
      expect(templateYaml).toContain('VPC, EC2, RDS, S3, and monitoring');
    });

    test('Template contains all critical AWS resource types for secure infrastructure', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
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
        'AWS::CloudTrail::Trail',
        'AWS::Logs::LogGroup'
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
      expect(templateYaml).toMatch(/Default: \"[a-zA-Z0-9\-]+\"/);
      expect(templateYaml).toContain('parallel deployments');
    });

    test('Dynamic SSM parameter for AMI ID is configured', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateYaml).toContain('SSM parameter name holding the AMI ID');
    });

    test('CIDR blocks are parameterized for flexibility', () => {
      const cidrParameters = ['VpcCidrBlock', 'PublicSubnet1CidrBlock', 'PrivateSubnet1CidrBlock', 'PrivateSubnet2CidrBlock'];

      cidrParameters.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('Type: String');
        expect(templateYaml).toContain('AllowedPattern:');
        expect(templateYaml).toContain('Default: 10.0');
      });
    });

    test('Database parameters are configurable', () => {
      expect(templateYaml).toContain('DBInstanceClass:');
      expect(templateYaml).toContain('DBMasterUsername:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('db.t3.micro');
      expect(templateYaml).toContain('Default: admin');
    });

    test('EC2 instance type is parameterized', () => {
      expect(templateYaml).toContain('EC2InstanceType:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('t2.micro');
      expect(templateYaml).toContain('t3.micro');
    });

    test('No hardcoded account-specific or region-specific parameters', () => {
      const parametersSection = extractYamlSection('Parameters');
      // Should not contain any hardcoded account IDs or regions
      expect(parametersSection).not.toMatch(/\b\d{12}\b/); // Account ID pattern
      expect(parametersSection).not.toMatch(/\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/); // Region pattern
    });
  });

  // ==================
  // NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is configured with parameterized CIDR and DNS settings', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidrBlock');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('InternetGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Subnets use parameterized CIDR blocks', () => {
      validateResourceExists('PublicSubnet1', 'AWS::EC2::Subnet');
      validateResourceExists('PrivateSubnet1', 'AWS::EC2::Subnet');
      validateResourceExists('PrivateSubnet2', 'AWS::EC2::Subnet');

      expect(templateYaml).toContain('CidrBlock: !Ref PublicSubnet1CidrBlock');
      expect(templateYaml).toContain('CidrBlock: !Ref PrivateSubnet1CidrBlock');
      expect(templateYaml).toContain('CidrBlock: !Ref PrivateSubnet2CidrBlock');
    });

    test('NAT Gateway is configured for private subnet internet access', () => {
      validateResourceExists('NatGateway', 'AWS::EC2::NatGateway');
      validateResourceExists('NatGatewayEIP', 'AWS::EC2::EIP');
      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('AllocationId: !GetAtt NatGatewayEIP.AllocationId');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
    });

    test('Route tables are properly configured with appropriate routes', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('DefaultPublicRoute', 'AWS::EC2::Route');
      validateResourceExists('DefaultPrivateRoute', 'AWS::EC2::Route');

      expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway');
    });

    test('Subnet associations link subnets to appropriate route tables', () => {
      expect(templateYaml).toContain('PublicSubnet1RouteTableAssociation');
      expect(templateYaml).toContain('PrivateSubnet1RouteTableAssociation');
      expect(templateYaml).toContain('PrivateSubnet2RouteTableAssociation');
    });

    test('Resource naming follows dynamic convention with region and environment', () => {
      const namingPattern = /Value: !Sub "\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(namingPattern);

      // Count occurrences to ensure consistent naming
      const matches = templateYaml.match(new RegExp(namingPattern.source, 'g'));
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(15); // Should be used extensively
    });
  });

  // ==================
  // SECURITY GROUPS
  // ==================
  describe('Security Groups Configuration', () => {
    test('EC2 Security Group allows HTTPS only', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for EC2 instances - HTTPS only');
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
      expect(templateYaml).toContain('IpProtocol: tcp');
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');
    });

    test('RDS Security Group restricts access to EC2 instances only', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for RDS instance');
      expect(templateYaml).toContain('FromPort: 3306');
      expect(templateYaml).toContain('ToPort: 3306');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });

    test('Security groups are associated with the VPC', () => {
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Security groups follow least privilege principle', () => {
      // EC2 should only allow outbound traffic
      expect(templateYaml).toContain('SecurityGroupEgress:');
      expect(templateYaml).toContain('IpProtocol: -1'); // All outbound traffic

      // RDS should only accept traffic from EC2 security group
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });
  });

  // ==================
  // S3 BUCKETS
  // ==================
  describe('S3 Storage Configuration', () => {
    test('Main S3 bucket has proper security configurations', () => {
      validateResourceExists('S3Bucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-bucket"');
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });

    test('S3 bucket blocks public access', () => {
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('CloudTrail bucket has lifecycle configuration', () => {
      validateResourceExists('CloudTrailBucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-trail-bucket"');
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('ExpirationInDays: 90');
      expect(templateYaml).toContain('Id: DeleteOldLogs');
    });

    test('CloudTrail bucket policy allows CloudTrail service access', () => {
      validateResourceExists('CloudTrailBucketPolicy', 'AWS::S3::BucketPolicy');
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain('Service: cloudtrail.amazonaws.com');
      expect(templateYaml).toContain('Action: s3:GetBucketAcl');
      expect(templateYaml).toContain('Action: s3:PutObject');
      expect(templateYaml).toContain('s3:x-amz-acl: bucket-owner-full-control');
    });
  });

  // ==================
  // KMS ENCRYPTION
  // ==================
  describe('KMS Key Management', () => {
    test('RDS KMS Key is properly configured', () => {
      validateResourceExists('RDSKMSKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Description: KMS key for RDS encryption');
      expect(templateYaml).toContain('KeyPolicy:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');
    });

    test('KMS Key has proper cross-account compatible key policy', () => {
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain('AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"');
      expect(templateYaml).toContain('Action: kms:*');
      expect(templateYaml).toContain('Resource: \'*\'');
    });

    test('KMS Key Alias is properly configured with dynamic naming', () => {
      validateResourceExists('RDSKMSKeyAlias', 'AWS::KMS::Alias');
      expect(templateYaml).toContain('AliasName: !Sub "alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-key"');
      expect(templateYaml).toContain('TargetKeyId: !Ref RDSKMSKey');
    });
  });

  // ==================
  // RDS DATABASE
  // ==================
  describe('RDS Database Configuration', () => {
    test('RDS instance uses parameterized configurations', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('DBInstanceClass: !Ref DBInstanceClass');
      expect(templateYaml).toContain('MasterUsername: !Ref DBMasterUsername');
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKMSKey');
    });

    test('RDS password is managed by Secrets Manager', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"');
      validateResourceExists('RDSSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('SecretStringTemplate: !Sub \'{"username": "${DBMasterUsername}"}\'');
    });

    test('RDS instance is in private subnets with proper security', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('VPCSecurityGroups:');
      expect(templateYaml).toContain('- !Ref RDSSecurityGroup');
    });

    test('RDS configuration follows security best practices', () => {
      expect(templateYaml).toContain('Engine: mysql');
      expect(templateYaml).toContain('EngineVersion: \'8.0.43\'');
      expect(templateYaml).toContain('StorageType: gp2');
      expect(templateYaml).toContain('AllocatedStorage: 20');
    });
  });

  // ==================
  // EC2 AND AUTO SCALING
  // ==================
  describe('EC2 and Auto Scaling Configuration', () => {
    test('Launch Template uses dynamic AMI ID from SSM', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
      expect(templateYaml).toContain('InstanceType: !Ref EC2InstanceType');
    });

    test('Launch Template includes proper IAM role and security groups', () => {
      expect(templateYaml).toContain('IamInstanceProfile:');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref EC2SecurityGroup');
    });

    test('Auto Scaling Group is configured in private subnets', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });

    test('Auto Scaling Group has appropriate sizing configuration', () => {
      expect(templateYaml).toContain('MinSize: 1');
      expect(templateYaml).toContain('MaxSize: 3');
      expect(templateYaml).toContain('DesiredCapacity: 1');
      expect(templateYaml).toContain('HealthCheckType: EC2');
      expect(templateYaml).toContain('HealthCheckGracePeriod: 300');
    });
  });

  // ==================
  // IAM RESOURCES
  // ==================
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM Role follows least privilege principle', () => {
      validateResourceExists('EC2Role', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('Action: sts:AssumeRole');
      expect(templateYaml).toContain('ManagedPolicyArns:');
      expect(templateYaml).toContain('- !Ref S3ReadAccessPolicy');
    });

    test('S3 Read Access Policy is scoped to specific bucket', () => {
      validateResourceExists('S3ReadAccessPolicy', 'AWS::IAM::ManagedPolicy');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('s3:GetBucketLocation');
      expect(templateYaml).toContain('Resource:');
      expect(templateYaml).toContain('- !GetAtt S3Bucket.Arn');
      expect(templateYaml).toContain('- !Sub "${S3Bucket.Arn}/*"');
    });

    test('EC2 Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2Role');
    });

    test('CloudTrail IAM Role has appropriate permissions', () => {
      validateResourceExists('CloudTrailRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: cloudtrail.amazonaws.com');
      expect(templateYaml).toContain('logs:CreateLogStream');
      expect(templateYaml).toContain('logs:PutLogEvents');
    });
  });

  // ==================
  // MONITORING
  // ==================
  describe('CloudWatch and CloudTrail Monitoring', () => {
    test('CloudWatch Log Group is configured with retention', () => {
      validateResourceExists('CloudWatchLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('LogGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-log-group"');
      expect(templateYaml).toContain('RetentionInDays: 7');
    });

    test('CloudTrail is properly configured for auditing', () => {
      validateResourceExists('CloudTrail', 'AWS::CloudTrail::Trail');
      expect(templateYaml).toContain('S3BucketName: !Ref CloudTrailBucket');
      expect(templateYaml).toContain('CloudWatchLogsLogGroupArn: !GetAtt CloudWatchLogGroup.Arn');
      expect(templateYaml).toContain('CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn');
      expect(templateYaml).toContain('IsLogging: true');
      expect(templateYaml).toContain('EnableLogFileValidation: true');
    });

    test('CloudTrail includes global service events', () => {
      expect(templateYaml).toContain('IncludeGlobalServiceEvents: true');
      expect(templateYaml).toContain('IsMultiRegionTrail: false');
    });
  });

  // ======================
  // CROSS-ACCOUNT/REGION
  // ======================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      // Allow ${AWS::AccountId} but not literal 12-digit numbers
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::AccountId\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      // Allow ${AWS::Region} but not literal region names
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::Region\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);

      // Count occurrences to ensure it's used consistently
      const matches = templateYaml.match(new RegExp(regionEnvironmentPattern.source, 'g'));
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(15); // Should be used extensively
    });

    test('S3 bucket names include account ID for global uniqueness', () => {
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}');
    });

    test('ARN references use proper AWS naming conventions', () => {
      // Check for ARN patterns in the template
      expect(templateYaml).toContain('!Sub "arn:aws:iam::${AWS::AccountId}:root"');
      expect(templateYaml).toContain('arn:aws');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('Networking outputs are comprehensive and exportable', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidrBlock', 'InternetGatewayId', 'NatGatewayId', 'NatGatewayEIP',
        'PublicSubnet1Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'PublicRouteTableId', 'PrivateRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub');
      });
    });

    test('Security Group outputs are defined', () => {
      const securityOutputs = ['EC2SecurityGroupId', 'RDSSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('S3 and storage outputs are comprehensive', () => {
      const storageOutputs = [
        'S3BucketName', 'S3BucketArn', 'S3BucketDomainName',
        'CloudTrailBucketName', 'CloudTrailBucketArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      storageOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('RDS outputs include connection information', () => {
      const rdsOutputs = [
        'RDSInstanceId', 'RDSEndpoint', 'RDSPort', 'RDSConnectionString',
        'RDSSecretArn', 'DBSubnetGroupName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      rdsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('KMS outputs are defined for key management', () => {
      const kmsOutputs = ['RDSKMSKeyId', 'RDSKMSKeyArn', 'RDSKMSKeyAlias'];

      const outputsSection = extractYamlSection('Outputs');
      kmsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM outputs are comprehensive', () => {
      const iamOutputs = [
        'EC2RoleArn', 'EC2RoleName', 'EC2InstanceProfileArn',
        'S3ReadAccessPolicyArn', 'CloudTrailRoleArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('EC2 and Auto Scaling outputs are defined', () => {
      const ec2Outputs = [
        'LaunchTemplateId', 'LaunchTemplateVersion',
        'AutoScalingGroupName', 'AutoScalingGroupArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      ec2Outputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring outputs are defined', () => {
      const monitoringOutputs = [
        'CloudWatchLogGroupName', 'CloudWatchLogGroupArn',
        'CloudTrailName', 'CloudTrailArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Stack metadata outputs are defined', () => {
      const metadataOutputs = ['StackName', 'Region', 'EnvironmentSuffix'];

      const outputsSection = extractYamlSection('Outputs');
      metadataOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });
  });

  // ====================
  // INTEGRATION TESTING
  // ====================
  describe('End-to-End Integration Tests', () => {
    test('VPC and networking components are properly linked', () => {
      // Subnets reference VPC
      validateResourceDependencies('PublicSubnet1', ['VPC']);
      validateResourceDependencies('PrivateSubnet1', ['VPC']);
      validateResourceDependencies('PrivateSubnet2', ['VPC']);

      // Route tables reference VPC
      validateResourceDependencies('PublicRouteTable', ['VPC']);
      validateResourceDependencies('PrivateRouteTable', ['VPC']);
    });

    test('Security groups reference each other appropriately', () => {
      validateResourceDependencies('RDSSecurityGroup', ['EC2SecurityGroup']);
    });

    test('RDS instance integrates with all dependencies', () => {
      validateResourceDependencies('RDSInstance', [
        'DBSubnetGroup', 'RDSSecurityGroup', 'RDSKMSKey', 'RDSSecret'
      ]);
    });

    test('Auto Scaling Group integrates with EC2 components', () => {
      validateResourceDependencies('AutoScalingGroup', ['LaunchTemplate']);
      validateResourceDependencies('LaunchTemplate', ['EC2InstanceProfile', 'EC2SecurityGroup']);
    });

    test('IAM roles have proper trust relationships and dependencies', () => {
      validateResourceDependencies('EC2Role', ['S3ReadAccessPolicy']);
      validateResourceDependencies('S3ReadAccessPolicy', ['S3Bucket']);
    });

    test('CloudTrail integrates with S3 and CloudWatch', () => {
      validateResourceDependencies('CloudTrail', [
        'CloudTrailBucket', 'CloudWatchLogGroup', 'CloudTrailRole'
      ]);
    });

    test('KMS key is referenced by encrypted resources', () => {
      validateResourceDependencies('RDSInstance', ['RDSKMSKey']);
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

      // Verify extracted values are reasonable
      expect(currentStackName).toBeTruthy();
      expect(currentStackName).not.toBe('unknown-stack');
      expect(currentEnvironmentSuffix).toBeTruthy();
      expect(currentEnvironmentSuffix).not.toBe('unknown-suffix');
      expect(region).toBeTruthy();
      expect(region).not.toBe('unknown-region');
      expect(accountId).toBeTruthy();
      expect(accountId).not.toBe('unknown-account');

      console.log(`Deployment validation using: Stack=${currentStackName}, Region=${region}, Suffix=${currentEnvironmentSuffix}, Account=${accountId}`);
    });

    test('VPC and networking resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.InternetGatewayId) {
        expect(deployedOutputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]+$/);
      }

      if (deployedOutputs.NatGatewayId) {
        expect(deployedOutputs.NatGatewayId).toMatch(/^nat-[a-f0-9]+$/);
      }

      // Verify CIDR blocks match parameters
      if (deployedOutputs.VPCCidrBlock) {
        expect(deployedOutputs.VPCCidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      }
    });

    test('Security groups are properly deployed with expected IDs', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const securityGroups = ['EC2SecurityGroupId', 'RDSSecurityGroupId'];
      securityGroups.forEach(sg => {
        if (deployedOutputs[sg]) {
          expect(deployedOutputs[sg]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('S3 buckets are deployed with expected naming pattern', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.S3BucketName) {
        expect(deployedOutputs.S3BucketName).toContain(accountId);
        expect(deployedOutputs.S3BucketName).toContain(region);
        expect(deployedOutputs.S3BucketName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.S3BucketName).toContain('bucket');
      }

      if (deployedOutputs.S3BucketArn) {
        expect(deployedOutputs.S3BucketArn).toMatch(/^arn:aws:s3:::/);
      }
    });

    test('RDS instance is deployed with proper configuration', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSEndpoint) {
        expect(deployedOutputs.RDSEndpoint).toContain(region);
        expect(deployedOutputs.RDSEndpoint).toContain('rds.amazonaws.com');
        expect(deployedOutputs.RDSEndpoint).toContain(currentStackName.toLowerCase());
        expect(deployedOutputs.RDSEndpoint).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.RDSPort) {
        expect(deployedOutputs.RDSPort).toBe('3306'); // MySQL port
      }

      if (deployedOutputs.RDSConnectionString) {
        expect(deployedOutputs.RDSConnectionString).toContain('mysql://');
        expect(deployedOutputs.RDSConnectionString).toContain('admin');
      }
    });

    test('KMS resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSKMSKeyArn) {
        expect(deployedOutputs.RDSKMSKeyArn).toMatch(/^arn:aws:kms:/);
        expect(deployedOutputs.RDSKMSKeyArn).toContain(region);
        expect(deployedOutputs.RDSKMSKeyArn).toContain(accountId);
      }

      if (deployedOutputs.RDSKMSKeyId) {
        expect(deployedOutputs.RDSKMSKeyId).toMatch(/^[a-f0-9-]+$/);
      }
    });

    test('IAM resources are deployed with proper naming', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.EC2RoleArn) {
        expect(deployedOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::/);
        expect(deployedOutputs.EC2RoleArn).toContain(accountId);
        expect(deployedOutputs.EC2RoleArn).toContain(currentStackName);
        expect(deployedOutputs.EC2RoleArn).toContain(region);
        expect(deployedOutputs.EC2RoleArn).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.EC2InstanceProfileArn) {
        expect(deployedOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::/);
        expect(deployedOutputs.EC2InstanceProfileArn).toContain('instance-profile');
      }
    });

    test('Auto Scaling and Launch Template are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.LaunchTemplateId) {
        expect(deployedOutputs.LaunchTemplateId).toMatch(/^lt-[a-f0-9]+$/);
      }

      if (deployedOutputs.AutoScalingGroupName) {
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentStackName);
        expect(deployedOutputs.AutoScalingGroupName).toContain(region);
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.AutoScalingGroupName).toContain('asg');
      }
    });

    test('CloudWatch and CloudTrail are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.CloudWatchLogGroupArn) {
        expect(deployedOutputs.CloudWatchLogGroupArn).toMatch(/^arn:aws:logs:/);
        expect(deployedOutputs.CloudWatchLogGroupArn).toContain(region);
        expect(deployedOutputs.CloudWatchLogGroupArn).toContain(accountId);
      }

      if (deployedOutputs.CloudTrailArn) {
        expect(deployedOutputs.CloudTrailArn).toMatch(/^arn:aws:cloudtrail:/);
        expect(deployedOutputs.CloudTrailArn).toContain(region);
        expect(deployedOutputs.CloudTrailArn).toContain(accountId);
      }
    });

    test('Environment-specific naming is applied correctly across all resources', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the environment suffix matches expected pattern
      expect(currentEnvironmentSuffix).toMatch(/^(pr|dev|prod|test|staging)\d*$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      // Count how many outputs contain the environment suffix
      const outputsWithSuffix = Object.values(deployedOutputs).filter(value =>
        typeof value === 'string' && value.includes(currentEnvironmentSuffix)
      );

      expect(outputsWithSuffix.length).toBeGreaterThan(10); // Should have many resources with suffix
    });

    test('Stack metadata matches deployment outputs', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.StackName) {
        expect(deployedOutputs.StackName).toBe(currentStackName);
      }

      if (deployedOutputs.Region) {
        expect(deployedOutputs.Region).toBe(region);
      }

      if (deployedOutputs.EnvironmentSuffix) {
        expect(deployedOutputs.EnvironmentSuffix).toBe(currentEnvironmentSuffix);
      }
    });
  });

  // ========================
  // SECURITY & COMPLIANCE
  // ========================
  describe('Security and Compliance Validation', () => {
    test('All storage resources use encryption', () => {
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
      expect(templateYaml).toContain('KmsKeyId: !Ref RDSKMSKey');
    });

    test('Network access follows least privilege principle', () => {
      // EC2 security group only allows HTTPS
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');

      // RDS only accessible from EC2
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');

      // Private subnets for sensitive resources
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
    });

    test('IAM follows least privilege principle', () => {
      expect(templateYaml).toContain('Effect: Allow');
      expect(templateYaml).toContain('- !GetAtt S3Bucket.Arn');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('s3:GetBucketLocation');

      // Should not grant broad permissions like Resource: "*"
      const iamPolicySection = templateYaml.substring(
        templateYaml.indexOf('S3ReadAccessPolicy:'),
        templateYaml.indexOf('EC2InstanceProfile:')
      );
      expect(iamPolicySection).not.toContain('Resource: "*"');
      expect(iamPolicySection).not.toContain('Action: "*"');
    });

    test('Audit logging is enabled through CloudTrail', () => {
      expect(templateYaml).toContain('IsLogging: true');
      expect(templateYaml).toContain('EnableLogFileValidation: true');
      expect(templateYaml).toContain('IncludeGlobalServiceEvents: true');
    });

    test('Secrets are managed securely', () => {
      expect(templateYaml).toContain('AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('PasswordLength: 32');
      expect(templateYaml).toContain('ExcludeCharacters:');
    });
  });
});
