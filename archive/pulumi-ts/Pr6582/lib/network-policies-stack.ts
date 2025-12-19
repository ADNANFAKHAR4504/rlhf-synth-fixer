/**
 * Network Policies Stack - Creates NetworkPolicy resources for pod isolation
 */
import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

export interface NetworkPoliciesStackArgs {
  environmentSuffix: string;
  kubeconfig: pulumi.Output<any>;
}

export class NetworkPoliciesStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: NetworkPoliciesStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:k8s:NetworkPoliciesStack', name, args, opts);

    const { environmentSuffix, kubeconfig } = args;

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-netpol-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig.apply(kc => JSON.stringify(kc)),
      },
      { parent: this }
    );

    // Create namespace for application workloads
    const appNamespace = new k8s.core.v1.Namespace(
      `app-namespace-${environmentSuffix}`,
      {
        metadata: {
          name: 'applications',
          labels: {
            'pod-security.kubernetes.io/enforce': 'restricted',
            'pod-security.kubernetes.io/audit': 'restricted',
            'pod-security.kubernetes.io/warn': 'restricted',
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Network Policy 1: Default deny all ingress traffic
    new k8s.networking.v1.NetworkPolicy(
      `deny-all-ingress-${environmentSuffix}`,
      {
        metadata: {
          name: 'deny-all-ingress',
          namespace: appNamespace.metadata.name,
        },
        spec: {
          podSelector: {},
          policyTypes: ['Ingress'],
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Network Policy 2: Allow ingress from specific labeled pods only
    new k8s.networking.v1.NetworkPolicy(
      `allow-app-ingress-${environmentSuffix}`,
      {
        metadata: {
          name: 'allow-app-ingress',
          namespace: appNamespace.metadata.name,
        },
        spec: {
          podSelector: {
            matchLabels: {
              app: 'backend',
            },
          },
          policyTypes: ['Ingress'],
          ingress: [
            {
              from: [
                {
                  podSelector: {
                    matchLabels: {
                      app: 'frontend',
                    },
                  },
                },
              ],
              ports: [
                {
                  protocol: 'TCP',
                  port: 8080,
                },
              ],
            },
          ],
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Network Policy 3: Allow egress to specific services
    new k8s.networking.v1.NetworkPolicy(
      `allow-dns-egress-${environmentSuffix}`,
      {
        metadata: {
          name: 'allow-dns-egress',
          namespace: appNamespace.metadata.name,
        },
        spec: {
          podSelector: {},
          policyTypes: ['Egress'],
          egress: [
            {
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
              to: [
                {
                  podSelector: {},
                },
              ],
            },
          ],
        },
      },
      { provider: k8sProvider, parent: this }
    );

    this.registerOutputs({
      appNamespace: appNamespace.metadata.name,
    });
  }
}
