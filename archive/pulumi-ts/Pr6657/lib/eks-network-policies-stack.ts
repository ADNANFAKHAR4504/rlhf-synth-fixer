/**
 * Network Policies Stack
 * Creates network policies for namespace isolation
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface NetworkPoliciesStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  devNamespace: k8s.core.v1.Namespace;
  prodNamespace: k8s.core.v1.Namespace;
}

export class NetworkPoliciesStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: NetworkPoliciesStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:NetworkPoliciesStack', name, args, opts);

    // Network policy for dev namespace - allow intra-namespace traffic only
    void new k8s.networking.v1.NetworkPolicy(
      `dev-network-policy-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'dev-network-policy',
          namespace: 'dev',
        },
        spec: {
          podSelector: {},
          policyTypes: ['Ingress', 'Egress'],
          ingress: [
            {
              from: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      environment: 'dev',
                    },
                  },
                },
              ],
            },
          ],
          egress: [
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      environment: 'dev',
                    },
                  },
                },
              ],
            },
            {
              // Allow DNS
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      'kubernetes.io/metadata.name': 'kube-system',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'UDP',
                  port: 53,
                },
              ],
            },
            {
              // Allow external egress
              to: [
                {
                  ipBlock: {
                    cidr: '0.0.0.0/0',
                    except: ['169.254.169.254/32'],
                  },
                },
              ],
            },
          ],
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [args.devNamespace],
      }
    );

    // Network policy for prod namespace - allow intra-namespace traffic only
    void new k8s.networking.v1.NetworkPolicy(
      `prod-network-policy-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'prod-network-policy',
          namespace: 'prod',
        },
        spec: {
          podSelector: {},
          policyTypes: ['Ingress', 'Egress'],
          ingress: [
            {
              from: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      environment: 'prod',
                    },
                  },
                },
              ],
            },
          ],
          egress: [
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      environment: 'prod',
                    },
                  },
                },
              ],
            },
            {
              // Allow DNS
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      'kubernetes.io/metadata.name': 'kube-system',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'UDP',
                  port: 53,
                },
              ],
            },
            {
              // Allow external egress
              to: [
                {
                  ipBlock: {
                    cidr: '0.0.0.0/0',
                    except: ['169.254.169.254/32'],
                  },
                },
              ],
            },
          ],
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [args.prodNamespace],
      }
    );

    this.registerOutputs({});
  }
}
