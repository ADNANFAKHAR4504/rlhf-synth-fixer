import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix: string;
  port: number;
}

function generateUniqueBucketName(): string {
  const timestamp = Date.now().toString(36); // base36 for compactness
  const random = Math.random().toString(36).substring(2, 8); // 6-char random string
  return `webserver-assets-${timestamp}-${random}`;
}

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    const { environmentSuffix, port } = props;

    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // updated
        },
      ],
    });

    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    vpc.addFlowLog('FlowLogs', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'FlowLogsGroup'),
        flowLogRole
      ),
    });

    const encryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      enableKeyRotation: true,
    });
    const bucketID = generateUniqueBucketName();
    const bucket = new s3.Bucket(this, 'WebAppBucket', {
      bucketName: `webserver-assets-${bucketID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new ssm.StringParameter(this, 'ConfigParam', {
      parameterName: `/webapp/${environmentSuffix}/config`,
      stringValue: JSON.stringify({ environment: environmentSuffix }),
    });

    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS'
    );
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo apt update -y',
      'sudo apt install -y nginx',
      'sudo systemctl enable nginx',
      'sudo systemctl start nginx'
    );
    const asg = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': 'ami-0fc5d935ebf8bc3bc', // Ubuntu 22.04 LTS x86_64
      }),
      role: ec2Role,
      minCapacity: 2,
      maxCapacity: 5,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup,
      userData,
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
    });

    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    httpListener.addTargets('HttpTargets', {
      port,
      targets: [asg],
      healthCheck: {
        path: '/',
        port: 'traffic-port',
        protocol: elbv2.Protocol.HTTP,
        healthyHttpCodes: '200-299',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });
    const certArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/app/certArn'
    );
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      `${environmentSuffix}`,
      certArn
    );
    // Add HTTPS listener (disabled unless certs are provided)
    alb.addListener('HttpsListener', {
      port: 443,
      // Provide actual certs before enabling
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Hello World!',
      }),
    });

    asg.scaleOnCpuUtilization('KeepSpareCPU', {
      targetUtilizationPercent: 50,
    });

    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS',
    });
    new cdk.CfnOutput(this, 'VPCID', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
    new cdk.CfnOutput(this, 'S3Bucket', {
      value: bucket.bucketName,
      description: 'S3 Bucket ID',
    });
    new cdk.CfnOutput(this, 'InstanceRoleName', {
      value: ec2Role.roleName,
      description: 'Instance role name',
    });
    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security group ID',
    });
  }
}
