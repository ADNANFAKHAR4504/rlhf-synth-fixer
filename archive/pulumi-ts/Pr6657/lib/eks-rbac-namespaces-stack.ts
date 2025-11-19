/**
 * RBAC and Namespaces Stack
 * Creates dev and prod namespaces with RBAC policies and pod security standards
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface RbacNamespacesStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class RbacNamespacesStack extends pulumi.ComponentResource {
  public readonly devNamespace: k8s.core.v1.Namespace;
  public readonly prodNamespace: k8s.core.v1.Namespace;

  constructor(
    name: string,
    args: RbacNamespacesStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:RbacNamespacesStack', name, args, opts);

    // Create dev namespace with pod security standards
    this.devNamespace = new k8s.core.v1.Namespace(
      `dev-namespace-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'dev',
          labels: {
            'pod-security.kubernetes.io/enforce': 'baseline',
            'pod-security.kubernetes.io/audit': 'restricted',
            'pod-security.kubernetes.io/warn': 'restricted',
            environment: 'dev',
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // Create prod namespace with stricter pod security standards
    this.prodNamespace = new k8s.core.v1.Namespace(
      `prod-namespace-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'prod',
          labels: {
            'pod-security.kubernetes.io/enforce': 'restricted',
            'pod-security.kubernetes.io/audit': 'restricted',
            'pod-security.kubernetes.io/warn': 'restricted',
            environment: 'prod',
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // Create dev role with read/write permissions
    const devRole = new k8s.rbac.v1.Role(
      `dev-role-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'dev-role',
          namespace: 'dev',
        },
        rules: [
          {
            apiGroups: ['', 'apps', 'batch'],
            resources: [
              'pods',
              'deployments',
              'services',
              'jobs',
              'cronjobs',
              'configmaps',
              'secrets',
            ],
            verbs: [
              'get',
              'list',
              'watch',
              'create',
              'update',
              'patch',
              'delete',
            ],
          },
        ],
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.devNamespace],
      }
    );

    // Create prod role with read-only permissions
    const prodRole = new k8s.rbac.v1.Role(
      `prod-role-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'prod-role',
          namespace: 'prod',
        },
        rules: [
          {
            apiGroups: ['', 'apps', 'batch'],
            resources: [
              'pods',
              'deployments',
              'services',
              'jobs',
              'cronjobs',
              'configmaps',
            ],
            verbs: ['get', 'list', 'watch'],
          },
        ],
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.prodNamespace],
      }
    );

    // Create dev service account
    const devServiceAccount = new k8s.core.v1.ServiceAccount(
      `dev-sa-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'dev-service-account',
          namespace: 'dev',
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.devNamespace],
      }
    );

    // Create prod service account
    const prodServiceAccount = new k8s.core.v1.ServiceAccount(
      `prod-sa-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'prod-service-account',
          namespace: 'prod',
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.prodNamespace],
      }
    );

    // Bind dev role to dev service account
    void new k8s.rbac.v1.RoleBinding(
      `dev-role-binding-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'dev-role-binding',
          namespace: 'dev',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'dev-service-account',
            namespace: 'dev',
          },
        ],
        roleRef: {
          kind: 'Role',
          name: 'dev-role',
          apiGroup: 'rbac.authorization.k8s.io',
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [devRole, devServiceAccount],
      }
    );

    // Bind prod role to prod service account
    void new k8s.rbac.v1.RoleBinding(
      `prod-role-binding-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'prod-role-binding',
          namespace: 'prod',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'prod-service-account',
            namespace: 'prod',
          },
        ],
        roleRef: {
          kind: 'Role',
          name: 'prod-role',
          apiGroup: 'rbac.authorization.k8s.io',
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [prodRole, prodServiceAccount],
      }
    );

    this.registerOutputs({
      devNamespace: this.devNamespace.metadata.name,
      prodNamespace: this.prodNamespace.metadata.name,
    });
  }
}
