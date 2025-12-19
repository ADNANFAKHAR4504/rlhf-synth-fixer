import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface CrossAccountRoleProps {
  environment: string;
  operationsAccountId: string;
}

export class CrossAccountRole extends Construct {
  public readonly role: IamRole;

  constructor(scope: Construct, id: string, props: CrossAccountRoleProps) {
    super(scope, id);

    const { environment, operationsAccountId } = props;

    // Create cross-account role
    this.role = new IamRole(this, 'deployment-role', {
      name: `deployment-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${operationsAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `deployment-role-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Attach deployment permissions with least privilege
    new IamRolePolicy(this, 'deployment-policy', {
      name: `deployment-policy-${environment}`,
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeVpcs',
              'ec2:DescribeSubnets',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeInternetGateways',
              'ec2:DescribeRouteTables',
              'ec2:CreateVpc',
              'ec2:CreateSubnet',
              'ec2:CreateSecurityGroup',
              'ec2:CreateInternetGateway',
              'ec2:CreateRouteTable',
              'ec2:CreateRoute',
              'ec2:CreateTags',
              'ec2:ModifyVpcAttribute',
              'ec2:ModifySubnetAttribute',
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:AuthorizeSecurityGroupEgress',
              'ec2:AttachInternetGateway',
              'ec2:AssociateRouteTable',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ecs:CreateCluster',
              'ecs:DescribeClusters',
              'ecs:RegisterTaskDefinition',
              'ecs:DeregisterTaskDefinition',
              'ecs:DescribeTaskDefinition',
              'ecs:CreateService',
              'ecs:UpdateService',
              'ecs:DeleteService',
              'ecs:DescribeServices',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'rds:CreateDBInstance',
              'rds:DescribeDBInstances',
              'rds:ModifyDBInstance',
              'rds:DeleteDBInstance',
              'rds:CreateDBSubnetGroup',
              'rds:DescribeDBSubnetGroups',
              'rds:DeleteDBSubnetGroup',
              'rds:AddTagsToResource',
              'rds:ListTagsForResource',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'elasticloadbalancing:CreateLoadBalancer',
              'elasticloadbalancing:DescribeLoadBalancers',
              'elasticloadbalancing:DeleteLoadBalancer',
              'elasticloadbalancing:CreateTargetGroup',
              'elasticloadbalancing:DescribeTargetGroups',
              'elasticloadbalancing:DeleteTargetGroup',
              'elasticloadbalancing:CreateListener',
              'elasticloadbalancing:DescribeListeners',
              'elasticloadbalancing:DeleteListener',
              'elasticloadbalancing:ModifyLoadBalancerAttributes',
              'elasticloadbalancing:ModifyTargetGroupAttributes',
              'elasticloadbalancing:AddTags',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:CreateBucket',
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:PutBucketVersioning',
              's3:GetBucketEncryption',
              's3:PutBucketEncryption',
              's3:GetBucketPublicAccessBlock',
              's3:PutBucketPublicAccessBlock',
              's3:GetBucketTagging',
              's3:PutBucketTagging',
            ],
            Resource: 'arn:aws:s3:::*',
          },
          {
            Effect: 'Allow',
            Action: [
              'iam:GetRole',
              'iam:CreateRole',
              'iam:DeleteRole',
              'iam:PassRole',
              'iam:AttachRolePolicy',
              'iam:DetachRolePolicy',
              'iam:PutRolePolicy',
              'iam:GetRolePolicy',
              'iam:DeleteRolePolicy',
              'iam:TagRole',
              'iam:ListRolePolicies',
              'iam:ListAttachedRolePolicies',
            ],
            Resource: [
              `arn:aws:iam::*:role/*${environment}*`,
              'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:DescribeLogGroups',
              'logs:DeleteLogGroup',
              'logs:PutRetentionPolicy',
              'logs:TagLogGroup',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: `arn:aws:secretsmanager:*:*:secret:rds-credentials-${environment}*`,
          },
        ],
      }),
    });
  }
}
