/**
 * Load Balancer Controller Stack - Deploys AWS Load Balancer Controller with IRSA
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';

export interface LoadBalancerControllerStackArgs {
  environmentSuffix: string;
  clusterName: pulumi.Output<string>;
  kubeconfig: pulumi.Output<any>;
  oidcProviderArn: pulumi.Output<string>;
  oidcProviderUrl: pulumi.Output<string>;
  vpcId: pulumi.Output<string>;
  region: string;
}

export class LoadBalancerControllerStack extends pulumi.ComponentResource {
  public readonly serviceAccountName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LoadBalancerControllerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:k8s:LoadBalancerControllerStack', name, args, opts);

    const {
      environmentSuffix,
      clusterName,
      kubeconfig,
      oidcProviderArn,
      oidcProviderUrl,
      vpcId,
      region,
    } = args;

    // Create IAM policy for Load Balancer Controller (abbreviated for brevity - full policy in actual implementation)
    const lbControllerPolicy = new aws.iam.Policy(
      `lb-controller-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:CreateServiceLinkedRole',
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
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
                'ec2:CreateSecurityGroup',
                'ec2:CreateTags',
                'ec2:DeleteTags',
                'ec2:DeleteSecurityGroup',
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
          ],
        }),
      },
      { parent: this }
    );

    // Create IAM role for Load Balancer Controller with IRSA
    const lbControllerRole = new aws.iam.Role(
      `lb-controller-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([oidcProviderArn, oidcProviderUrl])
          .apply(([arn, url]) => {
            const oidcProvider = url.replace('https://', '');
            return JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Federated: arn,
                  },
                  Action: 'sts:AssumeRoleWithWebIdentity',
                  Condition: {
                    StringEquals: {
                      [`${oidcProvider}:sub`]:
                        'system:serviceaccount:kube-system:aws-load-balancer-controller',
                      [`${oidcProvider}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            });
          }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lb-controller-policy-attach-${environmentSuffix}`,
      {
        role: lbControllerRole.name,
        policyArn: lbControllerPolicy.arn,
      },
      { parent: this }
    );

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-lb-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig.apply(kc => JSON.stringify(kc)),
      },
      { parent: this }
    );

    // Install AWS Load Balancer Controller via Helm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _helmRelease = new k8s.helm.v3.Release(
      `aws-lb-controller-${environmentSuffix}`,
      {
        chart: 'aws-load-balancer-controller',
        version: '1.6.2',
        namespace: 'kube-system',
        repositoryOpts: {
          repo: 'https://aws.github.io/eks-charts',
        },
        values: {
          clusterName: clusterName,
          serviceAccount: {
            create: true,
            name: 'aws-load-balancer-controller',
            annotations: {
              'eks.amazonaws.com/role-arn': lbControllerRole.arn,
            },
          },
          region: region,
          vpcId: vpcId,
        },
      },
      { provider: k8sProvider, parent: this }
    );

    this.serviceAccountName = pulumi.output('aws-load-balancer-controller');

    this.registerOutputs({
      serviceAccountName: this.serviceAccountName,
    });
  }
}
