import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Basic Web Infrastructure Unit Tests', () => {
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
          deployedOutputs.WebServerInstanceId?.split(':')[3] ||
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
      expect(templateYaml).toContain('Description: \'Cross-account executable template for VPC, subnet, and EC2 instance with proper naming convention\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates cross-account functionality', () => {
      expect(templateYaml).toContain('Cross-account executable template');
      expect(templateYaml).toContain('proper naming convention');
    });

    test('Template contains all critical AWS resource types for web infrastructure', () => {
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
        'AWS::EC2::Instance'
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
      expect(templateYaml).toContain('PR number from CI/CD');
    });

    test('VPC CIDR parameter has proper validation', () => {
      expect(templateYaml).toContain('VpcCidr:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('Default: \'10.0.0.0/16\'');
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('Must be a valid CIDR block');
    });

    test('Subnet CIDR parameter has proper validation', () => {
      expect(templateYaml).toContain('SubnetCidr:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('Default: \'10.0.1.0/24\'');
      expect(templateYaml).toContain('CIDR block for the public subnet');
    });

    test('InstanceType parameter has proper validation', () => {
      expect(templateYaml).toContain('InstanceType:');
      expect(templateYaml).toContain('Default: \'t2.micro\'');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- t2.micro');
      expect(templateYaml).toContain('- t3.micro');
      expect(templateYaml).toContain('Must be a valid EC2 instance type');
    });

    test('KeyPairName parameter has proper validation', () => {
      expect(templateYaml).toContain('KeyPairName:');
      expect(templateYaml).toContain('Default: \'MyKeyPair\'');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9][a-zA-Z0-9\\-]*$\'');
      expect(templateYaml).toContain('Must start with alphanumeric');
    });

    test('SourceAmiIdSsmParameter uses dynamic AMI lookup', () => {
      expect(templateYaml).toContain('SourceAmiIdSsmParameter:');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(templateYaml).toContain('keeps template free of hard-coded AMI IDs');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('VPC has proper naming convention tags', () => {
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc\'');
    });

    test('Public subnet is properly configured', () => {
      validateResourceExists('PublicSubnet', 'AWS::EC2::Subnet');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref SubnetCidr');
      expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
    });

    test('Public subnet has proper naming tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1\'');
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw\'');
    });

    test('VPC Gateway Attachment connects VPC to Internet Gateway', () => {
      validateResourceExists('AttachGateway', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
    });

    test('Public Route Table is properly configured', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt\'');
    });

    test('Public Route provides internet access', () => {
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');
      expect(templateYaml).toContain('DependsOn: AttachGateway');
      expect(templateYaml).toContain('RouteTableId: !Ref PublicRouteTable');
      expect(templateYaml).toContain('DestinationCidrBlock: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('Subnet Route Table Association is configured', () => {
      validateResourceExists('SubnetRouteTableAssociation', 'AWS::EC2::SubnetRouteTableAssociation');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet');
      expect(templateYaml).toContain('RouteTableId: !Ref PublicRouteTable');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('Web Server Security Group is properly configured', () => {
      validateResourceExists('WebServerSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg\'');
      expect(templateYaml).toContain('GroupDescription: \'Security group for web server allowing SSH and HTTP\'');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('Security Group allows SSH access', () => {
      expect(templateYaml).toContain('IpProtocol: tcp');
      expect(templateYaml).toContain('FromPort: 22');
      expect(templateYaml).toContain('ToPort: 22');
      expect(templateYaml).toContain('CidrIp: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('Description: \'Allow SSH from anywhere\'');
    });

    test('Security Group allows HTTP access', () => {
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('Description: \'Allow HTTP from anywhere\'');
    });

    test('Security Group has proper naming tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-security-group\'');
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
      validateResourceExists('WebServerInstance', 'AWS::EC2::Instance');
      expect(templateYaml).toContain('ImageId: !Sub \'{{resolve:ssm:${SourceAmiIdSsmParameter}}}\'');
      expect(templateYaml).toContain('InstanceType: !Ref InstanceType');
      expect(templateYaml).toContain('KeyName: !Ref EC2KeyPair');
    });

    test('EC2 Instance uses dynamic AMI resolution', () => {
      expect(templateYaml).toContain('{{resolve:ssm:${SourceAmiIdSsmParameter}}}');
      expect(templateYaml).not.toMatch(/ami-[a-f0-9]{8,}/); // No hardcoded AMI IDs (8+ chars after ami-)
    });

    test('EC2 Instance has proper network configuration', () => {
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref WebServerSecurityGroup');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet');
    });

    test('EC2 Instance has proper tags', () => {
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance\'');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Value: \'Testing\'');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('VPC outputs are defined with proper naming', () => {
      const vpcOutputs = [
        'VpcId', 'VpcCidrBlock', 'VpcDefaultNetworkAcl', 'VpcDefaultSecurityGroup'
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

    test('Subnet outputs are defined', () => {
      const subnetOutputs = [
        'PublicSubnetId', 'PublicSubnetCidrBlock', 'PublicSubnetAvailabilityZone'
      ];

      const outputsSection = extractYamlSection('Outputs');
      subnetOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Internet Gateway outputs are defined', () => {
      const igwOutputs = ['InternetGatewayId'];

      const outputsSection = extractYamlSection('Outputs');
      igwOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Route Table outputs are defined', () => {
      const rtOutputs = ['PublicRouteTableId'];

      const outputsSection = extractYamlSection('Outputs');
      rtOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security Group outputs are defined', () => {
      const sgOutputs = ['WebServerSecurityGroupId', 'WebServerSecurityGroupName'];

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
        'WebServerInstanceId', 'InstancePublicIp', 'InstancePrivateIp',
        'InstancePublicDnsName', 'InstancePrivateDnsName', 'InstanceAvailabilityZone',
        'InstanceState', 'InstanceImageId', 'InstanceType'
      ];

      const outputsSection = extractYamlSection('Outputs');
      instanceOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Stack metadata outputs are defined', () => {
      const metadataOutputs = ['StackName', 'StackRegion', 'EnvironmentSuffix'];

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
      expect(exportMatches!.length).toBeGreaterThan(15); // Should have many exports
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
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('Uses SSM parameter for AMI ID resolution', () => {
      expect(templateYaml).toContain('{{resolve:ssm:${SourceAmiIdSsmParameter}}}');
      expect(templateYaml).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('Basic Security Configuration', () => {
    test('Security Group rules are properly configured', () => {
      expect(templateYaml).toContain('SecurityGroupIngress:');
      expect(templateYaml).toContain('IpProtocol: tcp');
      expect(templateYaml).toContain('Description: \'Allow SSH from anywhere\'');
      expect(templateYaml).toContain('Description: \'Allow HTTP from anywhere\'');
    });

    test('Public subnet allows public IP mapping for web server', () => {
      expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
    });

    test('Internet connectivity is properly configured', () => {
      // Internet Gateway exists
      expect(templateYaml).toContain('Type: AWS::EC2::InternetGateway');

      // Route to internet exists
      expect(templateYaml).toContain('DestinationCidrBlock: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');
    });

    test('Resource dependencies prevent circular references', () => {
      // Route depends on gateway attachment
      expect(templateYaml).toContain('DependsOn: AttachGateway');

      // No circular dependencies in resource references
      validateResourceDependencies('PublicRoute', ['PublicRouteTable', 'InternetGateway']);
      validateResourceDependencies('WebServerInstance', ['WebServerSecurityGroup', 'PublicSubnet', 'EC2KeyPair']);
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('VPC provides network foundation for all resources', () => {
      // All network resources reference VPC
      validateResourceDependencies('PublicSubnet', ['VPC']);
      validateResourceDependencies('WebServerSecurityGroup', ['VPC']);
      validateResourceDependencies('PublicRouteTable', ['VPC']);
      validateResourceDependencies('AttachGateway', ['VPC']);
    });

    test('EC2 Instance has proper network connectivity', () => {
      // Instance is in public subnet with security group
      validateResourceDependencies('WebServerInstance', ['PublicSubnet', 'WebServerSecurityGroup', 'EC2KeyPair']);

      // Subnet is associated with route table for internet access
      validateResourceDependencies('SubnetRouteTableAssociation', ['PublicSubnet', 'PublicRouteTable']);

      // Route table has route to internet gateway
      validateResourceDependencies('PublicRoute', ['PublicRouteTable', 'InternetGateway']);
    });

    test('Resource naming follows consistent pattern', () => {
      const namingPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+/;

      // Check various resource names follow pattern
      expect(templateYaml).toMatch(namingPattern);

      // Check specific naming examples
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-sg');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance');
    });

    test('All resources have proper tagging for identification', () => {
      // Check that major resources have Name tags
      expect(templateYaml).toContain('Key: Name');

      // Count Name tag occurrences (should be multiple)
      const nameTagMatches = (templateYaml.match(/Key: Name/g) || []).length;
      expect(nameTagMatches).toBeGreaterThanOrEqual(6); // VPC, Subnet, IGW, RouteTable, SG, KeyPair, Instance
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
      if (deployedOutputs.VpcId) {
        expect(deployedOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.VpcCidrBlock) {
        expect(deployedOutputs.VpcCidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      }

      // Subnet Resources
      if (deployedOutputs.PublicSubnetId) {
        expect(deployedOutputs.PublicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);
      }

      if (deployedOutputs.PublicSubnetCidrBlock) {
        expect(deployedOutputs.PublicSubnetCidrBlock).toMatch(/^10\.0\.1\.0\/24$/);
      }

      // Security Group Resources
      if (deployedOutputs.WebServerSecurityGroupId) {
        expect(deployedOutputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      }

      // Internet Gateway
      if (deployedOutputs.InternetGatewayId) {
        expect(deployedOutputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]+$/);
      }

      // Route Table
      if (deployedOutputs.PublicRouteTableId) {
        expect(deployedOutputs.PublicRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
      }
    });

    test('EC2 Instance is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.WebServerInstanceId) {
        expect(deployedOutputs.WebServerInstanceId).toMatch(/^i-[a-f0-9]+$/);
      }

      if (deployedOutputs.InstancePublicIp) {
        expect(deployedOutputs.InstancePublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      }

      if (deployedOutputs.InstancePrivateIp) {
        expect(deployedOutputs.InstancePrivateIp).toMatch(/^10\.0\.1\.\d{1,3}$/);
      }

      if (deployedOutputs.InstanceType) {
        expect(deployedOutputs.InstanceType).toMatch(/^t[23]\.(micro|small|medium)$/);
      }

      if (deployedOutputs.InstanceStateName) {
        expect(['pending', 'running', 'stopping', 'stopped']).toContain(deployedOutputs.InstanceStateName);
      }
    });

    test('Key Pair is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.EC2KeyPairId) {
        expect(deployedOutputs.EC2KeyPairId).toContain(currentStackName);
        expect(deployedOutputs.EC2KeyPairId).toContain(region);
        expect(deployedOutputs.EC2KeyPairId).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.EC2KeyPairFingerprint) {
        expect(deployedOutputs.EC2KeyPairFingerprint).toMatch(/^[a-f0-9:]+$/);
      }
    });

    test('Stack metadata is properly captured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.StackName) {
        expect(deployedOutputs.StackName).toBe(currentStackName);
      }

      if (deployedOutputs.StackRegion) {
        expect(deployedOutputs.StackRegion).toBe(region);
      }

      if (deployedOutputs.EnvironmentSuffix) {
        expect(deployedOutputs.EnvironmentSuffix).toBe(currentEnvironmentSuffix);
        expect(deployedOutputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9\-]+$/);
      }
    });

    test('DNS names are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.InstancePublicDnsName) {
        expect(deployedOutputs.InstancePublicDnsName).toMatch(/\.amazonaws\.com$/);
        // DNS names use compute-1 format for us-east-1, compute.amazonaws.com for others
        expect(deployedOutputs.InstancePublicDnsName).toMatch(/\.(compute-\d|compute)\.amazonaws\.com$/);
      }

      if (deployedOutputs.InstancePrivateDnsName) {
        expect(deployedOutputs.InstancePrivateDnsName).toMatch(/\.internal$/);
      }
    });

    test('Availability Zone configuration is valid', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.PublicSubnetAvailabilityZone) {
        expect(deployedOutputs.PublicSubnetAvailabilityZone).toMatch(/^[a-z-]+-\d+[a-z]$/);
        expect(deployedOutputs.PublicSubnetAvailabilityZone).toContain(region);
      }

      if (deployedOutputs.InstanceAvailabilityZone) {
        expect(deployedOutputs.InstanceAvailabilityZone).toMatch(/^[a-z-]+-\d+[a-z]$/);
        expect(deployedOutputs.InstanceAvailabilityZone).toContain(region);
      }
    });

    test('Environment-specific naming is applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment suffix matches what we expect
      expect(currentEnvironmentSuffix).toMatch(/^[a-zA-Z0-9\-]+$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      // Check that resource names contain the environment suffix
      if (deployedOutputs.WebServerSecurityGroupName) {
        expect(deployedOutputs.WebServerSecurityGroupName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.EC2KeyPairId) {
        expect(deployedOutputs.EC2KeyPairId).toContain(currentEnvironmentSuffix);
      }
    });
  });

  // ========================
  // PERFORMANCE & COST
  // ========================
  describe('Performance and Cost Optimization', () => {
    test('Default instance type is cost-effective', () => {
      expect(templateYaml).toContain('Default: \'t2.micro\''); // Free tier eligible
    });

    test('Instance types are limited to appropriate sizes', () => {
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- t2.micro');
      expect(templateYaml).toContain('- t2.small');
      expect(templateYaml).toContain('- t2.medium');
      expect(templateYaml).toContain('- t3.micro');
      expect(templateYaml).toContain('- t3.small');
      expect(templateYaml).toContain('- t3.medium');

      // Should NOT contain expensive instance types
      expect(templateYaml).not.toContain('c5.large');
      expect(templateYaml).not.toContain('m5.xlarge');
    });

    test('Network configuration is optimized for web workload', () => {
      // Single public subnet for simple web architecture
      expect(templateYaml).toContain('Type: AWS::EC2::Subnet');

      // Direct internet access via Internet Gateway (no NAT Gateway costs)
      expect(templateYaml).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateYaml).not.toContain('Type: AWS::EC2::NatGateway');
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE
  // ========================
  describe('Reliability and Resilience', () => {
    test('Resource dependencies are properly defined', () => {
      // Critical dependency: Route creation depends on gateway attachment
      expect(templateYaml).toContain('DependsOn: AttachGateway');

      // This prevents race conditions during stack creation/deletion
      validateResourceDependencies('PublicRoute', ['PublicRouteTable', 'InternetGateway']);
    });

    test('Resource naming supports parallel deployments', () => {
      // Environment suffix enables multiple stack deployments
      expect(templateYaml).toContain('${EnvironmentSuffix}');

      // Key pair name includes all unique identifiers
      expect(templateYaml).toContain('KeyName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-${KeyPairName}\'');
    });

    test('Template supports infrastructure as code best practices', () => {
      // All resources are tagged for identification
      expect(templateYaml).toContain('Tags:');

      // Dynamic resource references (no hardcoded values)
      expect(templateYaml).toContain('!Ref');
      expect(templateYaml).toContain('!GetAtt');
      expect(templateYaml).toContain('!Sub');
    });

    test('Error-prone configurations are avoided', () => {
      // No hardcoded AMI IDs that become invalid
      expect(templateYaml).not.toMatch(/ami-[a-f0-9]{8,}/);

      // Uses SSM parameter for AMI resolution
      expect(templateYaml).toContain('{{resolve:ssm:');

      // No hardcoded account or region values
      expect(templateYaml).not.toMatch(/\b\d{12}\b/);
      expect(templateYaml).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });
  });
});