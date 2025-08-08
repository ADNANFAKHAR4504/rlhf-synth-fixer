/**
 * iamComponent.ts
 *
 * This module defines IAM roles and policies with the principle of least privilege
 * for accessing S3 buckets in different environments.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

/**
 * Arguments for creating IAM role with least privilege
 */
export interface IAMRoleArgs {
  /**
   * The environment suffix for the role (e.g., 'development', 'production')
   */
  environmentSuffix: string;

  /**
   * The ARN of the S3 bucket this role should have access to
   */
  bucketArn: pulumi.Input<string>;

  /**
   * Optional tags to apply to IAM resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A component that creates IAM role with least privilege for S3 bucket access
 */
export class IAMRole extends pulumi.ComponentResource {
  /**
   * The created IAM role
   */
  public readonly role: aws.iam.Role;

  /**
   * The inline policy attached to the role
   */
  public readonly rolePolicy: aws.iam.RolePolicy;

  /**
   * The ARN of the created role
   */
  public readonly roleArn: pulumi.Output<string>;

  /**
   * The name of the created role
   */
  public readonly roleName: pulumi.Output<string>;

  constructor(
    name: string,
    args: IAMRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:iam:IAMRole', name, {}, opts);

    const resourceOpts: pulumi.ResourceOptions = { parent: this };

    // Merge required tags with optional tags
    const allTags = pulumi.all([args.tags || {}]).apply(([userTags]) => ({
      ...userTags,
      Department: 'Security',
      Project: 'PulumiIaCProject',
    }));

    // Create the IAM role with trust policy for applications
    this.role = new aws.iam.Role(
      `app-read-role-${args.environmentSuffix}`,
      {
        path: '/applications/',
        description: `Read-only access to the application data bucket for the ${args.environmentSuffix} environment`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['ec2.amazonaws.com', 'lambda.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: allTags,
      },
      resourceOpts
    );

    // Create inline policy with least privilege for S3 read access
    this.rolePolicy = new aws.iam.RolePolicy(
      `app-read-policy-${args.environmentSuffix}`,
      {
        role: this.role.id,
        policy: pulumi.all([args.bucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      resourceOpts
    );

    // Export role ARN and name
    this.roleArn = this.role.arn;
    this.roleName = this.role.name;

    // Register outputs
    this.registerOutputs({
      roleArn: this.roleArn,
      roleName: this.roleName,
    });
  }
}
