# AWS CDK TypeScript Infrastructure

This solution provides AWS infrastructure using CDK TypeScript.

## lib/self-cert-util.ts

```typescript
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ACMClient, ImportCertificateCommand } from '@aws-sdk/client-acm';
import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

const DOMAIN = 'example.com';
const REGION = 'us-east-1';
const OUT_DIR = './certs';
const SSM_PARAM = '/app/certArn';

const KEY_FILE = path.join(OUT_DIR, `${DOMAIN}.key`);
const CSR_FILE = path.join(OUT_DIR, `${DOMAIN}.csr`);
const CRT_FILE = path.join(OUT_DIR, `${DOMAIN}.crt`);

export async function generateSelfSignedCertAndStore(): Promise<void> {
  const ssm = new SSMClient({ region: REGION });

  // Check if cert already exists in SSM
  try {
    const existing = await ssm.send(
      new GetParameterCommand({ Name: SSM_PARAM })
    );
    console.log(`ℹ️ Certificate already exists: ${existing.Parameter?.Value}`);
    return;
  } catch (err) {
    const e = err as Record<string, unknown>;
    if (e.name !== 'ParameterNotFound') {
      console.error('❌ Error checking SSM parameter:', err);
      throw err;
    }
    console.log('📎 No existing cert ARN, generating new one...');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('🔧 Generating private key...');
  execSync(`openssl genrsa -out "${KEY_FILE}" 2048`);

  console.log('🔧 Creating CSR...');
  execSync(
    `openssl req -new -key "${KEY_FILE}" -out "${CSR_FILE}" -subj "/C=US/ST=Dev/L=Dev/O=Dev/OU=Dev/CN=${DOMAIN}"`
  );

  console.log('🔧 Creating self-signed certificate...');
  execSync(
    `openssl x509 -req -in "${CSR_FILE}" -signkey "${KEY_FILE}" -out "${CRT_FILE}" -days 365`
  );

  console.log('✅ Self-signed certificate generated in', OUT_DIR);

  const certificate = fs.readFileSync(CRT_FILE);
  const privateKey = fs.readFileSync(KEY_FILE);

  const acm = new ACMClient({ region: REGION });

  console.log('📤 Importing certificate to AWS ACM...');
  const importResp = await acm.send(
    new ImportCertificateCommand({
      Certificate: certificate,
      PrivateKey: privateKey,
    })
  );

  const certArn = importResp.CertificateArn;
  if (!certArn) {
    throw new Error('❌ Certificate ARN was not returned from ACM.');
  }

  console.log(`✅ Certificate imported. ARN: ${certArn}`);

  console.log(`📦 Storing ARN to SSM: ${SSM_PARAM}`);
  await ssm.send(
    new PutParameterCommand({
      Name: SSM_PARAM,
      Type: 'String',
      Value: certArn,
      Overwrite: true,
    })
  );

  console.log(`✅ ARN stored in SSM: ${SSM_PARAM}`);
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebAppStack } from './webapp-stack';
import { generateSelfSignedCertAndStore } from './self-cert-util';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

if (require.main === module) {
  generateSelfSignedCertAndStore();
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const port = Number(process.env.PORT) || 80;

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    new WebAppStack(this, 'WebAppStack', {
      environmentSuffix,
      port,
      env: {
        region: 'us-east-1',
      },
    });
  }
}
```

## lib/webapp-stack.ts

```typescript
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

    // Create ALB security group
    const albSG = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'ALB security group',
      allowAllOutbound: true,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow HTTP from ALB',
    });

    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSG.securityGroupId),
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    securityGroup.addIngressRule(
      // ec2.Peer.anyIpv4(),
      ec2.Peer.securityGroupId(albSG.securityGroupId),
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
      description: 'EC2 Security Group ID',
    });
  }
}
```

