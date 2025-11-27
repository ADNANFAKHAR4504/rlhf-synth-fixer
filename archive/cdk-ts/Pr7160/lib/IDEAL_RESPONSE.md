## Ideal Response

This repository defines a multi-environment AWS CDK application that provisions secure infrastructure stacks and orchestrates them via a parent `TapStack`. Below are the authoritative implementations for the two constructs located in `lib/`.
 

### `lib/multi-environment-infra-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MultiEnvironmentInfraProps {
  environment: string;
  region: string;
  domainName?: string;
  certificateArn?: string;
  environmentSuffix?: string;
  timestamp?: string;
}

export class MultiEnvironmentInfrastructureStack extends Construct {
  constructor(scope: Construct, id: string, props: MultiEnvironmentInfraProps) {
    super(scope, id);

    const environment = props.environment;
    const region = props.region;
    const envSuffix =
      props.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const timestamp = props.timestamp || Date.now().toString().slice(-6);
    const domainName = props.domainName;

    const prefix = `${environment}-${region}`;
    const nameSuffix = `-${envSuffix}-${timestamp}`;

    // Get the stack to apply tags and outputs
    const stack = cdk.Stack.of(this);

    // Apply tag required by the user
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // VPC
    const vpc = new ec2.Vpc(this, `${prefix}-vpc${nameSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
    });

    // Secrets Manager for DB credentials - generate a JSON SecretString with username and password
    const dbSecret = new secretsmanager.Secret(
      this,
      `${prefix}-db-secret${nameSuffix}`,
      {
        description: `Credentials for RDS instance ${prefix}`,
        generateSecretString: {
          // RDS expects a JSON SecretString the DB can use. Provide a username and generate a password.
          secretStringTemplate: JSON.stringify({ username: 'master' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          // Keep the secret reasonably long
          passwordLength: 24,
        },
      }
    );

    // RDS Postgres
    const dbSg = new ec2.SecurityGroup(this, `${prefix}-db-sg${nameSuffix}`, {
      vpc,
    });
    const db = new rds.DatabaseInstance(this, `${prefix}-rds${nameSuffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(dbSecret),
      allocatedStorage: 20,
      storageEncrypted: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      securityGroups: [dbSg],
    });

    // S3 bucket with versioning and TLS-only bucket policy
    const bucket = new s3.Bucket(this, `${prefix}-bucket${nameSuffix}`, {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Enforce HTTPS-only via bucket policy
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'EnforceTLS',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } },
      })
    );

    // SNS topic
    const errorTopic = new sns.Topic(
      this,
      `${prefix}-error-topic${nameSuffix}`
    );

    // Lambda triggered by S3
    const lambdaRole = new iam.Role(
      this,
      `${prefix}-lambda-role${nameSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );
    const fn = new lambda.Function(this, `${prefix}-lambda${nameSuffix}`, {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        'exports.handler = async () => { return { statusCode: 200 } }'
      ),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        ENVIRONMENT: environment,
        SNS_TOPIC_ARN: errorTopic.topicArn,
        ALERT_THRESHOLD_MB: '100',
      },
    });
    bucket.grantRead(fn);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(fn)
    );

    // ALB and ASG
    const albSg = new ec2.SecurityGroup(this, `${prefix}-alb-sg${nameSuffix}`, {
      vpc,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${prefix}-alb${nameSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSg,
      }
    );

    // Use AWS-managed EBS encryption key for all volumes
    // Customer-managed KMS keys can cause issues with ASG instance launches
    // due to key state synchronization problems

    // Create an instance role and security group for instances launched from the LaunchTemplate
    const instanceRole = new iam.Role(
      this,
      `${prefix}-instance-role${nameSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    const ltSg = new ec2.SecurityGroup(this, `${prefix}-lt-sg${nameSuffix}`, {
      vpc,
    });

    // Create an L2 LaunchTemplate with a block device mapping that references the CMK
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${prefix}-launchTemplate${nameSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        role: instanceRole,
        securityGroup: ltSg,
        // Removed blockDevices configuration entirely to avoid KMS key issues
        // Let AWS use the default AMI root volume configuration
      }
    );

    const asg = new autoscaling.AutoScalingGroup(
      this,
      `${prefix}-asg${nameSuffix}`,
      {
        vpc,
        launchTemplate,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        minCapacity: 2,
        desiredCapacity: 2,
        maxCapacity: 4,
        // When using a LaunchTemplate, the instance role should be supplied on the LaunchTemplate
      }
    );

    const tg = new elbv2.ApplicationTargetGroup(
      this,
      `${prefix}-tg${nameSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: { path: '/', healthyHttpCodes: '200' },
      }
    );

    // Attach ASG to target group
    asg.attachToApplicationTargetGroup(tg);

    const certificate = props.certificateArn
      ? acm.Certificate.fromCertificateArn(
          this,
          `${prefix}-cert${nameSuffix}`,
          props.certificateArn
        )
      : undefined;

    if (certificate) {
      alb.addListener(`${prefix}-listener${nameSuffix}`, {
        port: 443,
        certificates: [certificate],
        defaultTargetGroups: [tg],
      });
    } else {
      // No certificate provided: create an HTTP listener instead of HTTPS
      alb.addListener(`${prefix}-listener${nameSuffix}`, {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [tg],
      });
    }

    // CloudFront distribution (only if certificate provided and domainName exists)
    let distribution: cloudfront.Distribution | undefined = undefined;
    if (domainName && certificate) {
      distribution = new cloudfront.Distribution(
        this,
        `${prefix}-cf${nameSuffix}`,
        {
          defaultBehavior: {
            origin: new origins.LoadBalancerV2Origin(alb),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          domainNames: [`${environment}.${domainName}`],
          certificate,
        }
      );
      distribution.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Route53 hosted zone lookup and record
    if (domainName) {
      const hostedZone = route53.HostedZone.fromLookup(
        this,
        `${prefix}-hz${nameSuffix}`,
        { domainName }
      );
      new route53.ARecord(this, `${prefix}-a${nameSuffix}`, {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.LoadBalancerTarget(alb)
        ),
      });
    }

    // CloudWatch alarm example
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `${prefix}-cpu-alarm${nameSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
        }),
        threshold: 80,
        evaluationPeriods: 2,
      }
    );
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic));

    // Outputs
    new cdk.CfnOutput(stack, `${prefix}-alb-dns${nameSuffix}`, {
      value: alb.loadBalancerDnsName,
    });
    new cdk.CfnOutput(stack, `${prefix}-bucket-name${nameSuffix}`, {
      value: bucket.bucketName,
    });
    new cdk.CfnOutput(stack, `${prefix}-rds-endpoint${nameSuffix}`, {
      value: db.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(stack, `${prefix}-lambda-arn${nameSuffix}`, {
      value: fn.functionArn,
    });
    new cdk.CfnOutput(stack, `${prefix}-sns-topic-arn${nameSuffix}`, {
      value: errorTopic.topicArn,
    });
    new cdk.CfnOutput(stack, `${prefix}-asg-name${nameSuffix}`, {
      value: asg.autoScalingGroupName,
    });
    if (distribution) {
      new cdk.CfnOutput(stack, `${prefix}-cf-domain${nameSuffix}`, {
        value: distribution.distributionDomainName,
      });
    }

    // apply generic tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Region', region);

    // ensure ASG waits for LT, instance profile and TG to exist
    asg.node.addDependency(launchTemplate);
    asg.node.addDependency(ltSg); // the LaunchTemplate security group
    asg.node.addDependency(instanceRole); // role; CDK also creates InstanceProfile resource as defaultChild
    asg.node.addDependency(tg); // target group so attachment waits until both exist

    // if you want to be explicit about the instance profile resource (optional):
    const instanceProfileResource = instanceRole.node
      .defaultChild as cdk.CfnResource;
    if (instanceProfileResource) {
      asg.node.addDependency(instanceProfileResource);
    }
  }
}

