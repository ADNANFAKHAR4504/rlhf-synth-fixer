import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

class IAMRolesConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { s3BucketName } = props;

    // Create IAM role for EC2 instances with minimal required permissions
    this.instanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for secure web application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ]
    });

    // Custom policy for S3 logging access (write-only to specific bucket)
    const s3LoggingPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      resources: [
        `arn:aws:s3:::${s3BucketName}/logs/*`
      ]
    });

    // Custom policy for CloudWatch Logs
    const cloudWatchLogsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams'
      ],
      resources: [
        'arn:aws:logs:*:*:log-group:/aws/ec2/secure-webapp/*'
      ]
    });

    // Custom policy for Systems Manager (for secure configuration management)
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [
        'arn:aws:ssm:*:*:parameter/secure-webapp/*'
      ]
    });

    // Add policies to the role
    this.instanceRole.addToPolicy(s3LoggingPolicy);
    this.instanceRole.addToPolicy(cloudWatchLogsPolicy);
    this.instanceRole.addToPolicy(ssmPolicy);

    // Create instance profile
    this.instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.instanceRole.roleName],
      instanceProfileName: 'SecureWebappInstanceProfile'
    });
  }
}

module.exports = { IAMRolesConstruct };
