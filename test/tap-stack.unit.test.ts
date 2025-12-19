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

        // Extract stack name and environment suffix from actual deployed resource names
        if (deployedOutputs.EC2RoleName) {
          console.log('Raw EC2RoleName:', deployedOutputs.EC2RoleName);
          const roleParts = deployedOutputs.EC2RoleName.split('-');
          console.log('EC2RoleName parts:', roleParts);

          // Role name pattern: TapStackpr7676-us-east-1-pr4056-ec2-role
          // Stack name is first part, environment suffix is the pr-part that's NOT in stack name
          currentStackName = roleParts[0] || 'TapStack';

          // Find environment suffix: look for pr pattern that's separate from stack name
          const envSuffixIndex = roleParts.findIndex((part: string, index: number) =>
            index > 0 && part.match(/^pr\d+$/) // Skip first part (stack name) and find pr pattern
          );
          if (envSuffixIndex >= 0) {
            currentEnvironmentSuffix = roleParts[envSuffixIndex];
          }
        } else if (deployedOutputs.S3BucketArn) {
          // Try to extract from S3 bucket ARN: arn:aws:s3:::119612786553-us-east-1-pr4056-s3-bucket
          console.log('Raw S3BucketArn:', deployedOutputs.S3BucketArn);
          const bucketName = deployedOutputs.S3BucketArn.split(':::')[1];
          const bucketParts = bucketName.split('-');
          console.log('S3Bucket name parts:', bucketParts);
          // The suffix should be the third part (after accountid and region)
          if (bucketParts.length >= 3) {
            currentEnvironmentSuffix = bucketParts[2];
          }
        }

        // Extract environment from actual deployment outputs first
        if (deployedOutputs.Environment) {
          currentEnvironment = deployedOutputs.Environment;
          console.log('Environment from outputs:', currentEnvironment);
        } else if (deployedOutputs.VPCCidr) {
          console.log('Raw VPCCidr:', deployedOutputs.VPCCidr);
          // VPC CIDR fallback (this logic was incorrect for the actual deployment)
          // The actual environment should come from the Environment output
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

  // Helper function to check resource dependencies
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // Helper function to validate CIDR blocks don't overlap
  const validateCidrNonOverlapping = (cidr1: string, cidr2: string) => {
    expect(cidr1).not.toBe(cidr2);
  };

  // Helper function to validate environment-specific configurations
  const validateEnvironmentConfiguration = (environment: string, expectedConfig: any) => {
    const envPattern = new RegExp(`${environment}:[\\s\\S]*?DBInstanceClass: '${expectedConfig.DBInstanceClass}'`);
    expect(templateYaml).toMatch(envPattern);
  };

  // =================
  // BASIC VALIDATION
  // =================
  test('Template has required sections', () => {
    expect(templateYaml).toContain('AWSTemplateFormatVersion:');
    expect(templateYaml).toContain('Description:');
    expect(templateYaml).toContain('Parameters:');
    expect(templateYaml).toContain('Mappings:');
    expect(templateYaml).toContain('Resources:');
    expect(templateYaml).toContain('Outputs:');
  });

  test('Template description indicates production-ready multi-AZ infrastructure', () => {
    expect(templateYaml).toContain('Production-ready');
    expect(templateYaml).toContain('multi-AZ');
    expect(templateYaml).toContain('web application infrastructure');
    expect(templateYaml).toContain('ALB');
    expect(templateYaml).toContain('ASG');
    expect(templateYaml).toContain('RDS');
    expect(templateYaml).toContain('S3');
  });

  test('Template uses proper YAML format and CloudFormation functions', () => {
    // Should contain YAML intrinsic functions
    expect(templateYaml).toContain('!Ref');
    expect(templateYaml).toContain('!Sub');
    expect(templateYaml).toContain('!GetAtt');
    expect(templateYaml).toContain('!FindInMap');

    // Verify template starts with proper CloudFormation version
    expect(templateYaml).toMatch(/^AWSTemplateFormatVersion:\s*'2010-09-09'/);
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section', () => {
    test('Core deployment parameters are properly defined', () => {
      const coreParams = [
        'EnvironmentSuffix',
        'ProjectName',
        'Environment',
        'AllowedCidr',
        'InstanceType',
        'VpcCidrBlock',
        'DBName',
        'DBUsername',
        'SourceAmiIdSsmParameter'
      ];

      coreParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toMatch(new RegExp(`${param}:[\\s\\S]*?Description:`));
      });
    });

    test('Environment parameter has correct allowed values', () => {
      expect(templateYaml).toMatch(/Environment:[\s\S]*?AllowedValues:[\s\S]*?- dev[\s\S]*?- test[\s\S]*?- prod/);
      expect(templateYaml).toMatch(/Environment:[\s\S]*?Default: 'prod'/);
    });

    test('EnvironmentSuffix has proper validation pattern', () => {
      expect(templateYaml).toMatch(/EnvironmentSuffix:[\s\S]*?AllowedPattern: '\^\[a-zA-Z0-9\\-\]\*\$'/);
      expect(templateYaml).toMatch(/EnvironmentSuffix:[\s\S]*?Default: "pr4056"/);
    });

    test('VPC CIDR parameter has CIDR validation pattern', () => {
      expect(templateYaml).toMatch(/VpcCidrBlock:[\s\S]*?AllowedPattern:/);
      expect(templateYaml).toContain('([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])');
    });

    test('Instance type parameter has allowed values', () => {
      const allowedInstanceTypes = ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge'];
      allowedInstanceTypes.forEach(instanceType => {
        expect(templateYaml).toMatch(new RegExp(`- ${instanceType}`));
      });
    });

    test('SSM parameter for AMI ID is properly configured', () => {
      expect(templateYaml).toMatch(/SourceAmiIdSsmParameter:[\s\S]*?Default: \/aws\/service\/ami-amazon-linux-latest\/amzn2-ami-hvm-x86_64-gp2/);
      expect(templateYaml).toMatch(/SourceAmiIdSsmParameter:[\s\S]*?Description:.*AMI ID.*template.*hard-coded/);
    });

    test('Database parameters have proper validation', () => {
      expect(templateYaml).toMatch(/DBName:[\s\S]*?AllowedPattern: '\[a-zA-Z\]\[a-zA-Z0-9\]\*'/);
      expect(templateYaml).toMatch(/DBUsername:[\s\S]*?NoEcho: true/);
      expect(templateYaml).toMatch(/DBUsername:[\s\S]*?AllowedPattern: '\[a-zA-Z\]\[a-zA-Z0-9\]\*'/);
    });
  });

  // ==========
  // MAPPINGS
  // ==========
  describe('Mappings Section', () => {
    test('DatabaseEngineMap contains MySQL and PostgreSQL configurations', () => {
      expect(templateYaml).toMatch(/DatabaseEngineMap:[\s\S]*?mysql:[\s\S]*?Engine: 'mysql'/);
      expect(templateYaml).toMatch(/DatabaseEngineMap:[\s\S]*?mysql:[\s\S]*?EngineVersion: '8.0'/);
      expect(templateYaml).toMatch(/DatabaseEngineMap:[\s\S]*?mysql:[\s\S]*?Port: 3306/);
      expect(templateYaml).toMatch(/DatabaseEngineMap:[\s\S]*?postgres:[\s\S]*?Engine: 'postgres'/);
      expect(templateYaml).toMatch(/DatabaseEngineMap:[\s\S]*?postgres:[\s\S]*?Port: 5432/);
    });

    test('EnvironmentMap contains all three environments with proper configurations', () => {
      // Dev environment - cost optimized
      validateEnvironmentConfiguration('dev', {
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        BackupRetentionPeriod: 1,
        MultiAZ: false
      });

      // Test environment - moderate resources
      validateEnvironmentConfiguration('test', {
        DBInstanceClass: 'db.t3.small',
        AllocatedStorage: '50',
        BackupRetentionPeriod: 3,
        MultiAZ: false
      });

      // Production environment - high availability
      validateEnvironmentConfiguration('prod', {
        DBInstanceClass: 'db.t3.medium',
        AllocatedStorage: '100',
        BackupRetentionPeriod: 7,
        MultiAZ: true
      });
    });

    test('Environment configurations follow cost optimization pattern', () => {
      expect(templateYaml).toMatch(/dev:[\s\S]*?MultiAZ: false/);
      expect(templateYaml).toMatch(/test:[\s\S]*?MultiAZ: false/);
      expect(templateYaml).toMatch(/prod:[\s\S]*?MultiAZ: true/);
    });
  });

  // ==================
  // SECRETS MANAGEMENT
  // ==================
  describe('Secrets Management', () => {
    test('DBMasterSecret is properly configured with auto-generated password', () => {
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?Type: AWS::SecretsManager::Secret/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?GenerateSecretString:/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?SecretStringTemplate: !Sub '\{"username": "\${DBUsername}"\}'/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?GenerateStringKey: 'password'/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?PasswordLength: 16/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?ExcludePunctuation: true/);
    });

    test('Secret follows dynamic naming convention', () => {
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-db-master-secret'/);
    });

    test('Secret has proper tags for compliance', () => {
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?Tags:[\s\S]*?Key: Project[\s\S]*?Value: !Ref ProjectName/);
      expect(templateYaml).toMatch(/DBMasterSecret:[\s\S]*?Tags:[\s\S]*?Key: Environment[\s\S]*?Value: !Ref Environment/);
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Core Networking Resources', () => {
    test('VPC is properly configured with DNS support', () => {
      expect(templateYaml).toMatch(/VPC:[\s\S]*?Type: AWS::EC2::VPC/);
      expect(templateYaml).toMatch(/VPC:[\s\S]*?EnableDnsHostnames: true/);
      expect(templateYaml).toMatch(/VPC:[\s\S]*?EnableDnsSupport: true/);
      expect(templateYaml).toMatch(/VPC:[\s\S]*?CidrBlock: !Ref VpcCidrBlock/);
    });

    test('Internet Gateway is properly configured and attached', () => {
      expect(templateYaml).toMatch(/InternetGateway:[\s\S]*?Type: AWS::EC2::InternetGateway/);
      expect(templateYaml).toMatch(/AttachGateway:[\s\S]*?Type: AWS::EC2::VPCGatewayAttachment/);
      expect(templateYaml).toMatch(/AttachGateway:[\s\S]*?InternetGatewayId: !Ref InternetGateway/);
      expect(templateYaml).toMatch(/AttachGateway:[\s\S]*?VpcId: !Ref VPC/);
    });

    test('Public subnets are configured correctly', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];

      publicSubnets.forEach(subnet => {
        expect(templateYaml).toMatch(new RegExp(`${subnet}:[\\s\\S]*?Type: AWS::EC2::Subnet`));
        expect(templateYaml).toMatch(new RegExp(`${subnet}:[\\s\\S]*?VpcId: !Ref VPC`));
        expect(templateYaml).toMatch(new RegExp(`${subnet}:[\\s\\S]*?MapPublicIpOnLaunch: true`));
      });
    });

    test('Private subnets are configured correctly', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2'];

      privateSubnets.forEach(subnet => {
        expect(templateYaml).toMatch(new RegExp(`${subnet}:[\\s\\S]*?Type: AWS::EC2::Subnet`));
        expect(templateYaml).toMatch(new RegExp(`${subnet}:[\\s\\S]*?VpcId: !Ref VPC`));
        // Private subnets should NOT have MapPublicIpOnLaunch: true
        expect(templateYaml).not.toMatch(new RegExp(`${subnet}:[\\s\\S]*?MapPublicIpOnLaunch: true`));
      });
    });

    test('Subnets are distributed across availability zones', () => {
      expect(templateYaml).toMatch(/PublicSubnet1:[\s\S]*?AvailabilityZone: !Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PublicSubnet2:[\s\S]*?AvailabilityZone: !Select \[1, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PrivateSubnet1:[\s\S]*?AvailabilityZone: !Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PrivateSubnet2:[\s\S]*?AvailabilityZone: !Select \[1, !GetAZs ''\]/);
    });

    test('All subnets have proper naming and tagging', () => {
      const subnetConfigs = [
        { name: 'PublicSubnet1', naming: 'public-subnet-1' },
        { name: 'PublicSubnet2', naming: 'public-subnet-2' },
        { name: 'PrivateSubnet1', naming: 'private-subnet-1' },
        { name: 'PrivateSubnet2', naming: 'private-subnet-2' }
      ];

      subnetConfigs.forEach(subnet => {
        expect(templateYaml).toMatch(new RegExp(`${subnet.name}:[\\s\\S]*?Key: Name[\\s\\S]*?Value: !Sub '\\$\\{AWS::StackName\\}-\\$\\{AWS::Region\\}-\\$\\{EnvironmentSuffix\\}-${subnet.naming}'`));
      });
    });
  });

  // ==================
  // NAT GATEWAYS & EIP
  // ==================
  describe('NAT Gateways and Elastic IPs', () => {
    test('NAT Gateways are properly configured for high availability', () => {
      const natGateways = ['NATGateway1', 'NATGateway2'];

      natGateways.forEach((natGateway, index) => {
        expect(templateYaml).toMatch(new RegExp(`${natGateway}:[\\s\\S]*?Type: AWS::EC2::NatGateway`));
        expect(templateYaml).toMatch(new RegExp(`${natGateway}:[\\s\\S]*?SubnetId: !Ref PublicSubnet${index + 1}`));
        expect(templateYaml).toMatch(new RegExp(`${natGateway}:[\\s\\S]*?AllocationId: !GetAtt ${natGateway}EIP.AllocationId`));
      });
    });

    test('Elastic IPs are properly configured for NAT Gateways', () => {
      const eips = ['NATGateway1EIP', 'NATGateway2EIP'];

      eips.forEach(eip => {
        expect(templateYaml).toMatch(new RegExp(`${eip}:[\\s\\S]*?Type: AWS::EC2::EIP`));
        expect(templateYaml).toMatch(new RegExp(`${eip}:[\\s\\S]*?Domain: vpc`));
        expect(templateYaml).toMatch(new RegExp(`${eip}:[\\s\\S]*?DependsOn: AttachGateway`));
      });
    });
  });

  // ==================
  // ROUTE TABLES
  // ==================
  describe('Route Tables and Routing', () => {
    test('Public route table is configured with internet access', () => {
      expect(templateYaml).toMatch(/PublicRouteTable:[\s\S]*?Type: AWS::EC2::RouteTable/);
      expect(templateYaml).toMatch(/PublicRouteTable:[\s\S]*?VpcId: !Ref VPC/);

      expect(templateYaml).toMatch(/PublicRoute:[\s\S]*?Type: AWS::EC2::Route/);
      expect(templateYaml).toMatch(/PublicRoute:[\s\S]*?DestinationCidrBlock: '0.0.0.0\/0'/);
      expect(templateYaml).toMatch(/PublicRoute:[\s\S]*?GatewayId: !Ref InternetGateway/);
    });

    test('Private route tables are configured with NAT Gateway access', () => {
      const privateRouteTables = ['PrivateRouteTable1', 'PrivateRouteTable2'];
      const privateRoutes = ['PrivateRoute1', 'PrivateRoute2'];

      privateRouteTables.forEach((routeTable, index) => {
        expect(templateYaml).toMatch(new RegExp(`${routeTable}:[\\s\\S]*?Type: AWS::EC2::RouteTable`));
        expect(templateYaml).toMatch(new RegExp(`${routeTable}:[\\s\\S]*?VpcId: !Ref VPC`));

        expect(templateYaml).toMatch(new RegExp(`${privateRoutes[index]}:[\\s\\S]*?NatGatewayId: !Ref NATGateway${index + 1}`));
      });
    });

    test('Subnet route table associations are properly configured', () => {
      const associations = [
        { subnet: 'PublicSubnet1', routeTable: 'PublicRouteTable', association: 'SubnetRouteTableAssociationPublic1' },
        { subnet: 'PublicSubnet2', routeTable: 'PublicRouteTable', association: 'SubnetRouteTableAssociationPublic2' },
        { subnet: 'PrivateSubnet1', routeTable: 'PrivateRouteTable1', association: 'SubnetRouteTableAssociationPrivate1' },
        { subnet: 'PrivateSubnet2', routeTable: 'PrivateRouteTable2', association: 'SubnetRouteTableAssociationPrivate2' }
      ];

      associations.forEach(assoc => {
        expect(templateYaml).toMatch(new RegExp(`${assoc.association}:[\\s\\S]*?Type: AWS::EC2::SubnetRouteTableAssociation`));
        expect(templateYaml).toMatch(new RegExp(`${assoc.association}:[\\s\\S]*?SubnetId: !Ref ${assoc.subnet}`));
        expect(templateYaml).toMatch(new RegExp(`${assoc.association}:[\\s\\S]*?RouteTableId: !Ref ${assoc.routeTable}`));
      });
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups Configuration', () => {
    test('ALB Security Group allows HTTP and HTTPS traffic', () => {
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?VpcId: !Ref VPC/);

      // Should allow HTTP (80) and HTTPS (443) from anywhere
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?FromPort: 80[\s\S]*?ToPort: 80/);
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?FromPort: 443[\s\S]*?ToPort: 443/);
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?CidrIp: !Ref AllowedCidr/);
    });

    test('EC2 Security Group follows least privilege principle', () => {
      expect(templateYaml).toMatch(/EC2SecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/EC2SecurityGroup:[\s\S]*?VpcId: !Ref VPC/);

      // Should allow HTTP (80) from ALB Security Group
      expect(templateYaml).toMatch(/EC2SecurityGroup:[\s\S]*?FromPort: 80[\s\S]*?ToPort: 80/);
      expect(templateYaml).toMatch(/EC2SecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref ALBSecurityGroup/);
    }); test('RDS Security Group restricts access to database port only', () => {
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?VpcId: !Ref VPC/);

      // Should allow MySQL port 3306 from EC2 security group
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?FromPort: 3306[\s\S]*?ToPort: 3306/);
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref EC2SecurityGroup/);
    });

    test('Security Groups have proper naming convention', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];

      securityGroups.forEach(sg => {
        expect(templateYaml).toMatch(new RegExp(`${sg}:[\\s\\S]*?Name[\\s\\S]*?Value: !Sub '\\$\\{AWS::StackName\\}-\\$\\{AWS::Region\\}-\\$\\{EnvironmentSuffix\\}-${sg.toLowerCase().replace('securitygroup', '-sg')}'`));
      });
    });
  });

  // =================
  // IAM ROLES
  // =================
  describe('IAM Roles and Instance Profiles', () => {
    test('EC2 Role has proper trust policy and permissions', () => {
      expect(templateYaml).toMatch(/EC2Role:[\s\S]*?Type: AWS::IAM::Role/);
      expect(templateYaml).toMatch(/EC2Role:[\s\S]*?AssumeRolePolicyDocument:[\s\S]*?ec2.amazonaws.com/);
      expect(templateYaml).toMatch(/EC2Role:[\s\S]*?sts:AssumeRole/);
    });

    test('EC2 Role has CloudWatch permissions', () => {
      expect(templateYaml).toMatch(/EC2Role:[\s\S]*?ManagedPolicyArns:[\s\S]*?CloudWatchAgentServerPolicy/);
    });

    test('EC2 Instance Profile is properly configured', () => {
      expect(templateYaml).toMatch(/EC2InstanceProfile:[\s\S]*?Type: AWS::IAM::InstanceProfile/);
      expect(templateYaml).toMatch(/EC2InstanceProfile:[\s\S]*?Roles:[\s\S]*?- !Ref EC2Role/);
    });

    test('IAM resources follow dynamic naming convention', () => {
      expect(templateYaml).toMatch(/EC2Role:[\s\S]*?RoleName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-ec2-role'/);
      expect(templateYaml).toMatch(/EC2InstanceProfile:[\s\S]*?InstanceProfileName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-ec2-profile'/);
    });
  });

  // =================
  // STORAGE RESOURCES
  // =================
  describe('S3 Storage Configuration', () => {
    test('S3 Bucket is configured with security best practices', () => {
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?Type: AWS::S3::Bucket/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BucketEncryption:/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?SSEAlgorithm: AES256/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?VersioningConfiguration:/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?Status: Enabled/);
    });

    test('S3 Bucket has public access blocked', () => {
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?PublicAccessBlockConfiguration:/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BlockPublicAcls: true/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BlockPublicPolicy: true/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?IgnorePublicAcls: true/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?RestrictPublicBuckets: true/);
    });

    test('S3 Bucket follows global naming convention', () => {
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BucketName: !Sub '\${AWS::AccountId}-\${AWS::Region}-\${EnvironmentSuffix}-s3-bucket'/);
    });
  });

  // =================
  // DATABASE RESOURCES
  // =================
  describe('RDS Database Configuration', () => {
    test('Database Subnet Group spans multiple AZs', () => {
      expect(templateYaml).toMatch(/DBSubnetGroup:[\s\S]*?Type: AWS::RDS::DBSubnetGroup/);
      expect(templateYaml).toMatch(/DBSubnetGroup:[\s\S]*?SubnetIds:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);
    });

    test('RDS Instance uses dynamic configuration from mappings', () => {
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?Type: AWS::RDS::DBInstance/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?DBInstanceClass: !FindInMap \[EnvironmentMap, !Ref Environment, DBInstanceClass\]/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?Engine: !FindInMap \[DatabaseEngineMap, mysql, Engine\]/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?EngineVersion: !FindInMap \[DatabaseEngineMap, mysql, EngineVersion\]/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?AllocatedStorage: !FindInMap \[EnvironmentMap, !Ref Environment, AllocatedStorage\]/);
    });

    test('RDS Instance uses Secrets Manager for password', () => {
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?MasterUserPassword: !Sub '\{\{resolve:secretsmanager:\${DBMasterSecret}:SecretString:password\}\}'/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?MasterUsername: !Ref DBUsername/);
    });

    test('RDS Instance has proper security and backup configuration', () => {
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?StorageEncrypted: true/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?MultiAZ: !FindInMap \[EnvironmentMap, !Ref Environment, MultiAZ\]/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?BackupRetentionPeriod: !FindInMap \[EnvironmentMap, !Ref Environment, BackupRetentionPeriod\]/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?VPCSecurityGroups:[\s\S]*?- !Ref RDSSecurityGroup/);
    });
  });

  // =================
  // COMPUTE RESOURCES
  // =================
  describe('Compute Resources - ALB, Launch Template, and Auto Scaling', () => {
    test('Application Load Balancer is properly configured', () => {
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Type: AWS::ElasticLoadBalancingV2::LoadBalancer/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Type: application/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Scheme: internet-facing/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?SecurityGroups:[\s\S]*?- !Ref ALBSecurityGroup/);
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Subnets:[\s\S]*?- !Ref PublicSubnet1[\s\S]*?- !Ref PublicSubnet2/);
    });

    test('Target Group is configured for health checks', () => {
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Type: AWS::ElasticLoadBalancingV2::TargetGroup/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Port: 80/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Protocol: HTTP/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?VpcId: !Ref VPC/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?HealthCheckPath: \//);
    });

    test('Launch Template uses dynamic AMI resolution', () => {
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?Type: AWS::EC2::LaunchTemplate/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?ImageId: !Sub '\{\{resolve:ssm:\${SourceAmiIdSsmParameter}\}\}'/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?InstanceType: !Ref InstanceType/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?IamInstanceProfile:[\s\S]*?Arn: !GetAtt EC2InstanceProfile.Arn/);
      expect(templateYaml).toMatch(/LaunchTemplate:[\s\S]*?SecurityGroupIds:[\s\S]*?- !Ref EC2SecurityGroup/);
    });

    test('Auto Scaling Group is configured for high availability', () => {
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?Type: AWS::AutoScaling::AutoScalingGroup/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?LaunchTemplate:[\s\S]*?LaunchTemplateId: !Ref LaunchTemplate/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?VPCZoneIdentifier:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?TargetGroupARNs:[\s\S]*?- !Ref TargetGroup/);
    });

    test('Scaling policies are configured for CPU-based scaling', () => {
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?Type: AWS::AutoScaling::ScalingPolicy/);
      expect(templateYaml).toMatch(/ScaleDownPolicy:[\s\S]*?Type: AWS::AutoScaling::ScalingPolicy/);
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?AutoScalingGroupName: !Ref AutoScalingGroup/);
      expect(templateYaml).toMatch(/ScaleDownPolicy:[\s\S]*?AutoScalingGroupName: !Ref AutoScalingGroup/);
    });
  });

  // =================
  // MONITORING & LOGGING
  // =================
  describe('CloudWatch Monitoring and Logging', () => {
    test('CloudWatch Log Groups are properly configured', () => {
      expect(templateYaml).toMatch(/ApplicationLogGroup:[\s\S]*?Type: AWS::Logs::LogGroup/);
      expect(templateYaml).toMatch(/RDSLogGroup:[\s\S]*?Type: AWS::Logs::LogGroup/);
      expect(templateYaml).toMatch(/ApplicationLogGroup:[\s\S]*?RetentionInDays: 7/);
      expect(templateYaml).toMatch(/RDSLogGroup:[\s\S]*?RetentionInDays: 7/);
    });

    test('CloudWatch Alarms are configured for scaling triggers', () => {
      expect(templateYaml).toMatch(/CPUAlarmHigh:[\s\S]*?Type: AWS::CloudWatch::Alarm/);
      expect(templateYaml).toMatch(/CPUAlarmLow:[\s\S]*?Type: AWS::CloudWatch::Alarm/);
      expect(templateYaml).toMatch(/CPUAlarmHigh:[\s\S]*?MetricName: CPUUtilization/);
      expect(templateYaml).toMatch(/CPUAlarmHigh:[\s\S]*?Threshold: 70/);
      expect(templateYaml).toMatch(/CPUAlarmLow:[\s\S]*?Threshold: 30/);
    });

    test('Alarms are connected to scaling policies', () => {
      expect(templateYaml).toMatch(/CPUAlarmHigh:[\s\S]*?AlarmActions:[\s\S]*?- !Ref ScaleUpPolicy/);
      expect(templateYaml).toMatch(/CPUAlarmLow:[\s\S]*?AlarmActions:[\s\S]*?- !Ref ScaleDownPolicy/);
    });
  });

  // =================
  // OUTPUTS VALIDATION
  // =================
  describe('Outputs Section - Comprehensive Resource Export', () => {
    test('Core infrastructure outputs are defined', () => {
      const coreOutputs = [
        'LoadBalancerURL',
        'S3BucketName',
        'RDSEndpoint',
        'DBMasterSecretArn',
        'DBMasterSecretName',
        'VPCId',
        'VPCCidr'
      ];

      coreOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Description:`));
        // Export blocks removed for LocalStack compatibility
        // expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Export:`));
      });
    });

    test('Networking outputs provide comprehensive subnet information', () => {
      const networkingOutputs = [
        'InternetGatewayId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NATGateway1Id',
        'NATGateway2Id',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id'
      ];

      networkingOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        // Export blocks removed for LocalStack compatibility
        // expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Export:`));
      });
    });

    test('Security and IAM outputs are available for reference', () => {
      const securityOutputs = [
        'ALBSecurityGroupId',
        'EC2SecurityGroupId',
        'RDSSecurityGroupId',
        'EC2RoleArn',
        'EC2RoleName',
        'EC2InstanceProfileArn',
        'EC2InstanceProfileName'
      ];

      securityOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        // Export blocks removed for LocalStack compatibility
        // expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Export:`));
      });
    });

    test('Compute and database outputs provide resource identifiers', () => {
      const computeDbOutputs = [
        'ApplicationLoadBalancerArn',
        'ApplicationLoadBalancerDNSName',
        'TargetGroupArn',
        'EC2LaunchTemplateId',
        'AutoScalingGroupName',
        'RDSInstanceId',
        'RDSInstanceArn',
        'RDSPort',
        'DBSubnetGroupName'
      ];

      computeDbOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        // Export blocks removed for LocalStack compatibility
        // expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Export:`));
      });
    });

    test('Outputs follow consistent export naming convention', () => {
      // Note: Export blocks were removed for LocalStack Community compatibility
      // LocalStack Community has limitations with cross-stack exports
      // For LocalStack deployments, outputs are used directly without exports
      const exportNamePattern = /Export:[\s\S]*?Name: !Sub '\${AWS::StackName}-\${Environment}-\${EnvironmentSuffix}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportNamePattern) || [];

      // LocalStack compatibility: Exports are optional
      // If exports exist, verify they follow the convention
      if (exportMatches.length > 0) {
        expect(exportMatches.length).toBeGreaterThan(20);
      } else {
        // For LocalStack: Just verify outputs exist (checked in other tests)
        expect(templateYaml).toContain('Outputs:');
      }
    });

    test('Project and environment information outputs are available', () => {
      const metaOutputs = ['ProjectName', 'Environment', 'EnvironmentSuffix'];

      metaOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toMatch(new RegExp(`${output}:[\\s\\S]*?Value: !Ref ${output}`));
      });
    });
  });

  // ====================
  // CROSS-ACCOUNT COMPATIBILITY
  // ====================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      // Should not contain account IDs outside of documentation/comments
      const accountIdPattern = /[^:]\d{12}[^'\s]/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic references for AWS pseudo parameters', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('AMI resolution is dynamic via SSM parameter', () => {
      expect(templateYaml).toMatch(/ImageId: !Sub '\{\{resolve:ssm:\${SourceAmiIdSsmParameter}\}\}'/);
      expect(templateYaml).not.toMatch(/ImageId: ami-[a-f0-9]+/);
    });

    test('All resource names are parameterized', () => {
      expect(templateYaml).toMatch(/Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/);
      expect(templateYaml).not.toMatch(/Name: '[^$]*TapStack[^$]*'/);
    });

    test('Availability zones use dynamic resolution', () => {
      expect(templateYaml).toMatch(/AvailabilityZone: !Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/AvailabilityZone: !Select \[1, !GetAZs ''\]/);
      expect(templateYaml).not.toMatch(/AvailabilityZone: [a-z0-9-]+[a-z]/);
    });
  });

  // ======================
  // SECURITY BEST PRACTICES
  // ======================
  describe('Security Best Practices Implementation', () => {
    test('Network segmentation follows multi-tier architecture', () => {
      // Public tier - only ALB and NAT Gateways
      expect(templateYaml).toMatch(/PublicSubnet[12]:[\s\S]*?MapPublicIpOnLaunch: true/);

      // Private tier - application servers with no public IPs
      expect(templateYaml).not.toMatch(/PrivateSubnet[12]:[\s\S]*?MapPublicIpOnLaunch: true/);
    });

    test('Database tier has restricted access', () => {
      // RDS should only allow access from EC2 security group
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref EC2SecurityGroup/);
      expect(templateYaml).not.toMatch(/RDSSecurityGroup:[\s\S]*?CidrIp: '0.0.0.0\/0'/);
    });

    test('Secrets are managed properly', () => {
      // Database password should use Secrets Manager
      expect(templateYaml).toMatch(/MasterUserPassword: !Sub '\{\{resolve:secretsmanager:\${DBMasterSecret}:SecretString:password\}\}'/);
      expect(templateYaml).not.toMatch(/MasterUserPassword: !Ref DBPassword/);
    });

    test('Storage encryption is enabled', () => {
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BucketEncryption:/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?StorageEncrypted: true/);
    });

    test('Public access is properly restricted', () => {
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BlockPublicAcls: true/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?BlockPublicPolicy: true/);
      expect(templateYaml).toMatch(/S3Bucket:[\s\S]*?RestrictPublicBuckets: true/);
    });
  });

  // ======================
  // HIGH AVAILABILITY
  // ======================
  describe('High Availability Configuration', () => {
    test('Resources are distributed across multiple availability zones', () => {
      // Subnets across 2 AZs
      expect(templateYaml).toMatch(/PublicSubnet1:[\s\S]*?AvailabilityZone: !Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PublicSubnet2:[\s\S]*?AvailabilityZone: !Select \[1, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PrivateSubnet1:[\s\S]*?AvailabilityZone: !Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/PrivateSubnet2:[\s\S]*?AvailabilityZone: !Select \[1, !GetAZs ''\]/);
    });

    test('NAT Gateways provide redundancy for each AZ', () => {
      expect(templateYaml).toMatch(/NATGateway1:[\s\S]*?SubnetId: !Ref PublicSubnet1/);
      expect(templateYaml).toMatch(/NATGateway2:[\s\S]*?SubnetId: !Ref PublicSubnet2/);
      expect(templateYaml).toMatch(/PrivateRoute1:[\s\S]*?NatGatewayId: !Ref NATGateway1/);
      expect(templateYaml).toMatch(/PrivateRoute2:[\s\S]*?NatGatewayId: !Ref NATGateway2/);
    });

    test('Auto Scaling Group spans multiple AZs', () => {
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?VPCZoneIdentifier:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);
    });

    test('Load balancer is configured for multi-AZ', () => {
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Subnets:[\s\S]*?- !Ref PublicSubnet1[\s\S]*?- !Ref PublicSubnet2/);
    });

    test('Database configuration supports high availability', () => {
      expect(templateYaml).toMatch(/DBSubnetGroup:[\s\S]*?SubnetIds:[\s\S]*?- !Ref PrivateSubnet1[\s\S]*?- !Ref PrivateSubnet2/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?MultiAZ: !FindInMap \[EnvironmentMap, !Ref Environment, MultiAZ\]/);
    });
  });

  // ======================
  // RESOURCE DEPENDENCIES
  // ======================
  describe('Resource Dependencies and Ordering', () => {
    test('Internet Gateway attachment dependencies', () => {
      expect(templateYaml).toMatch(/NATGateway[12]EIP:[\s\S]*?DependsOn: AttachGateway/);
    });

    test('NAT Gateway dependencies on EIPs', () => {
      expect(templateYaml).toMatch(/NATGateway1:[\s\S]*?AllocationId: !GetAtt NATGateway1EIP.AllocationId/);
      expect(templateYaml).toMatch(/NATGateway2:[\s\S]*?AllocationId: !GetAtt NATGateway2EIP.AllocationId/);
    });

    test('RDS dependencies on security groups and subnet groups', () => {
      validateResourceDependencies('RDSInstance', ['DBSubnetGroup', 'RDSSecurityGroup', 'DBMasterSecret']);
    });

    test('Auto Scaling Group dependencies', () => {
      validateResourceDependencies('AutoScalingGroup', ['LaunchTemplate', 'TargetGroup']);
    });

    test('Launch Template dependencies', () => {
      validateResourceDependencies('LaunchTemplate', ['EC2InstanceProfile', 'EC2SecurityGroup']);
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation', () => {
    test('Template structure is valid CloudFormation', () => {
      expect(templateYaml).toMatch(/^AWSTemplateFormatVersion:\s*'2010-09-09'/);

      const sections = ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Mappings', 'Resources', 'Outputs'];
      const templateLines = templateYaml.split('\n');
      let lastIndex = -1;

      sections.forEach(section => {
        const sectionIndex = templateLines.findIndex(line => line.startsWith(section));
        expect(sectionIndex).toBeGreaterThan(lastIndex);
        lastIndex = sectionIndex;
      });
    });

    test('All AWS resource types are valid', () => {
      const resourceTypes = [
        'AWS::SecretsManager::Secret',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::EIP',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::S3::Bucket',
        'AWS::RDS::DBSubnetGroup',
        'AWS::RDS::DBInstance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::ScalingPolicy',
        'AWS::Logs::LogGroup',
        'AWS::CloudWatch::Alarm'
      ];

      resourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });

    test('Deployed resources match expected patterns (if deployment exists)', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }

      if (deployedOutputs.PublicSubnet1Id) {
        expect(deployedOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      }

      if (deployedOutputs.EC2SecurityGroupId) {
        expect(deployedOutputs.EC2SecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      }

      // ALB Resources
      if (deployedOutputs.ApplicationLoadBalancerArn) {
        expect(deployedOutputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      }

      // RDS Resources
      if (deployedOutputs.RDSInstanceId) {
        expect(deployedOutputs.RDSInstanceId).toMatch(/^[a-z0-9-]+$/);
      }

      if (deployedOutputs.DBMasterSecretArn) {
        expect(deployedOutputs.DBMasterSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      }
    });

    test('Resource naming follows deployment convention (if deployment exists)', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping naming convention validation - no outputs available');
        return;
      }

      // Check that we successfully extracted environment suffix from actual resources
      if (currentEnvironmentSuffix !== 'unknown-suffix') {
        console.log(`Successfully extracted environment suffix: ${currentEnvironmentSuffix}`);
        // Verify that the environment suffix appears in resource names
        if (deployedOutputs.EC2RoleName) {
          expect(deployedOutputs.EC2RoleName).toContain(currentEnvironmentSuffix);
        }
        if (deployedOutputs.S3BucketArn) {
          expect(deployedOutputs.S3BucketArn).toContain(currentEnvironmentSuffix);
        }
      } else {
        console.log('Could not extract environment suffix from deployment outputs');
      }
    });
  });

  // ======================
  // COST OPTIMIZATION
  // ======================
  describe('Cost Optimization Features', () => {
    test('Environment-based resource sizing is implemented', () => {
      // Dev environment should use smaller, cheaper resources
      expect(templateYaml).toMatch(/dev:[\s\S]*?DBInstanceClass: 'db.t3.micro'/);
      expect(templateYaml).toMatch(/dev:[\s\S]*?AllocatedStorage: '20'/);
      expect(templateYaml).toMatch(/dev:[\s\S]*?MultiAZ: false/);

      // Production environment should use larger, more resilient resources
      expect(templateYaml).toMatch(/prod:[\s\S]*?DBInstanceClass: 'db.t3.medium'/);
      expect(templateYaml).toMatch(/prod:[\s\S]*?AllocatedStorage: '100'/);
      expect(templateYaml).toMatch(/prod:[\s\S]*?MultiAZ: true/);
    });

    test('Backup retention follows cost-conscious approach', () => {
      expect(templateYaml).toMatch(/dev:[\s\S]*?BackupRetentionPeriod: 1/);
      expect(templateYaml).toMatch(/test:[\s\S]*?BackupRetentionPeriod: 3/);
      expect(templateYaml).toMatch(/prod:[\s\S]*?BackupRetentionPeriod: 7/);
    });

    test('Log retention is configured to prevent indefinite growth', () => {
      expect(templateYaml).toMatch(/ApplicationLogGroup:[\s\S]*?RetentionInDays: 7/);
      expect(templateYaml).toMatch(/RDSLogGroup:[\s\S]*?RetentionInDays: 7/);
    });
  });

  // ======================
  // COMPREHENSIVE INTEGRATION
  // ======================
  describe('End-to-End Integration Validation', () => {
    test('Complete application flow is supported', () => {
      // Internet -> ALB -> EC2 -> RDS flow
      expect(templateYaml).toMatch(/ApplicationLoadBalancer:[\s\S]*?Scheme: internet-facing/);
      expect(templateYaml).toMatch(/TargetGroup:[\s\S]*?Port: 80/);
      expect(templateYaml).toMatch(/AutoScalingGroup:[\s\S]*?TargetGroupARNs:[\s\S]*?- !Ref TargetGroup/);
      expect(templateYaml).toMatch(/RDSInstance:[\s\S]*?VPCSecurityGroups:[\s\S]*?- !Ref RDSSecurityGroup/);
    });

    test('Security groups allow proper application traffic flow', () => {
      // ALB can receive traffic from internet
      expect(templateYaml).toMatch(/ALBSecurityGroup:[\s\S]*?CidrIp: !Ref AllowedCidr/);

      // EC2 can receive traffic from ALB
      expect(templateYaml).toMatch(/EC2SecurityGroup:[\s\S]*?FromPort: 80/);

      // RDS can receive traffic from EC2
      expect(templateYaml).toMatch(/RDSSecurityGroup:[\s\S]*?SourceSecurityGroupId: !Ref EC2SecurityGroup/);
    });

    test('Auto scaling and monitoring integration', () => {
      expect(templateYaml).toMatch(/CPUAlarmHigh:[\s\S]*?AlarmActions:[\s\S]*?- !Ref ScaleUpPolicy/);
      expect(templateYaml).toMatch(/ScaleUpPolicy:[\s\S]*?AutoScalingGroupName: !Ref AutoScalingGroup/);
    });

    test('All critical resources have monitoring and logging', () => {
      expect(templateYaml).toContain('ApplicationLogGroup');
      expect(templateYaml).toContain('RDSLogGroup');
      expect(templateYaml).toContain('CPUAlarmHigh');
      expect(templateYaml).toContain('CPUAlarmLow');
    });
  });
});
