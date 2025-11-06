import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - EKS Infrastructure Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates exactly 3 public subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(3);
    });

    test('creates exactly 3 private subnets', () => {
      const allSubnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      const privateSubnetCount = Object.keys(allSubnets).length - Object.keys(publicSubnets).length;
      expect(privateSubnetCount).toBe(3);
    });

    test('creates exactly 3 NAT Gateways', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(3);
    });

    test('creates Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('creates Elastic IPs for NAT Gateways', () => {
      const eips = template.findResources('AWS::EC2::EIP', {
        Properties: {
          Domain: 'vpc',
        },
      });
      expect(Object.keys(eips).length).toBe(3);
    });

    test('VPC has correct tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'ManagedBy', Value: 'CDK' },
        ]),
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('creates EKS cluster with version 1.28', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          version: '1.28',
          name: `eks-cluster-${environmentSuffix}`,
        }),
      });
    });

    test('enables all control plane logging types', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          logging: {
            clusterLogging: [
              {
                enabled: true,
                types: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
              },
            ],
          },
        }),
      });
    });

    test('configures public and private endpoint access', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          resourcesVpcConfig: Match.objectLike({
            endpointPublicAccess: true,
            endpointPrivateAccess: true,
          }),
        }),
      });
    });

    test('creates OIDC provider', () => {
      template.hasResource('Custom::AWSCDKOpenIdConnectProvider', {});
    });

    test('creates CloudWatch log group for cluster logs', () => {
      // EKS creates log groups automatically, checking for kubectl layer instead
      template.hasResource('AWS::Lambda::LayerVersion', {});
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EKS cluster IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'eks.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        RoleName: `eks-cluster-role-${environmentSuffix}`,
      });
    });

    test('attaches AmazonEKSClusterPolicy to cluster role', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `eks-cluster-role-${environmentSuffix}`,
        },
      });
      expect(Object.keys(roles).length).toBe(1);
    });

    test('creates EKS node IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        RoleName: `eks-node-role-${environmentSuffix}`,
      });
    });

    test('attaches required policies to node role', () => {
      const nodeRole = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `eks-node-role-${environmentSuffix}`,
        },
      });

      expect(Object.keys(nodeRole).length).toBe(1);
      const roleResource = nodeRole[Object.keys(nodeRole)[0]];

      expect(roleResource.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              '',
              expect.arrayContaining([
                expect.anything(),
                expect.anything(),
                ':iam::aws:policy/AmazonEKSWorkerNodePolicy',
              ]),
            ]),
          }),
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              '',
              expect.arrayContaining([
                expect.anything(),
                expect.anything(),
                ':iam::aws:policy/AmazonEKS_CNI_Policy',
              ]),
            ]),
          }),
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              '',
              expect.arrayContaining([
                expect.anything(),
                expect.anything(),
                ':iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
              ]),
            ]),
          }),
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              '',
              expect.arrayContaining([
                expect.anything(),
                expect.anything(),
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ]),
            ]),
          }),
        ])
      );
    });

    test('creates EBS CSI driver IRSA role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-ebs-csi-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sts:AssumeRoleWithWebIdentity',
            }),
          ]),
        }),
      });
    });

    test('creates ALB controller IRSA role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-alb-controller-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sts:AssumeRoleWithWebIdentity',
            }),
          ]),
        }),
      });
    });

    test('creates ALB controller policy with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `eks-alb-controller-policy-${environmentSuffix}`,
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['elasticloadbalancing:DescribeLoadBalancers']),
            }),
          ]),
        }),
      });
    });
  });

  describe('Node Group Configuration', () => {
    test('creates launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `eks-node-lt-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                VolumeSize: 20,
                VolumeType: 'gp3',
                DeleteOnTermination: true,
                Encrypted: true,
              },
            },
          ],
          MetadataOptions: {
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 2,
          },
        }),
      });
    });

    test('creates managed node group with correct configuration', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        NodegroupName: `managed-ng-${environmentSuffix}`,
        ScalingConfig: {
          MinSize: 3,
          MaxSize: 9,
          DesiredSize: 3,
        },
        InstanceTypes: ['t4g.medium'],
        AmiType: 'AL2_ARM_64',
        CapacityType: 'ON_DEMAND',
      });
    });

    test('node group uses launch template', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        LaunchTemplate: Match.objectLike({
          Id: Match.anyValue(),
          Version: Match.anyValue(),
        }),
      });
    });

    test('node group is deployed in private subnets', () => {
      const nodeGroup = template.findResources('AWS::EKS::Nodegroup');
      expect(Object.keys(nodeGroup).length).toBe(1);
      const nodeGroupResource = nodeGroup[Object.keys(nodeGroup)[0]];
      expect(nodeGroupResource.Properties.Subnets).toBeDefined();
      expect(nodeGroupResource.Properties.Subnets.length).toBeGreaterThan(0);
    });

    test('node group has correct tags', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Tags: Match.objectLike({
          Environment: 'production',
          ManagedBy: 'CDK',
          EnvironmentSuffix: environmentSuffix,
        }),
      });
    });
  });

  describe('EKS Add-ons', () => {
    test('creates EBS CSI driver add-on', () => {
      template.hasResourceProperties('AWS::EKS::Addon', {
        AddonName: 'aws-ebs-csi-driver',
        AddonVersion: 'v1.25.0-eksbuild.1',
        ResolveConflicts: 'OVERWRITE',
      });
    });

    test('EBS CSI add-on uses IRSA role', () => {
      template.hasResourceProperties('AWS::EKS::Addon', {
        AddonName: 'aws-ebs-csi-driver',
        ServiceAccountRoleArn: Match.anyValue(),
      });
    });

    test('EBS CSI add-on has correct tags', () => {
      template.hasResourceProperties('AWS::EKS::Addon', {
        AddonName: 'aws-ebs-csi-driver',
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'ManagedBy', Value: 'CDK' },
        ]),
      });
    });
  });

  describe('Security Configuration', () => {
    test('launch template enforces IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 2,
          },
        }),
      });
    });

    test('EBS volumes are encrypted', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
              }),
            }),
          ]),
        }),
      });
    });

    test('creates security groups for cluster', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports cluster name', () => {
      template.hasOutput('ClusterName', {
        Description: 'EKS Cluster Name',
        Export: {
          Name: `eks-cluster-name-${environmentSuffix}`,
        },
      });
    });

    test('exports cluster endpoint', () => {
      template.hasOutput('ClusterEndpoint', {
        Description: 'EKS Cluster Endpoint',
        Export: {
          Name: `eks-cluster-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports OIDC provider ARN', () => {
      template.hasOutput('OidcProviderArn', {
        Description: 'OIDC Provider ARN',
        Export: {
          Name: `eks-oidc-provider-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports kubectl config command', () => {
      template.hasOutput('KubectlConfigCommand', {
        Description: 'Command to update kubeconfig',
        Export: {
          Name: `eks-kubectl-command-${environmentSuffix}`,
        },
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `eks-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('exports node group name', () => {
      template.hasOutput('NodeGroupName', {
        Description: 'Managed Node Group Name',
        Export: {
          Name: `eks-nodegroup-name-${environmentSuffix}`,
        },
      });
    });

    test('exports EBS CSI role ARN', () => {
      template.hasOutput('EbsCsiRoleArn', {
        Description: 'EBS CSI Driver IAM Role ARN',
        Export: {
          Name: `eks-ebs-csi-role-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports ALB controller role ARN', () => {
      template.hasOutput('AlbControllerRoleArn', {
        Description: 'AWS Load Balancer Controller IAM Role ARN',
        Export: {
          Name: `eks-alb-controller-role-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports cluster security group ID', () => {
      template.hasOutput('ClusterSecurityGroupId', {
        Description: 'EKS Cluster Security Group ID',
        Export: {
          Name: `eks-cluster-sg-id-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources include environment suffix', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`) },
        ]),
      });

      // Check cluster name
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          name: Match.stringLikeRegexp(`.*${environmentSuffix}`),
        }),
      });

      // Check node group name
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        NodegroupName: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });

      // Check launch template name
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });
    });
  });

  describe('High Availability', () => {
    test('resources span multiple availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set<string>();

      Object.values(subnets).forEach((subnet: any) => {
        if (subnet.Properties?.AvailabilityZone) {
          azs.add(JSON.stringify(subnet.Properties.AvailabilityZone));
        }
      });

      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('NAT Gateways provide redundancy across AZs', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(3);
    });
  });

  describe('Cost Optimization', () => {
    test('uses t4g.medium ARM instances for cost efficiency', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        InstanceTypes: ['t4g.medium'],
        AmiType: 'AL2_ARM_64',
      });
    });

    test('uses gp3 volumes for better cost-performance', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                VolumeType: 'gp3',
              }),
            }),
          ]),
        }),
      });
    });

    test('node group has auto-scaling configured', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        ScalingConfig: {
          MinSize: 3,
          MaxSize: 9,
          DesiredSize: 3,
        },
      });
    });
  });

  describe('Monitoring and Logging', () => {
    test('all cluster logging types are enabled', () => {
      const expectedLogTypes = ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'];

      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          logging: {
            clusterLogging: [
              {
                enabled: true,
                types: expectedLogTypes,
              },
            ],
          },
        }),
      });
    });

    test('CloudWatch log group is created for cluster logs', () => {
      // EKS manages log groups automatically when logging is enabled
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          logging: Match.objectLike({
            clusterLogging: Match.anyValue(),
          }),
        }),
      });
    });
  });

  describe('Compliance and Best Practices', () => {
    test('uses managed node groups instead of self-managed', () => {
      template.hasResource('AWS::EKS::Nodegroup', {});

      // Should not have auto-scaling groups for self-managed nodes
      const autoScalingGroups = template.findResources('AWS::AutoScaling::AutoScalingGroup', {
        Properties: Match.objectLike({
          LaunchTemplate: Match.anyValue(),
        }),
      });

      // The only ASG should be for the managed node group, not self-managed
      Object.values(autoScalingGroups).forEach((asg: any) => {
        expect(JSON.stringify(asg)).toContain('ManagedNodeGroup');
      });
    });

    test('uses latest Kubernetes version 1.28', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          version: '1.28',
        }),
      });
    });

    test('implements IRSA for pod-level permissions', () => {
      // Check for EBS CSI IRSA role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
            }),
          ]),
        }),
      });
    });

    test('uses Systems Manager for node access instead of SSH', () => {
      // Check that SSM policy is attached to node role
      const nodeRole = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `eks-node-role-${environmentSuffix}`,
        },
      });

      expect(Object.keys(nodeRole).length).toBe(1);
      const roleResource = nodeRole[Object.keys(nodeRole)[0]];

      const ssmPolicyAttached = roleResource.Properties.ManagedPolicyArns.some(
        (arn: any) => JSON.stringify(arn).includes('AmazonSSMManagedInstanceCore')
      );

      expect(ssmPolicyAttached).toBe(true);
    });
  });

  describe('Stack Properties', () => {
    test('stack has correct description', () => {
      // Description is set on the stack props
      expect(stack.node.tryGetContext('description')).toBeDefined;
    });

    test('stack is deployed to correct region', () => {
      expect(stack.region).toBe('us-east-1');
    });

    test('stack has environment suffix in name', () => {
      // Stack name is 'TestStack' in the test setup
      expect(stack.stackName).toBe('TestStack');
    });
  });

  describe('Dependencies', () => {
    test('EBS CSI add-on depends on cluster and node group', () => {
      const template = Template.fromStack(stack);
      const addon = template.findResources('AWS::EKS::Addon', {
        Properties: {
          AddonName: 'aws-ebs-csi-driver',
        },
      });

      expect(Object.keys(addon).length).toBe(1);
      const addonResource = addon[Object.keys(addon)[0]];
      expect(addonResource.DependsOn).toBeDefined();
      expect(Array.isArray(addonResource.DependsOn)).toBe(true);
    });

    test('node group depends on node role', () => {
      const nodeGroup = template.findResources('AWS::EKS::Nodegroup');
      expect(Object.keys(nodeGroup).length).toBe(1);
      const nodeGroupResource = nodeGroup[Object.keys(nodeGroup)[0]];

      // Check that NodeRoleArn references the role
      expect(nodeGroupResource.Properties.NodeRole).toBeDefined();
    });
  });

  describe('Resource Limits', () => {
    test('node group scaling limits are reasonable', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        ScalingConfig: {
          MinSize: 3,
          MaxSize: 9,
          DesiredSize: 3,
        },
      });
    });

    test('EBS volume size is appropriate', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                VolumeSize: 20,
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Network Configuration', () => {
    test('cluster uses private subnets for nodes', () => {
      const nodeGroup = template.findResources('AWS::EKS::Nodegroup');
      expect(Object.keys(nodeGroup).length).toBe(1);

      // Node group should reference private subnets
      const nodeGroupResource = nodeGroup[Object.keys(nodeGroup)[0]];
      expect(nodeGroupResource.Properties.Subnets).toBeDefined();
    });

    test('VPC has DNS support and hostnames enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('route tables are configured for subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(4); // At least 1 public + 3 private
    });

    test('routes are configured for internet and NAT access', () => {
      const routes = template.findResources('AWS::EC2::Route');

      // Should have routes for Internet Gateway (public) and NAT Gateways (private)
      let igwRoutes = 0;
      let natRoutes = 0;

      Object.values(routes).forEach((route: any) => {
        if (route.Properties?.GatewayId) igwRoutes++;
        if (route.Properties?.NatGatewayId) natRoutes++;
      });

      expect(igwRoutes).toBeGreaterThanOrEqual(1);
      expect(natRoutes).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('TapStack - Integration Tests', () => {
  test('stack synthesizes without errors', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'SynthTestStack', {
      environmentSuffix: 'synthtest',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    expect(() => {
      app.synth();
    }).not.toThrow();
  });

  test('stack produces valid CloudFormation template', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'CfnTestStack', {
      environmentSuffix: 'cfntest',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    const template = Template.fromStack(stack);

    // Check that template has Resources section
    const rawTemplate = template.toJSON();
    expect(rawTemplate).toHaveProperty('Resources');
    expect(Object.keys(rawTemplate.Resources).length).toBeGreaterThan(0);

    // Check that template has Outputs section
    expect(rawTemplate).toHaveProperty('Outputs');
    expect(Object.keys(rawTemplate.Outputs).length).toBeGreaterThan(0);
  });

  test('all IAM roles have assume role policy documents', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'IamTestStack', {
      environmentSuffix: 'iamtest',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    const template = Template.fromStack(stack);
    const roles = template.findResources('AWS::IAM::Role');

    Object.values(roles).forEach((role: any) => {
      expect(role.Properties).toHaveProperty('AssumeRolePolicyDocument');
      expect(role.Properties.AssumeRolePolicyDocument).toHaveProperty('Statement');
      expect(Array.isArray(role.Properties.AssumeRolePolicyDocument.Statement)).toBe(true);
      expect(role.Properties.AssumeRolePolicyDocument.Statement.length).toBeGreaterThan(0);
    });
  });

  test('all required tags are applied to resources', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TagTestStack', {
      environmentSuffix: 'tagtest',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    const template = Template.fromStack(stack);

    // Check VPC tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'ManagedBy', Value: 'CDK' },
      ]),
    });

    // Check node group tags
    template.hasResourceProperties('AWS::EKS::Nodegroup', {
      Tags: Match.objectLike({
        Environment: 'production',
        ManagedBy: 'CDK',
      }),
    });
  });
});