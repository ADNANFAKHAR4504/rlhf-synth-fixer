/**
 * Cluster Autoscaler Stack - Deploys cluster autoscaler with IRSA
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';

export interface ClusterAutoscalerStackArgs {
  environmentSuffix: string;
  clusterName: pulumi.Output<string>;
  kubeconfig: pulumi.Output<any>;
  oidcProviderArn: pulumi.Output<string>;
  oidcProviderUrl: pulumi.Output<string>;
  region: string;
  kubernetesVersion: string;
  nodeGroupTags: pulumi.Output<{ [key: string]: string }>;
}

export class ClusterAutoscalerStack extends pulumi.ComponentResource {
  public readonly serviceAccountName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ClusterAutoscalerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:k8s:ClusterAutoscalerStack', name, args, opts);

    const {
      environmentSuffix,
      clusterName,
      kubeconfig,
      oidcProviderArn,
      oidcProviderUrl,
      region,
      kubernetesVersion,
    } = args;

    // Create IAM policy for cluster autoscaler
    const autoscalerPolicy = new aws.iam.Policy(
      `cluster-autoscaler-policy-${environmentSuffix}`,
      {
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
                'ec2:DescribeInstanceTypes',
                'ec2:DescribeLaunchTemplateVersions',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
                'ec2:DescribeImages',
                'ec2:GetInstanceTypesFromInstanceRequirements',
                'eks:DescribeNodegroup',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create IAM role for cluster autoscaler with IRSA
    const autoscalerRole = new aws.iam.Role(
      `cluster-autoscaler-role-${environmentSuffix}`,
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
                        'system:serviceaccount:kube-system:cluster-autoscaler',
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
      `cluster-autoscaler-policy-attach-${environmentSuffix}`,
      {
        role: autoscalerRole.name,
        policyArn: autoscalerPolicy.arn,
      },
      { parent: this }
    );

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-autoscaler-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig.apply(kc => JSON.stringify(kc)),
      },
      { parent: this }
    );

    // Create service account
    const serviceAccount = new k8s.core.v1.ServiceAccount(
      `cluster-autoscaler-sa-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': autoscalerRole.arn,
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create cluster role
    const clusterRole = new k8s.rbac.v1.ClusterRole(
      `cluster-autoscaler-cr-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
        },
        rules: [
          {
            apiGroups: [''],
            resources: ['events', 'endpoints'],
            verbs: ['create', 'patch'],
          },
          {
            apiGroups: [''],
            resources: ['pods/eviction'],
            verbs: ['create'],
          },
          {
            apiGroups: [''],
            resources: ['pods/status'],
            verbs: ['update'],
          },
          {
            apiGroups: [''],
            resources: ['endpoints'],
            resourceNames: ['cluster-autoscaler'],
            verbs: ['get', 'update'],
          },
          {
            apiGroups: [''],
            resources: ['nodes'],
            verbs: ['watch', 'list', 'get', 'update'],
          },
          {
            apiGroups: [''],
            resources: [
              'namespaces',
              'pods',
              'services',
              'replicationcontrollers',
              'persistentvolumeclaims',
              'persistentvolumes',
            ],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['extensions'],
            resources: ['replicasets', 'daemonsets'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['policy'],
            resources: ['poddisruptionbudgets'],
            verbs: ['watch', 'list'],
          },
          {
            apiGroups: ['apps'],
            resources: ['statefulsets', 'replicasets', 'daemonsets'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['storage.k8s.io'],
            resources: [
              'storageclasses',
              'csinodes',
              'csidrivers',
              'csistoragecapacities',
            ],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['batch', 'extensions'],
            resources: ['jobs'],
            verbs: ['get', 'list', 'watch', 'patch'],
          },
          {
            apiGroups: ['coordination.k8s.io'],
            resources: ['leases'],
            verbs: ['create'],
          },
          {
            apiGroups: ['coordination.k8s.io'],
            resourceNames: ['cluster-autoscaler'],
            resources: ['leases'],
            verbs: ['get', 'update'],
          },
        ],
      },
      { provider: k8sProvider, parent: this }
    );

    // Create cluster role binding
    new k8s.rbac.v1.ClusterRoleBinding(
      `cluster-autoscaler-crb-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
          name: clusterRole.metadata.name,
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: serviceAccount.metadata.name,
            namespace: 'kube-system',
          },
        ],
      },
      { provider: k8sProvider, parent: this }
    );

    // Create deployment with priority expander
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _deployment = new k8s.apps.v1.Deployment(
      `cluster-autoscaler-deploy-${environmentSuffix}`,
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
              serviceAccountName: serviceAccount.metadata.name,
              containers: [
                {
                  name: 'cluster-autoscaler',
                  image: `registry.k8s.io/autoscaling/cluster-autoscaler:v${kubernetesVersion}.0`,
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    pulumi.interpolate`--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${clusterName}`,
                    '--expander=priority',
                    '--balance-similar-node-groups',
                    '--skip-nodes-with-system-pods=false',
                  ],
                  volumeMounts: [
                    {
                      name: 'ssl-certs',
                      mountPath: '/etc/ssl/certs/ca-certificates.crt',
                      readOnly: true,
                    },
                  ],
                  env: [
                    {
                      name: 'AWS_REGION',
                      value: region,
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
      { provider: k8sProvider, parent: this }
    );

    // Create ConfigMap for priority expander
    new k8s.core.v1.ConfigMap(
      `cluster-autoscaler-priority-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler-priority-expander',
          namespace: 'kube-system',
        },
        data: {
          priorities: `
10:
  - .*-general-.*
5:
  - .*-compute-.*
`,
        },
      },
      { provider: k8sProvider, parent: this }
    );

    this.serviceAccountName = serviceAccount.metadata.name;

    this.registerOutputs({
      serviceAccountName: this.serviceAccountName,
    });
  }
}
