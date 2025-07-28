import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}
export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WebAppStackProps) {
    super(scope, id, props);

    // Create a VPC with public and private subnets across multiple AZs
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
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // Create an S3 bucket with KMS encryption
    const encryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      enableKeyRotation: true,
    });

    const bucket = new s3.Bucket(this, 'WebAppBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // Store configuration data in SSM Parameter Store
    const configParam = new ssm.StringParameter(this, 'ConfigParam', {
      parameterName: '/webapp/config',
      stringValue: JSON.stringify({ environment: 'production' }),
    });

    // Create an IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // Create a security group for the EC2 instances
    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Create an Auto Scaling Group with at least two instances
    const asg = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
      role: ec2Role,
      minCapacity: 2,
      maxCapacity: 5,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      securityGroup,
    });

    // Create an Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('WebAppListener', {
      port: 80,
      open: true,
    });

    listener.addTargets('WebAppFleet', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/',
        protocol: elbv2.Protocol.HTTP,
      },
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

    // Redirect HTTP to HTTPS
    listener.addRedirectResponse('HttpsRedirect', {
      statusCode: 'HTTP_301',
      protocol: 'HTTPS',
      port: '443',
    });

    // Add HTTPS listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [
        /* Add your certificate ARNs here */
      ],
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    httpsListener.addTargets('HttpsTargets', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/',
        protocol: elbv2.Protocol.HTTPS,
      },
    });

    // Enable detailed monitoring and logging
    asg.scaleOnCpuUtilization('KeepSpareCPU', {
      targetUtilizationPercent: 50,
    });

    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: asg.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
    });

    // Output the DNS name of the load balancer
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
    });
  }
}

// const app = new cdk.App();
// new WebAppStack(app, 'WebAppStack', {
//   env: {
//     region: 'us-east-1',
//   },
// });
