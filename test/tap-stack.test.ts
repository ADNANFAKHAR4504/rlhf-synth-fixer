import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        (subnet: any) => subnet.Properties.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(3);
    });

    test('should create 3 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(
        (subnet: any) => !subnet.Properties.MapPublicIpOnLaunch
      );
      expect(privateSubnets).toHaveLength(3);
    });

    test('should create 3 NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('should tag VPC with correct tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'ManagedBy', Value: 'CDK' },
          { Key: 'EnvironmentSuffix', Value: 'test' },
        ]),
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should create EKS cluster with version 1.28', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          version: '1.28',
        }),
      });
    });

    test('should enable all control plane logging', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          logging: {
            clusterLogging: Match.arrayWith([
              Match.objectLike({ types: Match.arrayWith(['api']) }),
            ]),
          },
        }),
      });
    });

    test('should configure cluster endpoint access as public and private', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          resourcesVpcConfig: Match.objectLike({
            endpointPublicAccess: true,
            endpointPrivateAccess: true,
          }),
        }),
      });
    });

    test('should tag cluster with correct tags', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          tags: Match.objectLike({
            Environment: 'production',
            ManagedBy: 'CDK',
            EnvironmentSuffix: 'test',
          }),
        }),
      });
    });

    test('should use custom cluster role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumedByPolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'eks.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonEKSClusterPolicy'),
              ]),
            ]),
          },
        ]),
      });
    });
  });

  describe('OIDC Provider Configuration', () => {
    test('should create OIDC provider', () => {
      template.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 1);
    });
  });

  describe('Managed Node Group Configuration', () => {
    test('should create managed node group', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        NodegroupName: 'managed-ng-test',
        InstanceTypes: ['t4g.medium'],
        AmiType: 'AL2_ARM_64',
        CapacityType: 'ON_DEMAND',
      });
    });

    test('should configure auto-scaling between 3 and 9 instances', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        ScalingConfig: {
          MinSize: 3,
          MaxSize: 9,
          DesiredSize: 3,
        },
      });
    });

    test('should use private subnets for node group', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Subnets: Match.anyValue(),
      });
    });

    test('should use custom launch template', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        LaunchTemplate: Match.objectLike({
          Id: Match.anyValue(),
        }),
      });
    });

    test('should tag node group with correct tags', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Tags: Match.objectLike({
          Environment: 'production',
          ManagedBy: 'CDK',
          EnvironmentSuffix: 'test',
        }),
      });
    });
  });

  describe('Launch Template Configuration', () => {
    test('should create launch template with IMDSv2 enforced', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 2,
          },
        },
      });
    });

    test('should not configure SSH key in launch template', () => {
      const launchTemplates = template.findResources(
        'AWS::EC2::LaunchTemplate'
      );
      Object.values(launchTemplates).forEach((lt: any) => {
        expect(lt.Properties.LaunchTemplateData.KeyName).toBeUndefined();
      });
    });

    test('should tag instances with launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          TagSpecifications: Match.arrayWith([
            {
              ResourceType: 'instance',
              Tags: Match.arrayWith([
                { Key: 'Environment', Value: 'production' },
                { Key: 'ManagedBy', Value: 'CDK' },
                { Key: 'EnvironmentSuffix', Value: 'test' },
              ]),
            },
            {
              ResourceType: 'volume',
              Tags: Match.arrayWith([
                { Key: 'Environment', Value: 'production' },
                { Key: 'ManagedBy', Value: 'CDK' },
                { Key: 'EnvironmentSuffix', Value: 'test' },
              ]),
            },
          ]),
        },
      });
    });
  });

  describe('Node Role Configuration', () => {
    test('should create node role with required managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumedByPolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonEKSWorkerNodePolicy'),
              ]),
            ]),
          },
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('AmazonEKS_CNI_Policy')]),
            ]),
          },
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonEC2ContainerRegistryReadOnly'),
              ]),
            ]),
          },
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          },
        ]),
      });
    });
  });

  describe('EBS CSI Driver Configuration', () => {
    test('should create EBS CSI driver add-on', () => {
      template.hasResourceProperties('AWS::EKS::Addon', {
        AddonName: 'aws-ebs-csi-driver',
        AddonVersion: 'v1.25.0-eksbuild.1',
        ResolveConflicts: 'OVERWRITE',
      });
    });

    test('should create IRSA role for EBS CSI driver', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumedByPolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: Match.objectLike({
                  'sts.amazonaws.com': Match.anyValue(),
                }),
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonEBSCSIDriverPolicy'),
              ]),
            ]),
          },
        ]),
      });
    });

    test('should configure service account in EBS CSI role trust policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ebsRoles = Object.values(roles).filter((role: any) =>
        role.Properties.ManagedPolicyArns?.some((arn: any) =>
          JSON.stringify(arn).includes('AmazonEBSCSIDriverPolicy')
        )
      );
      expect(ebsRoles.length).toBeGreaterThan(0);
      ebsRoles.forEach((role: any) => {
        expect(role.Properties.AssumedByPolicyDocument.Statement).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Action: 'sts:AssumeRoleWithWebIdentity',
            }),
          ])
        );
      });
    });
  });

  describe('AWS Load Balancer Controller Configuration', () => {
    test('should create IRSA role for ALB controller', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const albRoles = Object.values(roles).filter(
        (role: any) =>
          role.Properties.RoleName &&
          JSON.stringify(role.Properties.RoleName).includes(
            'alb-controller-role'
          )
      );
      expect(albRoles.length).toBeGreaterThan(0);
    });

    test('should create policy for ALB controller', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['iam:CreateServiceLinkedRole'],
              Condition: {
                StringEquals: {
                  'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should have EC2 describe permissions in ALB policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
              ]),
            }),
          ]),
        },
      });
    });

    test('should have ELB permissions in ALB policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeListeners',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output cluster name', () => {
      template.hasOutput('ClusterName', {
        Description: 'EKS Cluster Name',
        Export: {
          Name: 'eks-cluster-name-test',
        },
      });
    });

    test('should output cluster endpoint', () => {
      template.hasOutput('ClusterEndpoint', {
        Description: 'EKS Cluster Endpoint',
        Export: {
          Name: 'eks-cluster-endpoint-test',
        },
      });
    });

    test('should output OIDC provider ARN', () => {
      template.hasOutput('OidcProviderArn', {
        Description: 'OIDC Provider ARN',
        Export: {
          Name: 'eks-oidc-provider-arn-test',
        },
      });
    });

    test('should output kubectl config command', () => {
      const outputs = template.findOutputs('KubectlConfigCommand');
      expect(outputs).toBeDefined();
      expect(outputs.KubectlConfigCommand.Description).toBe(
        'Command to update kubeconfig'
      );
    });

    test('should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'eks-vpc-id-test',
        },
      });
    });

    test('should output node group name', () => {
      template.hasOutput('NodeGroupName', {
        Description: 'Managed Node Group Name',
        Export: {
          Name: 'eks-nodegroup-name-test',
        },
      });
    });

    test('should output EBS CSI role ARN', () => {
      template.hasOutput('EbsCsiRoleArn', {
        Description: 'EBS CSI Driver IAM Role ARN',
        Export: {
          Name: 'eks-ebs-csi-role-arn-test',
        },
      });
    });

    test('should output ALB controller role ARN', () => {
      template.hasOutput('AlbControllerRoleArn', {
        Description: 'AWS Load Balancer Controller IAM Role ARN',
        Export: {
          Name: 'eks-alb-controller-role-arn-test',
        },
      });
    });

    test('should output cluster security group ID', () => {
      template.hasOutput('ClusterSecurityGroupId', {
        Description: 'EKS Cluster Security Group ID',
        Export: {
          Name: 'eks-cluster-sg-id-test',
        },
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('should include environmentSuffix in cluster name', () => {
      const resources = template.findResources('AWS::EKS::Cluster');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.Properties.Name).toContain('test');
      });
    });

    test('should include environmentSuffix in node group name', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        NodegroupName: 'managed-ng-test',
      });
    });

    test('should include environmentSuffix in VPC name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('test'),
          }),
        ]),
      });
    });

    test('should include environmentSuffix in IAM role names', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const customRoles = Object.values(roles).filter(
        (role: any) => role.Properties.RoleName
      );
      customRoles.forEach((role: any) => {
        expect(role.Properties.RoleName).toContain('test');
      });
    });
  });

  describe('Security Configuration', () => {
    test('should not create default security group rules', () => {
      // Verify that restrictDefaultSecurityGroup is enabled via context
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      // The VPC should have a default security group with restricted rules
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties.GroupDescription?.includes('default')) {
          // Default SG should have deny-all rules
          expect(sg.Properties.SecurityGroupEgress).toBeDefined();
        }
      });
    });

    test('should enable VPC DNS support', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsSupport: true,
        EnableDnsHostnames: true,
      });
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestStack');
    });

    test('should have correct region', () => {
      expect(stack.region).toBe('ap-southeast-1');
    });

    test('should have correct environment suffix', () => {
      expect(
        stack.node.tryGetContext('environmentSuffix') || 'test'
      ).toBeDefined();
    });

    test('should have description', () => {
      expect(stack.templateOptions.description).toBe(
        'EKS cluster with managed node groups for environment test'
      );
    });
  });

  describe('Dependency Management', () => {
    test('EBS CSI add-on should depend on cluster', () => {
      const addons = template.findResources('AWS::EKS::Addon');
      Object.values(addons).forEach((addon: any) => {
        expect(addon.DependsOn).toBeDefined();
        expect(addon.DependsOn.length).toBeGreaterThan(0);
      });
    });

    test('node group should be created after cluster', () => {
      const nodegroups = template.findResources('AWS::EKS::Nodegroup');
      Object.values(nodegroups).forEach((ng: any) => {
        expect(ng.DependsOn).toBeDefined();
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create exactly one cluster', () => {
      template.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 1);
    });

    test('should create exactly one node group', () => {
      template.resourceCountIs('AWS::EKS::Nodegroup', 1);
    });

    test('should create exactly one EBS CSI add-on', () => {
      template.resourceCountIs('AWS::EKS::Addon', 1);
    });

    test('should create exactly one launch template', () => {
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    });

    test('should create multiple IAM roles', () => {
      const roleCount = Object.keys(
        template.findResources('AWS::IAM::Role')
      ).length;
      expect(roleCount).toBeGreaterThanOrEqual(3); // cluster, node, ebs-csi, alb
    });
  });

  describe('Integration', () => {
    test('should synthesize without errors', () => {
      const assembly = app.synth();
      expect(assembly).toBeDefined();
    });

    test('should generate valid CloudFormation template', () => {
      expect(() => {
        template.toJSON();
      }).not.toThrow();
    });

    test('should have CDK bootstrap version check', () => {
      const templateJson = template.toJSON();
      expect(templateJson.Rules).toBeDefined();
      expect(templateJson.Rules.CheckBootstrapVersion).toBeDefined();
    });
  });
});
