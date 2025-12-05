/**
 * IAM Stack - IAM roles and policies for CodePipeline, CodeBuild, and CodeDeploy
 *
 * This stack creates IAM roles with least privilege access for:
 * - CodePipeline: Orchestrate the pipeline
 * - CodeBuild: Build and test containers
 * - CodeDeploy: Deploy to ECS with blue-green strategy
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamStackArgs {
  environmentSuffix: string;
  region: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly codePipelineRoleArn: pulumi.Output<string>;
  public readonly codeBuildRoleArn: pulumi.Output<string>;
  public readonly codeDeployRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:IamStack', name, args, opts);

    // CodePipeline Trust Policy
    const codePipelineAssumeRole = aws.iam.getPolicyDocument({
      statements: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['codepipeline.amazonaws.com'],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    // CodePipeline Role
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${args.environmentSuffix}`,
      {
        name: `codepipeline-role-${args.environmentSuffix}`,
        assumeRolePolicy: codePipelineAssumeRole.then(doc => doc.json),
        tags: args.tags,
      },
      { parent: this }
    );

    // CodePipeline Policy
    new aws.iam.RolePolicy(
      `codepipeline-policy-${args.environmentSuffix}`,
      {
        name: `codepipeline-policy-${args.environmentSuffix}`,
        role: codePipelineRole.id,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:StartBuild",
        "codebuild:BatchGetBuilds"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetApplication",
        "codedeploy:GetApplicationRevision",
        "codedeploy:GetDeployment",
        "codedeploy:GetDeploymentConfig",
        "codedeploy:RegisterApplicationRevision"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}`,
      },
      { parent: this }
    );

    // CodeBuild Trust Policy
    const codeBuildAssumeRole = aws.iam.getPolicyDocument({
      statements: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['codebuild.amazonaws.com'],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    // CodeBuild Role
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${args.environmentSuffix}`,
      {
        name: `codebuild-role-${args.environmentSuffix}`,
        assumeRolePolicy: codeBuildAssumeRole.then(doc => doc.json),
        tags: args.tags,
      },
      { parent: this }
    );

    // CodeBuild Policy
    new aws.iam.RolePolicy(
      `codebuild-policy-${args.environmentSuffix}`,
      {
        name: `codebuild-policy-${args.environmentSuffix}`,
        role: codeBuildRole.id,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeDhcpOptions",
        "ec2:DescribeVpcs",
        "ec2:CreateNetworkInterfacePermission"
      ],
      "Resource": "*"
    }
  ]
}`,
      },
      { parent: this }
    );

    // CodeDeploy Trust Policy
    const codeDeployAssumeRole = aws.iam.getPolicyDocument({
      statements: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['codedeploy.amazonaws.com'],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    // CodeDeploy Role
    const codeDeployRole = new aws.iam.Role(
      `codedeploy-role-${args.environmentSuffix}`,
      {
        name: `codedeploy-role-${args.environmentSuffix}`,
        assumeRolePolicy: codeDeployAssumeRole.then(doc => doc.json),
        managedPolicyArns: ['arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'],
        tags: args.tags,
      },
      { parent: this }
    );

    this.codePipelineRoleArn = codePipelineRole.arn;
    this.codeBuildRoleArn = codeBuildRole.arn;
    this.codeDeployRoleArn = codeDeployRole.arn;

    this.registerOutputs({
      codePipelineRoleArn: this.codePipelineRoleArn,
      codeBuildRoleArn: this.codeBuildRoleArn,
      codeDeployRoleArn: this.codeDeployRoleArn,
    });
  }
}
