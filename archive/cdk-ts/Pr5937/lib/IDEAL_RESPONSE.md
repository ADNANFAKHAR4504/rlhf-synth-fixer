# Ideal Response

## Summary
- Captured the latest TapStack orchestration and CloudSetup infrastructure constructs.
- Documented environment defaults and supporting Lambda processor source used during validation.
- Included full source listings for direct reference without referring to tests or external docs.

## Source Listings

### tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudSetupStack } from './cloud-setup-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  existingVpcId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate CloudSetup as a construct within this single TapStack (no nested stacks)
    const usEast = new CloudSetupStack(
      this,
      `CloudSetupUsEast1-${environmentSuffix}`,
      {
        domainName: `cloudsetup-${environmentSuffix}.example.com`,
        environmentSuffix,
        createHostedZone: false,
        existingVpcId: props?.existingVpcId,
      }
    );

    // Instantiate CloudSetupStack for eu-west-1
    /*
    const euWest = new CloudSetupStack(this, `CloudSetupEuWest1-${environmentSuffix}`, {
      env: { region: 'eu-west-1', account: props?.env?.account },
      domainName: `eu.cloudsetup-${environmentSuffix}.example.com`,
      environmentSuffix,
    });
    */

    // Re-export important outputs so the top-level stack shows flat outputs
    new cdk.CfnOutput(this, 'UsEast_VpcId', { value: usEast.vpcId });
    new cdk.CfnOutput(this, 'UsEast_RdsEndpoint', {
      value: usEast.rdsEndpoint ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_BucketName', {
      value: usEast.bucketName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_AlbDns', { value: usEast.albDns ?? '' });
    new cdk.CfnOutput(this, 'UsEast_CloudFrontUrl', {
      value: usEast.cloudFrontUrl ?? '',
    });
    // Helpful additional outputs for integration tests
    new cdk.CfnOutput(this, 'UsEast_LambdaFunctionName', {
      value: usEast.lambdaFunctionName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_LambdaLogGroup', {
      value: usEast.lambdaLogGroupName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_RdsSecurityGroupId', {
      value: usEast.rdsSecurityGroupId ?? '',
    });

    /*
    new cdk.CfnOutput(this, 'EuWest_VpcId', { value: euWest.vpcId });
    new cdk.CfnOutput(this, 'EuWest_RdsEndpoint', { value: euWest.rdsEndpoint ?? '' });
    new cdk.CfnOutput(this, 'EuWest_BucketName', { value: euWest.bucketName ?? '' });
    new cdk.CfnOutput(this, 'EuWest_AlbDns', { value: euWest.albDns ?? '' });
    new cdk.CfnOutput(this, 'EuWest_CloudFrontUrl', { value: euWest.cloudFrontUrl ?? '' });
    */
  }
}
```

### cloud-setup-stack.ts
```typescript
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

export interface CloudSetupStackProps {
  domainName: string;
  environmentSuffix: string;
  // Optional: ARNs for certs if available
  albCertificateArn?: string;
  cloudFrontCertificateArn?: string; // should be in us-east-1 when used
  // When true, create a public Route53 hosted zone for `domainName`. Default: false.
  createHostedZone?: boolean;
  /** If provided, reuse an existing VPC instead of creating a new one */
  existingVpcId?: string;
}

export class CloudSetupStack extends Construct {
  public readonly vpcId!: string;
  public readonly rdsEndpoint?: string;
  public readonly bucketName?: string;
  public readonly albDns?: string;
  public readonly cloudFrontUrl?: string;
  public readonly lambdaFunctionName?: string;
  public readonly lambdaLogGroupName?: string;
  public readonly rdsSecurityGroupId?: string;

  private readonly suffix: string;

