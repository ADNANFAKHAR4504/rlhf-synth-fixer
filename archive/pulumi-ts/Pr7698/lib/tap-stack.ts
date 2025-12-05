/* eslint-disable import/no-extraneous-dependencies */
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
/* eslint-enable import/no-extraneous-dependencies */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  tags?: Record<string, string>;
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly configRecorderName: pulumi.Output<string>;
  public readonly configBucketArn: pulumi.Output<string>;
  public readonly complianceTopicArn: pulumi.Output<string>;
  public readonly tagCheckerLambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix;

    // S3 Bucket for AWS Config configuration history
    const configBucket = new aws.s3.Bucket(
      `config-bucket-${environmentSuffix}`,
      {
        bucket: `config-bucket-${environmentSuffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        forceDestroy: true,
        tags: {
          Department: 'Compliance',
          Purpose: 'Audit',
        },
      },
      { parent: this }
    );

    // S3 Bucket Policy for AWS Config
    const configBucketPolicy = new aws.s3.BucketPolicy(
      `config-bucket-policy-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        policy: pulumi
          .all([configBucket.arn, configBucket.bucket])
          .apply(([bucketArn, _bucketName]) =>
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
      { parent: this }
    );

    // IAM Role for AWS Config
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
        tags: {
          Department: 'Compliance',
          Purpose: 'Audit',
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for AWS Config
    new aws.iam.RolePolicyAttachment(
      `config-role-policy-${environmentSuffix}`,
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      },
      { parent: this }
    );

    // Additional IAM policy for S3 access
    new aws.iam.RolePolicy(
      `config-s3-policy-${environmentSuffix}`,
      {
        role: configRole.id,
        policy: configBucket.arn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:GetObject'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:GetBucketAcl', 's3:ListBucket'],
                Resource: bucketArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // AWS Config Recorder - Use shared recorder name
    // AWS Config only allows 1 recorder per region per account
    // All PRs share the same recorder to avoid quota limits
    const sharedRecorderName = 'config-recorder-shared';
    // Attempt to detect an existing recorder and reuse it; otherwise create a new one.
    // We'll perform discovery of recorder and delivery channel using the AWS SDK and create resources accordingly.
    const detectConfigResources = (() => {
      const cfgClient = new ConfigServiceClient({});
      return Promise.all([
        cfgClient.send(new DescribeConfigurationRecordersCommand({})),
        cfgClient.send(new DescribeDeliveryChannelsCommand({})),
      ])
        .then(([recResp, dcResp]) => {
          const existingRecorder = recResp.ConfigurationRecorders?.[0];
          const existingChannel = dcResp.DeliveryChannels?.[0];
          const existingRecorderName = existingRecorder?.name;
          const existingChannelName = existingChannel?.name;
          const hasSharedRecorder = !!existingRecorderName;
          const hasSharedChannel = !!existingChannelName;
          let configRecorder: aws.cfg.Recorder;
          let createdRecorder = false;
          if (hasSharedRecorder) {
            // If an existing recorder exists (any name), reuse it by getting its identifier
            const recorderId = existingRecorderName || sharedRecorderName;
            configRecorder = aws.cfg.Recorder.get(
              'config-recorder-shared',
              recorderId,
              undefined,
              { parent: this }
            );
          } else {
            configRecorder = new aws.cfg.Recorder(
              'config-recorder-shared',
              {
                name: sharedRecorderName,
                roleArn: configRole.arn,
                recordingGroup: {
                  allSupported: false,
                  includeGlobalResourceTypes: false,
                  resourceTypes: [
                    'AWS::EC2::Instance',
                    'AWS::RDS::DBInstance',
                    'AWS::S3::Bucket',
                  ],
                },
              },
              { parent: this }
            );
            createdRecorder = true;
          }

          let deliveryChannel: aws.cfg.DeliveryChannel;
          if (hasSharedChannel) {
            const channelId = existingChannelName || sharedChannelName;
            deliveryChannel = aws.cfg.DeliveryChannel.get(
              'config-delivery-channel-shared',
              channelId,
              undefined,
              { parent: this }
            );
          } else {
            deliveryChannel = new aws.cfg.DeliveryChannel(
              'config-delivery-channel-shared',
              {
                name: sharedChannelName,
                s3BucketName: configBucket.bucket,
                snapshotDeliveryProperties: {
                  deliveryFrequency: 'TwentyFour_Hours',
                },
              },
              { dependsOn: [configBucketPolicy], parent: this }
            );
          }

          let recorderStatus: aws.cfg.RecorderStatus | undefined;
          if (createdRecorder) {
            recorderStatus = new aws.cfg.RecorderStatus(
              'config-recorder-status-shared',
              { name: sharedRecorderName, isEnabled: true },
              { dependsOn: [deliveryChannel], parent: this }
            );
          }

          // Create managed rules dependent on the recorder/channel
          new aws.cfg.Rule(
            `encrypted-volumes-rule-${environmentSuffix}`,
            {
              name: `encrypted-volumes-rule-${environmentSuffix}`,
              source: { owner: 'AWS', sourceIdentifier: 'ENCRYPTED_VOLUMES' },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            {
              dependsOn: recorderStatus ? [recorderStatus] : [deliveryChannel],
              parent: this,
            }
          );

          new aws.cfg.Rule(
            `rds-encryption-rule-${environmentSuffix}`,
            {
              name: `rds-encryption-rule-${environmentSuffix}`,
              source: {
                owner: 'AWS',
                sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
              },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            {
              dependsOn: recorderStatus ? [recorderStatus] : [deliveryChannel],
              parent: this,
            }
          );

          new aws.cfg.Rule(
            `s3-ssl-rule-${environmentSuffix}`,
            {
              name: `s3-ssl-rule-${environmentSuffix}`,
              source: {
                owner: 'AWS',
                sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
              },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            {
              dependsOn: recorderStatus ? [recorderStatus] : [deliveryChannel],
              parent: this,
            }
          );

          return {
            configRecorder,
            deliveryChannel,
            recorderStatus,
            existingRecorderName,
            existingChannelName,
          };
        })
        .catch(() => {
          // Fallback - create everything if detection fails
          const configRecorder = new aws.cfg.Recorder(
            'config-recorder-shared',
            {
              name: sharedRecorderName,
              roleArn: configRole.arn,
              recordingGroup: {
                allSupported: false,
                includeGlobalResourceTypes: false,
                resourceTypes: [
                  'AWS::EC2::Instance',
                  'AWS::RDS::DBInstance',
                  'AWS::S3::Bucket',
                ],
              },
            },
            { parent: this }
          );
          const deliveryChannel = new aws.cfg.DeliveryChannel(
            'config-delivery-channel-shared',
            { name: sharedChannelName, s3BucketName: configBucket.bucket },
            { dependsOn: [configBucketPolicy], parent: this }
          );
          const recorderStatus = new aws.cfg.RecorderStatus(
            'config-recorder-status-shared',
            { name: sharedRecorderName, isEnabled: true },
            { dependsOn: [deliveryChannel], parent: this }
          );

          new aws.cfg.Rule(
            `encrypted-volumes-rule-${environmentSuffix}`,
            {
              name: `encrypted-volumes-rule-${environmentSuffix}`,
              source: { owner: 'AWS', sourceIdentifier: 'ENCRYPTED_VOLUMES' },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            { dependsOn: [recorderStatus], parent: this }
          );

          new aws.cfg.Rule(
            `rds-encryption-rule-${environmentSuffix}`,
            {
              name: `rds-encryption-rule-${environmentSuffix}`,
              source: {
                owner: 'AWS',
                sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
              },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            { dependsOn: [recorderStatus], parent: this }
          );

          new aws.cfg.Rule(
            `s3-ssl-rule-${environmentSuffix}`,
            {
              name: `s3-ssl-rule-${environmentSuffix}`,
              source: {
                owner: 'AWS',
                sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
              },
              tags: { Department: 'Compliance', Purpose: 'Audit' },
            },
            { dependsOn: [recorderStatus], parent: this }
          );

          return {
            configRecorder,
            deliveryChannel,
            recorderStatus,
            existingRecorderName: undefined,
            existingChannelName: undefined,
          };
        });
    })();

    // Delivery Channel name is defined above and is detected/created by `detectConfigResources` promise
    const sharedChannelName = 'config-delivery-channel-shared';

    // `recorderStatus` is created within the detectConfigResources Promise and used to create rules. If needed for further dependents,
    // we will rely on the detectConfigResources result to provide the appropriate resources and status.

    // SNS Topic for compliance notifications
    const complianceTopic = new aws.sns.Topic(
      `compliance-topic-${environmentSuffix}`,
      {
        name: `compliance-topic-${environmentSuffix}`,
        kmsMasterKeyId: 'alias/aws/sns',
        tags: {
          Department: 'Compliance',
          Purpose: 'Audit',
        },
      },
      { parent: this }
    );
    // We'll create config rules after we have a recorder and delivery channel (below)

    // IAM Role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `lambda-config-role-${environmentSuffix}`,
      {
        name: `lambda-config-role-${environmentSuffix}`,
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
        tags: {
          Department: 'Compliance',
          Purpose: 'Audit',
        },
      },
      { parent: this }
    );

    // Lambda policy for Config rule evaluation
    new aws.iam.RolePolicy(
      `lambda-config-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'config:PutEvaluations',
                'ec2:DescribeTags',
                'ec2:DescribeInstances',
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
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `const { ConfigServiceClient, PutEvaluationsCommand } = require("@aws-sdk/client-config-service");
const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");

const configClient = new ConfigServiceClient({});
const ec2Client = new EC2Client({});

const REQUIRED_TAGS = ["Environment", "Owner", "CostCenter"];

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event, null, 2));

    const configurationItem = JSON.parse(event.configurationItem || "{}");
    const invokingEvent = JSON.parse(event.invokingEvent || "{}");
    const token = event.resultToken;

    let compliance = "NON_COMPLIANT";
    let annotation = "Resource does not have required tags";

    try {
        if (configurationItem.resourceType === "AWS::EC2::Instance") {
            const instanceId = configurationItem.resourceId;

            const response = await ec2Client.send(
                new DescribeInstancesCommand({
                    InstanceIds: [instanceId],
                })
            );

            if (response.Reservations && response.Reservations.length > 0) {
                const instance = response.Reservations[0].Instances[0];
                const tags = instance.Tags || [];
                const tagKeys = tags.map((tag) => tag.Key);

                const missingTags = REQUIRED_TAGS.filter(
                    (requiredTag) => !tagKeys.includes(requiredTag)
                );

                if (missingTags.length === 0) {
                    compliance = "COMPLIANT";
                    annotation = "All required tags are present";
                } else {
                    annotation = \`Missing required tags: \${missingTags.join(", ")}\`;
                }
            }
        }
    } catch (error) {
        console.error("Error evaluating compliance:", error);
        annotation = \`Error: \${error.message}\`;
    }

    const evaluation = {
        ComplianceResourceType: configurationItem.resourceType,
        ComplianceResourceId: configurationItem.resourceId,
        ComplianceType: compliance,
        Annotation: annotation,
        OrderingTimestamp: new Date(configurationItem.configurationItemCaptureTime),
    };

    const putEvaluationsCommand = new PutEvaluationsCommand({
        Evaluations: [evaluation],
        ResultToken: token,
    });

    await configClient.send(putEvaluationsCommand);

    return {
        statusCode: 200,
        body: JSON.stringify({ compliance, annotation }),
    };
};`;

    // Create Lambda function with inline code
    const tagCheckerLambda = new aws.lambda.Function(
      `tag-checker-lambda-${environmentSuffix}`,
      {
        name: `tag-checker-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'config-tag-checker',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-config-service': '^3.400.0',
                '@aws-sdk/client-ec2': '^3.400.0',
              },
            })
          ),
        }),
        timeout: 60,
        tags: {
          Department: 'Compliance',
          Purpose: 'Audit',
        },
      },
      { parent: this }
    );

    // Lambda permission for AWS Config
    const lambdaPermission = new aws.lambda.Permission(
      `lambda-config-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: tagCheckerLambda.name,
        principal: 'config.amazonaws.com',
        statementId: 'AllowConfigInvoke',
      },
      { parent: this }
    );

    // Custom Config Rule using Lambda
    detectConfigResources.then(
      ({ recorderStatus, deliveryChannel }) =>
        new aws.cfg.Rule(
          `custom-tag-rule-${environmentSuffix}`,
          {
            name: `custom-tag-rule-${environmentSuffix}`,
            source: {
              owner: 'CUSTOM_LAMBDA',
              sourceIdentifier: tagCheckerLambda.arn,
              sourceDetails: [
                {
                  eventSource: 'aws.config',
                  messageType: 'ConfigurationItemChangeNotification',
                },
              ],
            },
            scope: {
              complianceResourceTypes: ['AWS::EC2::Instance'],
            },
            tags: {
              Department: 'Compliance',
              Purpose: 'Audit',
            },
          },
          {
            dependsOn: [
              recorderStatus ? recorderStatus : deliveryChannel,
              lambdaPermission,
            ],
            parent: this,
          }
        )
    );

    // Export outputs
    // Map the recorder output name to the existing or shared name (resolve via detection)
    // detectConfigResources resolves to an object with existingRecorderName if found.
    // Use a Pulumi output wrapping the detectConfigResources promise so we can set the output immediately
    this.configRecorderName = pulumi.output(
      detectConfigResources.then(
        res => res.existingRecorderName || sharedRecorderName
      )
    );
    this.configBucketArn = configBucket.arn;
    this.complianceTopicArn = complianceTopic.arn;
    this.tagCheckerLambdaArn = tagCheckerLambda.arn;

    this.registerOutputs({
      configRecorderName: this.configRecorderName,
      configBucketArn: this.configBucketArn,
      complianceTopicArn: this.complianceTopicArn,
      tagCheckerLambdaArn: this.tagCheckerLambdaArn,
    });
  }
}
