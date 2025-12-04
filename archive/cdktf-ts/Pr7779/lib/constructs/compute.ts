import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunctionUrl } from '@cdktf/provider-aws/lib/lambda-function-url';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

export interface ComputeConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryVpcId: string;
  secondaryVpcId: string;
  primarySubnetIds: string[];
  secondarySubnetIds: string[];
  primaryLambdaSecurityGroupId: string;
  secondaryLambdaSecurityGroupId: string;
  dynamoTableName: string;
  primaryBucketName: string;
  secondaryBucketName: string;
  auroraEndpointPrimary: string;
  auroraEndpointSecondary: string;
}

export class ComputeConstruct extends Construct {
  public readonly primaryLambdaArn: string;
  public readonly secondaryLambdaArn: string;
  public readonly primaryLambdaName: string;
  public readonly secondaryLambdaName: string;
  public readonly primaryLambdaUrl: string;
  public readonly secondaryLambdaUrl: string;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primarySubnetIds,
      secondarySubnetIds,
      primaryLambdaSecurityGroupId,
      secondaryLambdaSecurityGroupId,
      dynamoTableName,
      primaryBucketName,
      secondaryBucketName,
      auroraEndpointPrimary,
      auroraEndpointSecondary,
    } = props;

    // Archive provider for zipping Lambda code
    new ArchiveProvider(this, 'archive', {});

    // Create Lambda deployment package
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: `${__dirname}/../lambda/transaction-processor`,
      outputPath: `${__dirname}/../lambda/transaction-processor.zip`,
    });

    // Primary Lambda IAM Role
    const primaryLambdaRole = new IamRole(this, 'PrimaryLambdaRole', {
      provider: primaryProvider,
      name: `transaction-processor-role-primary-${environmentSuffix}`,
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
        Name: `transaction-processor-role-primary-${environmentSuffix}`,
      },
    });

    // Attach VPC execution policy
    new IamRolePolicyAttachment(this, 'PrimaryLambdaVPCPolicy', {
      provider: primaryProvider,
      role: primaryLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Primary Lambda custom policy
    new IamRolePolicy(this, 'PrimaryLambdaCustomPolicy', {
      provider: primaryProvider,
      name: `transaction-processor-policy-primary-${environmentSuffix}`,
      role: primaryLambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
            ],
            Resource: `arn:aws:dynamodb:*:*:table/${dynamoTableName}`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
            Resource: [
              `arn:aws:s3:::${primaryBucketName}`,
              `arn:aws:s3:::${primaryBucketName}/*`,
            ],
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
    });

    // Primary Lambda Function
    const primaryLambda = new LambdaFunction(this, 'PrimaryLambdaFunction', {
      provider: primaryProvider,
      functionName: `transaction-processor-primary-${environmentSuffix}`,
      role: primaryLambdaRole.arn,
      handler: 'processor.handler',
      runtime: 'python3.11',
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      timeout: 30,
      memorySize: 512,
      environment: {
        variables: {
          AWS_REGION_NAME: 'us-east-1',
          DYNAMO_TABLE_NAME: dynamoTableName,
          S3_BUCKET: primaryBucketName,
          AURORA_ENDPOINT: auroraEndpointPrimary,
          IS_PRIMARY: 'true',
        },
      },
      vpcConfig: {
        subnetIds: primarySubnetIds,
        securityGroupIds: [primaryLambdaSecurityGroupId],
      },
      tags: {
        Name: `transaction-processor-primary-${environmentSuffix}`,
      },
    });

    // Primary Lambda Function URL
    const primaryLambdaUrl = new LambdaFunctionUrl(this, 'PrimaryLambdaUrl', {
      provider: primaryProvider,
      functionName: primaryLambda.functionName,
      authorizationType: 'NONE',
    });

    // Secondary Lambda IAM Role
    const secondaryLambdaRole = new IamRole(this, 'SecondaryLambdaRole', {
      provider: secondaryProvider,
      name: `transaction-processor-role-secondary-${environmentSuffix}`,
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
        Name: `transaction-processor-role-secondary-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'SecondaryLambdaVPCPolicy', {
      provider: secondaryProvider,
      role: secondaryLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    new IamRolePolicy(this, 'SecondaryLambdaCustomPolicy', {
      provider: secondaryProvider,
      name: `transaction-processor-policy-secondary-${environmentSuffix}`,
      role: secondaryLambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
            ],
            Resource: `arn:aws:dynamodb:*:*:table/${dynamoTableName}`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
            Resource: [
              `arn:aws:s3:::${secondaryBucketName}`,
              `arn:aws:s3:::${secondaryBucketName}/*`,
            ],
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
    });

    // Secondary Lambda Function
    const secondaryLambda = new LambdaFunction(
      this,
      'SecondaryLambdaFunction',
      {
        provider: secondaryProvider,
        functionName: `transaction-processor-secondary-${environmentSuffix}`,
        role: secondaryLambdaRole.arn,
        handler: 'processor.handler',
        runtime: 'python3.11',
        filename: lambdaArchive.outputPath,
        sourceCodeHash: lambdaArchive.outputBase64Sha256,
        timeout: 30,
        memorySize: 512,
        environment: {
          variables: {
            AWS_REGION_NAME: 'us-east-2',
            DYNAMO_TABLE_NAME: dynamoTableName,
            S3_BUCKET: secondaryBucketName,
            AURORA_ENDPOINT: auroraEndpointSecondary,
            IS_PRIMARY: 'false',
          },
        },
        vpcConfig: {
          subnetIds: secondarySubnetIds,
          securityGroupIds: [secondaryLambdaSecurityGroupId],
        },
        tags: {
          Name: `transaction-processor-secondary-${environmentSuffix}`,
        },
      }
    );

    // Secondary Lambda Function URL
    const secondaryLambdaUrl = new LambdaFunctionUrl(
      this,
      'SecondaryLambdaUrl',
      {
        provider: secondaryProvider,
        functionName: secondaryLambda.functionName,
        authorizationType: 'NONE',
      }
    );

    // Export values
    this.primaryLambdaArn = primaryLambda.arn;
    this.secondaryLambdaArn = secondaryLambda.arn;
    this.primaryLambdaName = primaryLambda.functionName;
    this.secondaryLambdaName = secondaryLambda.functionName;
    this.primaryLambdaUrl = primaryLambdaUrl.functionUrl;
    this.secondaryLambdaUrl = secondaryLambdaUrl.functionUrl;
  }
}
