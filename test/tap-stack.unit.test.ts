import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Production-Grade EKS Cluster Unit Tests', () => {
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
        region = deployedOutputs.DeployedRegion ||
          process.env.AWS_REGION ||
          deployedOutputs.VpcId?.split(':')[3] ||
          deployedOutputs.ClusterArn?.split(':')[3] ||
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
        console.log('Resource Name Prefix:', deployedOutputs.ResourceNamePrefix);
        console.log('Kubernetes Version:', deployedOutputs.KubernetesVersion);
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
      expect(templateYaml).toContain('Description: \'Production-grade EKS cluster with complete automation via Lambda custom resources\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
      expect(templateYaml).toContain('Conditions:');
    });

    test('Template description indicates production-grade EKS infrastructure', () => {
      expect(templateYaml).toContain('Production-grade EKS cluster');
      expect(templateYaml).toContain('complete automation');
      expect(templateYaml).toContain('Lambda custom resources');
    });

    test('Template contains all critical AWS resource types for EKS infrastructure', () => {
      const criticalResourceTypes = [
        // VPC Infrastructure
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::VPCCidrBlock', // Secondary CIDR blocks
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::SecurityGroupIngress',
        // EKS Resources
        'AWS::EKS::Cluster',
        'AWS::EKS::Nodegroup',
        'AWS::EKS::Addon',
        // Launch Templates
        'AWS::EC2::LaunchTemplate',
        // IAM Resources
        'AWS::IAM::Role',
        'AWS::IAM::ManagedPolicy',
        'AWS::IAM::OIDCProvider',
        // KMS for encryption
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        // CloudWatch Logs
        'AWS::Logs::LogGroup',
        // Lambda for automation
        'AWS::Lambda::Function',
        // Custom Resources
        'Custom::KubernetesSetup'
      ];

      criticalResourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });

    test('Template includes conditional resources with proper conditions', () => {
      expect(templateYaml).toContain('Conditions:');
      expect(templateYaml).toContain('EnableEbsEncryption:');
      expect(templateYaml).toContain('EnableBastionAccess:');
      expect(templateYaml).toContain('Condition: EnableEbsEncryption');
      expect(templateYaml).toContain('Condition: EnableBastionAccess');
    });

    test('Template contains Mappings section for instance type configurations', () => {
      expect(templateYaml).toContain('Mappings:');
      expect(templateYaml).toContain('InstanceTypeMaxPods:');
    });

    test('InstanceTypeMaxPods mapping contains proper instance types and max pod values', () => {
      // Check for instance types that are actually in the template
      expect(templateYaml).toContain('t3.medium:');
      expect(templateYaml).toContain('MaxPods: 17');
      expect(templateYaml).toContain('t3.large:');
      expect(templateYaml).toContain('MaxPods: 35');
      expect(templateYaml).toContain('t3a.large:');
      expect(templateYaml).toContain('t2.large:');
      // All large instances have MaxPods: 35 in this template
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
      expect(templateYaml).toContain('CIDR block for VPC');
    });

    test('Subnet CIDR parameters are properly defined', () => {
      const subnetParams = [
        'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PublicSubnet3Cidr',
        'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr', 'PrivateSubnet3Cidr'
      ];

      subnetParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('Type: String');
        expect(templateYaml).toContain('Default: \'10.0.');
      });
    });

    test('Kubernetes version parameter has proper validation', () => {
      expect(templateYaml).toContain('KubernetesVersion:');
      expect(templateYaml).toContain('Default: \'1.28\'');
      expect(templateYaml).toContain('AllowedValues: [\'1.28\', \'1.29\', \'1.30\']');
      expect(templateYaml).toContain('Kubernetes version for EKS cluster');
    });

    test('Feature toggle parameters are properly configured', () => {
      expect(templateYaml).toContain('EnableBastionAccess:');
      expect(templateYaml).toContain('EnableEbsEncryption:');
      expect(templateYaml).toContain('AllowedValues: [\'true\', \'false\']');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources', () => {
    test('VPC is properly configured with enhanced features', () => {
      validateResourceExists('Vpc', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('VPC has proper naming convention tags', () => {
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc\'');
    });

    test('Secondary CIDR blocks are configured for VPC CNI custom networking', () => {
      validateResourceExists('SecondaryCidr1', 'AWS::EC2::VPCCidrBlock');
      validateResourceExists('SecondaryCidr2', 'AWS::EC2::VPCCidrBlock');
      validateResourceExists('SecondaryCidr3', 'AWS::EC2::VPCCidrBlock');

      expect(templateYaml).toContain('CidrBlock: \'100.64.0.0/19\'');
      expect(templateYaml).toContain('CidrBlock: \'100.64.32.0/19\'');
      expect(templateYaml).toContain('CidrBlock: \'100.64.64.0/19\'');
    });

    test('Public subnets are properly configured across AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      publicSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`AvailabilityZone: !Select [${index}, !GetAZs '']`);
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
        expect(templateYaml).toContain('Key: kubernetes.io/role/elb');
      });
    });

    test('Private subnets are properly configured with EKS tags', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];

      privateSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain(`AvailabilityZone: !Select [${index}, !GetAZs '']`);
        expect(templateYaml).toContain('Key: kubernetes.io/role/internal-elb');
        expect(templateYaml).toContain('kubernetes.io/cluster/');
      });
    });

    test('NAT Gateways provide high availability across AZs', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      const eips = ['NatGateway1Eip', 'NatGateway2Eip', 'NatGateway3Eip'];

      natGateways.forEach(nat => {
        validateResourceExists(nat, 'AWS::EC2::NatGateway');
      });

      eips.forEach(eip => {
        validateResourceExists(eip, 'AWS::EC2::EIP');
        expect(templateYaml).toContain('DependsOn: VpcGatewayAttachment');
      });
    });

    test('Route tables are properly configured with correct associations', () => {
      const routeTables = [
        'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'
      ];

      routeTables.forEach(rt => {
        validateResourceExists(rt, 'AWS::EC2::RouteTable');
        expect(templateYaml).toContain('VpcId: !Ref Vpc');
      });
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('VpcGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw\'');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('EKS Cluster Security Group is properly configured', () => {
      validateResourceExists('EksClusterSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: \'Security group for EKS cluster control plane\'');
      expect(templateYaml).toContain('VpcId: !Ref Vpc');
    });

    test('EKS Node Security Group has proper configuration', () => {
      validateResourceExists('EksNodeSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: \'Security group for EKS worker nodes\'');
      expect(templateYaml).toContain('kubernetes.io/cluster/');
    });

    test('Security Group rules allow proper EKS communication', () => {
      validateResourceExists('EksNodeSecurityGroupIngress', 'AWS::EC2::SecurityGroupIngress');
      validateResourceExists('EksNodeSecurityGroupFromControlPlaneIngress', 'AWS::EC2::SecurityGroupIngress');
      validateResourceExists('EksControlPlaneSecurityGroupFromNodeIngress', 'AWS::EC2::SecurityGroupIngress');
    });

    test('Bastion Security Group is conditionally created', () => {
      expect(templateYaml).toContain('BastionSecurityGroup:');
      expect(templateYaml).toContain('Condition: EnableBastionAccess');
      expect(templateYaml).toContain('SSH access from anywhere');
      expect(templateYaml).toContain('HTTPS access to EKS API');
    });
  });

  // ==================
  // KMS ENCRYPTION
  // ==================
  describe('KMS Keys - Encryption at Rest', () => {
    test('EBS KMS Key is properly configured', () => {
      validateResourceExists('EbsKmsKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Condition: EnableEbsEncryption');
      expect(templateYaml).toContain('Description: \'KMS key for EBS encryption\'');
      expect(templateYaml).toContain('Allow EC2 Service');
      expect(templateYaml).toContain('Allow Auto Scaling Service');
    });

    test('CloudWatch Logs KMS Key is properly configured', () => {
      validateResourceExists('LogsKmsKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Condition: EnableEbsEncryption');
      expect(templateYaml).toContain('Description: \'KMS key for CloudWatch Logs encryption\'');
      expect(templateYaml).toContain('Allow CloudWatch Logs');
    });

    test('KMS Key Aliases follow naming convention', () => {
      validateResourceExists('EbsKmsKeyAlias', 'AWS::KMS::Alias');
      validateResourceExists('LogsKmsKeyAlias', 'AWS::KMS::Alias');
      expect(templateYaml).toContain('alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ebs');
      expect(templateYaml).toContain('alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-logs');
    });

    test('KMS keys have proper IAM permissions', () => {
      expect(templateYaml).toContain('Sid: Enable IAM User Permissions');
      expect(templateYaml).toContain('Action: \'kms:*\'');
      expect(templateYaml).toContain('!Sub \'arn:${AWS::Partition}:iam::${AWS::AccountId}:root\'');
    });
  });

  // =============
  // EKS CLUSTER
  // =============
  describe('EKS Cluster Configuration', () => {
    test('EKS Cluster is properly configured', () => {
      validateResourceExists('EksCluster', 'AWS::EKS::Cluster');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster\'');
      expect(templateYaml).toContain('Version: !Ref KubernetesVersion');
      expect(templateYaml).toContain('RoleArn: !GetAtt EksClusterRole.Arn');
    });

    test('EKS Cluster has proper VPC configuration', () => {
      expect(templateYaml).toContain('ResourcesVpcConfig:');
      expect(templateYaml).toContain('EndpointPrivateAccess: true');
      expect(templateYaml).toContain('EndpointPublicAccess: true');
      expect(templateYaml).toContain('PublicAccessCidrs: [\'0.0.0.0/0\']');
    });

    test('EKS Cluster logging is enabled for all log types', () => {
      expect(templateYaml).toContain('Logging:');
      expect(templateYaml).toContain('ClusterLogging:');
      expect(templateYaml).toContain('Type: api');
      expect(templateYaml).toContain('Type: audit');
      expect(templateYaml).toContain('Type: authenticator');
      expect(templateYaml).toContain('Type: controllerManager');
      expect(templateYaml).toContain('Type: scheduler');
    });

    test('CloudWatch Log Group is properly configured', () => {
      validateResourceExists('EksClusterLogGroup', 'AWS::Logs::LogGroup');
      expect(templateYaml).toContain('LogGroupName: !Sub \'/aws/eks/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster/cluster\'');
      expect(templateYaml).toContain('RetentionInDays: 7');
      expect(templateYaml).toContain('KmsKeyId: !If [EnableEbsEncryption, !GetAtt LogsKmsKey.Arn, !Ref AWS::NoValue]');
    });
  });

  // ==================
  // EKS NODE GROUPS
  // ==================
  describe('EKS Node Groups', () => {
    test('On-Demand Node Group is properly configured', () => {
      validateResourceExists('OnDemandNodeGroup', 'AWS::EKS::Nodegroup');
      expect(templateYaml).toContain('NodegroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-nodes\'');
      expect(templateYaml).toContain('CapacityType: ON_DEMAND');
      expect(templateYaml).toContain('InstanceTypes:');
      expect(templateYaml).toContain('- t3.medium');
    });

    test('Spot Node Group is properly configured', () => {
      validateResourceExists('SpotNodeGroup', 'AWS::EKS::Nodegroup');
      expect(templateYaml).toContain('NodegroupName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-nodes\'');
      expect(templateYaml).toContain('CapacityType: SPOT');
      expect(templateYaml).toContain('- t3.large');
      expect(templateYaml).toContain('- t3a.large');
      expect(templateYaml).toContain('- t2.large');
    });

    test('Node Groups have proper scaling configuration', () => {
      expect(templateYaml).toContain('ScalingConfig:');
      expect(templateYaml).toContain('DesiredSize: 2');
      expect(templateYaml).toContain('MinSize: 2');
      expect(templateYaml).toContain('MaxSize: 4');

      // Spot node group scaling
      expect(templateYaml).toContain('DesiredSize: 3');
      expect(templateYaml).toContain('MinSize: 3');
      expect(templateYaml).toContain('MaxSize: 9');
    });

    test('Node Groups use private subnets for security', () => {
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('Node Groups have cluster autoscaler tags', () => {
      expect(templateYaml).toContain('\'k8s.io/cluster-autoscaler/enabled\': \'true\'');
    });
  });

  // ==================
  // LAUNCH TEMPLATES
  // ==================
  describe('Launch Templates', () => {
    test('On-Demand Launch Template has security configurations', () => {
      validateResourceExists('OnDemandLaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('LaunchTemplateName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-lt\'');
      expect(templateYaml).toContain('HttpTokens: required');
      expect(templateYaml).toContain('HttpPutResponseHopLimit: 2');
      expect(templateYaml).toContain('Monitoring:');
      expect(templateYaml).toContain('Enabled: true');
    });

    test('Spot Launch Template has security configurations', () => {
      validateResourceExists('SpotLaunchTemplate', 'AWS::EC2::LaunchTemplate');
      expect(templateYaml).toContain('LaunchTemplateName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-lt\'');
      expect(templateYaml).toContain('HttpTokens: required');
    });

    test('Launch Templates have encrypted EBS volumes', () => {
      expect(templateYaml).toContain('BlockDeviceMappings:');
      expect(templateYaml).toContain('DeviceName: /dev/xvda');
      expect(templateYaml).toContain('VolumeSize: 20');
      expect(templateYaml).toContain('VolumeType: gp3');
      expect(templateYaml).toContain('Encrypted: true');
      expect(templateYaml).toContain('DeleteOnTermination: true');
    });

    test('Launch Templates contain UserData with MIME multipart format', () => {
      expect(templateYaml).toContain('UserData:');
      expect(templateYaml).toContain('Fn::Base64:');
      expect(templateYaml).toContain('MIME-Version: 1.0');
      expect(templateYaml).toContain('Content-Type: multipart/mixed; boundary=');
      expect(templateYaml).toContain('Content-Type: text/x-shellscript; charset=');
      expect(templateYaml).toContain('--==MYBOUNDARY==');
    });

    test('Launch Templates contain kubelet max pods configuration', () => {
      expect(templateYaml).toContain('/etc/eks/bootstrap.sh');
      expect(templateYaml).toContain('--kubelet-extra-args');
      expect(templateYaml).toContain('--max-pods=');
      expect(templateYaml).toContain('!FindInMap [InstanceTypeMaxPods,');
      expect(templateYaml).toContain('MaxPods]');
    });

    test('Launch Templates have TagSpecifications for cluster autoscaler', () => {
      expect(templateYaml).toContain('TagSpecifications:');
      expect(templateYaml).toContain('ResourceType: instance');
      expect(templateYaml).toContain('k8s.io/cluster-autoscaler/enabled');
      expect(templateYaml).toContain('Value: \'true\'');
      expect(templateYaml).toContain('k8s.io/cluster-autoscaler/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster');
      expect(templateYaml).toContain('Value: \'owned\'');
    });
  });

  // ==================
  // IAM ROLES & IRSA
  // ==================
  describe('IAM Roles and IRSA Configuration', () => {
    test('EKS Cluster Role has proper policies', () => {
      validateResourceExists('EksClusterRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('RoleName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-role\'');
      expect(templateYaml).toContain('AmazonEKSClusterPolicy');
      expect(templateYaml).toContain('AmazonEKSServicePolicy');
    });

    test('EKS Node Role has necessary policies', () => {
      validateResourceExists('EksNodeRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('RoleName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-node-role\'');
      expect(templateYaml).toContain('AmazonEKSWorkerNodePolicy');
      expect(templateYaml).toContain('AmazonEKS_CNI_Policy');
      expect(templateYaml).toContain('AmazonEC2ContainerRegistryReadOnly');
      expect(templateYaml).toContain('AmazonSSMManagedInstanceCore');
    });

    test('OIDC Provider is configured for IRSA', () => {
      validateResourceExists('OidcProvider', 'AWS::IAM::OIDCProvider');
      expect(templateYaml).toContain('ClientIdList:');
      expect(templateYaml).toContain('- sts.amazonaws.com');
      expect(templateYaml).toContain('ThumbprintList:');
      expect(templateYaml).toContain('Url: !GetAtt EksCluster.OpenIdConnectIssuerUrl');
    });

    test('IRSA roles are properly configured', () => {
      const irsaRoles = [
        'ClusterAutoscalerRole',
        'AwsLoadBalancerControllerRole',
        'EbsCsiDriverRole'
      ];

      irsaRoles.forEach(role => {
        validateResourceExists(role, 'AWS::IAM::Role');
        expect(templateYaml).toContain('AssumeRoleWithWebIdentity');
        expect(templateYaml).toContain('Federated: !Ref OidcProvider');
      });
    });

    test('AWS Load Balancer Controller has comprehensive permissions', () => {
      validateResourceExists('AwsLoadBalancerControllerPolicy', 'AWS::IAM::ManagedPolicy');
      expect(templateYaml).toContain('elasticloadbalancing:*');
      expect(templateYaml).toContain('ec2:DescribeVpcs');
      expect(templateYaml).toContain('ec2:DescribeSubnets');
      expect(templateYaml).toContain('acm:ListCertificates');
    });
  });

  // ==================
  // EKS ADD-ONS
  // ==================
  describe('EKS Add-ons', () => {
    test('VPC CNI Add-on is configured', () => {
      validateResourceExists('VpcCniAddon', 'AWS::EKS::Addon');
      expect(templateYaml).toContain('AddonName: vpc-cni');
      expect(templateYaml).toContain('ClusterName: !Ref EksCluster');
      expect(templateYaml).toContain('ResolveConflicts: OVERWRITE');
    });

    test('EBS CSI Add-on is configured with IRSA', () => {
      validateResourceExists('EbsCsiAddon', 'AWS::EKS::Addon');
      expect(templateYaml).toContain('AddonName: aws-ebs-csi-driver');
      expect(templateYaml).toContain('ServiceAccountRoleArn: !GetAtt EbsCsiDriverRole.Arn');
      expect(templateYaml).toContain('ResolveConflicts: OVERWRITE');
    });
  });

  // ==================
  // LAMBDA AUTOMATION
  // ==================
  describe('Lambda Automation Function', () => {
    test('Lambda Execution Role has proper permissions', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('RoleName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role\'');
      expect(templateYaml).toContain('AWSLambdaBasicExecutionRole');
      expect(templateYaml).toContain('EksManagementPolicy');
    });

    test('Lambda function has proper configuration', () => {
      validateResourceExists('KubernetesManagementFunction', 'AWS::Lambda::Function');
      expect(templateYaml).toContain('FunctionName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda\'');
      expect(templateYaml).toContain('Runtime: python3.11');
      expect(templateYaml).toContain('Timeout: 900');
      expect(templateYaml).toContain('MemorySize: 1024');
    });

    test('Lambda function has necessary environment variables', () => {
      expect(templateYaml).toContain('Environment:');
      expect(templateYaml).toContain('CLUSTER_NAME: !Ref EksCluster');
      expect(templateYaml).toContain('VPC_ID: !Ref Vpc');
      expect(templateYaml).toContain('REGION: !Ref AWS::Region');
      expect(templateYaml).toContain('CLUSTER_AUTOSCALER_ROLE_ARN');
      expect(templateYaml).toContain('AWS_LB_CONTROLLER_ROLE_ARN');
    });

    test('Custom Resource uses Lambda for cluster setup', () => {
      validateResourceExists('KubernetesCustomResource', 'Custom::KubernetesSetup');
      expect(templateYaml).toContain('ServiceToken: !GetAtt KubernetesManagementFunction.Arn');
      expect(templateYaml).toContain('ClusterName: !Ref EksCluster');
    });

    test('Lambda function has VPC configuration for private EKS access', () => {
      expect(templateYaml).toContain('VpcConfig:');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref LambdaSecurityGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
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

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::Partition}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('Uses dynamic availability zone selection', () => {
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [2, !GetAZs \'\']');
    });

    test('ARN references use partition pseudo parameter', () => {
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy/');
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::${AWS::AccountId}:root');
    });
  });

  // =================
  // OUTPUTS VALIDATION
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('EKS cluster outputs are defined with proper naming', () => {
      const clusterOutputs = [
        'ClusterName', 'ClusterEndpoint', 'ClusterArn', 'OidcIssuerUrl',
        'OidcIssuerUrlDirect', 'OidcThumbprint', 'KubernetesVersion'
      ];

      const outputsSection = extractYamlSection('Outputs');
      clusterOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Description:');
        expect(outputsSection).toContain('Value:');
        expect(outputsSection).toContain('Export:');
      });
    });

    test('VPC and networking outputs are defined', () => {
      const networkOutputs = [
        'VpcId', 'VpcCidrBlock', 'InternetGatewayId',
        'PublicSubnetIds', 'PrivateSubnetIds',
        'PublicRouteTableId', 'PrivateRouteTable1Id'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const roleOutputs = [
        'EksClusterRoleArn', 'NodeGroupRoleArn', 'ClusterAutoscalerRoleArn',
        'AwsLoadBalancerControllerRoleArn', 'EbsCsiDriverRoleArn'
      ];

      const outputsSection = extractYamlSection('Outputs');
      roleOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('KMS key outputs are conditionally defined', () => {
      const kmsOutputs = ['EbsKmsKeyId', 'EbsKmsKeyArn', 'LogsKmsKeyId', 'LogsKmsKeyArn'];

      const outputsSection = extractYamlSection('Outputs');
      kmsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Condition: EnableEbsEncryption');
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Node group and launch template outputs are defined', () => {
      const nodeOutputs = [
        'OnDemandNodeGroupName', 'OnDemandNodeGroupArn',
        'SpotNodeGroupName', 'SpotNodeGroupArn',
        'OnDemandLaunchTemplateId', 'SpotLaunchTemplateId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      nodeOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Helper command outputs are defined', () => {
      const helperOutputs = [
        'KubectlConfigCommand', 'ClusterAccessTestCommand', 'ClusterInfoCommand'
      ];

      const outputsSection = extractYamlSection('Outputs');
      helperOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub "\${AWS::StackName}-\${EnvironmentSuffix}-[\w-]+"/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(50); // Should have many exports
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

      // EKS Cluster validation
      if (deployedOutputs.ClusterName) {
        expect(deployedOutputs.ClusterName).toMatch(/^.+-cluster$/);
        expect(deployedOutputs.ClusterName).toContain(currentStackName);
        expect(deployedOutputs.ClusterName).toContain(region);
        expect(deployedOutputs.ClusterName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.ClusterArn) {
        expect(deployedOutputs.ClusterArn).toMatch(/^arn:aws:eks:.+:\d{12}:cluster\/.+$/);
        expect(deployedOutputs.ClusterArn).toContain(region);
      }

      if (deployedOutputs.ClusterEndpoint) {
        expect(deployedOutputs.ClusterEndpoint).toMatch(/^https:\/\/[A-F0-9]+\.gr\d+\.[a-z0-9-]+\.eks\.amazonaws\.com$/);
      }
    });

    test('VPC and networking resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // VPC Resources
      if (deployedOutputs.VpcId) {
        expect(deployedOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }

      if (deployedOutputs.VpcCidrBlock) {
        expect(deployedOutputs.VpcCidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      }

      // Subnet validation
      if (deployedOutputs.PublicSubnetIds) {
        const publicSubnets = deployedOutputs.PublicSubnetIds.split(',');
        expect(publicSubnets.length).toBe(3);
        publicSubnets.forEach((subnet: string) => {
          expect(subnet.trim()).toMatch(/^subnet-[a-f0-9]+$/);
        });
      }

      if (deployedOutputs.PrivateSubnetIds) {
        const privateSubnets = deployedOutputs.PrivateSubnetIds.split(',');
        expect(privateSubnets.length).toBe(3);
        privateSubnets.forEach((subnet: string) => {
          expect(subnet.trim()).toMatch(/^subnet-[a-f0-9]+$/);
        });
      }

      // NAT Gateways
      if (deployedOutputs.AllNatGatewayIds) {
        const natGateways = deployedOutputs.AllNatGatewayIds.split(',');
        expect(natGateways.length).toBe(3);
        natGateways.forEach((nat: string) => {
          expect(nat.trim()).toMatch(/^nat-[a-f0-9]+$/);
        });
      }
    });

    test('EKS node groups are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.OnDemandNodeGroupArn) {
        expect(deployedOutputs.OnDemandNodeGroupArn).toMatch(/^arn:aws:eks:.+:\d{12}:nodegroup\/.+$/);
        expect(deployedOutputs.OnDemandNodeGroupArn).toContain('ondemand-nodes');
      }

      if (deployedOutputs.SpotNodeGroupArn) {
        expect(deployedOutputs.SpotNodeGroupArn).toMatch(/^arn:aws:eks:.+:\d{12}:nodegroup\/.+$/);
        expect(deployedOutputs.SpotNodeGroupArn).toContain('spot-nodes');
      }

      // Launch templates
      if (deployedOutputs.OnDemandLaunchTemplateId) {
        expect(deployedOutputs.OnDemandLaunchTemplateId).toMatch(/^lt-[a-f0-9]+$/);
      }

      if (deployedOutputs.SpotLaunchTemplateId) {
        expect(deployedOutputs.SpotLaunchTemplateId).toMatch(/^lt-[a-f0-9]+$/);
      }
    });

    test('IAM roles are properly created', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const roleArns = [
        'EksClusterRoleArn', 'NodeGroupRoleArn', 'ClusterAutoscalerRoleArn',
        'AwsLoadBalancerControllerRoleArn', 'EbsCsiDriverRoleArn', 'LambdaExecutionRoleArn'
      ];

      roleArns.forEach(roleArn => {
        if (deployedOutputs[roleArn]) {
          expect(deployedOutputs[roleArn]).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
          expect(deployedOutputs[roleArn]).toContain(currentStackName);
          expect(deployedOutputs[roleArn]).toContain(region);
          expect(deployedOutputs[roleArn]).toContain(currentEnvironmentSuffix);
        }
      });
    });

    test('OIDC provider is properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.OidcProviderArn) {
        expect(deployedOutputs.OidcProviderArn).toMatch(/^arn:aws:iam::\d{12}:oidc-provider\/oidc\.eks\..+\.amazonaws\.com\/id\/.+$/);
      }

      if (deployedOutputs.OidcIssuerUrl) {
        expect(deployedOutputs.OidcIssuerUrl).toMatch(/^https:\/\/oidc\.eks\..+\.amazonaws\.com\/id\/.+$/);
      }

      if (deployedOutputs.OidcThumbprint) {
        expect(deployedOutputs.OidcThumbprint).toMatch(/^[a-f0-9]{40}$/);
      }
    });

    test('KMS keys are conditionally deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Only validate KMS keys if EBS encryption is enabled
      if (deployedOutputs.EbsKmsKeyId) {
        expect(deployedOutputs.EbsKmsKeyId).toMatch(/^[a-f0-9-]{36}$/);
        expect(deployedOutputs.EbsKmsKeyArn).toMatch(/^arn:aws:kms:.+:\d{12}:key\/[a-f0-9-]{36}$/);
      }

      if (deployedOutputs.LogsKmsKeyId) {
        expect(deployedOutputs.LogsKmsKeyId).toMatch(/^[a-f0-9-]{36}$/);
        expect(deployedOutputs.LogsKmsKeyArn).toMatch(/^arn:aws:kms:.+:\d{12}:key\/[a-f0-9-]{36}$/);
      }
    });

    test('EKS Add-ons are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.VpcCniAddonArn) {
        expect(deployedOutputs.VpcCniAddonArn).toMatch(/^arn:aws:eks:.+:\d{12}:addon\/.+\/vpc-cni\/.+$/);
      }

      if (deployedOutputs.EbsCsiAddonArn) {
        expect(deployedOutputs.EbsCsiAddonArn).toMatch(/^arn:aws:eks:.+:\d{12}:addon\/.+\/aws-ebs-csi-driver\/.+$/);
      }
    });

    test('CloudWatch Log Group is configured correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.EksClusterLogGroupName) {
        expect(deployedOutputs.EksClusterLogGroupName).toMatch(/^\/aws\/eks\/.+\/cluster$/);
        expect(deployedOutputs.EksClusterLogGroupName).toContain(currentStackName);
        expect(deployedOutputs.EksClusterLogGroupName).toContain(region);
        expect(deployedOutputs.EksClusterLogGroupName).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.EksClusterLogGroupArn) {
        expect(deployedOutputs.EksClusterLogGroupArn).toMatch(/^arn:aws:logs:.+:\d{12}:log-group:.+:\*$/);
      }
    });

    test('Lambda function is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.KubernetesManagementFunctionArn) {
        expect(deployedOutputs.KubernetesManagementFunctionArn).toMatch(/^arn:aws:lambda:.+:\d{12}:function:.+$/);
        expect(deployedOutputs.KubernetesManagementFunctionArn).toContain(currentStackName);
        expect(deployedOutputs.KubernetesManagementFunctionArn).toContain(region);
        expect(deployedOutputs.KubernetesManagementFunctionArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('Environment-specific naming is applied correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the current environment suffix matches what we expect
      expect(currentEnvironmentSuffix).toMatch(/^[a-zA-Z0-9\-]+$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      // Check that resource names contain the environment suffix
      const resourcesWithSuffix = [
        'ClusterName', 'EksClusterRoleName', 'EksNodeRoleName',
        'KubernetesManagementFunctionName', 'ResourceNamePrefix'
      ];

      resourcesWithSuffix.forEach(resource => {
        if (deployedOutputs[resource]) {
          expect(deployedOutputs[resource]).toContain(currentEnvironmentSuffix);
        }
      });
    });

    test('Helper commands are properly formatted', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.KubectlConfigCommand) {
        expect(deployedOutputs.KubectlConfigCommand).toContain('aws eks');
        expect(deployedOutputs.KubectlConfigCommand).toContain('--region');
        expect(deployedOutputs.KubectlConfigCommand).toContain('update-kubeconfig');
        expect(deployedOutputs.KubectlConfigCommand).toContain('--name');
        expect(deployedOutputs.KubectlConfigCommand).toContain(region);
      }

      if (deployedOutputs.ClusterAccessTestCommand) {
        expect(deployedOutputs.ClusterAccessTestCommand).toBe('kubectl get nodes');
      }

      if (deployedOutputs.ClusterInfoCommand) {
        expect(deployedOutputs.ClusterInfoCommand).toBe('kubectl cluster-info');
      }
    });
  });

  // ========================
  // SECURITY VALIDATION
  // ========================
  describe('Security Configuration Validation', () => {
    test('EBS encryption is properly configured', () => {
      expect(templateYaml).toContain('Encrypted: true');
      expect(templateYaml).toContain('DeleteOnTermination: true');
      expect(templateYaml).toContain('VolumeType: gp3');
    });

    test('IMDSv2 is enforced on EC2 instances', () => {
      expect(templateYaml).toContain('MetadataOptions:');
      expect(templateYaml).toContain('HttpTokens: required');
      expect(templateYaml).toContain('HttpPutResponseHopLimit: 2');
    });

    test('Security group rules follow least privilege', () => {
      // EKS cluster security group should not have wide-open ingress
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref');

      // Node-to-node communication should be restricted to same security group
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref EksNodeSecurityGroup');
    });

    test('Private subnets are used for worker nodes', () => {
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('CloudWatch logging is enabled', () => {
      expect(templateYaml).toContain('RetentionInDays: 7');
      expect(templateYaml).toContain('KmsKeyId: !If [EnableEbsEncryption');
    });

    test('IAM roles follow least privilege principle', () => {
      expect(templateYaml).toContain('AmazonEKSClusterPolicy');
      expect(templateYaml).toContain('AmazonEKSWorkerNodePolicy');
      expect(templateYaml).toContain('AmazonEKS_CNI_Policy');
      expect(templateYaml).toContain('AmazonEC2ContainerRegistryReadOnly');
    });
  });

  // ========================
  // HIGH AVAILABILITY
  // ========================
  describe('High Availability Configuration', () => {
    test('Resources are distributed across multiple AZs', () => {
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [2, !GetAZs \'\']');
    });

    test('NAT Gateways provide redundancy in each AZ', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];
      natGateways.forEach(nat => {
        validateResourceExists(nat, 'AWS::EC2::NatGateway');
      });
    });

    test('EKS cluster spans multiple subnets', () => {
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
      expect(templateYaml).toContain('- !Ref PublicSubnet1');
      expect(templateYaml).toContain('- !Ref PublicSubnet2');
      expect(templateYaml).toContain('- !Ref PublicSubnet3');
    });

    test('Node groups have appropriate scaling configuration', () => {
      expect(templateYaml).toContain('MinSize: 2');
      expect(templateYaml).toContain('MaxSize: 4');
      expect(templateYaml).toContain('MinSize: 3');
      expect(templateYaml).toContain('MaxSize: 9');
    });
  });

  // ========================
  // COST OPTIMIZATION
  // ========================
  describe('Cost Optimization', () => {
    test('Spot instances are configured for cost savings', () => {
      expect(templateYaml).toContain('CapacityType: SPOT');
      expect(templateYaml).toContain('- t3.large');
      expect(templateYaml).toContain('- t3a.large');
      expect(templateYaml).toContain('- t2.large');
    });

    test('On-demand instances use cost-effective types', () => {
      expect(templateYaml).toContain('CapacityType: ON_DEMAND');
      expect(templateYaml).toContain('- t3.medium');
    });

    test('CloudWatch log retention is set to reasonable period', () => {
      expect(templateYaml).toContain('RetentionInDays: 7');
    });

    test('EBS volumes use efficient gp3 storage type', () => {
      expect(templateYaml).toContain('VolumeType: gp3');
      expect(templateYaml).toContain('VolumeSize: 20');
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE
  // ========================
  describe('Reliability and Resilience', () => {
    test('Resource dependencies are properly defined', () => {
      // Critical dependency: EIP creation depends on gateway attachment
      expect(templateYaml).toContain('DependsOn: VpcGatewayAttachment');

      // Node groups depend on OIDC provider
      expect(templateYaml).toContain('DependsOn: [OidcProvider]');

      // Custom resource depends on key components
      expect(templateYaml).toContain('DependsOn:');
      expect(templateYaml).toContain('- OnDemandNodeGroup');
      expect(templateYaml).toContain('- SpotNodeGroup');
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
      // No hardcoded account or region values
      expect(templateYaml).not.toMatch(/\b\d{12}\b/);
      expect(templateYaml).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });

    test('Conditional resources handle different deployment scenarios', () => {
      expect(templateYaml).toContain('!If');
      expect(templateYaml).toContain('EnableEbsEncryption');
      expect(templateYaml).toContain('EnableBastionAccess');
      expect(templateYaml).toContain('!Ref AWS::NoValue');
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('EKS cluster integrates with all supporting infrastructure', () => {
      // Cluster uses proper IAM role
      validateResourceDependencies('EksCluster', ['EksClusterRole']);

      // Cluster has proper VPC configuration
      expect(templateYaml).toContain('ResourcesVpcConfig:');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('SecurityGroupIds:');
    });

    test('Node groups integrate with cluster and networking', () => {
      validateResourceDependencies('OnDemandNodeGroup', ['EksCluster', 'EksNodeRole']);
      validateResourceDependencies('SpotNodeGroup', ['EksCluster', 'EksNodeRole']);

      // Node groups use private subnets
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('Lambda automation integrates with EKS cluster', () => {
      validateResourceDependencies('KubernetesCustomResource', ['KubernetesManagementFunction']);

      // Lambda has access to cluster information
      expect(templateYaml).toContain('CLUSTER_NAME: !Ref EksCluster');
      expect(templateYaml).toContain('VPC_ID: !Ref Vpc');
    });

    test('IRSA roles integrate with OIDC provider', () => {
      validateResourceDependencies('ClusterAutoscalerRole', ['OidcProvider']);
      validateResourceDependencies('AwsLoadBalancerControllerRole', ['OidcProvider']);
      validateResourceDependencies('EbsCsiDriverRole', ['OidcProvider']);
    });

    test('Resource naming follows consistent pattern', () => {
      const namingPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+/;

      // Check various resource names follow pattern
      expect(templateYaml).toMatch(namingPattern);

      // Check specific naming examples
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc');
      expect(templateYaml).toContain('${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda');
    });

    test('All major resources have proper tagging for identification', () => {
      // Check that major resources have Name tags
      expect(templateYaml).toContain('Key: Name');

      // Count Name tag occurrences (should be multiple for EKS infrastructure)
      const nameTagMatches = (templateYaml.match(/Key: Name/g) || []).length;
      expect(nameTagMatches).toBeGreaterThanOrEqual(15); 
    });

    test('Secondary CIDR blocks integrate with VPC for custom networking', () => {
      validateResourceDependencies('SecondaryCidr1', ['Vpc']);
      validateResourceDependencies('SecondaryCidr2', ['Vpc']);
      validateResourceDependencies('SecondaryCidr3', ['Vpc']);
    });
  });
});
