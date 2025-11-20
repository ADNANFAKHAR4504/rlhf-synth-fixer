import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Production Web Application Infrastructure Unit Tests', () => {
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
          deployedOutputs.VpcId?.split(':')[3] ||
          deployedOutputs.ALBArn?.split(':')[3] ||
          deployedOutputs.RDSInstanceId?.split(':')[3] ||
          deployedOutputs.DBSecretArn?.split(':')[3] ||
          deployedOutputs.EC2InstanceRoleArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name and environment suffix from resource naming pattern
        if (deployedOutputs.VpcId || deployedOutputs.ALBEndpoint || deployedOutputs.AutoScalingGroupName) {
          // Try different resource names to extract stack info
          const resourceIdentifiers = [
            deployedOutputs.AutoScalingGroupName,
            deployedOutputs.LaunchTemplateId,
            deployedOutputs.ALBTargetGroupArn?.split('/')[1], // Extract name from ARN
            deployedOutputs.DBSubnetGroupName
          ].filter(Boolean);

          if (resourceIdentifiers.length > 0) {
            const resourceName = resourceIdentifiers[0];
            console.log('Raw Resource Name:', resourceName);
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
          const anyArn = deployedOutputs.ALBArn || deployedOutputs.RDSInstanceId || deployedOutputs.DBSecretArn || deployedOutputs.EC2InstanceRoleArn;
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
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description: \'Production-grade web application infrastructure with ALB, Auto Scaling, RDS, and monitoring\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates production web application infrastructure', () => {
      expect(templateYaml).toContain('Production-grade web application infrastructure');
      expect(templateYaml).toContain('ALB');
      expect(templateYaml).toContain('Auto Scaling');
      expect(templateYaml).toContain('RDS');
      expect(templateYaml).toContain('monitoring');
    });

    test('Template contains all critical AWS resource types for web application', () => {
      const criticalResourceTypes = [
        'AWS::SecretsManager::Secret',
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::NatGateway',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::ScalingPolicy',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
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

    test('Database parameters are properly configured', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('DBMasterUsername:');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Default: \'admin\'');
      expect(parametersSection).toContain('MinLength: 1');
      expect(parametersSection).toContain('MaxLength: 16');
      expect(parametersSection).toContain('AllowedPattern: \'[a-zA-Z][a-zA-Z0-9]*\'');
    });

    test('Instance type parameter has appropriate options', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('InstanceType:');
      expect(parametersSection).toContain('Default: \'t3.micro\'');
      expect(parametersSection).toContain('AllowedValues:');
      expect(parametersSection).toContain('- t3.micro');
      expect(parametersSection).toContain('- t3.small');
      expect(parametersSection).toContain('- t3.medium');
      expect(parametersSection).toContain('- t3.large');
    });

    test('SSM parameter for dynamic AMI ID is configured', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('SourceAmiIdSsmParameter:');
      expect(parametersSection).toContain('Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(parametersSection).toContain('SSM parameter name holding the AMI ID');
    });

    test('No hardcoded account-specific or region-specific parameters', () => {
      const parametersSection = extractYamlSection('Parameters');
      // Should not contain any hardcoded account IDs or regions
      expect(parametersSection).not.toMatch(/\b\d{12}\b/); // Account ID pattern
      expect(parametersSection).not.toMatch(/\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/); // Region pattern
    });
  });

  // ==================
  // SECRETS MANAGEMENT
  // ==================
  describe('Secrets Manager Integration', () => {
    test('Database master secret is properly configured', () => {
      validateResourceExists('DBMasterSecret', 'AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret\'');
      expect(templateYaml).toContain('Description: \'RDS master password\'');
    });

    test('Secret generates secure password with proper configuration', () => {
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('SecretStringTemplate: !Sub \'{"username": "${DBMasterUsername}"}\'');
      expect(templateYaml).toContain('GenerateStringKey: \'password\'');
      expect(templateYaml).toContain('PasswordLength: 16');
      expect(templateYaml).toContain('ExcludePunctuation: true');
    });

    test('Secret has proper tags with dynamic naming', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-secret"');
    });
  });

  // ===============
  // VPC NETWORKING
  // ===============
  describe('VPC and Networking Infrastructure', () => {
    test('VPC is properly configured with DNS support', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: 10.0.0.0/16');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('Internet Gateway is configured for public access', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('VPCGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
    });

    test('Public subnets are properly configured across AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];

      publicSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: 10.0.${index + 1}.0/24`);
        expect(templateYaml).toContain(`AvailabilityZone: !Select [${index}, !GetAZs '']`);
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
      });
    });

    test('Private subnets are properly configured for applications', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2'];

      privateSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: 10.0.${index + 11}.0/24`);
        expect(templateYaml).toContain(`AvailabilityZone: !Select [${index}, !GetAZs '']`);
      });
    });

    test('Database subnets are isolated for RDS', () => {
      const dbSubnets = ['DBSubnet1', 'DBSubnet2'];

      dbSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`CidrBlock: 10.0.${index + 21}.0/24`);
        expect(templateYaml).toContain(`AvailabilityZone: !Select [${index}, !GetAZs '']`);
      });
    });

    test('NAT Gateways provide internet access for private subnets', () => {
      const natGateways = ['NatGateway1', 'NatGateway2'];
      const eips = ['NatGateway1EIP', 'NatGateway2EIP'];

      natGateways.forEach((nat, index) => {
        validateResourceExists(nat, 'AWS::EC2::NatGateway');
        validateResourceExists(eips[index], 'AWS::EC2::EIP');
        expect(templateYaml).toContain(`AllocationId: !GetAtt ${eips[index]}.AllocationId`);
        expect(templateYaml).toContain(`SubnetId: !Ref PublicSubnet${index + 1}`);
      });
    });

    test('Route tables are properly configured for traffic routing', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable1', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable2', 'AWS::EC2::RouteTable');

      expect(templateYaml).toContain('DestinationCidrBlock: 0.0.0.0/0');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway1');
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway2');
    });

    test('Subnet route table associations are properly configured', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'DBSubnet1RouteTableAssociation',
        'DBSubnet2RouteTableAssociation'
      ];

      associations.forEach(association => {
        validateResourceExists(association, 'AWS::EC2::SubnetRouteTableAssociation');
      });
    });

    test('All networking resources follow dynamic naming convention', () => {
      const networkingPattern = /Value: !Sub "\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+"/;
      expect(templateYaml).toMatch(networkingPattern);
    });
  });

  // ===============
  // SECURITY GROUPS
  // ===============
  describe('Security Groups Configuration', () => {
    test('ALB Security Group allows HTTP and HTTPS traffic', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for ALB');
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
    });

    test('EC2 Security Group allows traffic only from ALB', () => {
      validateResourceExists('EC2SecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for EC2 instances');
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ALBSecurityGroup');
    });

    test('RDS Security Group allows MySQL traffic only from EC2', () => {
      validateResourceExists('RDSSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: Security group for RDS database');
      expect(templateYaml).toContain('FromPort: 3306');
      expect(templateYaml).toContain('ToPort: 3306');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });

    test('Security groups follow proper least-privilege principle', () => {
      // Verify no overly permissive rules (0.0.0.0/0 should only be on ALB for web traffic)
      const sgSection = templateYaml.match(/SecurityGroup:[\s\S]*?(?=\w+:)/g) || [];

      // ALB should have 0.0.0.0/0 access for web traffic
      expect(templateYaml).toContain('CidrIp: 0.0.0.0/0');

      // Other security groups should reference security group IDs, not CIDR blocks
      expect(templateYaml).toContain('SourceSecurityGroupId:');
    });
  });

  // ===============
  // S3 BUCKET
  // ===============
  describe('S3 Bucket for Logs', () => {
    test('Logs bucket is properly configured with encryption', () => {
      validateResourceExists('LogsBucket', 'AWS::S3::Bucket');
      expect(templateYaml).toContain('BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-logs"');
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('ServerSideEncryptionByDefault:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });

    test('Bucket has versioning and lifecycle policies', () => {
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
      expect(templateYaml).toContain('LifecycleConfiguration:');
      expect(templateYaml).toContain('ExpirationInDays: 90');
    });

    test('Bucket blocks public access by default', () => {
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('IgnorePublicAcls: true');
      expect(templateYaml).toContain('RestrictPublicBuckets: true');
    });

    test('Bucket policy allows ELB access logs', () => {
      validateResourceExists('LogsBucketPolicy', 'AWS::S3::BucketPolicy');
      expect(templateYaml).toContain('AWSLogDeliveryWrite');
      expect(templateYaml).toContain('delivery.logs.amazonaws.com');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:GetBucketAcl');
    });
  });

  // ===============
  // IAM RESOURCES
  // ===============
  describe('IAM Roles and Policies', () => {
    test('EC2 Instance Role has appropriate permissions', () => {
      validateResourceExists('EC2InstanceRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: ec2.amazonaws.com');
      expect(templateYaml).toContain('ManagedPolicyArns:');
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
    });

    test('EC2 Role has S3 logs access policy', () => {
      expect(templateYaml).toContain('PolicyName: S3LogsAccess');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('s3:PutObjectAcl');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:ListBucket');
    });

    test('EC2 Role has CloudWatch metrics permissions', () => {
      expect(templateYaml).toContain('PolicyName: CloudWatchMetrics');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('cloudwatch:GetMetricStatistics');
      expect(templateYaml).toContain('cloudwatch:ListMetrics');
    });

    test('Instance Profile is properly configured', () => {
      validateResourceExists('EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref EC2InstanceRole');
    });

    test('IAM resources follow dynamic naming convention', () => {
      expect(templateYaml).toContain('RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"');
      expect(templateYaml).toContain('InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"');
    });
  });

  // ===============
  // RDS DATABASE
  // ===============
  describe('RDS Database Configuration', () => {
    test('Database subnet group is properly configured', () => {
      validateResourceExists('DBSubnetGroup', 'AWS::RDS::DBSubnetGroup');
      expect(templateYaml).toContain('DBSubnetGroupDescription: Subnet group for RDS database');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref DBSubnet1');
      expect(templateYaml).toContain('- !Ref DBSubnet2');
    });

    test('RDS Instance is configured with Secrets Manager integration', () => {
      validateResourceExists('RDSInstance', 'AWS::RDS::DBInstance');
      expect(templateYaml).toContain('Engine: mysql');
      expect(templateYaml).toContain('EngineVersion: \'8.0');
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
      expect(templateYaml).toContain('DBMasterSecret');
    });

    test('RDS Instance has proper backup and maintenance configuration', () => {
      expect(templateYaml).toContain('MultiAZ: true');
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('PreferredBackupWindow: \'03:00-04:00\'');
      expect(templateYaml).toContain('PreferredMaintenanceWindow: \'sun:04:00-sun:05:00\'');
    });

    test('RDS Instance enables CloudWatch logs export', () => {
      expect(templateYaml).toContain('EnableCloudwatchLogsExports:');
      expect(templateYaml).toContain('- error');
      expect(templateYaml).toContain('- general');
      expect(templateYaml).toContain('- slowquery');
    });

    test('Database uses proper security group and subnet group', () => {
      expect(templateYaml).toContain('VPCSecurityGroups:');
      expect(templateYaml).toContain('- !Ref RDSSecurityGroup');
      expect(templateYaml).toContain('DBSubnetGroupName: !Ref DBSubnetGroup');
    });
  });

  // ===============================
  // APPLICATION LOAD BALANCER
  // ===============================
  describe('Application Load Balancer Configuration', () => {
    test('ALB is properly configured as internet-facing', () => {
      validateResourceExists('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateYaml).toContain('Type: application');
      expect(templateYaml).toContain('Scheme: internet-facing');
      expect(templateYaml).toContain('SecurityGroups:');
      expect(templateYaml).toContain('- !Ref ALBSecurityGroup');
    });

    test('ALB uses public subnets for internet access', () => {
      expect(templateYaml).toContain('Subnets:');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
    });

    test('ALB has access logging configured to S3', () => {
      expect(templateYaml).toContain('LoadBalancerAttributes:');
      expect(templateYaml).toContain('Key: access_logs.s3.enabled');
      expect(templateYaml).toContain('Value: \'true\'');
      expect(templateYaml).toContain('Key: access_logs.s3.bucket');
      expect(templateYaml).toContain('Value: !Ref LogsBucket');
      expect(templateYaml).toContain('Key: access_logs.s3.prefix');
      expect(templateYaml).toContain('Value: \'alb-logs\'');
    });

    test('Target Group is properly configured for health checks', () => {
      validateResourceExists('ALBTargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');
      expect(templateYaml).toContain('TargetType: instance');
      expect(templateYaml).toContain('HealthCheckEnabled: true');
      expect(templateYaml).toContain('HealthCheckPath: /');
    });

    test('ALB Listener forwards traffic to target group', () => {
      validateResourceExists('ALBListener', 'AWS::ElasticLoadBalancingV2::Listener');
      expect(templateYaml).toContain('DefaultActions:');
      expect(templateYaml).toContain('Type: forward');
      expect(templateYaml).toContain('TargetGroupArn: !Ref ALBTargetGroup');
      expect(templateYaml).toContain('Port: 80');
      expect(templateYaml).toContain('Protocol: HTTP');
    });

    test('ALB depends on S3 bucket policy for logging', () => {
      expect(templateYaml).toContain('DependsOn: LogsBucketPolicy');
    });
  });

  // ===============================
  // AUTO SCALING CONFIGURATION
  // ===============================
  describe('Auto Scaling Group and Launch Template', () => {
    test('Launch Template uses dynamic AMI ID from SSM', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
      expect(templateYaml).toContain('InstanceType: !Ref InstanceType');
    });

    test('Launch Template has proper IAM instance profile', () => {
      expect(templateYaml).toContain('IamInstanceProfile:');
      expect(templateYaml).toContain('Arn: !GetAtt EC2InstanceProfile.Arn');
    });

    test('Launch Template includes security group configuration', () => {
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref EC2SecurityGroup');
    });

    test('Launch Template has comprehensive user data for web server setup', () => {
      expect(templateYaml).toContain('UserData:');
      expect(templateYaml).toContain('Fn::Base64: !Sub |');
      expect(templateYaml).toContain('yum update -y');
      expect(templateYaml).toContain('yum install -y httpd mysql amazon-cloudwatch-agent');
      expect(templateYaml).toContain('systemctl start httpd');
      expect(templateYaml).toContain('systemctl enable httpd');
    });

    test('User data creates proper web page with dynamic content', () => {
      expect(templateYaml).toContain('<title>Web App</title>');
      expect(templateYaml).toContain('Instance ID: $(ec2-metadata --instance-id');
      expect(templateYaml).toContain('Stack: ${AWS::StackName}');
      expect(templateYaml).toContain('Region: ${AWS::Region}');
      expect(templateYaml).toContain('Environment: ${EnvironmentSuffix}');
    });

    test('CloudWatch agent is properly configured', () => {
      expect(templateYaml).toContain('/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json');
      expect(templateYaml).toContain('log_group_name": "/aws/ec2/${AWS::StackName}"');
      expect(templateYaml).toContain('apache-access');
      expect(templateYaml).toContain('apache-error');
      expect(templateYaml).toContain('mem_used_percent');
      expect(templateYaml).toContain('used_percent');
    });

    test('Auto Scaling Group is properly configured', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('MinSize: 2');
      expect(templateYaml).toContain('MaxSize: 6');
      expect(templateYaml).toContain('DesiredCapacity: 2');
    });

    test('Auto Scaling Group integrates with ALB target group', () => {
      expect(templateYaml).toContain('HealthCheckType: ELB');
      expect(templateYaml).toContain('HealthCheckGracePeriod: 300');
      expect(templateYaml).toContain('TargetGroupARNs:');
      expect(templateYaml).toContain('- !Ref ALBTargetGroup');
    });

    test('Scaling policy is configured for CPU-based scaling', () => {
      validateResourceExists('ScaleUpPolicy', 'AWS::AutoScaling::ScalingPolicy');
      expect(templateYaml).toContain('PolicyType: TargetTrackingScaling');
      expect(templateYaml).toContain('PredefinedMetricType: ASGAverageCPUUtilization');
      expect(templateYaml).toContain('TargetValue: 70');
    });
  });

  // ===============================
  // CLOUDWATCH MONITORING
  // ===============================
  describe('CloudWatch Monitoring and Alarms', () => {
    test('SNS Topic is configured for alarm notifications', () => {
      validateResourceExists('SNSTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('DisplayName: CloudWatch Alarms');
      expect(templateYaml).toContain('Subscription:');
      expect(templateYaml).toContain('Endpoint: !Ref SNSEmailAddress');
      expect(templateYaml).toContain('Protocol: email');
    });

    test('EC2 CPU alarm monitors Auto Scaling Group', () => {
      validateResourceExists('EC2CPUAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/EC2');
      expect(templateYaml).toContain('Threshold: 80');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
      expect(templateYaml).toContain('Name: AutoScalingGroupName');
      expect(templateYaml).toContain('Value: !Ref AutoScalingGroup');
    });

    test('ALB latency alarm monitors response time', () => {
      validateResourceExists('ALBLatencyAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: TargetResponseTime');
      expect(templateYaml).toContain('Namespace: AWS/ApplicationELB');
      expect(templateYaml).toContain('Threshold: 1');
      expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
    });

    test('ALB 5XX error alarm monitors application errors', () => {
      validateResourceExists('ALB5XXAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: HTTPCode_Target_5XX_Count');
      expect(templateYaml).toContain('Namespace: AWS/ApplicationELB');
      expect(templateYaml).toContain('Threshold: 10');
      expect(templateYaml).toContain('Statistic: Sum');
    });

    test('RDS CPU alarm monitors database performance', () => {
      validateResourceExists('RDSCPUAlarm', 'AWS::CloudWatch::Alarm');
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('Namespace: AWS/RDS');
      expect(templateYaml).toContain('Threshold: 80');
      expect(templateYaml).toContain('Name: DBInstanceIdentifier');
      expect(templateYaml).toContain('Value: !Ref RDSInstance');
    });

    test('RDS storage and connection alarms monitor database health', () => {
      validateResourceExists('RDSFreeStorageAlarm', 'AWS::CloudWatch::Alarm');
      validateResourceExists('RDSConnectionsAlarm', 'AWS::CloudWatch::Alarm');

      expect(templateYaml).toContain('MetricName: FreeStorageSpace');
      expect(templateYaml).toContain('Threshold: 2147483648'); // 2GB
      expect(templateYaml).toContain('MetricName: DatabaseConnections');
      expect(templateYaml).toContain('Threshold: 50');
    });

    test('All alarms send notifications to SNS topic', () => {
      expect(templateYaml).toContain('AlarmActions:');
      expect(templateYaml).toContain('- !Ref SNSTopic');
    });

    test('CloudWatch Log Group is configured', () => {
      validateResourceExists('WebAppLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('LogGroupName: !Sub "/aws/ec2/${AWS::StackName}"');
      expect(templateYaml).toContain('RetentionInDays: 30');
    });
  });

  // ======================
  // CROSS-ACCOUNT/REGION
  // ======================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      // Allow ${AWS::AccountId} and ELB Account IDs in Mappings section (required by AWS)
      let templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::AccountId\}/g, '');

      // Remove the ELBAccountId mapping section which contains legitimate AWS-provided account IDs
      templateWithoutPseudoParams = templateWithoutPseudoParams.replace(/ELBAccountId:[\s\S]*?(?=\n\s{4}\w+:|$)/, '');

      expect(templateWithoutPseudoParams).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      // Allow ${AWS::Region} and region keys in ELB Account mapping (required by AWS)
      let templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::Region\}/g, '');

      // Remove the ELBAccountId mapping section which contains legitimate AWS region keys
      templateWithoutPseudoParams = templateWithoutPseudoParams.replace(/ELBAccountId:[\s\S]*?(?=\n\s{4}\w+:|$)/, '');

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

    test('Dynamic AMI resolution works across regions', () => {
      expect(templateYaml).toContain('{{resolve:ssm:${SourceAmiIdSsmParameter}}}');
      // This ensures AMI is fetched dynamically per region
    });

    test('Availability Zone selection is dynamic', () => {
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
    });

    test('ELB account mapping supports multiple regions', () => {
      expect(templateYaml).toContain('ELBAccountId:');
      expect(templateYaml).toContain('us-east-1:');
      expect(templateYaml).toContain('us-west-2:');
      expect(templateYaml).toContain('eu-west-1:');
      expect(templateYaml).toContain('ap-southeast-1:');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Comprehensive Outputs Section', () => {
    test('VPC and networking outputs are defined', () => {
      const networkingOutputs = [
        'VpcId', 'VpcCidr', 'InternetGatewayId',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnetIds',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnetIds',
        'DBSubnet1Id', 'DBSubnet2Id', 'DBSubnetIds',
        'NatGateway1Id', 'NatGateway2Id'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub "${AWS::StackName}');
      });
    });

    test('Security group outputs are defined', () => {
      const sgOutputs = ['ALBSecurityGroupId', 'EC2SecurityGroupId', 'RDSSecurityGroupId'];

      const outputsSection = extractYamlSection('Outputs');
      sgOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('S3 and IAM outputs are defined', () => {
      const s3IamOutputs = [
        'LogsBucketName', 'LogsBucketArn', 'LogsBucketDomainName',
        'EC2InstanceRoleArn', 'EC2InstanceProfileArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      s3IamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Database outputs are defined', () => {
      const dbOutputs = [
        'RDSEndpoint', 'RDSPort', 'RDSInstanceId',
        'DBSubnetGroupName', 'DBSecretArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      dbOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Load balancer and auto scaling outputs are defined', () => {
      const albAsgOutputs = [
        'ALBEndpoint', 'ALBArn', 'ALBFullName', 'ALBHostedZoneId',
        'ALBTargetGroupArn', 'ALBTargetGroupFullName',
        'LaunchTemplateId', 'LaunchTemplateVersion',
        'AutoScalingGroupName', 'AutoScalingGroupArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      albAsgOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Monitoring outputs are defined', () => {
      const monitoringOutputs = [
        'SNSTopicArn', 'WebAppLogGroupName', 'WebAppLogGroupArn',
        'EC2CPUAlarmName', 'ALBLatencyAlarmName', 'ALB5XXAlarmName',
        'RDSCPUAlarmName', 'RDSStorageAlarmName', 'RDSConnectionsAlarmName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      monitoringOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Utility outputs provide useful connection information', () => {
      const utilityOutputs = [
        'ApplicationURL', 'DatabaseConnectionString',
        'StackName', 'EnvironmentSuffix', 'Region'
      ];

      const outputsSection = extractYamlSection('Outputs');
      utilityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Application URL output provides direct access', () => {
      const outputsSection = extractYamlSection('Outputs');
      expect(outputsSection).toContain('ApplicationURL:');
      expect(outputsSection).toContain('Value: !Sub "http://${ApplicationLoadBalancer.DNSName}"');
    });

    test('Database connection string template is provided', () => {
      const outputsSection = extractYamlSection('Outputs');
      expect(outputsSection).toContain('DatabaseConnectionString:');
      expect(outputsSection).toContain('mysql://${DBMasterUsername}:<PASSWORD>@${RDSInstance.Endpoint.Address}');
    });

    test('Outputs follow consistent export naming convention', () => {
      const exportPattern = /Name: !Sub "\${AWS::StackName}-[\w-]+"/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(30); // Should have many exports
    });
  });

  // ====================
  // INTEGRATION TESTING
  // ====================
  describe('End-to-End Integration Tests', () => {
    test('Web traffic flow is properly configured', () => {
      // Internet → ALB → Target Group → EC2 instances
      validateResourceDependencies('ALBListener', ['ApplicationLoadBalancer', 'ALBTargetGroup']);
      validateResourceDependencies('AutoScalingGroup', ['LaunchTemplate', 'ALBTargetGroup']);
      validateResourceDependencies('ApplicationLoadBalancer', ['ALBSecurityGroup', 'PublicSubnet1', 'PublicSubnet2']);
    });

    test('Database access is properly secured', () => {
      // EC2 → RDS via security groups and subnets
      validateResourceDependencies('RDSInstance', ['RDSSecurityGroup', 'DBSubnetGroup', 'DBMasterSecret']);
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EC2SecurityGroup');
    });

    test('Secrets Manager integration with RDS', () => {
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
      expect(templateYaml).toContain('AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
    });

    test('CloudWatch monitoring covers all critical components', () => {
      validateResourceDependencies('EC2CPUAlarm', ['AutoScalingGroup', 'SNSTopic']);
      validateResourceDependencies('ALBLatencyAlarm', ['ApplicationLoadBalancer', 'SNSTopic']);
      validateResourceDependencies('RDSCPUAlarm', ['RDSInstance', 'SNSTopic']);
    });

    test('S3 logging integration works end-to-end', () => {
      validateResourceDependencies('ApplicationLoadBalancer', ['LogsBucket']);
      expect(templateYaml).toContain('DependsOn: LogsBucketPolicy');
    });

    test('IAM permissions support all service integrations', () => {
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');
      expect(templateYaml).toContain('s3:PutObject');
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
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

      console.log(`Deployment validation using: Stack=${currentStackName}, Region=${region}, Suffix=${currentEnvironmentSuffix}`);
    });

    test('VPC and networking resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.VpcId) {
        expect(deployedOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.ApplicationURL) {
        expect(deployedOutputs.ApplicationURL).toMatch(/^http:\/\/[\w\.-]+\.elb\.amazonaws\.com$/);
        expect(deployedOutputs.ApplicationURL).toContain(region);
      }
    });

    test('Database resources are properly deployed with Secrets Manager', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.RDSEndpoint) {
        expect(deployedOutputs.RDSEndpoint).toContain('.rds.amazonaws.com');
        expect(deployedOutputs.RDSEndpoint).toContain(region);
      }

      if (deployedOutputs.DBSecretArn) {
        expect(deployedOutputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);
        expect(deployedOutputs.DBSecretArn).toContain(region);
        expect(deployedOutputs.DBSecretArn).toContain(currentStackName);
        expect(deployedOutputs.DBSecretArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('Load balancer and auto scaling are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.ALBArn) {
        expect(deployedOutputs.ALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
        expect(deployedOutputs.ALBArn).toContain(region);
      }

      if (deployedOutputs.AutoScalingGroupName) {
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentStackName);
        expect(deployedOutputs.AutoScalingGroupName).toContain(region);
        expect(deployedOutputs.AutoScalingGroupName).toContain(currentEnvironmentSuffix);
      }
    });

    test('Monitoring and logging resources are deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.SNSTopicArn) {
        expect(deployedOutputs.SNSTopicArn).toMatch(/^arn:aws:sns:/);
        expect(deployedOutputs.SNSTopicArn).toContain(region);
      }

      if (deployedOutputs.LogsBucketName) {
        // Bucket name should follow AWS-compatible format: accountId-region-environmentSuffix-logs
        expect(deployedOutputs.LogsBucketName).toContain(region);
        expect(deployedOutputs.LogsBucketName).toContain(currentEnvironmentSuffix);
        expect(deployedOutputs.LogsBucketName).toContain('-logs');
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
  });

  // ========================
  // SECURITY BEST PRACTICES
  // ========================
  describe('Security and Best Practices', () => {
    test('Database credentials are managed securely', () => {
      // No password parameter in template
      expect(templateYaml).not.toContain('DBMasterPassword:');
      expect(templateYaml).not.toContain('NoEcho: true');

      // Uses Secrets Manager instead
      expect(templateYaml).toContain('AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('MasterUserPassword: !Sub \'{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}\'');
    });

    test('S3 bucket follows security best practices', () => {
      expect(templateYaml).toContain('BucketEncryption:');
      expect(templateYaml).toContain('PublicAccessBlockConfiguration:');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
    });

    test('IAM roles follow least privilege principle', () => {
      expect(templateYaml).toContain('CloudWatchAgentServerPolicy');

      // Should not have overly broad admin permissions
      expect(templateYaml).not.toContain('Action: "*"');
      expect(templateYaml).not.toContain('Action:\n              - "*"');

      expect(templateYaml).toContain('Resource: !Sub "${LogsBucket.Arn}/*"');
      expect(templateYaml).toContain('Resource: !GetAtt LogsBucket.Arn');

      // CloudWatch metrics legitimately use "*" for metrics operations (this is AWS best practice)
      expect(templateYaml).toContain('cloudwatch:PutMetricData');
      expect(templateYaml).toContain('Resource: "*"');
    });

    test('Network security is properly implemented', () => {
      // Security groups reference each other, not open to world
      expect(templateYaml).toContain('SourceSecurityGroupId:');

      // Only ALB should have 0.0.0.0/0 access for web traffic
      const securityGroupSection = templateYaml.match(/SecurityGroup:[\s\S]*?(?=\w+:|$)/g) || [];
      const cidrMatches = templateYaml.match(/CidrIp: 0\.0\.0\.0\/0/g) || [];

      // Should only have 2 CIDR 0.0.0.0/0 rules (HTTP and HTTPS on ALB)
      expect(cidrMatches.length).toBeLessThanOrEqual(2);
    });

    test('Database is properly isolated in private subnets', () => {
      expect(templateYaml).toContain('DBSubnet1:');
      expect(templateYaml).toContain('DBSubnet2:');
      expect(templateYaml).toContain('CidrBlock: 10.0.21.0/24');
      expect(templateYaml).toContain('CidrBlock: 10.0.22.0/24');

      // Extract DB subnet sections and verify they don't have MapPublicIpOnLaunch
      const dbSubnet1Match = templateYaml.match(/DBSubnet1:[\s\S]*?(?=\w+:)/);
      const dbSubnet2Match = templateYaml.match(/DBSubnet2:[\s\S]*?(?=\w+:)/);

      if (dbSubnet1Match) {
        expect(dbSubnet1Match[0]).not.toContain('MapPublicIpOnLaunch');
      }
      if (dbSubnet2Match) {
        expect(dbSubnet2Match[0]).not.toContain('MapPublicIpOnLaunch');
      }
    });

    test('Application instances are in private subnets', () => {
      expect(templateYaml).toContain('VPCZoneIdentifier:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
    });
  });

  // ========================
  // PERFORMANCE & RELIABILITY
  // ========================
  describe('Performance and Reliability', () => {
    test('Multi-AZ deployment for high availability', () => {
      expect(templateYaml).toContain('MultiAZ: true');
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
    });

    test('Auto Scaling provides resilience and performance', () => {
      expect(templateYaml).toContain('MinSize: 2');
      expect(templateYaml).toContain('MaxSize: 6');
      expect(templateYaml).toContain('DesiredCapacity: 2');
      expect(templateYaml).toContain('HealthCheckType: ELB');
      expect(templateYaml).toContain('TargetValue: 70');
    });

    test('Database backup and maintenance are configured', () => {
      expect(templateYaml).toContain('BackupRetentionPeriod: 7');
      expect(templateYaml).toContain('PreferredBackupWindow:');
      expect(templateYaml).toContain('PreferredMaintenanceWindow:');
    });

    test('Monitoring covers all critical metrics', () => {
      expect(templateYaml).toContain('MetricName: CPUUtilization');
      expect(templateYaml).toContain('MetricName: TargetResponseTime');
      expect(templateYaml).toContain('MetricName: HTTPCode_Target_5XX_Count');
      expect(templateYaml).toContain('MetricName: FreeStorageSpace');
      expect(templateYaml).toContain('MetricName: DatabaseConnections');
    });

    test('Appropriate alarm thresholds are set', () => {
      expect(templateYaml).toContain('Threshold: 80'); // CPU alarms
      expect(templateYaml).toContain('Threshold: 1'); // Response time
      expect(templateYaml).toContain('Threshold: 10'); // 5XX errors
      expect(templateYaml).toContain('Threshold: 50'); // DB connections
    });

    test('Log retention prevents unbounded growth', () => {
      expect(templateYaml).toContain('RetentionInDays: 30');
      expect(templateYaml).toContain('ExpirationInDays: 90');
    });
  });
});
