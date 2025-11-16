/**
 * Calico Stack - Installs Calico CNI plugin via Helm
 */
import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

export interface CalicoStackArgs {
  environmentSuffix: string;
  kubeconfig: pulumi.Output<any>;
  clusterOidcProvider: pulumi.Output<string>;
}

export class CalicoStack extends pulumi.ComponentResource {
  public readonly helmRelease: k8s.helm.v3.Release;

  constructor(
    name: string,
    args: CalicoStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:k8s:CalicoStack', name, args, opts);

    const { environmentSuffix, kubeconfig } = args;

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-calico-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig.apply(kc => JSON.stringify(kc)),
      },
      { parent: this }
    );

    // Install Calico via Helm
    this.helmRelease = new k8s.helm.v3.Release(
      `calico-${environmentSuffix}`,
      {
        chart: 'tigera-operator',
        version: '3.26.4',
        namespace: 'tigera-operator',
        createNamespace: true,
        repositoryOpts: {
          repo: 'https://docs.tigera.io/calico/charts',
        },
        values: {
          installation: {
            kubernetesProvider: 'EKS',
            cni: {
              type: 'Calico',
            },
            calicoNetwork: {
              bgp: 'Disabled',
              ipPools: [
                {
                  cidr: '192.168.0.0/16',
                  encapsulation: 'VXLAN',
                },
              ],
            },
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    this.registerOutputs({
      helmReleaseName: this.helmRelease.name,
    });
  }
}
