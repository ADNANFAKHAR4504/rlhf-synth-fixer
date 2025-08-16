/**
 * security-monitoring.ts
 *
 * This module defines security monitoring resources including CloudTrail,
 * GuardDuty, and Config for comprehensive security monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityMonitoringResources {
  cloudTrail: aws.cloudtrail.Trail;
  cloudTrailBucket: aws.s3.Bucket;
  guardDutyDetector: aws.guardduty.Detector;
  configRecorder: aws.cfg.Recorder;
  configDeliveryChannel: aws.cfg.DeliveryChannel;
}

export function createSecurityMonitoring(
  environment: string,
  provider: aws.Provider
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
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      
      eventSelectors: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResources: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::*/*'],
            },
          ],
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

  // Enable GuardDuty
  const guardDutyDetector = new aws.guardduty.Detector(
    `guardduty-${environment}`,
    {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      datasources: {
        s3Logs: {
          enable: true,
        },
        kubernetes: {
          auditLogs: {
            enable: true,
          },
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: {
              enable: true,
            },
          },
        },
      },
      tags: {
        Name: `guardduty-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
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
      policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole',
    },
    { provider }
  );

  // Config delivery channel
  const configDeliveryChannel = new aws.cfg.DeliveryChannel(
    `config-delivery-channel-${environment}`,
    {
      name: `config-delivery-channel-${environment}`,
      s3BucketName: configBucket.bucket,
    },
    { provider }
  );

  // Config configuration recorder
  const configRecorder = new aws.cfg.Recorder(
    `config-recorder-${environment}`,
    {
      name: `config-recorder-${environment}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    },
    { 
      provider,
      dependsOn: [configDeliveryChannel],
    }
  );

  return {
    cloudTrail,
    cloudTrailBucket,
    guardDutyDetector,
    configRecorder,
    configDeliveryChannel,
  };
}
