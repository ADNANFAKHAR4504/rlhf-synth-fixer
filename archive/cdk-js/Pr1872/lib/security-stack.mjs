import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // IAM role for EC2 instances with least privilege principle
    this.ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      roleName: `ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams'
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`
              ]
            })
          ]
        })
      }
    });

    // Instance profile for the role
    this.instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `ec2-profile-${environmentSuffix}`,
      role: this.ec2Role,
    });

    // Security Group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora cluster',
      allowAllOutbound: false,
    });

    // Security Group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instances',
    });

    // Allow EC2 to connect to RDS on MySQL port
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow EC2 instances to connect to RDS'
    );

    // Output role ARN
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'ARN of the EC2 instance role',
      exportName: `${this.stackName}-EC2RoleArn`,
    });
  }
}

export { SecurityStack };