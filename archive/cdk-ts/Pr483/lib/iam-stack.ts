import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IamStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class IamStack extends cdk.Stack {
  public readonly ec2Role: iam.Role;
  public readonly instanceProfile: iam.InstanceProfile;

  constructor(scope: Construct, id: string, props?: IamStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create IAM role for EC2 instances
    this.ec2Role = new iam.Role(this, `EC2Role${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `IAM role for EC2 instances in ${environmentSuffix} environment`,
      roleName: `EC2-MultiTier-Role-${environmentSuffix}`,
    });

    // Add policies for AWS services interaction
    this.ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Add custom policy for additional AWS services
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: ['*'],
      })
    );

    // Create instance profile
    this.instanceProfile = new iam.InstanceProfile(
      this,
      `InstanceProfile${environmentSuffix}`,
      {
        role: this.ec2Role,
        instanceProfileName: `EC2-MultiTier-Profile-${environmentSuffix}`,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: this.instanceProfile.instanceProfileArn,
      description: 'Instance Profile ARN',
    });
  }
}
