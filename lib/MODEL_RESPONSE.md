# Serverless Data Processing Infrastructure

This document contains the CDKTF TypeScript code for implementing a serverless data processing pipeline using AWS services.

## Architecture Overview

The infrastructure creates:
- S3 bucket with encryption and security policies
- Lambda function for data processing
- KMS key for encryption at rest
- IAM roles and policies with least privilege
- S3 bucket notifications to trigger Lambda

## Implementation

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketNotification } from "@cdktf/provider-aws/lib/s3-bucket-notification";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { DataAwsRegion } from "@cdktf/provider-aws/lib/data-aws-region";
import { TerraformAsset, AssetType } from "cdktf";
import * as path from "path";

class ServerlessDataProcessingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider configuration for us-east-1
    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    // Data sources for account ID and region
    const current = new DataAwsCallerIdentity(this, "current");
    const currentRegion = new DataAwsRegion(this, "current-region");

    // Project prefix for consistent naming
    const projectPrefix = "projectXYZ";

    // KMS Key for S3 encryption at rest
    const s3KmsKey = new KmsKey(this, "s3-kms-key", {
      description: `${projectPrefix} S3 encryption key`,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow S3 Service",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            },
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-s3-kms-key`,
        Project: projectPrefix
      }
    });

    // KMS Key Alias for easier reference
    new KmsAlias(this, "s3-kms-key-alias", {
      name: `alias/${projectPrefix}-s3-encryption`,
      targetKeyId: s3KmsKey.keyId
    });

    // S3 Bucket for data processing
    const dataBucket = new S3Bucket(this, "data-bucket", {
      bucket: `${projectPrefix.toLowerCase()}-data-processing-${current.accountId}`,
      tags: {
        Name: `${projectPrefix}-data-processing-bucket`,
        Project: projectPrefix
      }
    });

    // S3 Bucket Server-Side Encryption Configuration
    new S3BucketServerSideEncryptionConfiguration(this, "data-bucket-encryption", {
      bucket: dataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: s3KmsKey.arn
          },
          bucketKeyEnabled: true
        }
      ]
    });

    // S3 Bucket Public Access Block - security best practice
    new S3BucketPublicAccessBlock(this, "data-bucket-pab", {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // S3 Bucket Policy to enforce HTTPS and encryption
    new S3BucketPolicy(this, "data-bucket-policy", {
      bucket: dataBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyInsecureConnections",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              dataBucket.arn,
              `${dataBucket.arn}/*`
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false"
              }
            }
          },
          {
            Sid: "DenyUnencryptedObjectUploads",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:PutObject",
            Resource: `${dataBucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                "s3:x-amz-server-side-encryption": "aws:kms"
              }
            }
          }
        ]
      })
    });

    // Lambda function code asset
    const lambdaAsset = new TerraformAsset(this, "lambda-asset", {
      path: path.resolve(__dirname, "lambda"),
      type: AssetType.ARCHIVE
    });

    // IAM Role for Lambda execution with least privilege
    const lambdaRole = new IamRole(this, "lambda-execution-role", {
      name: `${projectPrefix}-lambda-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-lambda-execution-role`,
        Project: projectPrefix
      }
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    // Custom IAM Policy for S3 and KMS access (principle of least privilege)
    const lambdaS3KmsPolicy = new IamPolicy(this, "lambda-s3-kms-policy", {
      name: `${projectPrefix}-lambda-s3-kms-policy`,
      description: "Policy for Lambda to access S3 bucket and KMS key",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            Resource: `${dataBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: s3KmsKey.arn
          },
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:log-group:/aws/lambda/${projectPrefix}-*`
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-lambda-s3-kms-policy`,
        Project: projectPrefix
      }
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, "lambda-s3-kms-attachment", {
      role: lambdaRole.name,
      policyArn: lambdaS3KmsPolicy.arn
    });

    // Lambda function for data processing
    const dataProcessorLambda = new LambdaFunction(this, "data-processor-lambda", {
      functionName: `${projectPrefix}-data-processor`,
      filename: lambdaAsset.path,
      handler: "index.handler",
      runtime: "nodejs18.x",
      role: lambdaRole.arn,
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          BUCKET_NAME: dataBucket.bucket,
          KMS_KEY_ID: s3KmsKey.keyId,
          PROJECT_PREFIX: projectPrefix
        }
      },
      tags: {
        Name: `${projectPrefix}-data-processor`,
        Project: projectPrefix
      }
    });

    // Lambda permission to allow S3 to invoke the function
    new LambdaPermission(this, "s3-lambda-permission", {
      statementId: "AllowExecutionFromS3Bucket",
      action: "lambda:InvokeFunction",
      functionName: dataProcessorLambda.functionName,
      principal: "s3.amazonaws.com",
      sourceArn: dataBucket.arn
    });

    // S3 Bucket Notification to trigger Lambda on object creation
    new S3BucketNotification(this, "bucket-notification", {
      bucket: dataBucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: dataProcessorLambda.arn,
          events: ["s3:ObjectCreated:*"],
          filterPrefix: "input/",
          filterSuffix: ".json"
        }
      ],
      dependsOn: [dataProcessorLambda]
    });

    // Terraform Outputs
    new TerraformOutput(this, "bucket-name", {
      value: dataBucket.bucket,
      description: "Name of the S3 bucket for data processing"
    });

    new TerraformOutput(this, "lambda-function-name", {
      value: dataProcessorLambda.functionName,
      description: "Name of the Lambda function for data processing"
    });

    new TerraformOutput(this, "kms-key-id", {
      value: s3KmsKey.keyId,
      description: "KMS Key ID used for S3 encryption"
    });

    new TerraformOutput(this, "lambda-role-arn", {
      value: lambdaRole.arn,
      description: "ARN of the Lambda execution role"
    });
  }
}

// CDKTF App
const app = new App();
new ServerlessDataProcessingStack(app, "serverless-data-processing");
app.synth();
```

## Features

### Security
- **KMS Encryption**: S3 bucket encrypted at rest with customer-managed KMS key
- **IAM Least Privilege**: Lambda has minimal required permissions
- **Bucket Security**: Public access blocked, HTTPS enforced
- **Key Rotation**: KMS key rotation enabled

### Monitoring & Operations
- **Terraform Outputs**: Key resource information exposed
- **Resource Tagging**: Consistent tagging strategy
- **Environment Variables**: Configuration passed to Lambda

### Event Processing
- **S3 Triggers**: Lambda invoked on object creation in `input/` prefix
- **File Filtering**: Only processes `.json` files
- **Error Handling**: Comprehensive error handling in Lambda code

## Deployment

```bash
# Initialize CDKTF
cdktf get

# Generate Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy
```

## Resource Outputs

- `bucket-name`: S3 bucket for data processing
- `lambda-function-name`: Lambda function name
- `kms-key-id`: KMS key for encryption
- `lambda-role-arn`: Lambda execution role ARN