import { Construct } from 'constructs';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3DirectoryBucket } from '@cdktf/provider-aws/lib/s3-directory-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { TerraformAsset, AssetType } from 'cdktf';
import * as path from 'path';

interface ArtifactCleanupStackProps {
  environmentSuffix: string;
  artifactBucket: S3Bucket;
  artifactBucketExpressOneZone: S3DirectoryBucket;
  metadataTable: DynamodbTable;
}

export class ArtifactCleanupStack extends Construct {
  public readonly cleanupFunction: LambdaFunction;

  constructor(scope: Construct, id: string, props: ArtifactCleanupStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      artifactBucket,
      artifactBucketExpressOneZone,
      metadataTable,
    } = props;

    const lambdaAssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'lambda-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    const cleanupLambdaRole = new IamRole(this, 'cleanup-lambda-role', {
      name: `artifact-cleanup-lambda-${environmentSuffix}`,
      assumeRolePolicy: lambdaAssumeRolePolicy.json,
    });

    const cleanupLambdaPolicy = new DataAwsIamPolicyDocument(
      this,
      'cleanup-lambda-policy',
      {
        statement: [
          {
            actions: [
              's3:ListBucket',
              's3:GetObject',
              's3:DeleteObject',
              's3:ListBucketVersions',
              's3:DeleteObjectVersion',
            ],
            resources: [
              artifactBucket.arn,
              `${artifactBucket.arn}/*`,
              artifactBucketExpressOneZone.arn,
              `${artifactBucketExpressOneZone.arn}/*`,
            ],
          },
          {
            actions: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DeleteItem'],
            resources: [metadataTable.arn],
          },
          {
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            resources: ['arn:aws:logs:*:*:*'],
          },
        ],
      }
    );

    new IamRolePolicy(this, 'cleanup-lambda-role-policy', {
      name: `artifact-cleanup-policy-${environmentSuffix}`,
      role: cleanupLambdaRole.id,
      policy: cleanupLambdaPolicy.json,
    });

    const lambdaCode = new TerraformAsset(this, 'lambda-code', {
      path: path.join(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    this.cleanupFunction = new LambdaFunction(this, 'cleanup-function', {
      functionName: `artifact-cleanup-${environmentSuffix}`,
      runtime: 'nodejs22.x',
      handler: 'cleanup.handler',
      role: cleanupLambdaRole.arn,
      filename: lambdaCode.path,
      sourceCodeHash: lambdaCode.assetHash,
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          ARTIFACT_BUCKET: artifactBucket.id,
          EXPRESS_BUCKET: artifactBucketExpressOneZone.id,
          METADATA_TABLE: metadataTable.name,
          RETENTION_DAYS: '90',
        },
      },
      tags: {
        Name: `artifact-cleanup-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Artifact Cleanup',
      },
    });

    const cleanupSchedule = new CloudwatchEventRule(this, 'cleanup-schedule', {
      name: `artifact-cleanup-schedule-${environmentSuffix}`,
      description: 'Daily artifact cleanup schedule',
      scheduleExpression: 'rate(1 day)',
    });

    new CloudwatchEventTarget(this, 'cleanup-schedule-target', {
      rule: cleanupSchedule.name,
      targetId: 'cleanup-lambda',
      arn: this.cleanupFunction.arn,
    });

    new LambdaPermission(this, 'cleanup-schedule-permission', {
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: this.cleanupFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: cleanupSchedule.arn,
    });
  }
}
