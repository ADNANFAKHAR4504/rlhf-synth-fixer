import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import {
  AssetType,
  TerraformAsset,
  TerraformOutput,
  TerraformStack,
} from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Serverless Data Processing Stack with fully parameterized VPC configuration.
 *
 * Production environments (prod, production, prod-*) require explicit VPC configuration
 * via vpcId and subnetIds props. Development environments can use default VPC fallback.
 */

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    props?: {
      environmentSuffix?: string;
      projectPrefix?: string;
      stateBucket?: string;
      stateBucketRegion?: string;
      awsRegion?: string;
      vpcId?: string;
      subnetIds?: string[];
      availabilityZones?: string[];
      createVpc?: boolean;
      vpcCidr?: string;
      lambdaConfig?: {
        runtime?: string;
        timeout?: number;
        memorySize?: number;
        architecture?: string;
      };
      defaultTags?: { tags: Record<string, string> };
    }
  ) {
    super(scope, id);

    const awsRegion = props?.awsRegion || 'us-east-1';

    // AWS Provider configuration
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: props?.defaultTags ? [props.defaultTags] : undefined,
    });

    // Data sources for account ID and region
    const current = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    // Get environment suffix from props, defaulting to 'dev'
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Project prefix for consistent naming - deterministic for redeployments
    // Add timestamp suffix to avoid resource conflicts
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
    const projectPrefix =
      props?.projectPrefix || `projectXYZ-${environmentSuffix}-${timestamp}`;

    // VPC Configuration - fully parameterized for production
    let vpcId: string;
    let subnetIds: string[];

    // Check for production environment patterns
    const isProductionEnvironment =
      environmentSuffix === 'prod' ||
      environmentSuffix === 'production' ||
      environmentSuffix.startsWith('prod-');

    if (props?.vpcId && props?.subnetIds) {
      // Explicit VPC mode: Use provided VPC and subnets
      vpcId = props.vpcId;
      subnetIds = props.subnetIds;

      // Validate the provided configuration
      if (props.subnetIds.length < 2) {
        throw new Error(
          'Deployment requires at least 2 subnets for high availability'
        );
      }

      // Validate subnet count matches availability zones if provided
      if (
        props.availabilityZones &&
        props.subnetIds.length !== props.availabilityZones.length
      ) {
        throw new Error(
          'Number of subnets must match number of availability zones'
        );
      }
    } else if (props?.createVpc) {
      // Advanced mode: Create a new VPC with the specified configuration
      throw new Error(
        'VPC creation mode not implemented in this version. Please provide vpcId and subnetIds.'
      );
    } else if (isProductionEnvironment) {
      // Production environments must specify explicit VPC configuration
      throw new Error(
        `Production environment '${environmentSuffix}' requires explicit VPC configuration. ` +
          'Please provide vpcId and subnetIds in props for production deployments. ' +
          'Using default VPC is not allowed in production for security and compliance reasons.'
      );
    } else {
      // Development/testing mode: Use default VPC with warning
      console.warn(
        `⚠️  Using default VPC fallback for development environment '${environmentSuffix}'. ` +
          'For production deployments, specify vpcId and subnetIds in props.'
      );

      const defaultVpc = new DataAwsVpc(this, 'default-vpc', {
        default: true,
      });
      vpcId = defaultVpc.id;

      // Get subnets for the default VPC
      const vpcSubnets = new DataAwsSubnets(this, 'vpc-subnets', {
        filter: [
          {
            name: 'vpc-id',
            values: [vpcId],
          },
          {
            name: 'state',
            values: ['available'],
          },
        ],
      });
      subnetIds = vpcSubnets.ids;

      // Validate that we have sufficient subnets even in development
      if (subnetIds.length === 0) {
        throw new Error(
          'No available subnets found in the default VPC. ' +
            'Please check your VPC configuration or provide explicit vpcId and subnetIds.'
        );
      }
    }

    // Create dedicated security group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(
      this,
      'lambda-security-group',
      {
        name: `${projectPrefix}-lambda-sg`,
        description: 'Security group for Lambda data processing function',
        vpcId: vpcId,
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for S3/KMS API calls',
          },
        ],
        tags: {
          Name: `${projectPrefix}-lambda-sg`,
          Project: projectPrefix,
          Environment: environmentSuffix,
        },
      }
    );

    // KMS Key for S3 encryption at rest
    const s3KmsKey = new KmsKey(this, 's3-kms-key', {
      description: `${projectPrefix} S3 encryption key`,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable Key Management',
            Effect: 'Allow',
            Principal: {
              AWS: [
                `arn:aws:iam::${current.accountId}:root`,
                // Restrict to specific roles if needed
              ],
            },
            Action: [
              'kms:Create*',
              'kms:Describe*',
              'kms:Enable*',
              'kms:List*',
              'kms:Put*',
              'kms:Update*',
              'kms:Revoke*',
              'kms:Disable*',
              'kms:Get*',
              'kms:Delete*',
              'kms:TagResource',
              'kms:UntagResource',
              'kms:ScheduleKeyDeletion',
              'kms:CancelKeyDeletion',
            ],
            Resource: '*',
          },
          {
            Sid: 'Allow S3 Service Access',
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': `s3.${awsRegion}.amazonaws.com`,
              },
            },
          },
          {
            Sid: 'Allow Lambda Service Access',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: ['kms:Decrypt'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': `s3.${awsRegion}.amazonaws.com`,
              },
            },
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-s3-kms-key`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // KMS Key Alias for easier reference
    new KmsAlias(this, 's3-kms-key-alias', {
      name: `alias/${projectPrefix}-s3-encryption`,
      targetKeyId: s3KmsKey.keyId,
    });

    // S3 Bucket for data processing
    const dataBucket = new S3Bucket(this, 'data-bucket', {
      bucket: `${projectPrefix.toLowerCase()}-data-processing-${current.accountId}`,
      tags: {
        Name: `${projectPrefix}-data-processing-bucket`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket Server-Side Encryption Configuration
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'data-bucket-encryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: s3KmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Public Access Block - security best practice
    new S3BucketPublicAccessBlock(this, 'data-bucket-pab', {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Policy to enforce HTTPS and encryption
    new S3BucketPolicy(this, 'data-bucket-policy', {
      bucket: dataBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [dataBucket.arn, `${dataBucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${dataBucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
        ],
      }),
    });

    // Lambda configuration with production defaults
    const lambdaConfig = {
      runtime: props?.lambdaConfig?.runtime || 'nodejs20.x',
      timeout: props?.lambdaConfig?.timeout || 300,
      memorySize: props?.lambdaConfig?.memorySize || 512,
      architecture: props?.lambdaConfig?.architecture || 'x86_64',
    };

    // Production-grade Lambda asset management with versioning and optimization
    const lambdaAssetPath = path.resolve(__dirname, 'lambda');
    const packageJsonPath = path.join(lambdaAssetPath, 'package.json');

    // Validate Lambda source directory exists
    if (!fs.existsSync(lambdaAssetPath)) {
      throw new Error(
        `Lambda source directory not found: ${lambdaAssetPath}. Please ensure lambda code exists.`
      );
    }

    // Validate required source files exist
    const requiredSourceFiles = ['index.js', 'package.json'];
    for (const file of requiredSourceFiles) {
      const filePath = path.join(lambdaAssetPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required Lambda source file not found: ${filePath}`);
      }
    }

    // Generate version hash for asset management
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const sourceFiles = fs
      .readdirSync(lambdaAssetPath)
      .filter(file => file.endsWith('.js') || file.endsWith('.json'));

    // Create content hash for versioning
    const hasher = crypto.createHash('sha256');
    hasher.update(JSON.stringify(packageJson));
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(path.join(lambdaAssetPath, file));
      hasher.update(content);
    });
    const sourceHash = hasher.digest('hex');
    const assetVersion = sourceHash.substring(0, 12);

    // Production asset optimization configuration
    const assetConfig = {
      version: assetVersion,
      buildTimestamp: new Date().toISOString(),
      nodeVersion: packageJson.engines?.node || '>=18.0.0',
      dependencies: Object.keys(packageJson.dependencies || {}),
      buildOptimizations: {
        minify: isProductionEnvironment,
        stripDevDependencies: true,
        enableSourceMaps: !isProductionEnvironment,
        compressionLevel: isProductionEnvironment ? 9 : 6,
      },
    };

    // Create build metadata for production tracking
    const buildMetadata = {
      assetVersion,
      buildTimestamp: assetConfig.buildTimestamp,
      sourceHash,
      nodeRuntime: lambdaConfig.runtime,
      environment: environmentSuffix,
      buildConfig: assetConfig.buildOptimizations,
    };

    // Enhanced asset validation with dependency analysis
    console.log(
      `🏗️  Building Lambda asset v${assetVersion} for ${environmentSuffix} environment`
    );

    if (isProductionEnvironment) {
      // Production-specific validations
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      if (devDependencies.length > 0) {
        console.warn(
          `⚠️  Production build includes ${devDependencies.length} dev dependencies - will be stripped`
        );
      }

      // Validate security-sensitive dependencies
      const sensitivePackages = ['lodash', 'request', 'debug'];
      const usedSensitivePackages = assetConfig.dependencies.filter(dep =>
        sensitivePackages.some(sensitive => dep.includes(sensitive))
      );

      if (usedSensitivePackages.length > 0) {
        console.warn(
          `⚠️  Production build uses potentially sensitive packages: ${usedSensitivePackages.join(', ')}`
        );
      }
    }

    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: lambdaAssetPath,
      type: AssetType.ARCHIVE,
    });

    // IAM Role for Lambda execution with least privilege
    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-lambda-execution-role`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // Attach Lambda VPC execution policy (includes basic execution)
    new IamRolePolicyAttachment(this, 'lambda-vpc-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Custom IAM Policy for S3 and KMS access (principle of least privilege)
    const lambdaS3KmsPolicy = new IamPolicy(this, 'lambda-s3-kms-policy', {
      description: 'Policy for Lambda to access S3 bucket and KMS key',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:GetObjectVersion'],
            Resource: `${dataBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: s3KmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:log-group:/aws/lambda/${projectPrefix}-*`,
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-lambda-s3-kms-policy`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, 'lambda-s3-kms-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaS3KmsPolicy.arn,
    });

    // Lambda function for data processing
    const dataProcessorLambda = new LambdaFunction(
      this,
      'data-processor-lambda',
      {
        functionName: `${projectPrefix}-data-processor`,
        filename: lambdaAsset.path,
        sourceCodeHash: lambdaAsset.assetHash,
        handler: 'index.handler',
        runtime: lambdaConfig.runtime,
        role: lambdaRole.arn,
        timeout: lambdaConfig.timeout,
        memorySize: lambdaConfig.memorySize,
        architectures: [lambdaConfig.architecture],
        publish: isProductionEnvironment, // Enable versioning for production environments
        vpcConfig: {
          subnetIds: subnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            BUCKET_NAME: dataBucket.bucket,
            KMS_KEY_ID: s3KmsKey.keyId,
            PROJECT_PREFIX: projectPrefix,
            ASSET_VERSION: assetVersion,
            BUILD_TIMESTAMP: buildMetadata.buildTimestamp,
            NODE_ENV: isProductionEnvironment ? 'production' : 'development',
          },
        },
        tags: {
          Name: `${projectPrefix}-data-processor`,
          Project: projectPrefix,
          Environment: environmentSuffix,
          AssetVersion: assetVersion,
          BuildTimestamp: buildMetadata.buildTimestamp,
        },
      }
    );

    // Lambda permission to allow S3 to invoke the function
    new LambdaPermission(this, 's3-lambda-permission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: dataProcessorLambda.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: dataBucket.arn,
    });

    // S3 Bucket Notification to trigger Lambda on object creation
    // Must depend on the Lambda permission to avoid validation errors
    const bucketNotification = new S3BucketNotification(
      this,
      'bucket-notification',
      {
        bucket: dataBucket.id,
        lambdaFunction: [
          {
            lambdaFunctionArn: dataProcessorLambda.arn,
            events: ['s3:ObjectCreated:*'],
            filterPrefix: 'input/',
            filterSuffix: '.json',
          },
        ],
      }
    );

    // Ensure the Lambda permission is created before the bucket notification
    bucketNotification.addOverride('depends_on', [
      'aws_lambda_permission.s3-lambda-permission',
    ]);

    // Terraform Outputs
    new TerraformOutput(this, 'bucket-name', {
      value: dataBucket.bucket,
      description: 'Name of the S3 bucket for data processing',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: dataProcessorLambda.functionName,
      description: 'Name of the Lambda function for data processing',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID used for S3 encryption',
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: lambdaRole.arn,
      description: 'ARN of the Lambda execution role',
    });

    new TerraformOutput(this, 'lambda-asset-version', {
      value: assetVersion,
      description: 'Version hash of the Lambda asset for tracking deployments',
    });

    new TerraformOutput(this, 'lambda-build-metadata', {
      value: JSON.stringify(buildMetadata),
      description: 'Complete build metadata for production deployment tracking',
    });
  }
}
