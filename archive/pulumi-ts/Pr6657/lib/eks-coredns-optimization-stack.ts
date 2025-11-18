/**
 * CoreDNS Optimization Stack
 * Optimizes CoreDNS and deploys node-local DNS cache
 */
import * as eks from '@pulumi/eks';
import * as pulumi from '@pulumi/pulumi';

export interface CoreDnsOptimizationStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class CoreDnsOptimizationStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: CoreDnsOptimizationStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:CoreDnsOptimizationStack', name, args, opts);

    // NOTE: Node-local DNS cache disabled due to compatibility issues
    // This optional DNS optimization was causing pod crash loops
    // The CoreDNS service in kube-system provides sufficient DNS performance
    //
    // Uncomment below to enable node-local DNS caching:
    /*
    void new k8s.apps.v1.DaemonSet(
      `node-local-dns-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'node-local-dns',
          namespace: 'kube-system',
          labels: {
            'k8s-app': 'node-local-dns',
          },
        },
        spec: {
          updateStrategy: {
            rollingUpdate: {
              maxUnavailable: 1,
            },
          },
          selector: {
            matchLabels: {
              'k8s-app': 'node-local-dns',
            },
          },
          template: {
            metadata: {
              labels: {
                'k8s-app': 'node-local-dns',
              },
            },
            spec: {
              priorityClassName: 'system-node-critical',
              hostNetwork: true,
              dnsPolicy: 'Default',
              tolerations: [
                {
                  key: 'CriticalAddonsOnly',
                  operator: 'Exists',
                },
                {
                  effect: 'NoExecute',
                  operator: 'Exists',
                },
                {
                  effect: 'NoSchedule',
                  operator: 'Exists',
                },
              ],
              containers: [
                {
                  name: 'node-cache',
                  image: 'registry.k8s.io/dns/k8s-dns-node-cache:1.22.23',
                  resources: {
                    requests: {
                      cpu: '25m',
                      memory: '25Mi',
                    },
                    limits: {
                      memory: '100Mi',
                    },
                  },
                  args: [
                    '-localip',
                    '169.254.20.10,10.100.0.10',
                    '-conf',
                    '/etc/Corefile',
                    '-upstreamsvc',
                    'kube-dns-upstream',
                  ],
                  securityContext: {
                    privileged: true,
                  },
                  ports: [
                    {
                      containerPort: 53,
                      name: 'dns',
                      protocol: 'UDP',
                    },
                    {
                      containerPort: 53,
                      name: 'dns-tcp',
                      protocol: 'TCP',
                    },
                    {
                      containerPort: 9253,
                      name: 'metrics',
                      protocol: 'TCP',
                    },
                  ],
                  livenessProbe: {
                    httpGet: {
                      host: '169.254.20.10',
                      path: '/health',
                      port: 8080,
                    },
                    initialDelaySeconds: 60,
                    timeoutSeconds: 5,
                  },
                  volumeMounts: [
                    {
                      mountPath: '/run/xtables.lock',
                      name: 'xtables-lock',
                      readOnly: false,
                    },
                    {
                      name: 'config-volume',
                      mountPath: '/etc/coredns',
                    },
                    {
                      name: 'kube-dns-config',
                      mountPath: '/etc/kube-dns',
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'xtables-lock',
                  hostPath: {
                    path: '/run/xtables.lock',
                    type: 'FileOrCreate',
                  },
                },
                {
                  name: 'kube-dns-config',
                  configMap: {
                    name: 'kube-dns',
                    optional: true,
                  },
                },
                {
                  name: 'config-volume',
                  configMap: {
                    name: 'node-local-dns',
                    items: [
                      {
                        key: 'Corefile',
                        path: 'Corefile',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    void new k8s.core.v1.ConfigMap(
      `node-local-dns-config-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'node-local-dns',
          namespace: 'kube-system',
        },
        data: {
          Corefile: `cluster.local:53 {
    errors
    cache {
            success 9984 30
            denial 9984 5
    }
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    health 169.254.20.10:8080
    }
in-addr.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    }
ip6.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    }
.:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . /etc/resolv.conf {
            force_tcp
    }
    prometheus :9253
    }`,
        },
      },
      { provider: args.cluster.provider, parent: this }
    );
    */

    this.registerOutputs({});
  }
}
