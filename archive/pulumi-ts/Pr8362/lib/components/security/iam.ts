import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamRoleArgs {
  name: string;
  assumeRolePolicy: pulumi.Input<string>;
  description?: string;
  maxSessionDuration?: number;
  tags?: Record<string, string>;
}

export interface IamPolicyArgs {
  name: string;
  policy: pulumi.Input<string>;
  description?: string;
  tags?: Record<string, string>;
}

export interface IamRolePolicyAttachmentArgs {
  role: pulumi.Input<string>;
  policyArn: pulumi.Input<string>;
}

export interface IamInstanceProfileArgs {
  name: string;
  role: pulumi.Input<string>;
}

export interface IamRoleResult {
  role: aws.iam.Role;
  roleArn: pulumi.Output<string>;
  roleName: pulumi.Output<string>;
}

export interface IamPolicyResult {
  policy: aws.iam.Policy;
  policyArn: pulumi.Output<string>;
  policyName: pulumi.Output<string>;
}

export interface Ec2InstanceRoleArgs {
  name: string;
  s3BucketArn?: pulumi.Input<string>;
  kmsKeyArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface RdsRoleArgs {
  name: string;
  kmsKeyArn?: pulumi.Input<string>;
  s3BucketArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface AlbRoleArgs {
  name: string;
  s3BucketArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

// Define interface for IAM policy statements
interface IamPolicyStatement {
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
  Condition?: Record<string, Record<string, string | string[]>>;
}

export class IamRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly roleArn: pulumi.Output<string>;
  public readonly roleName: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:IamRoleComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.role = new aws.iam.Role(
      `${name}-role`,
      {
        name: args.name,
        assumeRolePolicy: args.assumeRolePolicy,
        description: args.description,
        maxSessionDuration: args.maxSessionDuration || 3600,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;
    this.roleName = this.role.name;

    this.registerOutputs({
      role: this.role,
      roleArn: this.roleArn,
      roleName: this.roleName,
    });
  }
}

export class IamPolicyComponent extends pulumi.ComponentResource {
  public readonly policy: aws.iam.Policy;
  public readonly policyArn: pulumi.Output<string>;
  public readonly policyName: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamPolicyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:IamPolicyComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.policy = new aws.iam.Policy(
      `${name}-policy`,
      {
        name: args.name,
        policy: args.policy,
        description: args.description,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.policyArn = this.policy.arn;
    this.policyName = this.policy.name;

    this.registerOutputs({
      policy: this.policy,
      policyArn: this.policyArn,
      policyName: this.policyName,
    });
  }
}

export class Ec2InstanceRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly instanceProfile: aws.iam.InstanceProfile;
  public readonly roleArn: pulumi.Output<string>;
  public readonly instanceProfileArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: Ec2InstanceRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:Ec2InstanceRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-ec2`,
      {
        name: `${args.name}-ec2-role`,
        assumeRolePolicy: assumeRolePolicy,
        description: 'IAM role for EC2 instances with least privilege access',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy with least privilege permissions
    const policyDocument = pulumi
      .all([args.s3BucketArn, args.kmsKeyArn])
      .apply(([s3Arn, kmsArn]) => {
        const statements: IamPolicyStatement[] = [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
        ];

        if (s3Arn) {
          statements.push({
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${s3Arn}/*`,
          });
          statements.push({
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Arn,
          });
        }

        if (kmsArn) {
          statements.push({
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: kmsArn,
          });
        }

