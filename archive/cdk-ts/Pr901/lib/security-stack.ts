import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // IAM role for EC2 instances
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with secure AWS service access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Additional permissions for secure operations
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          's3:GetObject',
          's3:PutObject',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dax:*',
        ],
        resources: ['*'],
      })
    );

    // Instance profile for EC2
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.ec2Role.roleName],
      instanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'IaCChallenge');
  }
}
