# AWS Config Compliance Monitoring Solution

This solution implements a comprehensive AWS Config-based compliance monitoring system using Pulumi with TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// S3 Bucket for AWS Config configuration history
const configBucket = new aws.s3.Bucket(`config-bucket-${environmentSuffix}`, {
    bucket: `config-bucket-${environmentSuffix}`,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    forceDestroy: true,
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
});

// S3 Bucket Policy for AWS Config
const configBucketPolicy = new aws.s3.BucketPolicy(`config-bucket-policy-${environmentSuffix}`, {
    bucket: configBucket.id,
    policy: pulumi.all([configBucket.arn, configBucket.bucket]).apply(([bucketArn, bucketName]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "AWSConfigBucketPermissionsCheck",
                    Effect: "Allow",
                    Principal: {
                        Service: "config.amazonaws.com",
                    },
                    Action: "s3:GetBucketAcl",
                    Resource: bucketArn,
                },
                {
                    Sid: "AWSConfigBucketExistenceCheck",
                    Effect: "Allow",
                    Principal: {
                        Service: "config.amazonaws.com",
                    },
                    Action: "s3:ListBucket",
                    Resource: bucketArn,
                },
                {
                    Sid: "AWSConfigBucketPutObject",
                    Effect: "Allow",
                    Principal: {
                        Service: "config.amazonaws.com",
                    },
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringEquals: {
                            "s3:x-amz-acl": "bucket-owner-full-control",
                        },
                    },
                },
            ],
        })
    ),
});

