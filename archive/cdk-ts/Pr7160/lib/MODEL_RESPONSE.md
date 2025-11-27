### Reasoning Trace
---

This is a comprehensive request to create a multi-environment, multi-region AWS infrastructure using AWS CDK with TypeScript. Let me break down all the requirements:

1. Multiple VPCs with non-overlapping CIDR blocks across regions
2. Lambda functions triggered by S3 events
3. PostgreSQL RDS with encrypted storage
4. Security Groups allowing only port 443 for load balancers
5. Route 53 for DNS and failover
6. IAM Roles for cross-account access
7. EC2 instance count control (default 3)
8. CloudWatch Alarms for EC2 CPU utilization
9. S3 buckets with versioning and HTTPS-only access
10. CloudFront distribution for regional routing
11. Secrets Manager for database credentials
12. SNS topics for error notifications
13. AWS Config rules for compliance
14. Auto-scaling ELB
15. Auto Scaling Groups with minimum 2 instances

The naming convention is: `[environment]-[region]-[service][Suffix]`

I need to create a comprehensive CDK stack that handles multiple environments and regions. Let me structure this properly.
### Answer 
---

Here's a complete TypeScript file that defines an AWS CDK stack meeting all the multi-environment and multi-region requirements:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as config from 'aws-cdk-lib/aws-config';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface MultiEnvStackProps extends cdk.StackProps {
  environment: string;
  region: string;
  domainName: string;
  ec2InstanceCount?: number;
  crossAccountRoleArns?: string[];
}

export class MultiEnvironmentInfrastructureStack extends cdk.Stack {
  private readonly vpcCidrMap: { [key: string]: string } = {
    'dev-us-east-1': '10.0.0.0/16',
    'dev-us-west-2': '10.1.0.0/16',
    'dev-eu-west-1': '10.2.0.0/16',
    'staging-us-east-1': '10.3.0.0/16',
    'staging-us-west-2': '10.4.0.0/16',
    'staging-eu-west-1': '10.5.0.0/16',
    'prod-us-east-1': '10.6.0.0/16',
    'prod-us-west-2': '10.7.0.0/16',
    'prod-eu-west-1': '10.8.0.0/16',
  };

  constructor(scope: Construct, id: string, props: MultiEnvStackProps) {
    super(scope, id, props);

    const { environment, region, domainName, ec2InstanceCount = 3, crossAccountRoleArns = [] } = props;
    const envRegionPrefix = `${environment}-${region}`;

    // 1. VPC with non-overlapping CIDR blocks
    const vpcCidr = this.vpcCidrMap[envRegionPrefix] || '10.100.0.0/16';
    const vpc = new ec2.Vpc(this, `${envRegionPrefix}-vpcMain`, {
      vpcName: `${envRegionPrefix}-vpcMain`,
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // 11. Secrets Manager for database credentials
    const dbSecret = new secretsmanager.Secret(this, `${envRegionPrefix}-dbSecretMain`, {
      secretName: `${envRegionPrefix}-dbSecretMain`,
      description: `Database credentials for ${envRegionPrefix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // 3. RDS PostgreSQL with encrypted storage
    const dbSecurityGroup = new ec2.SecurityGroup(this, `${envRegionPrefix}-dbSecurityGroupMain`, {
      vpc,
      securityGroupName: `${envRegionPrefix}-dbSecurityGroupMain`,
      description: 'Security group for RDS database',
      allowAllOutbound: true,
    });

    const dbInstance = new rds.DatabaseInstance(this, `${envRegionPrefix}-rdsPostgresMain`, {
      instanceIdentifier: `${envRegionPrefix}-rdspostgresmain`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 100,
      storageEncrypted: true,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'maindb',
      deletionProtection: environment === 'prod',
      backupRetention: cdk.Duration.days(environment === 'prod' ? 30 : 7),
      securityGroups: [dbSecurityGroup],
    });

    // 9. S3 bucket with versioning and HTTPS-only access
    const s3Bucket = new s3.Bucket(this, `${envRegionPrefix}-s3BucketMain`, {
      bucketName: `${envRegionPrefix}-s3bucketmain`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // 2. Lambda function triggered by S3 events
    const lambdaRole = new iam.Role(this, `${envRegionPrefix}-lambdaRoleMain`, {
      roleName: `${envRegionPrefix}-lambdaRoleMain`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    const lambdaFunction = new lambda.Function(this, `${envRegionPrefix}-lambdaS3ProcessorMain`, {
      functionName: `${envRegionPrefix}-lambdaS3ProcessorMain`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('S3 Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'S3 event processed successfully' }),
          };
        };
      `),
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environment,
        REGION: region,
      },
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.minutes(5),
    });

    s3Bucket.grantRead(lambdaFunction);
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    );

