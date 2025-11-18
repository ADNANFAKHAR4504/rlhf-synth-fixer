# Zero-Trust Security Configuration - Initial Model Response

This document contains the initial code generation for implementing a zero-trust security configuration for a data processing pipeline using Pulumi with TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Zero-Trust Security Configuration for Data Processing Pipeline
 * Implements defense-in-depth security controls with strict IAM, network segmentation,
 * and encryption at rest and in transit.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'prod').
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource for zero-trust security infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly lambdaRoleArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // Mandatory security tags
    const securityTags = {
      ...tags,
      Environment: environmentSuffix,
      DataClassification: 'confidential',
      Owner: 'security-team',
    };

    // Get available AZs
    const availableZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // 1. VPC with 3 private subnets (no internet gateway)
    const vpc = new aws.ec2.Vpc(`zero-trust-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...securityTags,
        Name: `zero-trust-vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    this.vpcId = vpc.id;

    // Create 3 private subnets across different AZs
    const privateSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`private-subnet-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: availableZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...securityTags,
          Name: `private-subnet-${i}-${environmentSuffix}`,
        },
      }, { parent: this });
      privateSubnets.push(subnet);
    }

    // 7. Security group for Lambda with HTTPS only
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for Lambda functions - HTTPS only',
      egress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'HTTPS to VPC endpoints',
      }],
      tags: {
        ...securityTags,
        Name: `lambda-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Security group for VPC endpoints
    const endpointSecurityGroup = new aws.ec2.SecurityGroup(`endpoint-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for VPC endpoints',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        securityGroups: [lambdaSecurityGroup.id],
        description: 'HTTPS from Lambda',
      }],
      tags: {
        ...securityTags,
        Name: `endpoint-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // 2. VPC Endpoints for S3, KMS, and CloudWatch Logs
    const s3Endpoint = new aws.ec2.VpcEndpoint(`s3-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${aws.config.region}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        ...securityTags,
        Name: `s3-endpoint-${environmentSuffix}`,
      },
    }, { parent: this });

    const kmsEndpoint = new aws.ec2.VpcEndpoint(`kms-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${aws.config.region}.kms`,
      vpcEndpointType: 'Interface',
      subnetIds: privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [endpointSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
        ...securityTags,
        Name: `kms-endpoint-${environmentSuffix}`,
      },
    }, { parent: this });

    const logsEndpoint = new aws.ec2.VpcEndpoint(`logs-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${aws.config.region}.logs`,
      vpcEndpointType: 'Interface',
      subnetIds: privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [endpointSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
        ...securityTags,
        Name: `logs-endpoint-${environmentSuffix}`,
      },
    }, { parent: this });

    // 3. KMS key with 90-day automatic rotation
    const kmsKey = new aws.kms.Key(`data-encryption-key-${environmentSuffix}`, {
      description: 'Customer-managed key for data encryption',
      enableKeyRotation: true,
      rotationPeriodInDays: 90,
      tags: {
        ...securityTags,
        Name: `data-encryption-key-${environmentSuffix}`,
      },
    }, { parent: this });

    this.kmsKeyId = kmsKey.id;

    const kmsKeyAlias = new aws.kms.Alias(`alias-data-key-${environmentSuffix}`, {
      name: `alias/data-encryption-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // 4. IAM role for Lambda with minimal permissions
    const lambdaRole = new aws.iam.Role(`lambda-execution-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: {
        ...securityTags,
        Name: `lambda-execution-role-${environmentSuffix}`,
      },
    }, { parent: this });

    this.lambdaRoleArn = lambdaRole.arn;

    // 8. IAM policy for KMS decrypt/encrypt permissions
    const kmsPolicy = new aws.iam.Policy(`lambda-kms-policy-${environmentSuffix}`, {
      description: 'Minimal KMS permissions for Lambda',
      policy: pulumi.all([kmsKey.arn]).apply(([keyArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:GenerateDataKey',
          ],
          Resource: keyArn,
        }],
      })),
      tags: {
        ...securityTags,
        Name: `lambda-kms-policy-${environmentSuffix}`,
      },
    }, { parent: this });

    // S3 read policy
    const s3ReadPolicy = new aws.iam.Policy(`lambda-s3-read-policy-${environmentSuffix}`, {
      description: 'Minimal S3 read permissions for Lambda',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:ListBucket',
          ],
          Resource: '*',
          Condition: {
            StringEquals: {
              'aws:ResourceTag/Environment': environmentSuffix,
            },
          },
        }],
      }),
      tags: {
        ...securityTags,
        Name: `lambda-s3-read-policy-${environmentSuffix}`,
      },
    }, { parent: this });

    // CloudWatch Logs write policy
    const logsPolicy = new aws.iam.Policy(`lambda-logs-policy-${environmentSuffix}`, {
      description: 'CloudWatch Logs write permissions for Lambda',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/*-${environmentSuffix}:*`,
        }],
      }),
      tags: {
        ...securityTags,
        Name: `lambda-logs-policy-${environmentSuffix}`,
      },
    }, { parent: this });

    // VPC execution policy
    const vpcPolicy = new aws.iam.Policy(`lambda-vpc-policy-${environmentSuffix}`, {
      description: 'VPC execution permissions for Lambda',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
          ],
          Resource: '*',
        }],
      }),
      tags: {
        ...securityTags,
        Name: `lambda-vpc-policy-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(`lambda-kms-attachment-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: kmsPolicy.arn,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-s3-attachment-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: s3ReadPolicy.arn,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-logs-attachment-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: logsPolicy.arn,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-vpc-attachment-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: vpcPolicy.arn,
    }, { parent: this });

    // 10. KMS key policy allowing Lambda role
    const kmsKeyPolicy = new aws.kms.KeyPolicy(`kms-key-policy-${environmentSuffix}`, {
      keyId: kmsKey.id,
      policy: pulumi.all([kmsKey.arn, lambdaRole.arn]).apply(([keyArn, roleArn]) => {
        const accountId = keyArn.split(':')[4];
        return JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow Lambda Role to use the key',
              Effect: 'Allow',
              Principal: {
                AWS: roleArn,
              },
              Action: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
          ],
        });
      }),
    }, { parent: this });

    // 5. S3 bucket with versioning and KMS encryption
    const dataBucket = new aws.s3.Bucket(`data-bucket-${environmentSuffix}`, {
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.id,
          },
        },
      },
      tags: {
        ...securityTags,
        Name: `data-bucket-${environmentSuffix}`,
      },
    }, { parent: this });

    this.bucketName = dataBucket.bucket;

    // Block public access
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `data-bucket-public-access-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 9. S3 bucket policy enforcing encryption in transit
    const bucketPolicy = new aws.s3.BucketPolicy(`data-bucket-policy-${environmentSuffix}`, {
      bucket: dataBucket.id,
      policy: pulumi.all([dataBucket.arn, lambdaRole.arn]).apply(([bucketArn, roleArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
          {
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              bucketArn,
              `${bucketArn}/*`,
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'AllowLambdaReadAccess',
            Effect: 'Allow',
            Principal: {
              AWS: roleArn,
            },
            Action: [
              's3:GetObject',
              's3:ListBucket',
            ],
            Resource: [
              bucketArn,
              `${bucketArn}/*`,
            ],
          },
        ],
      })),
    }, { parent: this, dependsOn: [bucketPublicAccessBlock] });

    // 6. CloudWatch Log group with KMS encryption
    const logGroup = new aws.cloudwatch.LogGroup(`lambda-logs-${environmentSuffix}`, {
      namePrefix: `/aws/lambda/data-processor-${environmentSuffix}`,
      kmsKeyId: kmsKey.arn,
      retentionInDays: 7,
      tags: {
        ...securityTags,
        Name: `lambda-logs-${environmentSuffix}`,
      },
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      bucketName: this.bucketName,
      kmsKeyId: this.kmsKeyId,
      lambdaRoleArn: this.lambdaRoleArn,
    });
  }
}
```

## File: lib/README.md

```markdown
# Zero-Trust Security Configuration

This infrastructure implements a zero-trust security architecture for a data processing pipeline using Pulumi with TypeScript.

## Architecture Overview

The infrastructure creates a locked-down AWS environment with defense-in-depth security controls:

- **VPC**: Isolated network with 3 private subnets across availability zones (no internet gateway)
- **VPC Endpoints**: Gateway and Interface endpoints for S3, KMS, and CloudWatch Logs
- **KMS Encryption**: Customer-managed key with 90-day automatic rotation
- **IAM**: Least-privilege role for Lambda with explicit permissions
- **S3**: Encrypted bucket with versioning and public access blocked
- **Security Groups**: Restrictive rules allowing only HTTPS (port 443)
- **CloudWatch Logs**: Encrypted logging with 7-day retention

## Security Features

### Network Security
- No internet gateway - all AWS service communication through VPC endpoints
- Private subnets only
- Security groups with explicit HTTPS-only rules
- No 0.0.0.0/0 CIDR blocks

### Encryption
- All data encrypted at rest using customer-managed KMS key
- All data encrypted in transit (HTTPS/TLS)
- KMS key rotation every 90 days
- S3 bucket policies enforce encryption in transit

### Access Control
- IAM role follows least-privilege principle
- No wildcard actions in IAM policies
- KMS key policies explicitly grant Lambda cryptographic operations
- S3 bucket policies enforce secure transport

### Compliance
- Mandatory security tags on all resources (Environment, DataClassification, Owner)
- CloudWatch Logs retention for audit trail
- Versioning enabled on S3 buckets
- Block all public access to S3

## Deployment

### Prerequisites
- Pulumi CLI 3.x installed
- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- TypeScript

### Environment Variables
- `ENVIRONMENT_SUFFIX`: Environment identifier (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')

### Deploy
```bash
npm install
pulumi stack init <stack-name>
pulumi up
```

### Destroy
```bash
pulumi destroy
```

## Resource Naming

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Example with ENVIRONMENT_SUFFIX=dev:
- VPC: `zero-trust-vpc-dev`
- S3 Bucket: `data-bucket-dev`
- KMS Key: `data-encryption-key-dev`
- IAM Role: `lambda-execution-role-dev`

## Outputs

- `vpcId`: VPC identifier
- `bucketName`: S3 bucket name
- `kmsKeyId`: KMS key identifier
- `lambdaRoleArn`: Lambda execution role ARN

## Security Compliance

This infrastructure meets the following security requirements:
- Zero-trust architecture with defense-in-depth
- Encryption at rest and in transit
- Network isolation and segmentation
- Least-privilege access control
- Audit logging and monitoring
- No public internet exposure
```
