import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bucket: s3.Bucket;
  public readonly instance: ec2.Instance;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly role: iam.Role;
  public readonly cpuAlarm: cloudwatch.Alarm;
  public readonly statusCheckAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = this.region || 'us-east-1';
    // Use a safe naming suffix that doesn't include tokens for construct IDs
    const namingSuffix = region.includes('Token')
      ? 'BlogApp-us-east-1'
      : `BlogApp-${region}`;

    this.vpc = new ec2.Vpc(this, `VPC-${namingSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Only set bucket name if we have resolved account and region (not tokens)
    const bucketName =
      this.account && !region.includes('Token')
        ? `s3-blogapp-${region}-${this.account}-${environmentSuffix}`.toLowerCase()
        : undefined;

    this.bucket = new s3.Bucket(this, `S3-${namingSuffix}`, {
      bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.role = new iam.Role(this, `IAM-${namingSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3ReadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
            }),
          ],
        }),
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [`arn:aws:logs:${region}:${this.account}:*`],
            }),
          ],
        }),
      },
    });

    this.securityGroup = new ec2.SecurityGroup(this, `SG-${namingSuffix}`, {
      vpc: this.vpc,
      description: 'Security group for blog platform EC2 instance',
      allowAllOutbound: true,
    });

    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic on port 80'
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Blog Platform - Environment: ' +
        environmentSuffix +
        '</h1>" > /var/www/html/index.html',
      // Robust metadata retrieval with retries and error handling
      'for i in {1..10}; do',
      '  TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" --connect-timeout 5 --max-time 10 2>/dev/null)',
      '  if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "curl: " ]; then',
      '    INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id --connect-timeout 5 --max-time 10 2>/dev/null)',
      '    if [ ! -z "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "curl: " ]; then',
      '      echo "<p>Instance ID: $INSTANCE_ID</p>" >> /var/www/html/index.html',
      '      break',
      '    fi',
      '  fi',
      '  sleep 2',
      'done',
      // Fallback if metadata service is not available
      'if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "curl: " ]; then',
      '  echo "<p>Instance ID: metadata-unavailable</p>" >> /var/www/html/index.html',
      'fi'
    );

    this.instance = new ec2.Instance(this, `EC2-${namingSuffix}`, {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.securityGroup,
      role: this.role,
      userData: userData,
      detailedMonitoring: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    this.cpuAlarm = new cloudwatch.Alarm(this, `CW-CPUAlarm-${namingSuffix}`, {
      alarmName: `EC2-CPUUtilization-${namingSuffix}-${environmentSuffix}`,
      alarmDescription:
        'Alarm for high CPU utilization on blog platform EC2 instance',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: this.instance.instanceId,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    this.statusCheckAlarm = new cloudwatch.Alarm(
      this,
      `CW-StatusCheckAlarm-${namingSuffix}`,
      {
        alarmName: `EC2-StatusCheckFailed-${namingSuffix}-${environmentSuffix}`,
        alarmDescription:
          'Alarm for failed status checks on blog platform EC2 instance',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'StatusCheckFailed',
          dimensionsMap: {
            InstanceId: this.instance.instanceId,
          },
          period: cdk.Duration.minutes(1),
          statistic: 'Maximum',
        }),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the blog platform',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name for static content',
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: this.instance.instanceId,
      description: 'EC2 instance ID',
    });

    new cdk.CfnOutput(this, 'PublicIp', {
      value: this.instance.instancePublicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `http://${this.instance.instancePublicIp}`,
      description: 'URL to access the blog platform',
    });
  }
}
