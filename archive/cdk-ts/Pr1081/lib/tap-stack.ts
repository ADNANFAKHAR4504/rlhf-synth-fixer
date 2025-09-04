import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2Targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Apply Environment=Production tag to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create KMS key for encryption with automatic rotation
    const kmsKey = new kms.Key(this, `EncryptionKey${environmentSuffix}`, {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account permissions
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow CloudWatch Logs service to use the key
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs access',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`,
              },
            },
          }),
        ],
      }),
    });

    // Use default VPC
    const vpc = ec2.Vpc.fromLookup(this, `VPC${environmentSuffix}`, {
      isDefault: true,
    });

    // Security Group for ALB (allow 'HTTP/HTTPS' from internet)
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for Lambda (allow outbound HTTPS only)
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Lambda'
    );

    // S3 bucket for AWS Config with encryption and secure transport
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket${environmentSuffix}`,
      {
        bucketName: `aws-config-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Bucket policy to enforce SSE-KMS and secure transport
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [configBucket.bucketArn, `${configBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyWrongKMSKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.keyArn,
          },
        },
      })
    );

    // AWS Config Configuration Recorder
    const configRole = new iam.Role(this, `ConfigRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    // Grant Config service access to the S3 bucket and KMS key
    configBucket.grantReadWrite(configRole);
    kmsKey.grantEncryptDecrypt(configRole);

    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder${environmentSuffix}`,
      {
        name: `SecureWebAppConfigRecorder${environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // AWS Config Delivery Channel - only create if explicitly requested
    // AWS Config service allows only 1 delivery channel per region per account
    // For PR environments, skip delivery channel creation to avoid conflicts
    const createDeliveryChannel =
      process.env.CREATE_CONFIG_DELIVERY_CHANNEL === 'true';

    let configDeliveryChannel: config.CfnDeliveryChannel | undefined;
    if (createDeliveryChannel) {
      configDeliveryChannel = new config.CfnDeliveryChannel(
        this,
        `ConfigDeliveryChannel${environmentSuffix}`,
        {
          name: `SecureWebAppDeliveryChannel${environmentSuffix}`,
          s3BucketName: configBucket.bucketName,
          s3KmsKeyArn: kmsKey.keyArn,
        }
      );
    }

    // AWS Config Rule for Security Group compliance
    const configRule = new config.CfnConfigRule(
      this,
      `RestrictedIncomingTrafficRule${environmentSuffix}`,
      {
        configRuleName: `restricted-incoming-traffic-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'INCOMING_SSH_DISABLED',
        },
      }
    );

    configRule.addDependency(configRecorder);
    if (configDeliveryChannel) {
      configRule.addDependency(configDeliveryChannel);
    }

    // CloudWatch Log Group for Lambda with KMS encryption
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/secure-web-app-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, `LambdaRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        LoggingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [lambdaLogGroup.logGroupArn],
            }),
          ],
        }),
        VPCPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
              ],
              resources: ['*'], // Required for VPC Lambda execution
            }),
          ],
        }),
      },
    });

    // Lambda function
    const lambdaFunction = new lambda.Function(
      this,
      `WebAppFunction${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Request received:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block',
            },
            body: JSON.stringify({
              message: 'Secure Web Application',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
        role: lambdaRole,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroups: [lambdaSecurityGroup],
        allowPublicSubnet: true,
        logGroup: lambdaLogGroup,
        environment: {
          NODE_OPTIONS: '--enable-source-maps',
        },
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group for Lambda
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `LambdaTargetGroup${environmentSuffix}`,
      {
        targetType: elbv2.TargetType.LAMBDA,
        targets: [new elbv2Targets.LambdaTarget(lambdaFunction)],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
        },
      }
    );

    // ALB Listener
    alb.addListener(`ALBListener${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Grant ALB permission to invoke Lambda
    lambdaFunction.addPermission(`ALBInvokePermission${environmentSuffix}`, {
      principal: new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
      sourceArn: targetGroup.targetGroupArn,
    });

    // WAFv2 Web ACL with SQL injection protection
    const webAcl = new wafv2.CfnWebACL(this, `WebACL${environmentSuffix}`, {
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `SecureWebAppWebACL${environmentSuffix}`,
      },
    });

    // Associate WAF Web ACL with ALB
    new wafv2.CfnWebACLAssociation(
      this,
      `WebACLAssociation${environmentSuffix}`,
      {
        resourceArn: alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, `LoadBalancerDNS${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `LoadBalancerDNS${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `KMSKeyId${environmentSuffix}`, {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `KMSKeyId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebACLArn${environmentSuffix}`, {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebACLArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}`, {
      value: configBucket.bucketName,
      description: 'Config S3 Bucket Name',
      exportName: `S3BucketName${environmentSuffix}`,
    });
  }
}
