import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface CloudSetupStackProps extends cdk.StackProps {
  domainName: string;
  environmentSuffix: string;
  // Optional: ARNs for certs if available
  albCertificateArn?: string;
  cloudFrontCertificateArn?: string; // should be in us-east-1 when used
  // When true, create a public Route53 hosted zone for `domainName`. Default: false.
  createHostedZone?: boolean;
}

export class CloudSetupStack extends cdk.Stack {
  public readonly vpcId!: string;
  public readonly rdsEndpoint?: string;
  public readonly bucketName?: string;
  public readonly albDns?: string;
  public readonly cloudFrontUrl?: string;

  private readonly suffix: string;

  constructor(scope: Construct, id: string, props: CloudSetupStackProps) {
    super(scope, id, props);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    this.suffix = `${props.environmentSuffix || 'dev'}-${timestamp}`;

    // Apply requested tag on all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', props.environmentSuffix || 'dev');

    // KMS key (region-local)
    const key = new kms.Key(this, `kms-key-${this.suffix}`, {
      description: `KMS key ${this.suffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    key.addAlias(`alias/iac-rlhf-${this.suffix}`);

    // VPC
    const vpc = new ec2.Vpc(this, `vpc-${this.suffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: `public-${this.suffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `private-${this.suffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });
    this.vpcId = vpc.vpcId;

    // Security group for ALB ingress (allow HTTPS and HTTP for flexibility)
    const httpsSg = new ec2.SecurityGroup(this, `https-sg-${this.suffix}`, {
      vpc,
      description: 'Allow ALB ingress (HTTP/HTTPS)',
      allowAllOutbound: true,
      securityGroupName: `https-sg-${this.suffix}`,
    });
    httpsSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS'
    );
    httpsSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    // IAM role for EC2
    const ec2Role = new iam.Role(this, `ec2-role-${this.suffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      description: 'EC2 role with read-only access',
    });

    // S3 bucket with unique name
    const bucket = new s3.Bucket(this, `s3-bucket-${this.suffix}`, {
      bucketName: `cloud-setup-${props.environmentSuffix || 'dev'}-${timestamp}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    this.bucketName = bucket.bucketName;

    // Lambda triggered by S3
    const fn = new lambda.Function(this, `s3-trigger-fn-${this.suffix}`, {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        "exports.handler = async () => { console.log('ok'); }"
      ),
      timeout: cdk.Duration.minutes(1),
      memorySize: 256,
    });
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(fn)
    );

    // RDS
    const rdsSg = new ec2.SecurityGroup(this, `rds-sg-${this.suffix}`, {
      vpc,
      description: 'RDS security group',
      securityGroupName: `rds-sg-${this.suffix}`,
    });
    rdsSg.addIngressRule(httpsSg, ec2.Port.tcp(3306), 'Allow from app SG');

    const db = new rds.DatabaseInstance(this, `rds-${this.suffix}`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSg],
      allocatedStorage: 20,
      storageEncrypted: true,
      storageEncryptionKey: key,
      multiAz: true,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // per user request
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.rdsEndpoint = db.dbInstanceEndpointAddress;

    // Log group
    new logs.LogGroup(this, `logs-${this.suffix}`, {
      logGroupName: `/aws/ecs/cloud-setup-${this.suffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // AutoScalingGroup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl enable httpd',
      'systemctl start httpd',
      'echo "Hello from CloudSetup" > /var/www/html/index.html'
    );

    const asg = new autoscaling.AutoScalingGroup(this, `asg-${this.suffix}`, {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: httpsSg,
      role: ec2Role,
      userData,
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
    });

    // ALB: terminate TLS at ALB, communicate to targets over HTTP
    const alb = new elbv2.ApplicationLoadBalancer(this, `alb-${this.suffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: httpsSg,
      loadBalancerName: `alb-${this.suffix}`,
    });

    // Create HTTPS listener only if certificate ARN provided, otherwise create HTTP listener
    let listener: elbv2.ApplicationListener;
    if (props.albCertificateArn) {
      listener = alb.addListener('HttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [{ certificateArn: props.albCertificateArn }],
      });
    } else {
      listener = alb.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
      });
    }

    listener.addTargets('AppTargets', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: { path: '/', healthyHttpCodes: '200' },
    });
    this.albDns = alb.loadBalancerDnsName;

    // CloudFront + optional Route53 zone. Do not create a public hosted zone by default
    // Only configure alternate domain names (CNAMEs) if a certificate ARN is provided.
    const cfCert = props.cloudFrontCertificateArn
      ? acm.Certificate.fromCertificateArn(
          this,
          `cf-cert-${this.suffix}`,
          props.cloudFrontCertificateArn
        )
      : undefined;
    const domainNames =
      cfCert && props.domainName ? [props.domainName] : undefined;

    const cf = new cloudfront.Distribution(this, `cf-${this.suffix}`, {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(alb),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: domainNames,
      certificate: domainNames && cfCert ? cfCert : undefined,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    this.cloudFrontUrl = `https://${cf.distributionDomainName}`;

    if (props.createHostedZone && props.domainName) {
      const hostedZone = new route53.HostedZone(
        this,
        `hosted-zone-${this.suffix}`,
        { zoneName: props.domainName }
      );
      new route53.ARecord(this, `cf-alias-${this.suffix}`, {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(cf)
        ),
      });
    }

    // CloudWatch alarm
    new cloudwatch.Alarm(this, `cpu-alarm-${this.suffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        dimensionsMap: { AutoScalingGroupName: asg.autoScalingGroupName },
      }),
      threshold: 70,
      evaluationPeriods: 2,
      alarmDescription: 'High CPU',
    });

    // Outputs (expose via public properties so TapStack can re-export)
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpcId });
    new cdk.CfnOutput(this, 'RdsEndpoint', { value: this.rdsEndpoint || '' });
    new cdk.CfnOutput(this, 'BucketName', { value: this.bucketName || '' });
    new cdk.CfnOutput(this, 'AlbDns', { value: this.albDns || '' });
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: this.cloudFrontUrl || '',
    });
  }
}
