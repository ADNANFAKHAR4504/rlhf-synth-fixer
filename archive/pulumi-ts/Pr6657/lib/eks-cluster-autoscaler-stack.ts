/**
 * Cluster Autoscaler Stack
 * Installs Kubernetes Cluster Autoscaler with pod disruption budgets
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface ClusterAutoscalerStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ClusterAutoscalerStack extends pulumi.ComponentResource {
  public readonly autoscalerRole: aws.iam.Role;
  public readonly autoscalerServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(
    name: string,
    args: ClusterAutoscalerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:ClusterAutoscalerStack', name, args, opts);

    // Create IAM policy for Cluster Autoscaler
    const autoscalerPolicy = new aws.iam.Policy(
      `cluster-autoscaler-policy-${args.environmentSuffix}`,
      {
        name: `cluster-autoscaler-policy-${args.environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:DescribeAutoScalingGroups',
                'autoscaling:DescribeAutoScalingInstances',
                'autoscaling:DescribeLaunchConfigurations',
                'autoscaling:DescribeScalingActivities',
                'autoscaling:DescribeTags',
                'ec2:DescribeImages',
                'ec2:DescribeInstanceTypes',
                'ec2:DescribeLaunchTemplateVersions',
                'ec2:GetInstanceTypesFromInstanceRequirements',
                'eks:DescribeNodegroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: {
          Name: `cluster-autoscaler-policy-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for Cluster Autoscaler with IRSA
    const autoscalerPolicyDoc = pulumi
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
                    'system:serviceaccount:kube-system:cluster-autoscaler',
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

    this.autoscalerRole = new aws.iam.Role(
      `cluster-autoscaler-role-${args.environmentSuffix}`,
      {
        name: `cluster-autoscaler-role-${args.environmentSuffix}`,
        assumeRolePolicy: autoscalerPolicyDoc.apply(doc => doc.json),
        tags: {
          Name: `cluster-autoscaler-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `cluster-autoscaler-policy-attachment-${args.environmentSuffix}`,
      {
        role: this.autoscalerRole.name,
        policyArn: autoscalerPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for Cluster Autoscaler
    this.autoscalerServiceAccount = new k8s.core.v1.ServiceAccount(
      `cluster-autoscaler-sa-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': this.autoscalerRole.arn,
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // Deploy Cluster Autoscaler
    void new k8s.apps.v1.Deployment(
      `cluster-autoscaler-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
          namespace: 'kube-system',
          labels: {
            app: 'cluster-autoscaler',
          },
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: 'cluster-autoscaler',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'cluster-autoscaler',
              },
            },
            spec: {
              serviceAccountName: 'cluster-autoscaler',
              containers: [
                {
                  name: 'cluster-autoscaler',
                  image:
                    'registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2',
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    '--skip-nodes-with-local-storage=false',
                    '--expander=least-waste',
                    pulumi.interpolate`--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${args.cluster.eksCluster.name}`,
                  ],
                  resources: {
                    limits: {
                      cpu: '100m',
                      memory: '300Mi',
                    },
                    requests: {
                      cpu: '100m',
                      memory: '300Mi',
                    },
                  },
                  volumeMounts: [
                    {
                      name: 'ssl-certs',
                      mountPath: '/etc/ssl/certs/ca-certificates.crt',
                      readOnly: true,
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'ssl-certs',
                  hostPath: {
                    path: '/etc/ssl/certs/ca-bundle.crt',
                  },
                },
              ],
            },
          },
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.autoscalerServiceAccount],
      }
    );

    // Create Pod Disruption Budget for Cluster Autoscaler
    void new k8s.policy.v1.PodDisruptionBudget(
      `cluster-autoscaler-pdb-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler-pdb',
          namespace: 'kube-system',
        },
        spec: {
          minAvailable: 1,
          selector: {
            matchLabels: {
              app: 'cluster-autoscaler',
            },
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    this.registerOutputs({
      autoscalerRoleArn: this.autoscalerRole.arn,
      autoscalerServiceAccountName: this.autoscalerServiceAccount.metadata.name,
    });
  }
}
