import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Production-ready EKS Cluster Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';
  let currentEnvironment = 'unknown-environment';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.Region ||
          deployedOutputs.ClusterArn?.split(':')[3] ||
          deployedOutputs.EKSClusterRoleArn?.split(':')[3] ||
          deployedOutputs.VPCId?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from outputs
        currentStackName = deployedOutputs.StackName || 'TapStack';

        // Extract environment suffix from outputs
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix || 'pr4056';

        // Extract environment from outputs  
        currentEnvironment = deployedOutputs.Environment || 'Production';

        // If outputs don't have these values, try to extract from resource ARNs
        if (currentStackName === 'TapStack' && deployedOutputs.ClusterArn) {
          // Extract from cluster ARN pattern
          const arnParts = deployedOutputs.ClusterArn.split('/');
          if (arnParts.length > 1) {
            const clusterName = arnParts[1];
            // Cluster name might be just the parameter value, not the full resource name
            currentStackName = deployedOutputs.StackName || 'TapStack';
          }
        }

        // If still no environment suffix, try to extract from role names or function names
        if (currentEnvironmentSuffix === 'pr4056') {
          const roleNames = [
            deployedOutputs.EKSClusterRoleName,
            deployedOutputs.SystemNodeRoleName,
            deployedOutputs.ApplicationNodeRoleName,
            deployedOutputs.OIDCProviderFunctionName
          ];

          for (const roleName of roleNames) {
            if (roleName) {
              const nameParts = roleName.split('-');
              const envSuffixIndex = nameParts.findIndex((part: string) =>
                part.match(/^(pr|dev|prod|test)\d+$/) ||
                (part.startsWith('pr') && part.length > 2)
              );
              if (envSuffixIndex >= 0) {
                currentEnvironmentSuffix = nameParts[envSuffixIndex];
                break;
              }
            }
          }
        }

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('Environment:', currentEnvironment);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('Environment:', currentEnvironment);
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
    // Check for both quoted and unquoted resource types
    const quotedType = `Type: '${resourceType}'`;
    const unquotedType = `Type: ${resourceType}`;
    const doubleQuotedType = `Type: "${resourceType}"`;

    const hasQuotedType = templateYaml.includes(quotedType);
    const hasUnquotedType = templateYaml.includes(unquotedType);
    const hasDoubleQuotedType = templateYaml.includes(doubleQuotedType);

    expect(hasQuotedType || hasUnquotedType || hasDoubleQuotedType).toBe(true);
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
      expect(templateYaml).toContain('Description: \'Production-ready Amazon EKS cluster with OIDC provider, managed node groups, and CloudWatch Container Insights\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates production-ready EKS cluster', () => {
      expect(templateYaml).toContain('Production-ready Amazon EKS cluster');
      expect(templateYaml).toContain('OIDC provider');
      expect(templateYaml).toContain('managed node groups');
      expect(templateYaml).toContain('CloudWatch Container Insights');
    });

    test('Template contains all critical AWS resource types for EKS infrastructure', () => {
      const criticalResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::SecurityGroupIngress',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::IAM::Role',
        'AWS::IAM::Policy',
        'AWS::Lambda::Function',
        'AWS::EKS::Cluster',
        'AWS::EKS::Nodegroup',
        'AWS::EKS::Addon'
      ];

      criticalResourceTypes.forEach(resourceType => {
        const hasUnquotedType = templateYaml.includes(`Type: ${resourceType}`);
        const hasQuotedType = templateYaml.includes(`Type: '${resourceType}'`);
        const hasDoubleQuotedType = templateYaml.includes(`Type: "${resourceType}"`);
        expect(hasUnquotedType || hasQuotedType || hasDoubleQuotedType).toBeTruthy();
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
      expect(templateYaml).toContain('Default: \'pr4056\'');
      expect(templateYaml).toContain('parallel deployments');
    });

    test('ClusterName parameter has proper validation', () => {
      expect(templateYaml).toContain('ClusterName:');
      expect(templateYaml).toContain('Type: String');
      expect(templateYaml).toContain('Default: \'production-eks\'');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z][a-zA-Z0-9\\-]*$\'');
    });

    test('KubernetesVersion parameter supports multiple versions', () => {
      expect(templateYaml).toContain('KubernetesVersion:');
      expect(templateYaml).toContain('Default: \'1.28\'');
      expect(templateYaml).toContain('AllowedValues:');
      expect(templateYaml).toContain('- \'1.28\'');
      expect(templateYaml).toContain('- \'1.29\'');
      expect(templateYaml).toContain('- \'1.30\'');
    });

    test('VpcCidr parameter has proper CIDR validation', () => {
      expect(templateYaml).toContain('VpcCidr:');
      expect(templateYaml).toContain('Default: \'10.0.0.0/16\'');
      expect(templateYaml).toContain('AllowedPattern:');
    });

    test('Node group parameters have proper numeric constraints', () => {
      const nodeGroupParams = [
        'SystemNodeGroupMinSize',
        'SystemNodeGroupMaxSize',
        'SystemNodeGroupDesiredSize',
        'ApplicationNodeGroupMinSize',
        'ApplicationNodeGroupMaxSize',
        'ApplicationNodeGroupDesiredSize'
      ];

      nodeGroupParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('Type: Number');
        expect(templateYaml).toContain('MinValue: 1');
      });
    });

    test('Instance type parameters have sensible defaults', () => {
      expect(templateYaml).toContain('SystemNodeInstanceType:');
      expect(templateYaml).toContain('Default: \'t3.medium\'');
      expect(templateYaml).toContain('ApplicationNodeInstanceType:');
      expect(templateYaml).toContain('Default: \'t3.large\'');
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Networking Resources - High Availability Architecture', () => {
    test('VPC is properly configured with standard CIDR block', () => {
      validateResourceExists('VPC', 'AWS::EC2::VPC');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
    });

    test('VPC has proper resource tags', () => {
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc\'');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Key: ManagedBy');
      expect(templateYaml).toContain('Value: CloudFormation');
    });

    test('Internet Gateway is properly configured', () => {
      validateResourceExists('InternetGateway', 'AWS::EC2::InternetGateway');
      validateResourceExists('VPCGatewayAttachment', 'AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
    });

    test('Public subnets are properly configured across multiple AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

      publicSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain('VpcId: !Ref VPC');
        expect(templateYaml).toContain('MapPublicIpOnLaunch: true');
        expect(templateYaml).toContain(`!Select [${index}, !GetAZs '']`);
      });

      // Verify CIDR allocation
      expect(templateYaml).toContain('!Select [0, !Cidr [!Ref VpcCidr, 6, 12]]');
      expect(templateYaml).toContain('!Select [1, !Cidr [!Ref VpcCidr, 6, 12]]');
      expect(templateYaml).toContain('!Select [2, !Cidr [!Ref VpcCidr, 6, 12]]');
    });

    test('Private subnets are properly configured for EKS nodes', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];

      privateSubnets.forEach((subnet, index) => {
        validateResourceExists(subnet, 'AWS::EC2::Subnet');
        expect(templateYaml).toContain('VpcId: !Ref VPC');
        expect(templateYaml).toContain(`!Select [${index}, !GetAZs '']`);
      });

      // Verify EKS cluster tags
      expect(templateYaml).toContain('Key: !Sub \'kubernetes.io/cluster/${ClusterName}\'');
      expect(templateYaml).toContain('Value: shared');

      // Verify private CIDR allocation
      expect(templateYaml).toContain('!Select [3, !Cidr [!Ref VpcCidr, 6, 12]]');
      expect(templateYaml).toContain('!Select [4, !Cidr [!Ref VpcCidr, 6, 12]]');
      expect(templateYaml).toContain('!Select [5, !Cidr [!Ref VpcCidr, 6, 12]]');
    });

    test('NAT Gateway is properly configured for outbound connectivity', () => {
      validateResourceExists('NatGateway1EIP', 'AWS::EC2::EIP');
      validateResourceExists('NatGateway1', 'AWS::EC2::NatGateway');

      expect(templateYaml).toContain('Domain: vpc');
      expect(templateYaml).toContain('DependsOn: VPCGatewayAttachment');
      expect(templateYaml).toContain('AllocationId: !GetAtt NatGateway1EIP.AllocationId');
      expect(templateYaml).toContain('SubnetId: !Ref PublicSubnet1');
    });

    test('Route tables are properly configured', () => {
      validateResourceExists('PublicRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PrivateRouteTable', 'AWS::EC2::RouteTable');
      validateResourceExists('PublicRoute', 'AWS::EC2::Route');
      validateResourceExists('PrivateRoute', 'AWS::EC2::Route');

      // Public route to Internet Gateway
      expect(templateYaml).toContain('DestinationCidrBlock: \'0.0.0.0/0\'');
      expect(templateYaml).toContain('GatewayId: !Ref InternetGateway');

      // Private route to NAT Gateway
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway1');
    });

    test('Subnet route table associations are configured', () => {
      const publicAssociations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation'
      ];

      const privateAssociations = [
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PrivateSubnet3RouteTableAssociation'
      ];

      [...publicAssociations, ...privateAssociations].forEach(association => {
        validateResourceExists(association, 'AWS::EC2::SubnetRouteTableAssociation');
      });

      expect(templateYaml).toContain('RouteTableId: !Ref PublicRouteTable');
      expect(templateYaml).toContain('RouteTableId: !Ref PrivateRouteTable');
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - Network Security Controls', () => {
    test('Cluster Security Group is properly configured', () => {
      validateResourceExists('ClusterSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: \'Security group for EKS cluster\'');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('SecurityGroupEgress:');
      expect(templateYaml).toContain('IpProtocol: -1');
      expect(templateYaml).toContain('CidrIp: \'0.0.0.0/0\'');
    });

    test('Node Security Group is properly configured', () => {
      validateResourceExists('NodeSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: \'Security group for EKS nodes\'');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
      expect(templateYaml).toContain('Key: !Sub \'kubernetes.io/cluster/${ClusterName}\'');
      expect(templateYaml).toContain('Value: owned');
    });

    test('Load Balancer Security Group allows HTTP/HTTPS traffic', () => {
      validateResourceExists('LoadBalancerSecurityGroup', 'AWS::EC2::SecurityGroup');
      expect(templateYaml).toContain('GroupDescription: \'Security group for load balancers\'');

      // HTTP and HTTPS ingress rules
      expect(templateYaml).toContain('FromPort: 80');
      expect(templateYaml).toContain('ToPort: 80');
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('ToPort: 443');
      expect(templateYaml).toContain('CidrIp: \'0.0.0.0/0\'');
    });

    test('Security group rules are properly separated to avoid circular dependencies', () => {
      const securityGroupRules = [
        'NodeSecurityGroupIngress',
        'ClusterSecurityGroupIngress',
        'NodeSecurityGroupFromCluster',
        'NodeSecurityGroupFromClusterKubelet',
        'NodeSecurityGroupFromLB80',
        'NodeSecurityGroupFromLB443'
      ];

      securityGroupRules.forEach(rule => {
        validateResourceExists(rule, 'AWS::EC2::SecurityGroupIngress');
      });

      // Verify proper rule configuration
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref NodeSecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref ClusterSecurityGroup');
      expect(templateYaml).toContain('SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup');
      expect(templateYaml).toContain('FromPort: 443');
      expect(templateYaml).toContain('FromPort: 10250');
    });
  });

  // ===========
  // IAM ROLES
  // ===========
  describe('IAM Resources - Least Privilege Access', () => {
    test('EKS Cluster Role has proper assume role policy and managed policies', () => {
      validateResourceExists('EKSClusterRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('AssumeRolePolicyDocument:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Service: eks.amazonaws.com');
      expect(templateYaml).toContain('Action: \'sts:AssumeRole\'');
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy/AmazonEKSClusterPolicy');
    });

    test('Node Group Roles have required managed policies', () => {
      const nodeRoles = ['SystemNodeRole', 'ApplicationNodeRole'];
      const requiredPolicies = [
        'AmazonEKSWorkerNodePolicy',
        'AmazonEC2ContainerRegistryReadOnly',
        'AmazonEKS_CNI_Policy'
      ];

      nodeRoles.forEach(role => {
        validateResourceExists(role, 'AWS::IAM::Role');
        expect(templateYaml).toContain('Service: ec2.amazonaws.com');

        requiredPolicies.forEach(policy => {
          expect(templateYaml).toContain(`arn:\${AWS::Partition}:iam::aws:policy/${policy}`);
        });
      });
    });

    test('Cluster Autoscaler Policy has appropriate permissions', () => {
      validateResourceExists('ClusterAutoscalerPolicy', 'AWS::IAM::Policy');

      const autoscalerActions = [
        'autoscaling:DescribeAutoScalingGroups',
        'autoscaling:DescribeAutoScalingInstances',
        'autoscaling:DescribeLaunchConfigurations',
        'autoscaling:DescribeTags',
        'autoscaling:SetDesiredCapacity',
        'autoscaling:TerminateInstanceInAutoScalingGroup',
        'ec2:DescribeLaunchTemplateVersions',
        'ec2:DescribeInstanceTypes'
      ];

      autoscalerActions.forEach(action => {
        expect(templateYaml).toContain(action);
      });

      expect(templateYaml).toContain('Resource: \'*\'');
      expect(templateYaml).toContain('Roles:');
      expect(templateYaml).toContain('- !Ref SystemNodeRole');
    });

    test('CloudWatch Observability Role is configured for IRSA', () => {
      validateResourceExists('CloudWatchObservabilityRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Federated: !Sub \'arn:${AWS::Partition}:iam::${AWS::AccountId}:oidc-provider/${OIDCProvider.OIDCIssuer}\'');
      expect(templateYaml).toContain('Action: \'sts:AssumeRoleWithWebIdentity\'');
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('Lambda Execution Role has EKS and OIDC management permissions', () => {
      validateResourceExists('LambdaExecutionRole', 'AWS::IAM::Role');

      expect(templateYaml).toContain('Service: lambda.amazonaws.com');
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');

      // EKS and OIDC permissions
      const lambdaActions = [
        'eks:DescribeCluster',
        'iam:CreateOpenIDConnectProvider',
        'iam:DeleteOpenIDConnectProvider',
        'iam:GetOpenIDConnectProvider',
        'iam:TagOpenIDConnectProvider'
      ];

      lambdaActions.forEach(action => {
        expect(templateYaml).toContain(action);
      });
    });

    test('All IAM roles have consistent naming patterns', () => {
      const iamRoles = [
        'EKSClusterRole',
        'SystemNodeRole',
        'ApplicationNodeRole',
        'CloudWatchObservabilityRole',
        'LambdaExecutionRole'
      ];

      iamRoles.forEach(role => {
        expect(templateYaml).toContain(`RoleName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-`);
      });
    });
  });

  // =============
  // LAMBDA FUNCTION
  // =============
  describe('Lambda Function - OIDC Provider Management', () => {
    test('OIDC Provider Function is properly configured', () => {
      validateResourceExists('OIDCProviderFunction', 'AWS::Lambda::Function');

      expect(templateYaml).toContain('Runtime: python3.11');
      expect(templateYaml).toContain('Handler: index.handler');
      expect(templateYaml).toContain('Timeout: 300');
      expect(templateYaml).toContain('Role: !GetAtt LambdaExecutionRole.Arn');
    });

    test('Lambda function code includes proper OIDC management logic', () => {
      expect(templateYaml).toContain('import json');
      expect(templateYaml).toContain('import boto3');
      expect(templateYaml).toContain('import cfnresponse');
      expect(templateYaml).toContain('eks = boto3.client(\'eks\', region_name=region)');
      expect(templateYaml).toContain('iam = boto3.client(\'iam\')');
      expect(templateYaml).toContain('sts = boto3.client(\'sts\')');
    });

    test('Lambda function includes regional thumbprint mapping', () => {
      expect(templateYaml).toContain('region_thumbprints = {');
      expect(templateYaml).toContain('\"us-east-1\"');
      expect(templateYaml).toContain('\"us-west-2\"');
      expect(templateYaml).toContain('\"eu-west-1\"');
      expect(templateYaml).toContain('\"ap-south-1\"');
    });

    test('Lambda function handles EKS cluster OIDC issuer extraction', () => {
      expect(templateYaml).toContain('cluster = eks.describe_cluster(name=cluster_name)');
      expect(templateYaml).toContain('issuer_url = cluster[\'identity\'][\'oidc\'][\'issuer\']');
      expect(templateYaml).toContain('issuer_host = issuer_url.replace(\'https://\', \'\')');
    });

    test('Lambda function includes regional thumbprint mapping', () => {
      expect(templateYaml).toContain('region_thumbprints = {');
      expect(templateYaml).toContain('\"us-east-1\"');
      expect(templateYaml).toContain('\"us-west-2\"');
      expect(templateYaml).toContain('\"eu-west-1\"');
      expect(templateYaml).toContain('\"ap-south-1\"');
    });

    test('Lambda function has proper error handling and CloudFormation response', () => {
      expect(templateYaml).toContain('try:');
      expect(templateYaml).toContain('except Exception as e:');
      expect(templateYaml).toContain('cfnresponse.send(event, context, cfnresponse.SUCCESS');
      expect(templateYaml).toContain('cfnresponse.send(event, context, cfnresponse.FAILED');
    });

    test('Lambda function waits for EKS cluster to become ACTIVE', () => {
      expect(templateYaml).toContain('Waiting for cluster');
      expect(templateYaml).toContain('to become ACTIVE');
      expect(templateYaml).toContain('for _ in range(60):');
      expect(templateYaml).toContain('status = cluster[\'status\']');
    });
  });

  // ===============
  // EKS CLUSTER
  // ===============
  describe('EKS Cluster - Container Orchestration Platform', () => {
    test('EKS Cluster is properly configured', () => {
      validateResourceExists('EKSCluster', 'AWS::EKS::Cluster');

      expect(templateYaml).toContain('Name: !Ref ClusterName');
      expect(templateYaml).toContain('Version: !Ref KubernetesVersion');
      expect(templateYaml).toContain('RoleArn: !GetAtt EKSClusterRole.Arn');
    });

    test('EKS Cluster VPC configuration uses private subnets', () => {
      expect(templateYaml).toContain('ResourcesVpcConfig:');
      expect(templateYaml).toContain('SecurityGroupIds:');
      expect(templateYaml).toContain('- !Ref ClusterSecurityGroup');
      expect(templateYaml).toContain('SubnetIds:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('EKS Cluster has private-only endpoint access', () => {
      expect(templateYaml).toContain('EndpointPrivateAccess: true');
      expect(templateYaml).toContain('EndpointPublicAccess: false');
    });

    test('OIDC Provider custom resource is properly configured', () => {
      validateResourceExists('OIDCProvider', 'Custom::OIDCProvider');
      expect(templateYaml).toContain('DependsOn: EKSCluster');
      expect(templateYaml).toContain('ServiceToken: !GetAtt OIDCProviderFunction.Arn');
      expect(templateYaml).toContain('ClusterName: !Ref ClusterName');
      expect(templateYaml).toContain('Region: !Ref \'AWS::Region\'');
    });
  });

  // ===============
  // NODE GROUPS
  // ===============
  describe('Node Groups - Worker Node Management', () => {
    test('System Node Group is properly configured', () => {
      validateResourceExists('SystemNodeGroup', 'AWS::EKS::Nodegroup');

      expect(templateYaml).toContain('DependsOn: OIDCProvider');
      expect(templateYaml).toContain('ClusterName: !Ref EKSCluster');
      expect(templateYaml).toContain('NodeRole: !GetAtt SystemNodeRole.Arn');
      expect(templateYaml).toContain('AmiType: BOTTLEROCKET_x86_64');
      expect(templateYaml).toContain('nodegroup-type: system');
    });

    test('Application Node Group is properly configured', () => {
      validateResourceExists('ApplicationNodeGroup', 'AWS::EKS::Nodegroup');

      expect(templateYaml).toContain('DependsOn: OIDCProvider');
      expect(templateYaml).toContain('ClusterName: !Ref EKSCluster');
      expect(templateYaml).toContain('NodeRole: !GetAtt ApplicationNodeRole.Arn');
      expect(templateYaml).toContain('AmiType: BOTTLEROCKET_x86_64');
      expect(templateYaml).toContain('nodegroup-type: application');
    });

    test('Node groups have proper scaling configuration', () => {
      // System nodes scaling
      expect(templateYaml).toContain('MinSize: !Ref SystemNodeGroupMinSize');
      expect(templateYaml).toContain('MaxSize: !Ref SystemNodeGroupMaxSize');
      expect(templateYaml).toContain('DesiredSize: !Ref SystemNodeGroupDesiredSize');

      // Application nodes scaling
      expect(templateYaml).toContain('MinSize: !Ref ApplicationNodeGroupMinSize');
      expect(templateYaml).toContain('MaxSize: !Ref ApplicationNodeGroupMaxSize');
      expect(templateYaml).toContain('DesiredSize: !Ref ApplicationNodeGroupDesiredSize');
    });

    test('Node groups use proper instance types', () => {
      expect(templateYaml).toContain('InstanceTypes:');
      expect(templateYaml).toContain('- !Ref SystemNodeInstanceType');
      expect(templateYaml).toContain('- !Ref ApplicationNodeInstanceType');
    });

    test('Node groups are deployed in private subnets across multiple AZs', () => {
      expect(templateYaml).toContain('Subnets:');
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });
  });

  // =======================
  // CLOUDWATCH ADDON
  // =======================
  describe('CloudWatch Container Insights Add-on', () => {
    test('CloudWatch Add-on is properly configured', () => {
      validateResourceExists('CloudWatchAddon', 'AWS::EKS::Addon');

      expect(templateYaml).toContain('AddonName: amazon-cloudwatch-observability');
      expect(templateYaml).toContain('AddonVersion: !Ref CloudWatchAddonVersion');
      expect(templateYaml).toContain('ClusterName: !Ref EKSCluster');
      expect(templateYaml).toContain('ServiceAccountRoleArn: !GetAtt CloudWatchObservabilityRole.Arn');
      expect(templateYaml).toContain('ResolveConflicts: OVERWRITE');
    });

    test('CloudWatch Add-on depends on system node group', () => {
      expect(templateYaml).toContain('DependsOn:');
      expect(templateYaml).toContain('- SystemNodeGroup');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('EKS Cluster outputs are defined with proper naming', () => {
      const clusterOutputs = [
        'ClusterName', 'ClusterEndpoint', 'ClusterArn',
        'ClusterSecurityGroupId', 'ClusterVersion'
      ];

      const outputsSection = extractYamlSection('Outputs');
      clusterOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Description:');
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub \'${AWS::StackName}-');
      });
    });

    test('OIDC Provider outputs are defined', () => {
      const oidcOutputs = ['OIDCIssuerURL', 'OIDCProviderArn'];

      const outputsSection = extractYamlSection('Outputs');
      oidcOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('VPC and networking outputs are defined', () => {
      const networkingOutputs = [
        'VPCId', 'VPCCidr', 'InternetGatewayId',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id', 'PublicSubnetIds',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id', 'PrivateSubnetIds',
        'NatGateway1Id', 'NatGateway1EIP',
        'PublicRouteTableId', 'PrivateRouteTableId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      networkingOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Security group outputs are defined', () => {
      const securityOutputs = [
        'ClusterSecurityGroupIdManual',
        'NodeSecurityGroupId',
        'LoadBalancerSecurityGroupId'
      ];

      const outputsSection = extractYamlSection('Outputs');
      securityOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const iamOutputs = [
        'EKSClusterRoleArn', 'EKSClusterRoleName',
        'SystemNodeRoleArn', 'SystemNodeRoleName',
        'ApplicationNodeRoleArn', 'ApplicationNodeRoleName',
        'CloudWatchObservabilityRoleArn', 'CloudWatchObservabilityRoleName',
        'LambdaExecutionRoleArn', 'LambdaExecutionRoleName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Node group outputs are defined', () => {
      const nodeGroupOutputs = [
        'SystemNodeGroupName', 'SystemNodeGroupArn', 'SystemNodeGroupStatus',
        'ApplicationNodeGroupName', 'ApplicationNodeGroupArn', 'ApplicationNodeGroupStatus'
      ];

      const outputsSection = extractYamlSection('Outputs');
      nodeGroupOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Lambda function outputs are defined', () => {
      const lambdaOutputs = [
        'OIDCProviderFunctionArn',
        'OIDCProviderFunctionName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      lambdaOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('CloudWatch add-on outputs are defined', () => {
      const cloudwatchOutputs = [
        'CloudWatchAddonName',
        'CloudWatchAddonStatus',
        'CloudWatchAddonVersion'
      ];

      const outputsSection = extractYamlSection('Outputs');
      cloudwatchOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Environment and configuration outputs are defined', () => {
      const envOutputs = [
        'StackName', 'Region', 'Environment', 'EnvironmentSuffix',
        'SystemNodeInstanceType', 'ApplicationNodeInstanceType',
        'SystemNodeGroupScaling', 'ApplicationNodeGroupScaling'
      ];

      const outputsSection = extractYamlSection('Outputs');
      envOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent export naming convention', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(50); // Should have many exports
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

    test('No hardcoded region names in template (excluding Lambda function code)', () => {
      // Extract the template without the Lambda function code section
      const lambdaCodePattern = /Code:\s*ZipFile:\s*\|[\s\S]*?(?=\n\s*Tags:)/;
      const templateWithoutLambdaCode = templateYaml.replace(lambdaCodePattern, 'Code:\n        ZipFile: "# Lambda function code removed for testing"');

      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      expect(templateWithoutLambdaCode).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::Partition}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);
    });

    test('ARN references use proper AWS partition naming', () => {
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::aws:policy');
      expect(templateYaml).toContain('arn:${AWS::Partition}:iam::${AWS::AccountId}:');
    });

    test('Availability zones are dynamically selected', () => {
      expect(templateYaml).toContain('!GetAZs \'\'');
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [2, !GetAZs \'\']');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('EKS Security Best Practices', () => {
    test('EKS cluster endpoints are configured securely', () => {
      expect(templateYaml).toContain('EndpointPrivateAccess: true');
      expect(templateYaml).toContain('EndpointPublicAccess: false');
    });

    test('Node groups use Bottlerocket AMI for enhanced security', () => {
      expect(templateYaml).toContain('AmiType: BOTTLEROCKET_x86_64');
    });

    test('IAM roles follow least privilege principles', () => {
      // Node roles only have required EKS policies
      expect(templateYaml).toContain('AmazonEKSWorkerNodePolicy');
      expect(templateYaml).toContain('AmazonEC2ContainerRegistryReadOnly');
      expect(templateYaml).toContain('AmazonEKS_CNI_Policy');

      // Cluster role only has cluster policy
      expect(templateYaml).toContain('AmazonEKSClusterPolicy');

      // CloudWatch role uses IRSA instead of EC2 instance profile
      expect(templateYaml).toContain('sts:AssumeRoleWithWebIdentity');
    });

    test('Security groups enforce proper network segmentation', () => {
      // Separate security groups for different tiers
      expect(templateYaml).toContain('Security group for EKS cluster');
      expect(templateYaml).toContain('Security group for EKS nodes');
      expect(templateYaml).toContain('Security group for load balancers');

      // Rules allow only necessary communication
      expect(templateYaml).toContain('Allow nodes to communicate with each other');
      expect(templateYaml).toContain('Allow pods to communicate with the cluster API Server');
    });

    test('Network isolation through private subnets', () => {
      // EKS cluster in private subnets only
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');

      // Outbound internet access through NAT Gateway only
      expect(templateYaml).toContain('NatGatewayId: !Ref NatGateway1');
    });

    test('Container insights for monitoring and observability', () => {
      expect(templateYaml).toContain('amazon-cloudwatch-observability');
      expect(templateYaml).toContain('ServiceAccountRoleArn: !GetAtt CloudWatchObservabilityRole.Arn');
    });
  });

  // ========================
  // END-TO-END INTEGRATION
  // ========================
  describe('End-to-End Integration Tests', () => {
    test('EKS cluster integrates with OIDC provider for IRSA', () => {
      // Custom resource creates OIDC provider after cluster
      validateResourceDependencies('OIDCProvider', ['EKSCluster']);

      // CloudWatch role uses OIDC provider for web identity
      expect(templateYaml).toContain('Federated: !Sub \'arn:${AWS::Partition}:iam::${AWS::AccountId}:oidc-provider/${OIDCProvider.OIDCIssuer}\'');

      // Lambda function manages OIDC provider lifecycle
      expect(templateYaml).toContain('ServiceToken: !GetAtt OIDCProviderFunction.Arn');
    });

    test('Node groups depend on OIDC provider setup', () => {
      expect(templateYaml).toContain('DependsOn: OIDCProvider');
    });

    test('CloudWatch addon integrates with node groups and service account role', () => {
      expect(templateYaml).toContain('DependsOn:');
      expect(templateYaml).toContain('- SystemNodeGroup');
      expect(templateYaml).toContain('ServiceAccountRoleArn: !GetAtt CloudWatchObservabilityRole.Arn');
    });

    test('Network architecture supports EKS communication patterns', () => {
      // Private subnets for nodes
      validateResourceDependencies('SystemNodeGroup', ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3']);
      validateResourceDependencies('ApplicationNodeGroup', ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3']);

      // Security groups allow cluster-node communication
      expect(templateYaml).toContain('Allow pods to communicate with the cluster API Server');
      expect(templateYaml).toContain('Allow cluster to manage nodes');
    });

    test('Resource tagging supports proper resource organization', () => {
      // Consistent tagging pattern
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Key: Environment');
      expect(templateYaml).toContain('Key: ManagedBy');
      expect(templateYaml).toContain('Value: CloudFormation');

      // EKS-specific tagging for subnets
      expect(templateYaml).toContain('Key: !Sub \'kubernetes.io/cluster/${ClusterName}\'');
      expect(templateYaml).toContain('Value: shared');
      expect(templateYaml).toContain('Value: owned');
    });

    test('Lambda function handles OIDC provider lifecycle correctly', () => {
      // Create/Update operations
      expect(templateYaml).toContain('if event[\'RequestType\'] in [\'Create\', \'Update\']:');

      // Delete operations
      expect(templateYaml).toContain('elif event[\'RequestType\'] == \'Delete\':');

      // Proper error handling and CloudFormation responses
      expect(templateYaml).toContain('cfnresponse.send(event, context, cfnresponse.SUCCESS');
      expect(templateYaml).toContain('cfnresponse.send(event, context, cfnresponse.FAILED');
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

      // EKS Cluster
      if (deployedOutputs.ClusterArn) {
        expect(deployedOutputs.ClusterArn).toMatch(/^arn:aws:eks:/);
        expect(deployedOutputs.ClusterArn).toContain(region);
      }

      if (deployedOutputs.ClusterName) {
        expect(deployedOutputs.ClusterName).toBeTruthy();
      }
    });

    test('Node groups are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const nodeGroupOutputs = [
        'SystemNodeGroupArn',
        'ApplicationNodeGroupArn',
        'SystemNodeGroupName',
        'ApplicationNodeGroupName'
      ];

      nodeGroupOutputs.forEach(output => {
        if (deployedOutputs[output]) {
          if (output.includes('Arn')) {
            expect(deployedOutputs[output]).toMatch(/^arn:aws:eks:/);
            expect(deployedOutputs[output]).toContain(region);
          }

          if (output.includes('Name')) {
            expect(deployedOutputs[output]).toContain(currentEnvironmentSuffix);
          }
        }
      });
    });

    test('Security groups are properly configured', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const securityGroupOutputs = [
        'ClusterSecurityGroupId',
        'NodeSecurityGroupId',
        'LoadBalancerSecurityGroupId'
      ];

      securityGroupOutputs.forEach(sgOutput => {
        if (deployedOutputs[sgOutput]) {
          expect(deployedOutputs[sgOutput]).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });

    test('IAM resources follow expected patterns', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const iamArnOutputs = [
        'EKSClusterRoleArn',
        'SystemNodeRoleArn',
        'ApplicationNodeRoleArn',
        'CloudWatchObservabilityRoleArn',
        'LambdaExecutionRoleArn'
      ];

      iamArnOutputs.forEach(arnOutput => {
        if (deployedOutputs[arnOutput]) {
          expect(deployedOutputs[arnOutput]).toMatch(/^arn:aws:iam::\d{12}:role\//);
          expect(deployedOutputs[arnOutput]).toContain(currentEnvironmentSuffix);
        }
      });
    });

    test('OIDC Provider outputs are valid', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.OIDCProviderArn) {
        expect(deployedOutputs.OIDCProviderArn).toMatch(/^arn:aws:iam::\d{12}:oidc-provider\//);
      }

      if (deployedOutputs.OIDCIssuerURL) {
        expect(deployedOutputs.OIDCIssuerURL).toMatch(/^oidc\.eks\./);
        expect(deployedOutputs.OIDCIssuerURL).toContain(region);
      }
    });

    test('Lambda function is properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.OIDCProviderFunctionArn) {
        expect(deployedOutputs.OIDCProviderFunctionArn).toMatch(/^arn:aws:lambda:/);
        expect(deployedOutputs.OIDCProviderFunctionArn).toContain(region);
        expect(deployedOutputs.OIDCProviderFunctionArn).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.OIDCProviderFunctionName) {
        expect(deployedOutputs.OIDCProviderFunctionName).toContain(currentStackName);
        expect(deployedOutputs.OIDCProviderFunctionName).toContain(region);
        expect(deployedOutputs.OIDCProviderFunctionName).toContain(currentEnvironmentSuffix);
      }
    });

    test('Environment configuration is consistent', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Environment values should match what we extracted
      if (deployedOutputs.Environment) {
        expect(deployedOutputs.Environment).toBe(currentEnvironment);
      }

      if (deployedOutputs.EnvironmentSuffix) {
        expect(deployedOutputs.EnvironmentSuffix).toBe(currentEnvironmentSuffix);
      }

      if (deployedOutputs.Region) {
        expect(deployedOutputs.Region).toBe(region);
      }

      if (deployedOutputs.StackName) {
        expect(deployedOutputs.StackName).toBe(currentStackName);
      }
    });

    test('Scaling configuration outputs are properly formatted', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const scalingOutputs = [
        'SystemNodeGroupScaling',
        'ApplicationNodeGroupScaling'
      ];

      scalingOutputs.forEach(scalingOutput => {
        if (deployedOutputs[scalingOutput]) {
          // Should be in format "min/desired/max"
          expect(deployedOutputs[scalingOutput]).toMatch(/^\d+\/\d+\/\d+$/);
        }
      });
    });
  });

  // ========================
  // PERFORMANCE & COST
  // ========================
  describe('Performance and Cost Optimization', () => {
    test('Node groups use cost-effective instance types by default', () => {
      expect(templateYaml).toContain('Default: \'t3.medium\''); // System nodes
      expect(templateYaml).toContain('Default: \'t3.large\'');  // Application nodes
    });

    test('Node group scaling parameters are set to reasonable defaults', () => {
      // System nodes: smaller scale
      expect(templateYaml).toContain('Default: 2'); // Min/Desired for system
      expect(templateYaml).toContain('Default: 6'); // Max for system

      // Application nodes: larger scale
      expect(templateYaml).toContain('Default: 3');  // Min/Desired for application  
      expect(templateYaml).toContain('Default: 10'); // Max for application
    });

    test('Kubernetes version supports latest stable release', () => {
      expect(templateYaml).toContain('Default: \'1.28\'');
      expect(templateYaml).toContain('- \'1.28\'');
      expect(templateYaml).toContain('- \'1.29\'');
      expect(templateYaml).toContain('- \'1.30\'');
    });

    test('NAT Gateway configuration balances cost and availability', () => {
      // Single NAT Gateway for cost optimization
      expect(templateYaml).toContain('NatGateway1:');
      expect(templateYaml).not.toContain('NatGateway2:');
      expect(templateYaml).not.toContain('NatGateway3:');
    });
  });

  // ========================
  // RELIABILITY & RESILIENCE  
  // ========================
  describe('Reliability and Resilience', () => {
    test('Multi-AZ deployment provides high availability', () => {
      // Resources span 3 AZs
      expect(templateYaml).toContain('!Select [0, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [1, !GetAZs \'\']');
      expect(templateYaml).toContain('!Select [2, !GetAZs \'\']');

      // Node groups deployed across all private subnets
      expect(templateYaml).toContain('- !Ref PrivateSubnet1');
      expect(templateYaml).toContain('- !Ref PrivateSubnet2');
      expect(templateYaml).toContain('- !Ref PrivateSubnet3');
    });

    test('Bottlerocket AMI provides enhanced security and reliability', () => {
      expect(templateYaml).toContain('AmiType: BOTTLEROCKET_x86_64');
    });

    test('CloudWatch Container Insights enables comprehensive monitoring', () => {
      expect(templateYaml).toContain('amazon-cloudwatch-observability');
      expect(templateYaml).toContain('ResolveConflicts: OVERWRITE');
    });

    test('Lambda function includes proper timeout and retry logic', () => {
      expect(templateYaml).toContain('Timeout: 300'); // 5 minutes
      expect(templateYaml).toContain('for _ in range(60):'); // Retry loop
      expect(templateYaml).toContain('time.sleep(10)'); // Wait between retries
    });

    test('Cluster autoscaler policy enables automatic scaling', () => {
      expect(templateYaml).toContain('ClusterAutoscalerPolicy');
      expect(templateYaml).toContain('autoscaling:SetDesiredCapacity');
      expect(templateYaml).toContain('autoscaling:TerminateInstanceInAutoScalingGroup');
    });

    test('OIDC provider enables workload identity for enhanced security', () => {
      expect(templateYaml).toContain('sts:AssumeRoleWithWebIdentity');
      expect(templateYaml).toContain('Custom::OIDCProvider');
    });

    test('Proper dependency management ensures correct deployment order', () => {
      // Critical dependencies
      validateResourceDependencies('OIDCProvider', ['EKSCluster']);
      validateResourceDependencies('SystemNodeGroup', ['OIDCProvider']);
      validateResourceDependencies('ApplicationNodeGroup', ['OIDCProvider']);
      validateResourceDependencies('CloudWatchAddon', ['SystemNodeGroup']);

      // Network dependencies
      expect(templateYaml).toContain('DependsOn: VPCGatewayAttachment');
    });
  });
});
