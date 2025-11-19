/**
 * IRSA Demonstration Stack
 * Demonstrates IAM Roles for Service Accounts with a sample workload
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface IrsaDemoStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class IrsaDemoStack extends pulumi.ComponentResource {
  public readonly demoRole: aws.iam.Role;
  public readonly demoServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(
    name: string,
    args: IrsaDemoStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:IrsaDemoStack', name, args, opts);

    // Create S3 bucket for IRSA demo
    const demoBucket = new aws.s3.Bucket(
      `irsa-demo-bucket-${args.environmentSuffix}`,
      {
        bucket: `irsa-demo-bucket-${args.environmentSuffix}`,
        forceDestroy: true,
        tags: {
          Name: `irsa-demo-bucket-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          Purpose: 'IRSA-Demo',
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    const demoPolicy = new aws.iam.Policy(
      `irsa-demo-policy-${args.environmentSuffix}`,
      {
        name: `irsa-demo-policy-${args.environmentSuffix}`,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket",
              "s3:GetObject",
              "s3:PutObject"
            ],
            "Resource": [
              "${demoBucket.arn}",
              "${demoBucket.arn}/*"
            ]
          }
        ]
      }`,
        tags: {
          Name: `irsa-demo-policy-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for IRSA demo with OIDC trust
    const demoPolicyDoc = pulumi
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
                  values: ['system:serviceaccount:dev:irsa-demo-sa'],
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

    this.demoRole = new aws.iam.Role(
      `irsa-demo-role-${args.environmentSuffix}`,
      {
        name: `irsa-demo-role-${args.environmentSuffix}`,
        assumeRolePolicy: demoPolicyDoc.apply(doc => doc.json),
        tags: {
          Name: `irsa-demo-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `irsa-demo-policy-attachment-${args.environmentSuffix}`,
      {
        role: this.demoRole.name,
        policyArn: demoPolicy.arn,
      },
      { parent: this }
    );

    // Create service account with IRSA annotation
    this.demoServiceAccount = new k8s.core.v1.ServiceAccount(
      `irsa-demo-sa-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'irsa-demo-sa',
          namespace: 'dev',
          annotations: {
            'eks.amazonaws.com/role-arn': this.demoRole.arn,
          },
        },
      },
      { provider: args.cluster.provider, parent: this }
    );

    // NOTE: Demo pod commented out to avoid scheduling delays during initial deployment
    // The IRSA infrastructure (IAM role, policy, service account) is fully configured
    // and can be tested by deploying a pod manually after node groups are ready.
    //
    // Uncomment below to deploy demo pod:
    /*
    void new k8s.core.v1.Pod(
      `irsa-demo-pod-${args.environmentSuffix}`,
      {
        metadata: {
          name: 'irsa-demo-pod',
          namespace: 'dev',
          labels: {
            app: 'irsa-demo',
          },
        },
        spec: {
          serviceAccountName: 'irsa-demo-sa',
          containers: [
            {
              name: 'aws-cli',
              image: 'amazon/aws-cli:latest',
              command: [
                'sh',
                '-c',
                pulumi.interpolate`while true; do aws s3 ls ${demoBucket.bucket} --region ${args.region}; sleep 300; done`,
              ],
              env: [
                {
                  name: 'AWS_DEFAULT_REGION',
                  value: args.region,
                },
              ],
            },
          ],
          restartPolicy: 'Always',
        },
      },
      {
        provider: args.cluster.provider,
        parent: this,
        dependsOn: [this.demoServiceAccount],
      }
    );
    */

    this.registerOutputs({
      demoRoleArn: this.demoRole.arn,
      demoServiceAccountName: this.demoServiceAccount.metadata.name,
      demoBucketName: demoBucket.bucket,
    });
  }
}