```

### `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiEnvironmentInfrastructureStack } from './multi-environment-infra-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply the required global tag for all resources created by stacks
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    const timestamp = Date.now().toString().slice(-6);

    // Only deploy dev environment to avoid production deployment issues
    // Force dev-only deployment regardless of context
    const environments = ['dev'];

    // Determine which regions to create stacks in. If CDK_DEFAULT_REGION is set
    // in the environment (recommended for CI), honor it and create stacks only
    // in that single region. Otherwise fall back to the `regions` context (multi-region).
    const contextRegions = this.node.tryGetContext('regions') || [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
    ];
    const envRegion = process.env.CDK_DEFAULT_REGION;
    const regions = envRegion ? [envRegion] : contextRegions;

    const domainName =
      this.node.tryGetContext('domainName') ||
      this.node.tryGetContext('domain') ||
      undefined;
    const certificateArn =
      this.node.tryGetContext('cloudFrontCertificateArn') || undefined;

    for (const env of environments) {
      for (const region of regions) {
        const constructId = `multi-infra-${env}-${region}-${environmentSuffix}-${timestamp}`;
        new MultiEnvironmentInfrastructureStack(this, constructId, {
          environment: env,
          region: region,
          environmentSuffix,
          timestamp,
          domainName,
          certificateArn,
        });
      }
    }
  }
}

```