// IAM Role for AWS Config
const configRole = new aws.iam.Role(`config-role-${environmentSuffix}`, {
    name: `config-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
});

// Attach AWS managed policy for AWS Config
const configRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
    `config-role-policy-${environmentSuffix}`,
    {
        role: configRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
    }
);

// Additional IAM policy for S3 access
const configS3Policy = new aws.iam.RolePolicy(`config-s3-policy-${environmentSuffix}`, {
    role: configRole.id,
    policy: configBucket.arn.apply((bucketArn) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: ["s3:PutObject", "s3:GetObject"],
                    Resource: `${bucketArn}/*`,
                },
                {
                    Effect: "Allow",
                    Action: ["s3:GetBucketAcl", "s3:ListBucket"],
                    Resource: bucketArn,
                },
            ],
        })
    ),
});

// AWS Config Recorder
const configRecorder = new aws.cfg.Recorder(`config-recorder-${environmentSuffix}`, {
    name: `config-recorder-${environmentSuffix}`,
    roleArn: configRole.arn,
    recordingGroup: {
        allSupported: false,
        includeGlobalResourceTypes: false,
        resourceTypes: [
            "AWS::EC2::Instance",
            "AWS::RDS::DBInstance",
            "AWS::S3::Bucket",
        ],
    },
});

// Delivery Channel for AWS Config
const deliveryChannel = new aws.cfg.DeliveryChannel(`config-delivery-channel-${environmentSuffix}`, {
    name: `config-delivery-channel-${environmentSuffix}`,
    s3BucketName: configBucket.bucket,
    snapshotDeliveryProperties: {
        deliveryFrequency: "TwentyFour_Hours",
    },
}, { dependsOn: [configBucketPolicy] });

// Start the AWS Config Recorder
const recorderStatus = new aws.cfg.RecorderStatus(`config-recorder-status-${environmentSuffix}`, {
    name: configRecorder.name,
    isEnabled: true,
}, { dependsOn: [deliveryChannel] });

// SNS Topic for compliance notifications
const complianceTopic = new aws.sns.Topic(`compliance-topic-${environmentSuffix}`, {
    name: `compliance-topic-${environmentSuffix}`,
    kmsMasterKeyId: "alias/aws/sns",
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
});

// Managed Config Rule: encrypted-volumes
const encryptedVolumesRule = new aws.cfg.Rule(`encrypted-volumes-rule-${environmentSuffix}`, {
    name: `encrypted-volumes-rule-${environmentSuffix}`,
    source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES",
    },
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
}, { dependsOn: [recorderStatus] });

// Managed Config Rule: rds-encryption-enabled
const rdsEncryptionRule = new aws.cfg.Rule(`rds-encryption-rule-${environmentSuffix}`, {
    name: `rds-encryption-rule-${environmentSuffix}`,
    source: {
        owner: "AWS",
        sourceIdentifier: "RDS_STORAGE_ENCRYPTED",
    },
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
}, { dependsOn: [recorderStatus] });

// Managed Config Rule: s3-bucket-ssl-requests-only
const s3SslRule = new aws.cfg.Rule(`s3-ssl-rule-${environmentSuffix}`, {
    name: `s3-ssl-rule-${environmentSuffix}`,
    source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_SSL_REQUESTS_ONLY",
    },
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
}, { dependsOn: [recorderStatus] });

// IAM Role for Lambda function
const lambdaRole = new aws.iam.Role(`lambda-config-role-${environmentSuffix}`, {
    name: `lambda-config-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
});

// Lambda policy for Config rule evaluation
const lambdaConfigPolicy = new aws.iam.RolePolicy(`lambda-config-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "config:PutEvaluations",
                    "ec2:DescribeTags",
                    "ec2:DescribeInstances",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                Resource: "arn:aws:logs:*:*:*",
            },
        ],
    }),
});

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

// Write Lambda code to file
const lambdaDir = path.join(process.cwd(), "lib", "lambda");
if (!fs.existsSync(lambdaDir)) {
    fs.mkdirSync(lambdaDir, { recursive: true });
}
fs.writeFileSync(path.join(lambdaDir, "config-tag-checker.js"), lambdaCode);

// Create Lambda function with inline code
const tagCheckerLambda = new aws.lambda.Function(`tag-checker-lambda-${environmentSuffix}`, {
    name: `tag-checker-lambda-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(lambdaCode),
        "package.json": new pulumi.asset.StringAsset(JSON.stringify({
            name: "config-tag-checker",
            version: "1.0.0",
            dependencies: {
                "@aws-sdk/client-config-service": "^3.400.0",
                "@aws-sdk/client-ec2": "^3.400.0"
            }
        }))
    }),
    timeout: 60,
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
});

// Lambda permission for AWS Config
const lambdaPermission = new aws.lambda.Permission(`lambda-config-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: tagCheckerLambda.name,
    principal: "config.amazonaws.com",
    statementId: "AllowConfigInvoke",
});

// Custom Config Rule using Lambda
const customTagRule = new aws.cfg.Rule(`custom-tag-rule-${environmentSuffix}`, {
    name: `custom-tag-rule-${environmentSuffix}`,
    source: {
        owner: "CUSTOM_LAMBDA",
        sourceIdentifier: tagCheckerLambda.arn,
        sourceDetails: [
            {
                eventSource: "aws.config",
                messageType: "ConfigurationItemChangeNotification",
            },
        ],
    },
    scope: {
        complianceResourceTypes: ["AWS::EC2::Instance"],
    },
    tags: {
        Department: "Compliance",
        Purpose: "Audit",
    },
}, { dependsOn: [recorderStatus, lambdaPermission] });

// Export outputs
export const configRecorderName = configRecorder.name;
export const configBucketArn = configBucket.arn;
export const complianceTopicArn = complianceTopic.arn;
export const tagCheckerLambdaArn = tagCheckerLambda.arn;
```

## File: lib/lambda/config-tag-checker.ts

```typescript
import { ConfigServiceClient, PutEvaluationsCommand } from "@aws-sdk/client-config-service";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const configClient = new ConfigServiceClient({});
const ec2Client = new EC2Client({});

const REQUIRED_TAGS = ["Environment", "Owner", "CostCenter"];

interface ConfigEvent {
    configurationItem: string;
    invokingEvent: string;
    resultToken: string;
}

interface ConfigurationItem {
    resourceType: string;
    resourceId: string;
    configurationItemCaptureTime: string;
}

export const handler = async (event: ConfigEvent) => {
    console.log("Event received:", JSON.stringify(event, null, 2));

    const configurationItem: ConfigurationItem = JSON.parse(event.configurationItem || "{}");
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
                const instance = response.Reservations[0].Instances![0];
                const tags = instance.Tags || [];
                const tagKeys = tags.map((tag) => tag.Key!);

                const missingTags = REQUIRED_TAGS.filter(
                    (requiredTag) => !tagKeys.includes(requiredTag)
                );

                if (missingTags.length === 0) {
                    compliance = "COMPLIANT";
                    annotation = "All required tags are present";
                } else {
                    annotation = `Missing required tags: ${missingTags.join(", ")}`;
                }
            }
        }
    } catch (error) {
        console.error("Error evaluating compliance:", error);
        annotation = `Error: ${(error as Error).message}`;
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
};
```

## File: lib/lambda/package.json

```json
{
    "name": "config-tag-checker",
    "version": "1.0.0",
    "description": "AWS Config custom rule for tag validation",
    "main": "index.js",
    "dependencies": {
        "@aws-sdk/client-config-service": "^3.400.0",
        "@aws-sdk/client-ec2": "^3.400.0"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    }
}
```

## File: lib/README.md

```markdown
# AWS Config Compliance Monitoring Solution

This Pulumi TypeScript project implements a comprehensive AWS Config-based compliance monitoring system.

## Architecture

The solution includes:

1. **AWS Config Setup**
   - Configuration recorder tracking EC2, RDS, and S3 resources
   - S3 bucket for configuration history with encryption
   - Delivery channel with 24-hour snapshot intervals

2. **Managed Compliance Rules**
   - `encrypted-volumes`: Verifies EC2 volumes are encrypted
   - `rds-encryption-enabled`: Verifies RDS encryption
   - `s3-bucket-ssl-requests-only`: Enforces SSL on S3 buckets

3. **Custom Compliance Rule**
   - Lambda function validating EC2 instance tags
   - Checks for required tags: Environment, Owner, CostCenter
   - Uses AWS SDK v3 with Node.js 18.x runtime

4. **Notifications**
   - SNS topic for compliance change notifications
   - Encrypted with AWS managed KMS key

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18.x or later
- TypeScript

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy
pulumi up
```

## Outputs

After deployment, the following outputs are available:

- `configRecorderName`: Name of the AWS Config recorder
- `configBucketArn`: ARN of the S3 bucket storing configuration history
- `complianceTopicArn`: ARN of the SNS topic for compliance notifications
- `tagCheckerLambdaArn`: ARN of the custom tag checker Lambda function

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable without manual intervention.

## Resource Naming

All resources include the `environmentSuffix` configuration value in their names for uniqueness and proper resource isolation.

## Tags

All resources are tagged with:
- `Department`: Compliance
- `Purpose`: Audit

## Security

- S3 bucket uses AES256 encryption
- SNS topic uses AWS managed KMS key
- IAM roles follow least privilege principle
- Lambda function has CloudWatch Logs enabled
```

## Deployment Instructions

1. Set the required configuration parameter:
   ```bash
   pulumi config set environmentSuffix <unique-suffix>
   ```

2. Deploy the stack:
   ```bash
   pulumi up
   ```

3. Verify AWS Config is recording:
   ```bash
   aws configservice describe-configuration-recorders
   aws configservice describe-delivery-channels
   ```

4. Check compliance rules:
   ```bash
   aws configservice describe-config-rules
   ```

All resources follow the naming pattern `resource-type-${environmentSuffix}` and are tagged appropriately for compliance tracking.