    // 4. Security Group for Load Balancer (only port 443)
    const albSecurityGroup = new ec2.SecurityGroup(this, `${envRegionPrefix}-albSecurityGroupMain`, {
      vpc,
      securityGroupName: `${envRegionPrefix}-albSecurityGroupMain`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound traffic'
    );

    // 14. Application Load Balancer with auto-scaling
    const alb = new elbv2.ApplicationLoadBalancer(this, `${envRegionPrefix}-albMain`, {
      loadBalancerName: `${envRegionPrefix}-albMain`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // 12. SNS Topic for error notifications
    const errorTopic = new sns.Topic(this, `${envRegionPrefix}-snsErrorTopicMain`, {
      topicName: `${envRegionPrefix}-snsErrorTopicMain`,
      displayName: `${environment} ${region} Error Notifications`,
    });

    // 15. Auto Scaling Group with minimum 2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Hello from ${envRegionPrefix}</h1>" > /var/www/html/index.html`
    );

    const asgRole = new iam.Role(this, `${envRegionPrefix}-asgRoleMain`, {
      roleName: `${envRegionPrefix}-asgRoleMain`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    const launchTemplate = new ec2.LaunchTemplate(this, `${envRegionPrefix}-launchTemplateMain`, {
      launchTemplateName: `${envRegionPrefix}-launchTemplateMain`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      role: asgRole,
      securityGroup: new ec2.SecurityGroup(this, `${envRegionPrefix}-ec2SecurityGroupMain`, {
        vpc,
        securityGroupName: `${envRegionPrefix}-ec2SecurityGroupMain`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }),
    });

    const asg = new autoscaling.AutoScalingGroup(this, `${envRegionPrefix}-asgMain`, {
      autoScalingGroupName: `${envRegionPrefix}-asgMain`,
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: ec2InstanceCount,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Add target group to ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `${envRegionPrefix}-targetGroupMain`, {
      targetGroupName: `${envRegionPrefix}-targetGroupMain`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        enabled: true,
        path: '/',
        healthyHttpCodes: '200',
      },
    });

    const listener = alb.addListener(`${envRegionPrefix}-listenerMain`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [{
        certificateArn: `arn:aws:acm:${region}:${this.account}:certificate/placeholder-cert-id`,
      }],
      defaultTargetGroups: [targetGroup],
    });

    // Auto-scaling policies
    asg.scaleOnRequestCount(`${envRegionPrefix}-scaleOnRequestMain`, {
      targetRequestsPerMinute: 100,
    });

    asg.scaleOnCpuUtilization(`${envRegionPrefix}-scaleOnCpuMain`, {
      targetUtilizationPercent: 70,
    });

    // 8. CloudWatch Alarms for EC2 CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(this, `${envRegionPrefix}-cpuAlarmMain`, {
      alarmName: `${envRegionPrefix}-cpuAlarmMain`,
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
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic));

    // 5. Route 53 for DNS management and failover
    const hostedZone = new route53.PublicHostedZone(this, `${envRegionPrefix}-hostedZoneMain`, {
      zoneName: domainName,
    });

    new route53.ARecord(this, `${envRegionPrefix}-aRecordMain`, {
      recordName: `${environment}-${region}`,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlb(alb),
      ttl: cdk.Duration.minutes(5),
    });

    // Health check for failover
    const healthCheck = new route53.CfnHealthCheck(this, `${envRegionPrefix}-healthCheckMain`, {
      type: 'HTTPS',
      resourcePath: '/',
      fullyQualifiedDomainName: alb.loadBalancerDnsName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    });

    // 6. IAM Role for cross-account access
    const crossAccountRole = new iam.Role(this, `${envRegionPrefix}-crossAccountRoleMain`, {
      roleName: `${envRegionPrefix}-crossAccountRoleMain`,
      assumedBy: new iam.CompositePrincipal(
        ...crossAccountRoleArns.map(arn => new iam.ArnPrincipal(arn))
      ),
      description: `Cross-account access role for ${envRegionPrefix}`,
    });

    crossAccountRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:ListBucket',
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: ['*'],
    }));

    // 10. CloudFront distribution
    const cloudfrontDistribution = new cloudfront.Distribution(this, `${envRegionPrefix}-cloudFrontMain`, {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(alb, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      domainNames: [`${environment}.${domainName}`],
      certificate: {
        certificateArn: `arn:aws:acm:us-east-1:${this.account}:certificate/placeholder-cert-id`,
      },
      comment: `CloudFront distribution for ${envRegionPrefix}`,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
    });

    // 13. AWS Config rules for compliance
    const configRole = new iam.Role(this, `${envRegionPrefix}-configRoleMain`, {
      roleName: `${envRegionPrefix}-configRoleMain`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    const configBucket = new s3.Bucket(this, `${envRegionPrefix}-configBucketMain`, {
      bucketName: `${envRegionPrefix}-configbucketmain`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    configBucket.grantWrite(configRole);

    const configurationRecorder = new config.CfnConfigurationRecorder(this, `${envRegionPrefix}-configRecorderMain`, {
      name: `${envRegionPrefix}-configRecorderMain`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    const deliveryChannel = new config.CfnDeliveryChannel(this, `${envRegionPrefix}-deliveryChannelMain`, {
      name: `${envRegionPrefix}-deliveryChannelMain`,
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    });

    deliveryChannel.node.addDependency(configurationRecorder);

    // Config rule for required tags
    const requiredTagsRule = new config.ManagedRule(this, `${envRegionPrefix}-requiredTagsRuleMain`, {
      identifier: config.ManagedRuleIdentifiers.REQUIRED_TAGS,
      inputParameters: {
        tag1Key: 'Environment',
        tag1Value: environment,
        tag2Key: 'Region',
        tag2Value: region,
      },
      ruleScope: config.RuleScope.fromResources([
        config.ResourceType.EC2_INSTANCE,
        config.ResourceType.RDS_DB_INSTANCE,
        config.ResourceType.S3_BUCKET,
      ]),
    });

    // Config rule for encryption
    const encryptionRule = new config.ManagedRule(this, `${envRegionPrefix}-encryptionRuleMain`, {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
    });

    // Output important values
    new cdk.CfnOutput(this, `${envRegionPrefix}-vpcIdOutput`, {
      value: vpc.vpcId,
      description: `VPC ID for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-vpcId`,
    });

    new cdk.CfnOutput(this, `${envRegionPrefix}-albDnsOutput`, {
      value: alb.loadBalancerDnsName,
      description: `ALB DNS name for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-albDns`,
    });

    new cdk.CfnOutput(this, `${envRegionPrefix}-cloudFrontDomainOutput`, {
      value: cloudfrontDistribution.distributionDomainName,
      description: `CloudFront domain name for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-cloudFrontDomain`,
    });

    new cdk.CfnOutput(this, `${envRegionPrefix}-s3BucketOutput`, {
      value: s3Bucket.bucketName,
      description: `S3 bucket name for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-s3Bucket`,
    });

    new cdk.CfnOutput(this, `${envRegionPrefix}-errorTopicArnOutput`, {
      value: errorTopic.topicArn,
      description: `Error SNS topic ARN for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-errorTopicArn`,
    });

    new cdk.CfnOutput(this, `${envRegionPrefix}-dbEndpointOutput`, {
      value: dbInstance.dbInstanceEndpointAddress,
      description: `RDS endpoint for ${envRegionPrefix}`,
      exportName: `${envRegionPrefix}-dbEndpoint`,
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('Stack', 'MultiEnvironmentInfrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}

// Example usage
const app = new cdk.App();

// Deploy for multiple environments and regions
const environments = ['dev', 'staging', 'prod'];
const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

for (const env of environments) {
  for (const region of regions) {
    new MultiEnvironmentInfrastructureStack(app, `${env}-${region}-stackMain`, {
      environment: env,
      region: region,
      domainName: 'example.com',
      ec2InstanceCount: parseInt(app.node.tryGetContext('ec2InstanceCount') || '3'),
      crossAccountRoleArns: app.node.tryGetContext('crossAccountRoleArns') || [],
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
    });
  }
}

app.synth();
```

This TypeScript file creates a complete multi-environment, multi-region AWS infrastructure using AWS CDK. Here's what it implements:

## Key Features:

1. **VPCs with Non-overlapping CIDR blocks**: Each environment-region combination gets a unique CIDR block (10.0.0.0/16 through 10.8.0.0/16)

2. **Lambda Functions**: Created with S3 event triggers for object creation events

3. **RDS PostgreSQL**: Encrypted storage enabled with credentials stored in Secrets Manager

4. **Security Groups**: ALB security group only allows inbound traffic on port 443

5. **Route 53**: DNS management with health checks for failover capabilities

6. **IAM Roles**: Cross-account access roles with customizable trust relationships

7. **EC2 Instance Control**: Uses CDK context variables to control instance count (default: 3)

8. **CloudWatch Alarms**: Monitors CPU utilization and sends alerts to SNS

9. **S3 Buckets**: Versioning enabled and HTTPS-only access enforced

10. **CloudFront**: Global distribution for routing requests to the closest region

11. **Secrets Manager**: Stores database credentials securely

12. **SNS Topics**: Error notification topics for each environment

13. **AWS Config**: Monitors compliance for tagging and encryption

14. **Auto-scaling ELB**: Scales based on request count and CPU utilization

15. **Auto Scaling Groups**: Maintains minimum 2 instances per environment

## Naming Convention:
All resources follow the `[environment]-[region]-[service]Main` pattern with "Main" as the suffix.

## Deployment:
The stack can be deployed using:
```bash
cdk deploy dev-us-east-1-stackMain --context ec2InstanceCount=5 --context crossAccountRoleArns='["arn:aws:iam::123456789012:role/CrossAccountRole"]'
```