        return JSON.stringify({
          Version: '2012-10-17',
          Statement: statements,
        });
      });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-ec2-policy`,
        policy: policyDocument,
        description:
          'Policy for EC2 instances with minimal required permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    // Create instance profile
    this.instanceProfile = new aws.iam.InstanceProfile(
      `${name}-profile`,
      {
        name: `${args.name}-ec2-profile`,
        role: this.role.name,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;
    this.instanceProfileArn = this.instanceProfile.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      instanceProfile: this.instanceProfile,
      roleArn: this.roleArn,
      instanceProfileArn: this.instanceProfileArn,
    });
  }
}

export class RdsRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:RdsRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'rds.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-rds`,
      {
        name: `${args.name}-rds-role`,
        assumeRolePolicy: assumeRolePolicy,
        description: 'IAM role for RDS with monitoring and backup permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy with RDS-specific permissions
    const policyDocument = pulumi
      .all([args.s3BucketArn, args.kmsKeyArn])
      .apply(([s3Arn, kmsArn]) => {
        const statements: IamPolicyStatement[] = [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ];

        if (s3Arn) {
          statements.push({
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Arn}/backups/*`,
          });
          statements.push({
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Arn,
            Condition: {
              StringLike: {
                's3:prefix': ['backups/*'],
              },
            },
          });
        }

        if (kmsArn) {
          statements.push({
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            Resource: kmsArn,
          });
        }

        return JSON.stringify({
          Version: '2012-10-17',
          Statement: statements,
        });
      });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-rds-policy`,
        policy: policyDocument,
        description: 'Policy for RDS with backup and monitoring permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      roleArn: this.roleArn,
    });
  }
}

export class AlbRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:AlbRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'elasticloadbalancing.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-alb`,
      {
        name: `${args.name}-alb-role`,
        assumeRolePolicy: assumeRolePolicy,
        description:
          'IAM role for Application Load Balancer with logging permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy for ALB access logs
    const policyDocument = pulumi.all([args.s3BucketArn]).apply(([s3Arn]) => {
      const statements: IamPolicyStatement[] = [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: '*',
        },
      ];

      if (s3Arn) {
        statements.push({
          Effect: 'Allow',
          Action: ['s3:PutObject'],
          Resource: `${s3Arn}/alb-logs/*`,
        });
        statements.push({
          Effect: 'Allow',
          Action: ['s3:GetBucketAcl'],
          Resource: s3Arn,
        });
      }

      return JSON.stringify({
        Version: '2012-10-17',
        Statement: statements,
      });
    });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-alb-policy`,
        policy: policyDocument,
        description: 'Policy for ALB with logging permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      roleArn: this.roleArn,
    });
  }
}

export function createIamRole(name: string, args: IamRoleArgs): IamRoleResult {
  const roleComponent = new IamRoleComponent(name, args);
  return {
    role: roleComponent.role,
    roleArn: roleComponent.roleArn,
    roleName: roleComponent.roleName,
  };
}

export function createIamPolicy(
  name: string,
  args: IamPolicyArgs
): IamPolicyResult {
  const policyComponent = new IamPolicyComponent(name, args);
  return {
    policy: policyComponent.policy,
    policyArn: policyComponent.policyArn,
    policyName: policyComponent.policyName,
  };
}

export function createEc2InstanceRole(name: string, args: Ec2InstanceRoleArgs) {
  const ec2RoleComponent = new Ec2InstanceRoleComponent(name, args);
  return {
    role: ec2RoleComponent.role,
    policy: ec2RoleComponent.policy,
    instanceProfile: ec2RoleComponent.instanceProfile,
    roleArn: ec2RoleComponent.roleArn,
    instanceProfileArn: ec2RoleComponent.instanceProfileArn,
  };
}

export function createRdsRole(name: string, args: RdsRoleArgs) {
  const rdsRoleComponent = new RdsRoleComponent(name, args);
  return {
    role: rdsRoleComponent.role,
    policy: rdsRoleComponent.policy,
    roleArn: rdsRoleComponent.roleArn,
  };
}

export function createAlbRole(name: string, args: AlbRoleArgs) {
  const albRoleComponent = new AlbRoleComponent(name, args);
  return {
    role: albRoleComponent.role,
    policy: albRoleComponent.policy,
    roleArn: albRoleComponent.roleArn,
  };
}
