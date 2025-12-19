# Zero-Trust Security Architecture - Pulumi TypeScript Implementation

This implementation creates a secure, isolated infrastructure for processing sensitive financial data with zero-trust security architecture.

## Architecture Overview

- VPC with 3 private subnets across availability zones
- VPC Endpoints for S3, DynamoDB, and KMS (no internet access)
- KMS key with rotation for encryption
- S3 bucket with versioning and encryption
- Lambda function in private subnet for data processing
- DynamoDB table for audit logs
- CloudWatch Logs with encryption
- AWS Config for compliance monitoring

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = config.get("region") || "us-east-1";

const stack = new TapStack("tap-stack", {
  environmentSuffix,
  region,
});

export const kmsKeyArn = stack.kmsKey.arn;
export const bucketName = stack.bucket.bucket;
export const lambdaArn = stack.lambdaFunction.arn;
export const vpcId = stack.vpc.id;
export const auditTableName = stack.auditTable.name;
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackProps {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly kmsKey: aws.kms.Key;
  public readonly bucket: aws.s3.Bucket;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly auditTable: aws.dynamodb.Table;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:TapStack", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // KMS Key with rotation
    this.kmsKey = new aws.kms.Key("financialDataKey", {
      description: "KMS key for financial data encryption",
      enableKeyRotation: true,
      tags: {
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    const kmsAlias = new aws.kms.Alias("financialDataKeyAlias", {
      name: "alias/financial-data-key",
      targetKeyId: this.kmsKey.keyId,
    }, defaultResourceOptions);

    // VPC Configuration
    this.vpc = new aws.ec2.Vpc("secureVpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `secure-vpc-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Get AZs
    const azs = aws.getAvailabilityZones({
      state: "available",
    });

    // Create 3 private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateRouteTables: aws.ec2.RouteTable[] = [];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`privateSubnet${i + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: azs.then(az => az.names[i]),
        tags: {
          Name: `private-subnet-${i + 1}-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
          DataClassification: "PCI-DSS",
          Owner: "SecurityTeam",
        },
      }, defaultResourceOptions);
      privateSubnets.push(subnet);

      const routeTable = new aws.ec2.RouteTable(`privateRouteTable${i + 1}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${i + 1}-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
          DataClassification: "PCI-DSS",
          Owner: "SecurityTeam",
        },
      }, defaultResourceOptions);
      privateRouteTables.push(routeTable);

      new aws.ec2.RouteTableAssociation(`privateRtAssoc${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      }, defaultResourceOptions);
    }

    // Security Group for Lambda
    const lambdaSg = new aws.ec2.SecurityGroup("lambdaSecurityGroup", {
      name: `lambda-sg-${props.environmentSuffix}`,
      vpcId: this.vpc.id,
      description: "Security group for Lambda function",
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["10.0.0.0/16"],
      }],
      tags: {
        Name: `lambda-sg-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // VPC Endpoints
    const s3Endpoint = new aws.ec2.VpcEndpoint("s3Endpoint", {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${props.region}.s3`,
      vpcEndpointType: "Gateway",
      routeTableIds: privateRouteTables.map(rt => rt.id),
      tags: {
        Name: `s3-endpoint-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    const dynamoEndpoint = new aws.ec2.VpcEndpoint("dynamodbEndpoint", {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${props.region}.dynamodb`,
      vpcEndpointType: "Gateway",
      routeTableIds: privateRouteTables.map(rt => rt.id),
      tags: {
        Name: `dynamodb-endpoint-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Security Group for VPC Endpoints
    const endpointSg = new aws.ec2.SecurityGroup("endpointSecurityGroup", {
      name: `endpoint-sg-${props.environmentSuffix}`,
      vpcId: this.vpc.id,
      description: "Security group for VPC endpoints",
      ingress: [{
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["10.0.0.0/16"],
      }],
      tags: {
        Name: `endpoint-sg-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    const kmsEndpoint = new aws.ec2.VpcEndpoint("kmsEndpoint", {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${props.region}.kms`,
      vpcEndpointType: "Interface",
      subnetIds: privateSubnets.map(s => s.id),
      securityGroupIds: [endpointSg.id],
      privateDnsEnabled: true,
      tags: {
        Name: `kms-endpoint-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // S3 Bucket
    this.bucket = new aws.s3.Bucket("dataBucket", {
      bucket: `financial-data-${props.environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: this.kmsKey.keyId,
          },
        },
      },
      tags: {
        Name: `financial-data-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Block public access
    new aws.s3.BucketPublicAccessBlock("dataBucketPublicAccessBlock", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, defaultResourceOptions);

    // DynamoDB Table
    this.auditTable = new aws.dynamodb.Table("auditLogsTable", {
      name: `audit-logs-${props.environmentSuffix}`,
      billingMode: "PAY_PER_REQUEST",
      hashKey: "id",
      attributes: [{
        name: "id",
        type: "S",
      }],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: this.kmsKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `audit-logs-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup("lambdaLogGroup", {
      name: `/aws/lambda/data-processor-${props.environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Lambda IAM Role
    const lambdaRole = new aws.iam.Role("lambdaRole", {
      name: `lambda-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        }],
      }),
      tags: {
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Lambda IAM Policy
    const lambdaPolicy = new aws.iam.RolePolicy("lambdaPolicy", {
      role: lambdaRole.id,
      policy: pulumi.all([this.bucket.arn, this.auditTable.arn, this.kmsKey.arn, this.logGroup.arn]).apply(([bucketArn, tableArn, keyArn, logArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:Query",
            ],
            Resource: tableArn,
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:Encrypt",
              "kms:GenerateDataKey",
            ],
            Resource: keyArn,
          },
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: `${logArn}:*`,
          },
          {
            Effect: "Allow",
            Action: [
              "ec2:CreateNetworkInterface",
              "ec2:DescribeNetworkInterfaces",
              "ec2:DeleteNetworkInterface",
            ],
            Resource: "*",
          },
        ],
      })),
    }, defaultResourceOptions);

    // Lambda Function
    this.lambdaFunction = new aws.lambda.Function("dataProcessor", {
      name: `data-processor-${props.environmentSuffix}`,
      runtime: aws.lambda.Runtime.NodeJS18dX,
      handler: "index.handler",
      role: lambdaRole.arn,
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lib/lambda"),
      }),
      memorySize: 1024,
      timeout: 300,
      vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSg.id],
      },
      environment: {
        variables: {
          BUCKET_NAME: this.bucket.bucket,
          AUDIT_TABLE: this.auditTable.name,
          KMS_KEY_ID: this.kmsKey.keyId,
        },
      },
      tags: {
        Name: `data-processor-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, { ...defaultResourceOptions, dependsOn: [this.logGroup, lambdaPolicy] });

    // AWS Config Configuration
    const configRole = new aws.iam.Role("configRole", {
      name: `config-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "config.amazonaws.com",
          },
        }],
      }),
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
      ],
      tags: {
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    // Config bucket
    const configBucket = new aws.s3.Bucket("configBucket", {
      bucket: `config-bucket-${props.environmentSuffix}`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: this.kmsKey.keyId,
          },
        },
      },
      tags: {
        Name: `config-bucket-${props.environmentSuffix}`,
        Environment: props.environmentSuffix,
        DataClassification: "PCI-DSS",
        Owner: "SecurityTeam",
      },
    }, defaultResourceOptions);

    new aws.s3.BucketPublicAccessBlock("configBucketPublicAccessBlock", {
      bucket: configBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, defaultResourceOptions);

    // AWS Config Recorder
    const configRecorder = new aws.cfg.Recorder("configRecorder", {
      name: `config-recorder-${props.environmentSuffix}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    }, defaultResourceOptions);

    const configDeliveryChannel = new aws.cfg.DeliveryChannel("configDeliveryChannel", {
      name: `config-delivery-${props.environmentSuffix}`,
      s3BucketName: configBucket.bucket,
      dependsOn: [configRecorder],
    }, defaultResourceOptions);

    // AWS Config Rules
    const s3EncryptionRule = new aws.cfg.Rule("s3EncryptionRule", {
      name: `s3-encryption-rule-${props.environmentSuffix}`,
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
      },
      dependsOn: [configDeliveryChannel],
    }, defaultResourceOptions);

    const dynamoEncryptionRule = new aws.cfg.Rule("dynamoEncryptionRule", {
      name: `dynamo-encryption-rule-${props.environmentSuffix}`,
      source: {
        owner: "AWS",
        sourceIdentifier: "DYNAMODB_TABLE_ENCRYPTED_KMS",
      },
      dependsOn: [configDeliveryChannel],
    }, defaultResourceOptions);

    this.registerOutputs({
      vpcId: this.vpc.id,
      kmsKeyArn: this.kmsKey.arn,
      bucketName: this.bucket.bucket,
      lambdaArn: this.lambdaFunction.arn,
      auditTableName: this.auditTable.name,
    });
  }
}
```

## File: lib/lambda/index.ts

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { KMSClient, DecryptCommand, EncryptCommand } from "@aws-sdk/client-kms";

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const kmsClient = new KMSClient({});

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const bucketName = process.env.BUCKET_NAME!;
  const auditTable = process.env.AUDIT_TABLE!;
  const kmsKeyId = process.env.KMS_KEY_ID!;

  try {
    // Process S3 event
    for (const record of event.Records || []) {
      const s3Event = record.s3;
      const key = s3Event.object.key;

      console.log(`Processing file: ${key}`);

      // Get object from S3
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(getCommand);
      const data = await response.Body?.transformToString();

      // Log to audit table
      const timestamp = new Date().toISOString();
      const auditCommand = new PutItemCommand({
        TableName: auditTable,
        Item: {
          id: { S: `${timestamp}-${key}` },
          timestamp: { S: timestamp },
          action: { S: "FILE_PROCESSED" },
          fileName: { S: key },
          status: { S: "SUCCESS" },
        },
      });

      await dynamoClient.send(auditCommand);

      console.log(`Audit log created for: ${key}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Processing complete" }),
    };
  } catch (error) {
    console.error("Error processing:", error);

    // Log error to audit table
    const timestamp = new Date().toISOString();
    const auditCommand = new PutItemCommand({
      TableName: auditTable,
      Item: {
        id: { S: `${timestamp}-error` },
        timestamp: { S: timestamp },
        action: { S: "PROCESSING_ERROR" },
        error: { S: String(error) },
        status: { S: "FAILED" },
      },
    });

    await dynamoClient.send(auditCommand);

    throw error;
  }
};
```

## File: lib/lambda/package.json

```json
{
  "name": "data-processor",
  "version": "1.0.0",
  "description": "Lambda function for processing financial data",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-kms": "^3.400.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Install Lambda dependencies:
```bash
cd lib/lambda && npm install && cd ../..
```

3. Configure Pulumi:
```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set region us-east-1
pulumi config set aws:region us-east-1
```

4. Deploy:
```bash
pulumi up
```

5. Test the deployment:
```bash
# Upload a test file to S3
aws s3 cp test.txt s3://financial-data-<suffix>/test.txt

# Check audit logs
aws dynamodb scan --table-name audit-logs-<suffix>
```

6. Destroy resources:
```bash
pulumi destroy
```

## Security Features

- All data encrypted at rest with customer-managed KMS keys
- No public internet access - all communication via VPC endpoints
- Lambda runs in private subnets only
- Security groups with minimal access
- Audit logging to DynamoDB
- CloudWatch Logs encrypted with KMS
- AWS Config monitoring encryption compliance
- Point-in-time recovery enabled for DynamoDB
- S3 versioning enabled
- IAM roles with least-privilege permissions
