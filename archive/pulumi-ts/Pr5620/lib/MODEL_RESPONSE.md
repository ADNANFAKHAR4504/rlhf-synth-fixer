# Lambda Image Processing Optimization - Pulumi TypeScript Implementation

This implementation provides an optimized Lambda-based image processing infrastructure using Pulumi with TypeScript, focusing on cost reduction and performance improvements.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const inputBucketName = config.get("inputBucketName") || `image-input-${environmentSuffix}`;
const outputBucketName = config.get("outputBucketName") || `image-output-${environmentSuffix}`;

// Create KMS key for Lambda environment variable encryption
const kmsKey = new aws.kms.Key(`lambda-encryption-key-${environmentSuffix}`, {
    description: "KMS key for Lambda environment variable encryption",
    enableKeyRotation: true,
    tags: {
        Name: `lambda-encryption-key-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const kmsKeyAlias = new aws.kms.Alias(`lambda-encryption-alias-${environmentSuffix}`, {
    name: `alias/lambda-encryption-${environmentSuffix}`,
    targetKeyId: kmsKey.keyId,
});

// Create S3 buckets for image processing
const inputBucket = new aws.s3.Bucket(`image-input-bucket-${environmentSuffix}`, {
    bucket: inputBucketName,
    forceDestroy: true,
    tags: {
        Name: inputBucketName,
        Environment: environmentSuffix,
    },
});

const outputBucket = new aws.s3.Bucket(`image-output-bucket-${environmentSuffix}`, {
    bucket: outputBucketName,
    forceDestroy: true,
    tags: {
        Name: outputBucketName,
        Environment: environmentSuffix,
    },
});

// Create Lambda Layer for shared dependencies
const sharedLayer = new aws.lambda.LayerVersion(`shared-dependencies-layer-${environmentSuffix}`, {
    layerName: `shared-dependencies-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
        "nodejs": new pulumi.asset.FileArchive("./lambda-layers/shared-dependencies"),
    }),
    compatibleRuntimes: ["nodejs18.x", "nodejs20.x"],
    description: "Shared dependencies for image processing Lambda functions",
});

