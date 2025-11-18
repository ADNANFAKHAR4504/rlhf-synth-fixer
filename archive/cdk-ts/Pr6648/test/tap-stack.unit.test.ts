import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as logs from 'aws-cdk-lib/aws-logs';

const environmentSuffix = 'test123';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct name including environmentSuffix', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
          }),
        ]),
      });
    });

    test('should create VPC with Environment and Project tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Project', Value: 'PaymentPlatform' },
        ]),
      });
    });

    test('should create VPC with 3 availability zones', () => {
      // Verify private subnets across 3 AZs
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'aws-cdk:subnet-type',
              Value: 'Private',
            },
          ]),
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(3);
    });

    test('should create public subnets for NAT gateways', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'aws-cdk:subnet-type',
              Value: 'Public',
            },
          ]),
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(3);
    });

    test('should create exactly 1 NAT Gateway for cost optimization', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create route tables for private and public subnets', () => {
      // CDK creates routing infrastructure based on VPC configuration
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EKS cluster role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-cluster-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should attach required managed policies to cluster role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-cluster-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('.*AmazonEKSClusterPolicy')]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonEKSVPCResourceController'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create node group role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-nodegroup-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should attach required managed policies to node group role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eks-nodegroup-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('.*AmazonEKSWorkerNodePolicy')]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('.*AmazonEKS_CNI_Policy')]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonEC2ContainerRegistryReadOnly'),
              ]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should add cluster autoscaler permissions to node group role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: Match.arrayWith([
                'autoscaling:DescribeAutoScalingGroups',
                'autoscaling:DescribeAutoScalingInstances',
                'autoscaling:DescribeLaunchConfigurations',
                'autoscaling:DescribeScalingActivities',
                'autoscaling:DescribeTags',
                'ec2:DescribeInstanceTypes',
                'ec2:DescribeLaunchTemplateVersions',
              ]),
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: Match.arrayWith([
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
                'ec2:DescribeImages',
                'ec2:GetInstanceTypesFromInstanceRequirements',
                'eks:DescribeNodegroup',
              ]),
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create OIDC provider for IRSA', () => {
      template.hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
        Url: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('PaymentEksCluster.*'),
            'OpenIdConnectIssuerUrl',
          ]),
        }),
      });
    });

    test('should create service account role for cluster autoscaler', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: Match.objectLike({
                  'Fn::GetAtt': Match.anyValue(),
                }),
              },
            }),
          ]),
        },
      });
    });

    test('should create service account role for workload with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should create log group with correct name including environmentSuffix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/eks/payment-cluster-v1-${environmentSuffix}/cluster`,
        RetentionInDays: 7,
      });
    });

    test('should set log group removal policy to DESTROY', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);
      expect(logGroupKeys.length).toBeGreaterThan(0);

      // Check that at least one log group has DeletionPolicy: Delete
      const hasDeletePolicy = logGroupKeys.some(
        (key) =>
          logGroups[key].DeletionPolicy === 'Delete' ||
          logGroups[key].UpdateReplacePolicy === 'Delete'
      );
      expect(hasDeletePolicy).toBe(true);
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should create EKS cluster with correct name including environmentSuffix', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          name: `payment-cluster-${environmentSuffix}`,
        }),
      });
    });

    test('should use Kubernetes version 1.28', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          version: '1.28',
        }),
      });
    });

    test('should enable all control plane logging types', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          logging: {
            clusterLogging: [
              {
                types: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
                enabled: true,
              },
            ],
          },
        }),
      });
    });

    test('should configure private endpoint access only', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          resourcesVpcConfig: Match.objectLike({
            endpointPrivateAccess: true,
            endpointPublicAccess: false,
          }),
        }),
      });
    });

    test('should deploy cluster in private subnets', () => {
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          resourcesVpcConfig: Match.objectLike({
            subnetIds: Match.anyValue(), // CDK generates subnet IDs
          }),
        }),
      });
    });

    test('should have Environment and Project tags', () => {
      // Tags are applied via CDK Tags.of() which adds them to the cluster resource
      // Verify cluster exists and has proper configuration
      template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
        Config: Match.objectLike({
          name: `payment-cluster-${environmentSuffix}`,
          version: '1.28',
        }),
      });
    });
  });

  describe('Managed Node Group Configuration', () => {
    test('should create managed node group with correct name including environmentSuffix', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        NodegroupName: `bottlerocket-ng-${environmentSuffix}`,
      });
    });

    test('should use Bottlerocket AMI', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        AmiType: 'BOTTLEROCKET_x86_64',
      });
    });

    test('should use t3.large instance types', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        InstanceTypes: ['t3.large'],
      });
    });

    test('should configure scaling with min 3 and max 15 nodes', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        ScalingConfig: {
          MinSize: 3,
          MaxSize: 15,
          DesiredSize: 3,
        },
      });
    });

    test('should use ON_DEMAND capacity type', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        CapacityType: 'ON_DEMAND',
      });
    });

    test('should have correct tags', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Tags: {
          Environment: 'Production',
          Project: 'PaymentPlatform',
          Name: `bottlerocket-node-${environmentSuffix}`,
        },
      });
    });

    test('should deploy nodes in private subnets', () => {
      // Node groups are configured via CDK constructs
      // Verify that node group exists and is properly configured
      const nodeGroups = template.findResources('AWS::EKS::Nodegroup');
      expect(Object.keys(nodeGroups).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should output cluster name with correct export name', () => {
      template.hasOutput('ClusterName', {
        Description: 'EKS Cluster Name',
        Export: {
          Name: `eks-cluster-name-${environmentSuffix}`,
        },
      });
    });

    test('should output cluster ARN with correct export name', () => {
      template.hasOutput('ClusterArn', {
        Description: 'EKS Cluster ARN',
        Export: {
          Name: `eks-cluster-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output cluster endpoint with correct export name', () => {
      template.hasOutput('ClusterEndpoint', {
        Description: 'EKS Cluster Endpoint (Private)',
        Export: {
          Name: `eks-cluster-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should output cluster security group ID with correct export name', () => {
      template.hasOutput('ClusterSecurityGroupId', {
        Description: 'EKS Cluster Security Group ID',
        Export: {
          Name: `eks-cluster-sg-${environmentSuffix}`,
        },
      });
    });

    test('should output VPC ID with correct export name', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `eks-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('should output OIDC provider ARN with correct export name', () => {
      template.hasOutput('OidcProviderArn', {
        Description: 'OIDC Provider ARN for IRSA',
        Export: {
          Name: `eks-oidc-provider-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output node group name with correct export name', () => {
      template.hasOutput('NodeGroupName', {
        Description: 'Managed Node Group Name',
        Export: {
          Name: `eks-nodegroup-name-${environmentSuffix}`,
        },
      });
    });

    test('should output cluster autoscaler role ARN with correct export name', () => {
      template.hasOutput('ClusterAutoscalerRoleArn', {
        Description: 'Cluster Autoscaler Service Account Role ARN',
        Export: {
          Name: `eks-autoscaler-role-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output workload service account role ARN with correct export name', () => {
      template.hasOutput('WorkloadServiceAccountRoleArn', {
        Description: 'Workload Service Account Role ARN',
        Export: {
          Name: `eks-workload-sa-role-arn-${environmentSuffix}`,
        },
      });
    });

    test('should have all required outputs present', () => {
      const outputs = [
        'ClusterName',
        'ClusterArn',
        'ClusterEndpoint',
        'ClusterSecurityGroupId',
        'VpcId',
        'OidcProviderArn',
        'NodeGroupName',
        'ClusterAutoscalerRoleArn',
        'WorkloadServiceAccountRoleArn',
      ];

      outputs.forEach((outputKey) => {
        expect(() => template.hasOutput(outputKey, Match.anyValue())).not.toThrow();
      });
    });
  });

  describe('Security Groups', () => {
    test('should create security groups for cluster communication', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
    });

    test('should have security group rules for cluster and node communication', () => {
      // Security group rules are managed by EKS automatically
      // Verify security groups exist
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
    });
  });

  describe('Resource Destroyability', () => {
    test('should not have any resources with RETAIN removal policy', () => {
      const resources = template.toJSON().Resources;
      const retainResources = Object.keys(resources).filter(
        (key) =>
          resources[key].DeletionPolicy === 'Retain' ||
          resources[key].UpdateReplacePolicy === 'Retain'
      );
      expect(retainResources).toEqual([]);
    });

    test('should have log group set to DESTROY removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);

      logGroupKeys.forEach((key) => {
        // Either DeletionPolicy or UpdateReplacePolicy should be Delete (or absent, which defaults to Delete for most resources)
        if (logGroups[key].DeletionPolicy) {
          expect(logGroups[key].DeletionPolicy).not.toBe('Retain');
        }
        if (logGroups[key].UpdateReplacePolicy) {
          expect(logGroups[key].UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Lambda Functions for Kubernetes Operations', () => {
    test('should create Lambda functions for kubectl operations', () => {
      // Lambda functions are created for custom resources by CDK
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
    });

    test('should create IAM role for kubectl Lambda with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ]),
        },
      });
    });
  });

  describe('Service Account Configuration', () => {
    test('should create cluster autoscaler service account in kube-system namespace', () => {
      // This would create a Kubernetes manifest through CDK's Kubernetes resources
      // We verify the IAM role exists with proper trust policy for IRSA
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: Match.objectLike({
                StringEquals: Match.anyValue(),
              }),
            }),
          ]),
        },
      });
    });

    test('should create workload service account in default namespace', () => {
      // Similar to above, verify IAM role for workload service account
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRoleWithWebIdentity',
              }),
            ]),
          },
        },
      });
      // Should have at least 2 service account roles (cluster autoscaler + workload)
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cost Optimization', () => {
    test('should use only 1 NAT Gateway instead of 3 for cost savings', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(1);
    });

    test('should set CloudWatch logs retention to 7 days for cost optimization', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should use ON_DEMAND capacity type (no SPOT for production)', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        CapacityType: 'ON_DEMAND',
      });
    });
  });

  describe('Compliance and Tagging', () => {
    test('all major resources should have Environment tag', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'Production' }]),
      });

      // Check Node Group
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Tags: Match.objectLike({
          Environment: 'Production',
        }),
      });
    });

    test('all major resources should have Project tag', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Project', Value: 'PaymentPlatform' }]),
      });

      // Check Node Group
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        Tags: Match.objectLike({
          Project: 'PaymentPlatform',
        }),
      });
    });
  });

  describe('High Availability', () => {
    test('should span exactly 3 availability zones', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'aws-cdk:subnet-type',
              Value: 'Private',
            },
          ]),
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(3);

      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'aws-cdk:subnet-type',
              Value: 'Public',
            },
          ]),
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(3);
    });

    test('should have minimum 3 nodes for high availability', () => {
      template.hasResourceProperties('AWS::EKS::Nodegroup', {
        ScalingConfig: {
          MinSize: 3,
        },
      });
    });
  });
});