  constructor(scope: Construct, id: string, props: CloudSetupStackProps) {
    super(scope, id);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    this.suffix = `${props.environmentSuffix || 'dev'}-${timestamp}`;

    // Apply requested tag on all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', props.environmentSuffix || 'dev');
    cdk.Tags.of(this).add('project', 'cloud-setup');

    // KMS key (region-local)
    const key = new kms.Key(this, `kms-key-${this.suffix}`, {
      description: `KMS key ${this.suffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    key.addAlias(`alias/iac-rlhf-${this.suffix}`);

    // VPC: reuse existing VPC if provided via props.existingVpcId, otherwise create new
    let vpc: ec2.IVpc;
    if (props.existingVpcId) {
      vpc = ec2.Vpc.fromLookup(this, `existing-vpc-${this.suffix}`, {
        vpcId: props.existingVpcId,
      });
    } else {
      vpc = new ec2.Vpc(this, `vpc-${this.suffix}`, {
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
    }
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

    // Lambda for S3 event processing - real-world use case
    const fn = new lambda.Function(this, `s3-processor-fn-${this.suffix}`, {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({});

exports.handler = async (event) => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));
  const results = [];
  
  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
      const size = record.s3.object.size;
      
      console.log(\`Processing object: \${bucket}/\${key} (\${size} bytes)\`);
      
      // Get object metadata for processing
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      
      const response = await s3Client.send(getObjectCommand);
      
      const processingResult = {
        bucket,
        key,
        size,
        lastModified: response.LastModified?.toISOString() || new Date().toISOString(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
      
      // Create processing summary and store it back to S3
      const summaryKey = \`processed-summaries/\${key.replace(/[^a-zA-Z0-9]/g, '_')}_summary.json\`;
      const summaryData = {
        ...processingResult,
        processedAt: new Date().toISOString(),
        processingVersion: '1.0',
        eventSource: record.eventSource,
        eventName: record.eventName,
      };
      
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: summaryKey,
        Body: JSON.stringify(summaryData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'original-key': key,
          'processing-timestamp': new Date().toISOString(),
        },
      });
      
      await s3Client.send(putCommand);
      
      console.log(\`Created processing summary: \${bucket}/\${summaryKey}\`);
      results.push(processingResult);
      
    } catch (error) {
      console.error('Error processing S3 object:', error);
      throw error;
    }
  }
  
  console.log(\`Successfully processed \${results.length} S3 objects\`);
  return {
    statusCode: 200,
    processedCount: results.length,
    results,
  };
};
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      description: 'Processes S3 events and creates object summaries',
      environment: {
        BUCKET_NAME: bucket.bucketName,
        LOG_GROUP_NAME: `/aws/lambda/s3-processor-${this.suffix}`,
      },
    });
    // Grant Lambda permissions to read from and write to the S3 bucket
    bucket.grantReadWrite(fn);

    // expose function name and expected log group name for integration tests
    this.lambdaFunctionName = fn.functionName;
    this.lambdaLogGroupName = `/aws/lambda/${fn.functionName}`;

    // Add S3 event notification for object creation
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(fn),
      { prefix: 'uploads/', suffix: '.json' } // Only process JSON files in uploads/ prefix
    );

    // RDS
    const rdsSg = new ec2.SecurityGroup(this, `rds-sg-${this.suffix}`, {
      vpc,
      description: 'RDS security group',
      securityGroupName: `rds-sg-${this.suffix}`,
    });
    this.rdsSecurityGroupId = rdsSg.securityGroupId;
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
    // Install HTTPD and the Amazon CloudWatch Agent, configure it to ship httpd logs
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl enable httpd',
      'systemctl start httpd',
      'echo "Hello from CloudSetup" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      // write the cloudwatch agent config; inject the stack suffix into the log group name
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
{ "agent": { "metrics_collection_interval": 60, "run_as_user": "root" },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ecs/cloud-setup-${this.suffix}",
            "log_stream_name": "{instance_id}-httpd-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ecs/cloud-setup-${this.suffix}",
            "log_stream_name": "{instance_id}-httpd-error"
          }
        ]
      }
    }
  }
}
EOF`,
      // start the agent using the file-based config
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Ensure the EC2 role can create log streams and put log events into the target log group
    ec2Role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [
          // allow the role to write to the specific log group created above
          `arn:aws:logs:*:*:log-group:/aws/ecs/cloud-setup-${this.suffix}:*`,
        ],
      })
    );

    // Define the ASG and explicitly set a root block device mapping that does
    // not provide a customer KMS key. This ensures EC2/EBS volumes will use
    // the default EBS KMS key (AWS-managed) rather than a custom key which
    // can sometimes be in an invalid state and prevent instances from
    // reaching InService.
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
      // Explicitly configure the root block device without encryption to avoid
      // any KMS key issues. This ensures instances can launch even if the
      // account's default EBS encryption key is in an invalid state.
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(8, {
            // Remove encryption to avoid KMS key issues during deployment
            // encrypted: false is the default, so we don't need to specify it
          }),
        },
      ],
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
    // Removed CfnOutputs to avoid cross-stack export conflicts
  }
}
```

### lambda/s3-event-processor.ts
```typescript
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event, S3Handler } from 'aws-lambda';

const s3Client = new S3Client({});
const logsClient = new CloudWatchLogsClient({});

interface S3ProcessingResult {
  bucket: string;
  key: string;
  size: number;
  lastModified: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export const handler: S3Handler = async (event: S3Event) => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

  const results: S3ProcessingResult[] = [];

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const size = record.s3.object.size;

      console.log(`Processing object: ${bucket}/${key} (${size} bytes)`);

      // Get object metadata for processing
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);

      const processingResult: S3ProcessingResult = {
        bucket,
        key,
        size,
        lastModified: response.LastModified?.toISOString() || new Date().toISOString(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };

      // Create processing summary and store it back to S3
      const summaryKey = `processed-summaries/${key.replace(/[^a-zA-Z0-9]/g, '_')}_summary.json`;
      const summaryData = {
        ...processingResult,
        processedAt: new Date().toISOString(),
        processingVersion: '1.0',
        eventSource: record.eventSource,
        eventName: record.eventName,
      };

      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: summaryKey,
        Body: JSON.stringify(summaryData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'original-key': key,
          'processing-timestamp': new Date().toISOString(),
        },
      });

      await s3Client.send(putCommand);

      console.log(`Created processing summary: ${bucket}/${summaryKey}`);
      results.push(processingResult);

    } catch (error) {
      console.error('Error processing S3 object:', error);
      throw error;
    }
  }

  console.log(`Successfully processed ${results.length} S3 objects`);
};
```
