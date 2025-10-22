import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Unit Tests', () => {
  // Test configuration
  // const stackName = process.env.STACK_NAME || 'TapStack';
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs (from ARN format: arn:aws:service:region:account:resource)
        region = process.env.AWS_REGION ||
          deployedOutputs.DBSecretArn?.split(':')[3] ||
          deployedOutputs.EC2RoleArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from resource naming pattern (e.g., TapStack-us-east-2-dev-ec2-role)
        if (deployedOutputs.EC2RoleArn) {
          const roleName = deployedOutputs.EC2RoleArn.split('/').pop();
          currentStackName = roleName?.split('-')[0] || 'unknown-stack';
        } else if (deployedOutputs.DBSecretArn) {
          const secretName = deployedOutputs.DBSecretArn.split(':').pop()?.split('-')[0];
          currentStackName = secretName || 'unknown-stack';
        }
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
    }
  });

  // Helper function to check resource dependencies
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`Ref: ${dep}|!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // =================
  // BASIC VALIDATION
  // =================
  test('Template has required sections', () => {
    expect(templateYaml).toContain('AWSTemplateFormatVersion:');
    expect(templateYaml).toContain('Description:');
    expect(templateYaml).toContain('Parameters:');
    expect(templateYaml).toContain('Resources:');
    expect(templateYaml).toContain('Outputs:');
    expect(templateYaml).toContain('Mappings:');
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section', () => {
    test('Required parameters are defined with proper constraints', () => {
      const requiredParams = [
        'VPCCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'DBInstanceClass',
        'DBMasterUsername',
        'DatabaseEngine',
        'DBBackupRetentionPeriod',
        'S3BucketNamePrefix',
        'DynamoDBTableName',
        'EnvironmentSuffix'
      ];

      requiredParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
      });

      // Verify parameter constraints
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('MinLength:');
      expect(templateYaml).toContain('MaxLength:');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('Description:');
    });

    test('CIDR parameters have proper validation patterns', () => {
      const cidrParams = ['VPCCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr'];

      cidrParams.forEach(param => {
        // Check that each CIDR parameter has AllowedPattern constraint that validates CIDR format
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('AllowedPattern:');
        expect(templateYaml).toContain('(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
      });
    });
  });

  // ====================
  // MAPPINGS
  // ====================
  describe('Mappings Section', () => {
    test('Database engine mappings are properly defined', () => {
      expect(templateYaml).toContain('DatabaseEngineMap:');

      // MySQL configuration
      expect(templateYaml).toMatch(/mysql:.*Engine: 'mysql'/s);
      expect(templateYaml).toMatch(/mysql:.*EngineVersion: '8.0'/s);
      expect(templateYaml).toMatch(/mysql:.*Port: 3306/s);

      // PostgreSQL configuration
      expect(templateYaml).toMatch(/postgres:.*Engine: 'postgres'/s);
      expect(templateYaml).toMatch(/postgres:.*EngineVersion: '14'/s);
      expect(templateYaml).toMatch(/postgres:.*Port: 5432/s);
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::VPC');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
      expect(templateYaml).toContain('CidrBlock: !Ref VPCCidr');
    });

    test('Subnets are properly configured', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];

      subnets.forEach(subnet => {
        expect(templateYaml).toContain(`${subnet}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::Subnet');
      });

      // Verify AZ distribution
      expect(templateYaml).toMatch(/!Select \[0, !GetAZs/);
      expect(templateYaml).toMatch(/!Select \[1, !GetAZs/);
    });

    test('Internet Gateway and NAT Gateway are properly configured', () => {
      // Internet Gateway
      expect(templateYaml).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateYaml).toContain('Type: AWS::EC2::VPCGatewayAttachment');

      // NAT Gateway
      expect(templateYaml).toContain('Type: AWS::EC2::NatGateway');
      expect(templateYaml).toContain('Type: AWS::EC2::EIP');
      expect(templateYaml).toContain('Domain: vpc');
    });

    test('Route tables are properly configured', () => {
      // Route Tables
      expect(templateYaml).toContain('Type: AWS::EC2::RouteTable');
      expect(templateYaml).toContain('Type: AWS::EC2::Route');
      expect(templateYaml).toContain('Type: AWS::EC2::SubnetRouteTableAssociation');

      // Route configurations
      expect(templateYaml).toMatch(/DestinationCidrBlock: '0.0.0.0\/0'/);
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('NatGatewayId: !Ref NATGateway');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups', () => {
    test('Web Security Group is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::SecurityGroup');
      expect(templateYaml).toMatch(/FromPort: 80/);
      expect(templateYaml).toMatch(/ToPort: 80/);
      expect(templateYaml).toMatch(/FromPort: 443/);
      expect(templateYaml).toMatch(/ToPort: 443/);
      expect(templateYaml).toMatch(/CidrIp: '0.0.0.0\/0'/);
    });

    test('RDS Security Group is properly configured', () => {
      expect(templateYaml).toContain('RDSSecurityGroup:');
      expect(templateYaml).toContain('GroupDescription: \'Security group for RDS database\'');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref WebSecurityGroup');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources', () => {
    test('EC2 Role is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::IAM::Role');
      expect(templateYaml).toContain('ec2.amazonaws.com');
      expect(templateYaml).toContain('sts:AssumeRole');
      expect(templateYaml).toContain('s3:ListBucket');
      expect(templateYaml).toContain('s3:GetObject');
      expect(templateYaml).toContain('s3:PutObject');
    });

    test('EC2 Instance Profile is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::IAM::InstanceProfile');
      validateResourceDependencies('EC2InstanceProfile', ['EC2Role']);
    });
  });

  // ===============
  // STORAGE
  // ===============
  describe('Storage Resources', () => {
    test('S3 Bucket is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::S3::Bucket');
      expect(templateYaml).toContain('VersioningConfiguration:');
      expect(templateYaml).toContain('Status: Enabled');
      expect(templateYaml).toContain('BlockPublicAcls: true');
      expect(templateYaml).toContain('BlockPublicPolicy: true');
      expect(templateYaml).toContain('ServerSideEncryptionConfiguration:');
      expect(templateYaml).toContain('SSEAlgorithm: AES256');
    });

    test('DynamoDB Table is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::DynamoDB::Table');
      expect(templateYaml).toMatch(/AttributeName: id/);
      expect(templateYaml).toMatch(/AttributeType: S/);
      expect(templateYaml).toMatch(/KeyType: HASH/);
      expect(templateYaml).toMatch(/ReadCapacityUnits: 5/);
      expect(templateYaml).toMatch(/WriteCapacityUnits: 5/);
      expect(templateYaml).toMatch(/SSEEnabled: true/);
    });
  });

  // =================
  // DATABASE
  // =================
  describe('Database Resources', () => {
    test('RDS Subnet Group is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::RDS::DBSubnetGroup');
      validateResourceDependencies('RDSSubnetGroup', ['PrivateSubnet1', 'PrivateSubnet2']);
    });

    test('RDS Instance is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::RDS::DBInstance');
      expect(templateYaml).toContain('DeletionPolicy: Snapshot');
      expect(templateYaml).toContain('UpdateReplacePolicy: Snapshot');
      expect(templateYaml).toContain('StorageEncrypted: true');
      expect(templateYaml).toContain('MultiAZ: true');
      expect(templateYaml).toContain('PubliclyAccessible: false');
      expect(templateYaml).toMatch(/StorageType: gp3/);
    });

    test('Database Secrets are properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::SecretsManager::Secret');
      expect(templateYaml).toContain('GenerateSecretString:');
      expect(templateYaml).toContain('SecretStringTemplate:');
      expect(templateYaml).toContain('GenerateStringKey: \'password\'');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section', () => {
    test('Required outputs are defined', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebSecurityGroupId',
        'S3BucketName',
        'RDSEndpoint',
        'DynamoDBTableName',
        'EC2RoleArn'
      ];

      requiredOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toContain('Export:');
      });
    });

    test('Outputs follow naming convention', () => {
      const exportPattern = /!Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/;
      const exportMatches = templateYaml.match(/Export:(?:\s+Name:[^\n]+\n)/g) || [];

      exportMatches.forEach(match => {
        expect(match).toMatch(exportPattern);
      });
    });
  });

  // ====================
  // CROSS-ACCOUNT
  // ====================
  describe('Cross-Account Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\d{12}/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /us-(east|west)-[12]|eu-west-[12]|ap-southeast-[12]/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic references for region and account', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation', () => {
    test('Deployed resources match expected formats', () => {
      // Skip if no deployment outputs
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-/);
      }
      if (deployedOutputs.PublicSubnet1Id) {
        expect(deployedOutputs.PublicSubnet1Id).toMatch(/^subnet-/);
      }
      if (deployedOutputs.WebSecurityGroupId) {
        expect(deployedOutputs.WebSecurityGroupId).toMatch(/^sg-/);
      }

      // Database
      if (deployedOutputs.RDSEndpoint) {
        expect(deployedOutputs.RDSEndpoint).toMatch(/\.rds\./);
      }

      // IAM
      if (deployedOutputs.EC2RoleArn) {
        expect(deployedOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::/);
      }

      // S3
      if (deployedOutputs.S3BucketName && deployedOutputs.S3BucketNamePrefix) {
        // Check bucket name follows {prefix}-{account-id}-{region} format
        expect(deployedOutputs.S3BucketName).toMatch(new RegExp(
          `^${deployedOutputs.S3BucketNamePrefix}-\\d{12}-[a-z]{2}-[a-z]+-\\d$`
        ));
      }
    });
  });
});
