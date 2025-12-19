/**
 * Spot Instance Interruption Handling Stack
 * Demonstrates handling of spot instance interruptions
 */
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface SpotInterruptionStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class SpotInterruptionStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: SpotInterruptionStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:SpotInterruptionStack', name, args, opts);

    // Install AWS Node Termination Handler for spot interruption handling
    void new k8s.helm.v3.Release(
      `aws-node-termination-handler-${args.environmentSuffix}`,
      {
        chart: 'aws-node-termination-handler',
        repositoryOpts: {
          repo: 'https://aws.github.io/eks-charts',
        },
        namespace: 'kube-system',
        values: {
          enableSpotInterruptionDraining: true,
          enableScheduledEventDraining: true,
          enableRebalanceMonitoring: true,
          enableRebalanceDraining: true,
          nodeSelector: {
            'node-type': 'spot',
          },
          tolerations: [
            {
              operator: 'Exists',
            },
          ],
          podAnnotations: {
            'prometheus.io/scrape': 'true',
            'prometheus.io/port': '9092',
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // NOTE: Demo deployment and PDB commented out to avoid scheduling delays
    // The spot interruption handler is installed and ready to handle spot terminations
    // Deploy workloads manually after node groups are ready to test functionality.
    //
    // Uncomment below to deploy demo workload:
    /*
    void new k8s.apps.v1.Deployment(
      `spot-demo-deployment-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'spot-demo-deployment',
          namespace: 'dev',
          labels: {
            app: 'spot-demo',
          },
        },
        spec: {
          replicas: 3,
          selector: {
            matchLabels: {
              app: 'spot-demo',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'spot-demo',
              },
            },
            spec: {
              affinity: {
                nodeAffinity: {
                  preferredDuringSchedulingIgnoredDuringExecution: [
                    {
                      weight: 1,
                      preference: {
                        matchExpressions: [
                          {
                            key: 'node-type',
                            operator: 'In',
                            values: ['spot'],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              containers: [
                {
                  name: 'nginx',
                  image: 'nginx:latest',
                  ports: [
                    {
                      containerPort: 80,
                    },
                  ],
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '128Mi',
                    },
                    limits: {
                      cpu: '200m',
                      memory: '256Mi',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    void new k8s.policy.v1.PodDisruptionBudget(
      `spot-demo-pdb-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'spot-demo-pdb',
          namespace: 'dev',
        },
        spec: {
          minAvailable: 2,
          selector: {
            matchLabels: {
              app: 'spot-demo',
            },
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );
    */

    this.registerOutputs({});
  }
}
