import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IAMRolesConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { s3BucketName, logGroup } = props;

    // -------------------------------
    // Safe log group ARN resolution
    // -------------------------------
    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;

    let logGroupArn;
    if ('logGroupArn' in logGroup) {
      // If log group is created in CDK
      logGroupArn = logGroup.logGroupArn;
    } else {
      // If log group is imported (fromLogGroupName)
      logGroupArn = `arn:aws:logs:${region}:${account}:log-group:${logGroup.logGroupName}:*`;
    }

    // -------------------------------
    // IAM Role for EC2
    // -------------------------------
    this.instanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for secure web application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // S3 logging policy (write-only)
    const s3LoggingPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [`arn:aws:s3:::${s3BucketName}/logs/*`],
    });

    // CloudWatch Logs policy (dynamic ARN)
    const cloudWatchLogsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [logGroupArn],
    });

    // SSM policy
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: ['arn:aws:ssm:*:*:parameter/secure-webapp/*'],
    });

    // Attach all policies
    this.instanceRole.addToPolicy(s3LoggingPolicy);
    this.instanceRole.addToPolicy(cloudWatchLogsPolicy);
    this.instanceRole.addToPolicy(ssmPolicy);

    // Instance profile
    this.instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.instanceRole.roleName],
      instanceProfileName: 'InstanceProfile',
    });
  }
}
