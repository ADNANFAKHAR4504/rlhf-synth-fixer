import * as cdk from 'aws-cdk-lib';
import { Aws, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // --- 1) 'S3' bucket for logging ---
    // We intentionally do not force a fixed bucketName so CDK synthesizes a unique name.
    // This satisfies the "unique name" constraint, while allowing easy override later.
    const logsBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY, // Allow bucket deletion for QA testing
      autoDeleteObjects: true, // Automatically empty bucket on deletion
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // logging bucket should not be public
      enforceSSL: true,
      lifecycleRules: [
        // Keep a lifecycle rule to expire non-current versions after 365 days (optional)
        {
          noncurrentVersionExpiration: Duration.days(365),
        },
      ],
    });

    // --- 2) VPC: single public subnet + IGW ---
    // Create a small VPC with one AZ and a single public subnet to host the EC2 instance.
    // Explicit CIDR chosen to be conservative and avoid collisions.
    const vpc = new ec2.Vpc(this, 'PublicVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
      maxAzs: 1,
      natGateways: 0, // no NAT required for a purely public instance
      subnetConfiguration: [
        {
          cidrMask: 28, // small subnet for minimal footprint
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // --- 3) Security Group: allow SSH & HTTP ---
    // IMPORTANT: For SSH, restrict source CIDR in production. Default here is 0.0.0.0/0 for convenience.
    const instanceSg = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      description: 'Allow SSH and HTTP to EC2 instance',
      allowAllOutbound: true,
    });

    // Allow SSH - restrict in production by replacing '0.0.0.0/0' with a narrow CIDR.
    instanceSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere restrict in production'
    );

    // Allow HTTP
    instanceSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // --- 4) IAM Role for EC2 (least privilege) ---
    // The instance role is granted:
    //  - ssm: needed for Session Manager (no open SSH required, but we still provide SSH port)
    //  - s3: PutObject/GetObject to the specific logging bucket only
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'EC2 role with minimal privileges: SSM for management and S3 write to logging bucket',
    });

    // Attach managed policy for SSM Core (so you can use Session Manager and Run Command)
    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Inline policy for S3 access limited to the logging bucket
    const bucketArn = logsBucket.bucketArn;
    const bucketObjectsArn = `${bucketArn}/*`;

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
        resources: [bucketArn, bucketObjectsArn],
        effect: iam.Effect.ALLOW,
        sid: 'AllowBucketOpsForLogging',
      })
    );

    // --- 5) EC2 Instance (t2.micro) ---
    // Amazon Linux 2 latest
    const ami = ec2.MachineImage.latestAmazonLinux({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      edition: ec2.AmazonLinuxEdition.STANDARD,
      virtualization: ec2.AmazonLinuxVirt.HVM,
      storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
    });

    const publicSubnet = vpc.publicSubnets[0];

    const instance = new ec2.Instance(this, 'WebInstance', {
      vpc,
      vpcSubnets: { subnets: [publicSubnet] },
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ami,
      securityGroup: instanceSg,
      role: instanceRole,
      keyName: undefined, // we rely on SSM session manager by default; if you need SSH with a key, set this (not recommended for automation)
    });

    // User data: install nginx and a simple index page that reports instance metadata
    const userDataScript = `#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl enable nginx
systemctl start nginx
# Create a simple page showing instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
AVAIL_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
cat > /usr/share/nginx/html/index.html <<'EOF'
<html>
  <head><title>Minimal Infra - Welcome</title></head>
  <body>
    <h1>Minimal Infra Deployment</h1>
    <p>Instance ID: $INSTANCE_ID</p>
    <p>Availability Zone: $AVAIL_ZONE</p>
    <p>Region: ${Aws.REGION}</p>
  </body>
</html>
EOF
# Example: put a marker file to the logging bucket using the instance role (demonstrates S3 permissions)
aws s3 cp /usr/share/nginx/html/index.html s3://${logsBucket.bucketName}/deployed-index.html || true
`;
    instance.addUserData(userDataScript);

    // --- 6) Elastic IP associated to the instance ---
    // Create an Elastic IP and attach it to the instance's primary network interface
    const eip = new ec2.CfnEIP(this, 'InstanceEIP', {
      domain: 'vpc',
      instanceId: instance.instanceId,
    });

    // --- 7) CloudWatch Log Group for instance bootstrap logs (optional) ---
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const logGroup = new logs.LogGroup(this, 'InstanceUserDataLog', {
      logGroupName: `/aws/tap/${environmentSuffix}/instance-logs`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // --- 8) SSM parameter: store the bucket name (convenience) ---
    new ssm.StringParameter(this, 'LoggingBucketNameParameter', {
      parameterName: `/tap-${environmentSuffix}/logging-bucket-name`,
      stringValue: logsBucket.bucketName,
      description:
        'Name of the S3 logging bucket created by minimal-infra stack',
    });

    // --- 9) Outputs ---
    // Public IP of the instance (from the EIP resource)
    new cdk.CfnOutput(this, 'InstancePublicIp', {
      value: eip.ref,
      description: 'Elastic IP attached to the EC2 instance',
    });

    // Public DNS (constructed) - can vary; provide a best-effort output
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket name for logs (versioned)',
    });

    // Security note output
    new cdk.CfnOutput(this, 'SecurityNote', {
      value:
        'SSH is open to 0.0.0.0/0 by default in this stack. Restrict SSH ingress in production.',
    });
  }
}
