/**
 * EKS Add-ons Stack
 * Installs essential EKS add-ons including EBS CSI driver
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface EksAddonsStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksAddonsStack extends pulumi.ComponentResource {
  public readonly ebsCsiDriverRole: aws.iam.Role;
  public readonly ebsCsiAddon: aws.eks.Addon;

  constructor(
    name: string,
    args: EksAddonsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:EksAddonsStack', name, args, opts);

    // Create IAM role for EBS CSI driver with IRSA
    const ebsCsiPolicyDoc = pulumi
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
                    'system:serviceaccount:kube-system:ebs-csi-controller-sa',
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

    this.ebsCsiDriverRole = new aws.iam.Role(
      `ebs-csi-driver-role-${args.environmentSuffix}`,
      {
        name: `ebs-csi-driver-role-${args.environmentSuffix}`,
        assumeRolePolicy: ebsCsiPolicyDoc.apply(doc => doc.json),
        tags: {
          Name: `ebs-csi-driver-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for EBS CSI driver
    new aws.iam.RolePolicyAttachment(
      `ebs-csi-policy-attachment-${args.environmentSuffix}`,
      {
        role: this.ebsCsiDriverRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy',
      },
      { parent: this }
    );

    // Install EBS CSI driver addon
    this.ebsCsiAddon = new aws.eks.Addon(
      `ebs-csi-addon-${args.environmentSuffix}`,
      {
        clusterName: args.cluster.eksCluster.name,
        addonName: 'aws-ebs-csi-driver',
        addonVersion: 'v1.25.0-eksbuild.1',
        serviceAccountRoleArn: this.ebsCsiDriverRole.arn,
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: {
          Name: `ebs-csi-addon-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create storage class with encryption
    void new k8s.storage.v1.StorageClass(
      `ebs-sc-encrypted-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'ebs-sc-encrypted',
        },
        provisioner: 'ebs.csi.aws.com',
        parameters: {
          type: 'gp3',
          encrypted: 'true',
        },
        volumeBindingMode: 'WaitForFirstConsumer',
        allowVolumeExpansion: true,
      },
      { provider: args.cluster.provider, parent: this }
    );

    this.registerOutputs({
      ebsCsiDriverRoleArn: this.ebsCsiDriverRole.arn,
      ebsCsiAddonName: this.ebsCsiAddon.addonName,
    });
  }
}
