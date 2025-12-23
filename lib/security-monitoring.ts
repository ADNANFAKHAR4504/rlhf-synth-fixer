/**
 * security-monitoring.ts
 *
 * This module defines security monitoring resources including CloudTrail,
 * GuardDuty, and Config for comprehensive security monitoring.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecurityMonitoringResources {
  cloudTrail: aws.cloudtrail.Trail;
  cloudTrailBucket: aws.s3.Bucket;
  guardDutyDetectorId: pulumi.Output<string>;
  configRecorder: aws.cfg.Recorder;
  configDeliveryChannel: aws.cfg.DeliveryChannel;
}

interface ConfigRecorderOptions {
  recorderName?: string;
  deliveryChannelName?: string;
  roleArn: pulumi.Input<string>;
  bucketName: pulumi.Input<string>;
  provider: aws.Provider;
  parent?: pulumi.ComponentResource;
}

export function getOrCreateOrImportConfigRecorder(
  options: ConfigRecorderOptions
): {
  recorder: aws.cfg.Recorder;
  deliveryChannel: aws.cfg.DeliveryChannel;
} {
  const {
    recorderName,
    deliveryChannelName,
    roleArn,
    bucketName,
    provider,
    parent,
  } = options;

  if (recorderName && deliveryChannelName) {
    const recorder = aws.cfg.Recorder.get(
      `imported-${recorderName}`,
      recorderName,
      undefined,
      { provider, ...(parent && { parent }) }
    );

    const deliveryChannel = aws.cfg.DeliveryChannel.get(
      `imported-${deliveryChannelName}`,
      deliveryChannelName,
      undefined,
      { provider, ...(parent && { parent }) }
    );

    return { recorder, deliveryChannel };
  } else {
    const fallbackRecorderName = recorderName ?? 'config-recorder';
    const fallbackDeliveryChannelName =
      deliveryChannelName ?? 'config-delivery-channel';

    const recorder = new aws.cfg.Recorder(
      fallbackRecorderName,
      {
        name: fallbackRecorderName,
        roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      { provider, ...(parent && { parent }) }
    );

    const deliveryChannel = new aws.cfg.DeliveryChannel(
      fallbackDeliveryChannelName,
      {
        name: fallbackDeliveryChannelName,
        s3BucketName: bucketName,
        snapshotDeliveryProperties: {
          deliveryFrequency: 'TwentyFour_Hours',
        },
      },
      { provider, ...(parent && { parent }), dependsOn: [recorder] }
    );

    return { recorder, deliveryChannel };
  }
}

export function createSecurityMonitoring(
  environment: string,
  provider: aws.Provider,
  parent?: pulumi.ComponentResource,
  existingRecorderName?: string,
  existingDeliveryChannelName?: string
): SecurityMonitoringResources {
  // Create S3 bucket for CloudTrail logs
  const cloudTrailBucket = new aws.s3.Bucket(
    `cloudtrail-logs-${environment}`,
    {
      bucket: `cloudtrail-logs-${environment}-${Date.now()}`,
      forceDestroy: environment !== 'prod', // Protect production logs
      tags: {
        Name: `cloudtrail-logs-${environment}`,
        Environment: environment,
        Purpose: 'CloudTrail-Logs',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Enable versioning on CloudTrail bucket
  new aws.s3.BucketVersioning(
    `cloudtrail-bucket-versioning-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    },
    { provider }
  );

  // Enable server-side encryption for CloudTrail bucket
  new aws.s3.BucketServerSideEncryptionConfiguration(
    `cloudtrail-bucket-encryption-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    },
    { provider }
  );

  // Block public access to CloudTrail bucket
  new aws.s3.BucketPublicAccessBlock(
    `cloudtrail-bucket-pab-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider }
  );

  // CloudTrail bucket policy
  const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
    `cloudtrail-bucket-policy-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      policy: pulumi.all([cloudTrailBucket.arn]).apply(([bucketArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: bucketArn,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
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
    { provider }
  );

  // Create CloudTrail
  const cloudTrail = new aws.cloudtrail.Trail(
    `cloudtrail-${environment}`,
    {
      name: `cloudtrail-${environment}`,
      s3BucketName: cloudTrailBucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableLogFileValidation: true,

      eventSelectors: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          // Removed dataResources to avoid S3 ARN format issues
          // Management events will still be captured
        },
      ],

      tags: {
        Name: `cloudtrail-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    {
      provider,
      dependsOn: [cloudTrailBucketPolicy],
    }
  );

  // Use a simpler approach to handle existing GuardDuty detector
  const guardDutyDetector = pulumi.output(
    aws.guardduty
      .getDetector({}, { provider })
      .then(result => {
        // If detector exists, reference it
        return aws.guardduty.Detector.get(
          'existing-detector',
          result.id,
          undefined,
          { provider }
        );
      })
      .catch(() => {
        // If detector doesn't exist, create one
        return new aws.guardduty.Detector(
          'main-detector',
          {
            enable: true,
            findingPublishingFrequency: 'FIFTEEN_MINUTES',
            tags: {
              Name: `guardduty-${environment}`,
              Environment: environment,
              ManagedBy: 'Pulumi',
            },
          },
          { provider }
        );
      })
  );

  // Get the detector ID as a Pulumi Output
  const guardDutyDetectorId = guardDutyDetector.apply(d => d.id);

  // Enable S3 protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-s3-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'S3_DATA_EVENTS',
      status: 'ENABLED',
    },
    { provider }
  );

  // Enable EKS protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-eks-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'EKS_AUDIT_LOGS',
      status: 'ENABLED',
    },
    { provider }
  );

  // Enable malware protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-malware-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'EBS_MALWARE_PROTECTION',
      status: 'ENABLED',
    },
    { provider }
  );

  // Create S3 bucket for Config
  const configBucket = new aws.s3.Bucket(
    `config-logs-${environment}`,
    {
      bucket: `config-logs-${environment}-${Date.now()}`,
      forceDestroy: environment !== 'prod',
      tags: {
        Name: `config-logs-${environment}`,
        Environment: environment,
        Purpose: 'Config-Logs',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Config bucket policy
  new aws.s3.BucketPolicy(
    `config-bucket-policy-${environment}`,
    {
      bucket: configBucket.id,
      policy: pulumi.all([configBucket.arn]).apply(([bucketArn]) =>
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
              Sid: 'AWSConfigBucketDelivery',
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
    { provider }
  );

  // Config service role
  const configRole = new aws.iam.Role(
    `config-role-${environment}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `config-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach Config service role policy
  new aws.iam.RolePolicyAttachment(
    `config-role-policy-${environment}`,
    {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    },
    { provider }
  );

  const { recorder: configRecorder, deliveryChannel: configDeliveryChannel } =
    getOrCreateOrImportConfigRecorder({
      recorderName: existingRecorderName,
      deliveryChannelName: existingDeliveryChannelName,
      roleArn: configRole.arn,
      bucketName: configBucket.bucket,
      provider,
      parent,
    });

  return {
    cloudTrail,
    cloudTrailBucket,
    guardDutyDetectorId,
    configRecorder,
    configDeliveryChannel,
  };
}