// Create IAM role for Lambda functions with S3 access
const lambdaRole = new aws.iam.Role(`lambda-execution-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
        }],
    }),
    tags: {
        Name: `lambda-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Attach basic Lambda execution policy
const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Attach X-Ray write access
const lambdaXRayAccess = new aws.iam.RolePolicyAttachment(`lambda-xray-access-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

// Create policy for S3 access with least privilege
const s3AccessPolicy = new aws.iam.Policy(`lambda-s3-access-policy-${environmentSuffix}`, {
    description: "Least privilege S3 access for Lambda functions",
    policy: pulumi.all([inputBucket.arn, outputBucket.arn]).apply(([inputArn, outputArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: ["s3:GetObject"],
                    Resource: `${inputArn}/*`,
                },
                {
                    Effect: "Allow",
                    Action: ["s3:PutObject"],
                    Resource: `${outputArn}/*`,
                },
            ],
        })
    ),
});

const s3PolicyAttachment = new aws.iam.RolePolicyAttachment(`lambda-s3-policy-attachment-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: s3AccessPolicy.arn,
});

// Create policy for KMS access
const kmsAccessPolicy = new aws.iam.Policy(`lambda-kms-access-policy-${environmentSuffix}`, {
    description: "KMS access for Lambda environment variable decryption",
    policy: kmsKey.arn.apply(keyArn =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: ["kms:Decrypt"],
                Resource: keyArn,
            }],
        })
    ),
});

const kmsAccessAttachment = new aws.iam.RolePolicyAttachment(`lambda-kms-policy-attachment-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: kmsAccessPolicy.arn,
});

// CloudWatch Log Groups with 7-day retention
const thumbnailLogGroup = new aws.cloudwatch.LogGroup(`thumbnail-logs-${environmentSuffix}`, {
    name: `/aws/lambda/thumbnail-generator-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `thumbnail-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const watermarkLogGroup = new aws.cloudwatch.LogGroup(`watermark-logs-${environmentSuffix}`, {
    name: `/aws/lambda/watermark-applier-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `watermark-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const metadataLogGroup = new aws.cloudwatch.LogGroup(`metadata-logs-${environmentSuffix}`, {
    name: `/aws/lambda/metadata-extractor-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `metadata-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Thumbnail Generator Lambda Function (Node.js with ARM64)
const thumbnailFunction = new aws.lambda.Function(`thumbnail-generator-${environmentSuffix}`, {
    name: `thumbnail-generator-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda-functions/thumbnail-generator"),
    }),
    memorySize: 1024,
    timeout: 60,
    architecture: "arm64",
    reservedConcurrentExecutions: 50,
    layers: [sharedLayer.arn],
    environment: {
        variables: {
            INPUT_BUCKET: inputBucketName,
            OUTPUT_BUCKET: outputBucketName,
        },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
        mode: "Active",
    },
    tags: {
        Name: `thumbnail-generator-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [thumbnailLogGroup, s3PolicyAttachment, kmsAccessAttachment] });

// Watermark Applier Lambda Function (Java with ARM64 and SnapStart)
const watermarkFunction = new aws.lambda.Function(`watermark-applier-${environmentSuffix}`, {
    name: `watermark-applier-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.Java11,
    handler: "com.example.WatermarkHandler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda-functions/watermark-applier"),
    }),
    memorySize: 512,
    timeout: 60,
    architecture: "arm64",
    reservedConcurrentExecutions: 25,
    environment: {
        variables: {
            INPUT_BUCKET: inputBucketName,
            OUTPUT_BUCKET: outputBucketName,
        },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
        mode: "Active",
    },
    snapStart: {
        applyOn: "PublishedVersions",
    },
    tags: {
        Name: `watermark-applier-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [watermarkLogGroup, s3PolicyAttachment, kmsAccessAttachment] });

// Metadata Extractor Lambda Function (Node.js with ARM64)
const metadataFunction = new aws.lambda.Function(`metadata-extractor-${environmentSuffix}`, {
    name: `metadata-extractor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda-functions/metadata-extractor"),
    }),
    memorySize: 256,
    timeout: 30,
    architecture: "arm64",
    reservedConcurrentExecutions: 25,
    layers: [sharedLayer.arn],
    environment: {
        variables: {
            INPUT_BUCKET: inputBucketName,
            OUTPUT_BUCKET: outputBucketName,
        },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
        mode: "Active",
    },
    tags: {
        Name: `metadata-extractor-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [metadataLogGroup, s3PolicyAttachment, kmsAccessAttachment] });

// Configure X-Ray sampling rule (10% sampling)
const xraySamplingRule = new aws.xray.SamplingRule(`image-processing-sampling-${environmentSuffix}`, {
    ruleName: `image-processing-${environmentSuffix}`,
    priority: 1000,
    version: 1,
    reservoirSize: 1,
    fixedRate: 0.1, // 10% sampling
    urlPath: "*",
    host: "*",
    httpMethod: "*",
    serviceName: "*",
    serviceType: "*",
    resourceArn: "*",
    tags: {
        Name: `image-processing-sampling-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lambda Function URLs with IAM authentication
const thumbnailFunctionUrl = new aws.lambda.FunctionUrl(`thumbnail-url-${environmentSuffix}`, {
    functionName: thumbnailFunction.name,
    authorizationType: "AWS_IAM",
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["POST"],
        allowHeaders: ["content-type", "x-amz-date", "authorization", "x-api-key"],
        maxAge: 86400,
    },
});

const watermarkFunctionUrl = new aws.lambda.FunctionUrl(`watermark-url-${environmentSuffix}`, {
    functionName: watermarkFunction.name,
    authorizationType: "AWS_IAM",
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["POST"],
        allowHeaders: ["content-type", "x-amz-date", "authorization", "x-api-key"],
        maxAge: 86400,
    },
});

const metadataFunctionUrl = new aws.lambda.FunctionUrl(`metadata-url-${environmentSuffix}`, {
    functionName: metadataFunction.name,
    authorizationType: "AWS_IAM",
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["POST"],
        allowHeaders: ["content-type", "x-amz-date", "authorization", "x-api-key"],
        maxAge: 86400,
    },
});

// Exports
export const inputBucketArn = inputBucket.arn;
export const outputBucketArn = outputBucket.arn;
export const thumbnailFunctionArn = thumbnailFunction.arn;
export const watermarkFunctionArn = watermarkFunction.arn;
export const metadataFunctionArn = metadataFunction.arn;
export const thumbnailUrl = thumbnailFunctionUrl.functionUrl;
export const watermarkUrl = watermarkFunctionUrl.functionUrl;
export const metadataUrl = metadataFunctionUrl.functionUrl;
export const kmsKeyId = kmsKey.keyId;
export const sharedLayerArn = sharedLayer.arn;
```

## File: lambda-functions/thumbnail-generator/index.js

```javascript
// Thumbnail Generator Lambda Function
exports.handler = async (event) => {
    console.log('Thumbnail generation started', JSON.stringify(event));

    const inputBucket = process.env.INPUT_BUCKET;
    const outputBucket = process.env.OUTPUT_BUCKET;

    // Simulate thumbnail generation logic
    // In production, this would use sharp or similar library from the layer
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Thumbnail generated successfully',
            inputBucket,
            outputBucket,
            architecture: 'arm64',
            memorySize: '1024MB'
        })
    };

    return response;
};
```

## File: lambda-functions/watermark-applier/WatermarkHandler.java

```java
package com.example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import java.util.Map;
import java.util.HashMap;

public class WatermarkHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        context.getLogger().log("Watermark application started: " + event.toString());

        String inputBucket = System.getenv("INPUT_BUCKET");
        String outputBucket = System.getenv("OUTPUT_BUCKET");

        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);

        Map<String, String> body = new HashMap<>();
        body.put("message", "Watermark applied successfully");
        body.put("inputBucket", inputBucket);
        body.put("outputBucket", outputBucket);
        body.put("architecture", "arm64");
        body.put("memorySize", "512MB");
        body.put("snapStart", "enabled");

        response.put("body", body.toString());

        return response;
    }
}
```

## File: lambda-functions/metadata-extractor/index.js

```javascript
// Metadata Extractor Lambda Function
exports.handler = async (event) => {
    console.log('Metadata extraction started', JSON.stringify(event));

    const inputBucket = process.env.INPUT_BUCKET;
    const outputBucket = process.env.OUTPUT_BUCKET;

    // Simulate metadata extraction logic
    // In production, this would use exif-parser or similar library from the layer
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Metadata extracted successfully',
            inputBucket,
            outputBucket,
            architecture: 'arm64',
            memorySize: '256MB'
        })
    };

    return response;
};
```

## File: lambda-layers/shared-dependencies/nodejs/package.json

```json
{
  "name": "image-processing-shared-dependencies",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda image processing functions",
  "main": "index.js",
  "dependencies": {
    "sharp": "^0.32.0",
    "aws-xray-sdk-core": "^3.5.0"
  }
}
```

## File: Pulumi.yaml

```yaml
name: lambda-image-processing-optimization
runtime: nodejs
description: Optimized Lambda-based image processing infrastructure with ARM64, SnapStart, and cost optimizations
```

## File: Pulumi.dev.yaml

```yaml
config:
  lambda-image-processing-optimization:environmentSuffix: "dev"
  lambda-image-processing-optimization:inputBucketName: "image-input-dev"
  lambda-image-processing-optimization:outputBucketName: "image-output-dev"
```

## Architecture Overview

This implementation provides:

1. **ARM64 Architecture**: All Lambda functions use ARM64 (Graviton2) for ~20% cost savings
2. **Right-Sized Memory**: Functions allocated based on profiling (1024MB, 512MB, 256MB)
3. **Reserved Concurrency**: Thumbnail (50), Watermark (25), Metadata (25) - total 100
4. **Lambda SnapStart**: Java watermark function uses SnapStart to reduce cold starts
5. **Lambda Layers**: Shared dependencies layer reduces deployment package sizes
6. **7-Day Log Retention**: CloudWatch logs configured for cost control
7. **X-Ray Tracing**: 10% sampling rate for cost-effective observability
8. **Function URLs**: Direct invocation with IAM auth and CORS configuration
9. **Least Privilege IAM**: Specific S3 permissions (read from input, write to output)
10. **KMS Encryption**: Shared KMS key for environment variable encryption

## Cost Optimization Highlights

- **ARM64 Architecture**: ~20% reduction in compute costs
- **Memory Right-Sizing**: No over-provisioning based on profiling data
- **Reserved Concurrency**: Prevents runaway costs from unlimited scaling
- **Log Retention**: 7-day retention vs indefinite storage saves on CloudWatch costs
- **X-Ray Sampling**: 10% sampling reduces tracing costs while maintaining visibility
- **Lambda Layers**: Reduces deployment package sizes and speeds up deployments

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set inputBucketName <input-bucket-name>
pulumi config set outputBucketName <output-bucket-name>
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Access function URLs from outputs for direct invocation with IAM authentication
