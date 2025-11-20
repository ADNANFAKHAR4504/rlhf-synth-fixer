/**
 * AWS Load Balancer Controller Stack
 * Installs AWS Load Balancer Controller with IRSA
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface LoadBalancerControllerStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  vpcId: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerControllerStack extends pulumi.ComponentResource {
  public readonly lbControllerRole: aws.iam.Role;
  public readonly lbControllerServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(
    name: string,
    args: LoadBalancerControllerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:LoadBalancerControllerStack', name, args, opts);

    // Create IAM policy for Load Balancer Controller
    const lbControllerPolicy = new aws.iam.Policy(
      `lb-controller-policy-${args.environmentSuffix}`,
      {
        name: `lb-controller-policy-${args.environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['iam:CreateServiceLinkedRole'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
                'ec2:DescribeVpcPeeringConnections',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeInstances',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DescribeTags',
                'ec2:GetCoipPoolUsage',
                'ec2:DescribeCoipPools',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeLoadBalancerAttributes',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeListenerCertificates',
                'elasticloadbalancing:DescribeSSLPolicies',
                'elasticloadbalancing:DescribeRules',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetGroupAttributes',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:DescribeTags',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'cognito-idp:DescribeUserPoolClient',
                'acm:ListCertificates',
                'acm:DescribeCertificate',
                'iam:ListServerCertificates',
                'iam:GetServerCertificate',
                'waf-regional:GetWebACL',
                'waf-regional:GetWebACLForResource',
                'waf-regional:AssociateWebACL',
                'waf-regional:DisassociateWebACL',
                'wafv2:GetWebACL',
                'wafv2:GetWebACLForResource',
                'wafv2:AssociateWebACL',
                'wafv2:DisassociateWebACL',
                'shield:GetSubscriptionState',
                'shield:DescribeProtection',
                'shield:CreateProtection',
                'shield:DeleteProtection',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
                'ec2:CreateSecurityGroup',
                'ec2:CreateTags',
                'ec2:DeleteTags',
                'ec2:AuthorizeSecurityGroupEgress',
                'ec2:RevokeSecurityGroupEgress',
                'ec2:DeleteSecurityGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateLoadBalancer',
                'elasticloadbalancing:CreateTargetGroup',
                'elasticloadbalancing:CreateListener',
                'elasticloadbalancing:DeleteListener',
                'elasticloadbalancing:CreateRule',
                'elasticloadbalancing:DeleteRule',
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags',
                'elasticloadbalancing:ModifyLoadBalancerAttributes',
                'elasticloadbalancing:SetIpAddressType',
                'elasticloadbalancing:SetSecurityGroups',
                'elasticloadbalancing:SetSubnets',
                'elasticloadbalancing:DeleteLoadBalancer',
                'elasticloadbalancing:ModifyTargetGroup',
                'elasticloadbalancing:ModifyTargetGroupAttributes',
                'elasticloadbalancing:DeleteTargetGroup',
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
                'elasticloadbalancing:SetWebAcl',
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:AddListenerCertificates',
                'elasticloadbalancing:RemoveListenerCertificates',
                'elasticloadbalancing:ModifyRule',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: {
          Name: `lb-controller-policy-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for Load Balancer Controller with IRSA
    const lbControllerPolicyDoc = pulumi
      .all([args.oidcProviderArn, args.oidcProviderUrl])
      .apply(([arn, url]) => {
        const urlWithoutProtocol = url.replace('https://', '');
        return aws.iam.getPolicyDocument({
          statements: [
            {
              effect: 'Allow',
              principals: [
                {
                  type: 'Federated',
                  identifiers: [arn],
                },
              ],
              actions: ['sts:AssumeRoleWithWebIdentity'],
              conditions: [
                {
                  test: 'StringEquals',
                  variable: `${urlWithoutProtocol}:sub`,
                  values: [
                    'system:serviceaccount:kube-system:aws-load-balancer-controller',
                  ],
                },
                {
                  test: 'StringEquals',
                  variable: `${urlWithoutProtocol}:aud`,
                  values: ['sts.amazonaws.com'],
                },
              ],
            },
          ],
        });
      });

    this.lbControllerRole = new aws.iam.Role(
      `lb-controller-role-${args.environmentSuffix}`,
      {
        name: `lb-controller-role-${args.environmentSuffix}`,
        assumeRolePolicy: lbControllerPolicyDoc.apply(doc => doc.json),
        tags: {
          Name: `lb-controller-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lb-controller-policy-attachment-${args.environmentSuffix}`,
      {
        role: this.lbControllerRole.name,
        policyArn: lbControllerPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for Load Balancer Controller
    this.lbControllerServiceAccount = new k8s.core.v1.ServiceAccount(
      `aws-load-balancer-controller-sa-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'aws-load-balancer-controller',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': this.lbControllerRole.arn,
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // Install AWS Load Balancer Controller using Helm
    void new k8s.helm.v3.Release(
      `aws-load-balancer-controller-${args.environmentSuffix}`,
      {
        chart: 'aws-load-balancer-controller',
        repositoryOpts: {
          repo: 'https://aws.github.io/eks-charts',
        },
        namespace: 'kube-system',
        values: {
          clusterName: args.cluster.eksCluster.name,
          serviceAccount: {
            create: false,
            name: 'aws-load-balancer-controller',
          },
          region: args.region,
          vpcId: args.vpcId,
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.lbControllerServiceAccount],
      }
    );

    this.registerOutputs({
      lbControllerRoleArn: this.lbControllerRole.arn,
      lbControllerServiceAccountName:
        this.lbControllerServiceAccount.metadata.name,
    });
  }
}
