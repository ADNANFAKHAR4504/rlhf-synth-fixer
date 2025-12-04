import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

export interface LambdaStackProps {
  environmentSuffix: string;
  awsRegion: string;
  rawDataBucket: S3Bucket;
  processedDataBucket: S3Bucket;
  sessionsTable: DynamodbTable;
  securityGroup: SecurityGroup;
  privateSubnets: Subnet[];
  kmsKey: KmsKey;
}

export class LambdaStack extends Construct {
  public readonly dataProcessorFunction: LambdaFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      awsRegion,
      rawDataBucket,
      processedDataBucket,
      sessionsTable,
      securityGroup,
      privateSubnets,
      kmsKey,
    } = props;

    // Create Archive provider
    new ArchiveProvider(this, 'archive', {});

    // Create Lambda execution role
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `trading-lambda-role-${environmentSuffix}`,
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
        Name: `trading-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Create custom policy for Lambda
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `trading-lambda-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [
              rawDataBucket.arn,
              `${rawDataBucket.arn}/*`,
              processedDataBucket.arn,
              `${processedDataBucket.arn}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
            ],
            Resource: [sessionsTable.arn],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: [kmsKey.arn],
          },
          {
            Effect: 'Deny',
            Action: '*',
            Resource: '*',
            Condition: {
              StringNotEquals: {
                'aws:RequestedRegion': [awsRegion],
              },
            },
          },
        ],
      }),
      tags: {
        Name: `trading-lambda-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-custom-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/trading-data-processor-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `trading-data-processor-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Lambda function code archive
    const lambdaArchive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/../lambda-${environmentSuffix}.zip`,
    });

    // Create Lambda function
    this.dataProcessorFunction = new LambdaFunction(this, 'data-processor', {
      functionName: `trading-data-processor-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      architectures: ['arm64'],
      memorySize: 512,
      timeout: 60,
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
          RAW_DATA_BUCKET: rawDataBucket.id,
          PROCESSED_DATA_BUCKET: processedDataBucket.id,
          SESSIONS_TABLE: sessionsTable.name,
        },
      },
      kmsKeyArn: kmsKey.arn,
      vpcConfig: {
        subnetIds: privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [securityGroup.id],
      },
      tags: {
        Name: `trading-data-processor-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
      dependsOn: [logGroup],
    });
  }
}
