import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  approvedAmiIds?: string[];
  requiredTags?: string[];
}

export class TapStack {
  public readonly configBucket: aws.s3.Bucket;
  public readonly configBucketOutput: pulumi.Output<string>;
  public readonly configRecorder: aws.cfg.Recorder;
  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly complianceFunction: aws.lambda.Function;
  public readonly configAggregator: aws.cfg.AggregateAuthorization;

  constructor(name: string, props?: TapStackProps) {
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const region = props?.awsRegion || 'us-east-1';
    const approvedAmiIds = props?.approvedAmiIds || [
      'ami-0c55b159cbfafe1f0',
      'ami-0abcdef1234567890',
    ];
    const requiredTags = props?.requiredTags || [
      'Environment',
      'Owner',
      'CostCenter',
    ];

    // Create AWS provider
    const provider = new aws.Provider('aws', {
      region: region,
    });

    // Get current AWS account ID and region
    const current = aws.getCallerIdentity();

    // Create KMS key for encryption
    const configKmsKey = new aws.kms.Key(
      `config-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for AWS Config encryption',
        enableKeyRotation: true,
        tags: {
          Name: `config-kms-key-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    // Create KMS key alias for easier reference
    new aws.kms.Alias(
      `config-kms-alias-${environmentSuffix}`,
      {
        name: `alias/config-key-${environmentSuffix}`,
        targetKeyId: configKmsKey.id,
      },
      { provider }
    );

    // Create S3 bucket for Config snapshots
    this.configBucket = new aws.s3.Bucket(
      `config-bucket-${environmentSuffix}`,
      {
        bucket: `config-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: configKmsKey.id,
            },
            bucketKeyEnabled: true,
          },
        },
        forceDestroy: true,
        tags: {
          Name: `config-bucket-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    this.configBucketOutput = this.configBucket.id;

    // Block public access to the bucket
    const configBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `config-bucket-public-access-block-${environmentSuffix}`,
      {
        bucket: this.configBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider }
    );

    // S3 bucket policy for AWS Config
    const configBucketPolicy = new aws.s3.BucketPolicy(
      `config-bucket-policy-${environmentSuffix}`,
      {
        bucket: this.configBucket.id,
        policy: pulumi
          .all([this.configBucket.arn, current])
          .apply(([bucketArn, _account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:ListBucket',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSConfigBucketPutObject',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider, dependsOn: [configBucketPublicAccessBlock] }
    );

    // Create IAM role for AWS Config
    const configRole = new aws.iam.Role(
      `config-role-${environmentSuffix}`,
      {
        name: `config-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
        tags: {
          Name: `config-role-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    // Attach inline policy for S3 and KMS access
    const configRolePolicy = new aws.iam.RolePolicy(
      `config-role-policy-${environmentSuffix}`,
      {
        role: configRole.id,
        policy: pulumi
          .all([this.configBucket.arn, configKmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetBucketVersioning',
                    's3:PutObject',
                    's3:GetObject',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { provider }
    );

    // Create SNS topic for compliance notifications
    this.snsTopic = new aws.sns.Topic(
      `compliance-notifications-${environmentSuffix}`,
      {
        name: `compliance-notifications-${environmentSuffix}`,
        displayName: 'AWS Config Compliance Notifications',
        kmsMasterKeyId: configKmsKey.id,
        tags: {
          Name: `compliance-notifications-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    this.snsTopicArn = this.snsTopic.arn;

    // SNS topic policy
    new aws.sns.TopicPolicy(
      `sns-topic-policy-${environmentSuffix}`,
      {
        arn: this.snsTopic.arn,
        policy: pulumi
          .all([this.snsTopic.arn, current])
          .apply(([topicArn, _account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowConfigPublish',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: ['SNS:Publish'],
                  Resource: topicArn,
                },
                {
                  Sid: 'AllowLambdaPublish',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                  Action: ['SNS:Publish'],
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { provider }
    );

    // Create AWS Config recorder
    this.configRecorder = new aws.cfg.Recorder(
      `config-recorder-${environmentSuffix}`,
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      { provider, dependsOn: [configRolePolicy] }
    );

    // Create delivery channel
    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      `config-delivery-channel-${environmentSuffix}`,
      {
        name: `config-delivery-channel-${environmentSuffix}`,
        s3BucketName: this.configBucket.id,
        snsTopicArn: this.snsTopic.arn,
      },
      { provider, dependsOn: [this.configRecorder, configBucketPolicy] }
    );

    // Start the recorder
    const recorderStatus = new aws.cfg.RecorderStatus(
      `config-recorder-status-${environmentSuffix}`,
      {
        name: this.configRecorder.name,
        isEnabled: true,
      },
      { provider, dependsOn: [configDeliveryChannel] }
    );

    // Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        name: `compliance-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: {
          Name: `compliance-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    // Lambda role policy for SNS and Config access
    const lambdaRolePolicy = new aws.iam.RolePolicy(
      `lambda-role-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: this.snsTopic.arn.apply(topicArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
              {
                Effect: 'Allow',
                Action: [
                  'config:DescribeComplianceByConfigRule',
                  'config:DescribeComplianceByResource',
                  'config:GetComplianceDetailsByConfigRule',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { provider }
    );

    // Lambda function for processing compliance events
    const lambdaCode = `
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { ConfigServiceClient, GetComplianceDetailsByConfigRuleCommand } = require('@aws-sdk/client-config-service');

const snsClient = new SNSClient();
const configClient = new ConfigServiceClient();

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse Config compliance change notification
    let message;
    if (event.Records && event.Records[0] && event.Records[0].Sns) {
      message = JSON.parse(event.Records[0].Sns.Message);
    } else {
      message = event;
    }

    const configRuleName = message.configRuleName;
    const resourceType = message.resourceType;
    const resourceId = message.resourceId;
    const complianceType = message.newEvaluationResult?.complianceType;

    // Format detailed compliance report
    const report = {
      timestamp: new Date().toISOString(),
      configRule: configRuleName,
      resourceType: resourceType,
      resourceId: resourceId,
      complianceStatus: complianceType,
      details: message.newEvaluationResult?.annotation || 'No additional details'
    };

    console.log('Compliance Report:', JSON.stringify(report, null, 2));

    // Get additional compliance details if available
    if (configRuleName) {
      try {
        const detailsCommand = new GetComplianceDetailsByConfigRuleCommand({
          ConfigRuleName: configRuleName,
          Limit: 10
        });
        const details = await configClient.send(detailsCommand);
        report.additionalDetails = details.EvaluationResults;
      } catch (err) {
        console.log('Could not fetch additional details:', err.message);
      }
    }

    // Publish formatted report to SNS
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (topicArn) {
      const publishCommand = new PublishCommand({
        TopicArn: topicArn,
        Subject: \`AWS Config Compliance Alert - \${complianceType}\`,
        Message: JSON.stringify(report, null, 2)
      });

      await snsClient.send(publishCommand);
      console.log('Published compliance report to SNS');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Compliance event processed successfully', report })
    };
  } catch (error) {
    console.error('Error processing compliance event:', error);
    throw error;
  }
};
`;

    // Create Lambda function
    this.complianceFunction = new aws.lambda.Function(
      `compliance-processor-${environmentSuffix}`,
      {
        name: `compliance-processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            SNS_TOPIC_ARN: this.snsTopic.arn,
          },
        },
        tags: {
          Name: `compliance-processor-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [lambdaRolePolicy] }
    );

    // Subscribe Lambda to SNS topic
    new aws.sns.TopicSubscription(
      `compliance-lambda-subscription-${environmentSuffix}`,
      {
        topic: this.snsTopic.arn,
        protocol: 'lambda',
        endpoint: this.complianceFunction.arn,
      },
      { provider }
    );

    // Grant SNS permission to invoke Lambda
    new aws.lambda.Permission(
      `compliance-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.complianceFunction.name,
        principal: 'sns.amazonaws.com',
        sourceArn: this.snsTopic.arn,
      },
      { provider }
    );

    // Config rule for S3 bucket encryption
    const s3EncryptionRule = new aws.cfg.Rule(
      `s3-encryption-rule-${environmentSuffix}`,
      {
        name: `s3-bucket-encryption-${environmentSuffix}`,
        description: 'Checks that S3 buckets have encryption enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
        tags: {
          Name: `s3-encryption-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [recorderStatus] }
    );

    // Config rule for S3 bucket versioning
    new aws.cfg.Rule(
      `s3-versioning-rule-${environmentSuffix}`,
      {
        name: `s3-bucket-versioning-${environmentSuffix}`,
        description: 'Checks that S3 buckets have versioning enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
        },
        tags: {
          Name: `s3-versioning-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [recorderStatus] }
    );

    // Config rule for EC2 approved AMIs
    new aws.cfg.Rule(
      `ec2-ami-rule-${environmentSuffix}`,
      {
        name: `ec2-approved-ami-${environmentSuffix}`,
        description: 'Checks that EC2 instances use approved AMI IDs',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'APPROVED_AMIS_BY_ID',
        },
        inputParameters: JSON.stringify({
          amiIds: approvedAmiIds.join(','),
        }),
        tags: {
          Name: `ec2-ami-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [recorderStatus] }
    );

    // Config rule for required tags
    new aws.cfg.Rule(
      `required-tags-rule-${environmentSuffix}`,
      {
        name: `required-tags-${environmentSuffix}`,
        description: 'Checks that resources have required tags',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'REQUIRED_TAGS',
        },
        inputParameters: JSON.stringify({
          tag1Key: requiredTags[0],
          tag2Key: requiredTags[1],
          tag3Key: requiredTags[2],
        }),
        tags: {
          Name: `required-tags-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [recorderStatus] }
    );

    // Create IAM role for remediation
    const remediationRole = new aws.iam.Role(
      `remediation-role-${environmentSuffix}`,
      {
        name: `remediation-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ssm.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `remediation-role-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    // Remediation role policy
    const remediationRolePolicy = new aws.iam.RolePolicy(
      `remediation-role-policy-${environmentSuffix}`,
      {
        role: remediationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:PutEncryptionConfiguration',
                's3:GetEncryptionConfiguration',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['config:ListDiscoveredResources'],
              Resource: '*',
            },
          ],
        }),
      },
      { provider }
    );

    // Remediation configuration for S3 encryption
    new aws.cfg.RemediationConfiguration(
      `s3-encryption-remediation-${environmentSuffix}`,
      {
        configRuleName: s3EncryptionRule.name,
        targetType: 'SSM_DOCUMENT',
        targetId: 'AWS-ConfigureS3BucketServerSideEncryption',
        targetVersion: '1',
        parameters: [
          {
            name: 'AutomationAssumeRole',
            staticValue: remediationRole.arn,
          },
          {
            name: 'BucketName',
            resourceValue: 'RESOURCE_ID',
          },
          {
            name: 'SSEAlgorithm',
            staticValue: 'AES256',
          },
        ],
        automatic: true,
        maximumAutomaticAttempts: 5,
        retryAttemptSeconds: 60,
      },
      { provider, dependsOn: [remediationRolePolicy] }
    );

    // Config aggregator authorization
    this.configAggregator = new aws.cfg.AggregateAuthorization(
      `config-aggregator-auth-${environmentSuffix}`,
      {
        accountId: current.then(acc => acc.accountId),
        region: region,
        tags: {
          Name: `config-aggregator-auth-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider }
    );

    // Config aggregator
    new aws.cfg.ConfigurationAggregator(
      `config-aggregator-${environmentSuffix}`,
      {
        name: `config-aggregator-${environmentSuffix}`,
        accountAggregationSource: {
          accountIds: [current.then(acc => acc.accountId)],
          allRegions: true,
        },
        tags: {
          Name: `config-aggregator-${environmentSuffix}`,
          Environment: environmentSuffix,
          Owner: 'cloud-team',
          CostCenter: 'engineering',
        },
      },
      { provider, dependsOn: [this.configAggregator] }
    );

    // Export outputs
    pulumi
      .all([
        this.configBucket.id,
        this.snsTopic.arn,
        this.complianceFunction.arn,
        this.configRecorder.id,
      ])
      .apply(([bucketId, topicArn, functionArn, recorderId]) => {
        console.log('Outputs:');
        console.log(`ConfigBucket: ${bucketId}`);
        console.log(`SNSTopicArn: ${topicArn}`);
        console.log(`ComplianceFunctionArn: ${functionArn}`);
        console.log(`ConfigRecorderId: ${recorderId}`);
      });
  }
}
