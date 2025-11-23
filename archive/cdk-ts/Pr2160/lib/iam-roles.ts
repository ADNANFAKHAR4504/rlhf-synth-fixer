import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IamRolesProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
}

export class IamRolesStack extends cdk.Stack {
  public readonly ec2Role: iam.Role;
  public readonly crossRegionReplicationRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id, props);

    // EC2 Instance Role with minimal permissions
    this.ec2Role = new iam.Role(this, `EC2Role${props.environmentSuffix}`, {
      roleName: `ec2-role-${props.environmentSuffix}-${props.region.replace(/-/g, '')}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add custom policy for specific resource access
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [`arn:aws:logs:${props.region}:*:log-group:/aws/ec2/*`],
      })
    );

    // Cross-region replication role (if needed for data replication)
    this.crossRegionReplicationRole = new iam.Role(
      this,
      `CrossRegionRole${props.environmentSuffix}`,
      {
        roleName: `cross-region-role-${props.environmentSuffix}-${props.region.replace(/-/g, '')}`,
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description:
          'IAM role for cross-region replication with minimal required permissions',
      }
    );

    // Add minimal permissions for cross-region operations
    this.crossRegionReplicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObjectVersion',
          's3:GetObjectVersionAcl',
          's3:ListBucket',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    // Output role ARNs for cross-stack references
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: `EC2 Role ARN for ${props.region}`,
      exportName: `EC2RoleArn-${props.environmentSuffix}-${props.region}`,
    });

    new cdk.CfnOutput(this, 'CrossRegionRoleArn', {
      value: this.crossRegionReplicationRole.roleArn,
      description: `Cross Region Role ARN for ${props.region}`,
      exportName: `CrossRegionRoleArn-${props.environmentSuffix}-${props.region}`,
    });

    // Add tags
    cdk.Tags.of(this.ec2Role).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.ec2Role).add('Region', props.region);
    cdk.Tags.of(this.crossRegionReplicationRole).add(
      'Environment',
      props.environmentSuffix
    );
    cdk.Tags.of(this.crossRegionReplicationRole).add('Region', props.region);
  }
}
