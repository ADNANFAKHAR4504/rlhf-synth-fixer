# Secure AWS Infrastructure with CDK and TypeScript

I'll create a comprehensive CDK TypeScript solution that implements secure, multi-region AWS infrastructure with encryption at rest and in transit, following IAM best practices.

## Project Structure

```
secure-aws-infrastructure/
├── bin/
│   └── tap.ts
├── lib/
│   ├── tap-stack.ts
│   └── constructs/
│       ├── s3-bucket.ts
│       ├── api-gateway.ts
│       ├── api-lambda.ts
│       ├── iam-role.ts
│       └── kms-key.ts
├── test/
│   ├── tap-stack.unit.test.ts
│   ├── s3-bucket.unit.test.ts
│   ├── api-gateway.unit.test.ts
│   ├── api-lambda.unit.test.ts
│   ├── iam-role.unit.test.ts
│   ├── kms-key.unit.test.
|   ├── tap-stack.int.test.ts
│   ├── s3-bucket.int.test.ts
│   ├── api-gateway.int.test.ts
│   ├── api-lambda.int.test.ts
│   ├── iam-role.int.test.ts
│   ├── kms-key.int.test.ts
```

## 1. Package Configuration

```json
{
  "name": "secure-aws-infrastructure",
  "version": "0.1.0",
  "bin": {
    "tap": "bin/tap.ts"
  },
  "devDependencies": {
    "@aws-cdk/assert": "^2.0.0",
    "@types/jest": "^27.0.0",
    "aws-cdk-lib": "^2.0.0",
    "constructs": "^10.0.0",
    "jest": "^27.0.0",
    "ts-jest": "^27.0.0",
    "typescript": "^4.5.0"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "lint": "eslint .",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
}
```

## 2. Constructs Code

### lib/constructs/s3-bucket.ts

```typescript
import { aws_iam as iam, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  encryptionKey: import('aws-cdk-lib').aws_kms.Key;
  bucketName?: string;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      bucketKeyEnabled: true,
      enforceSSL: true,
    });

    // Enforce KMS + correct key on PUT
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionHeader',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: { 's3:x-amz-server-side-encryption': 'aws:kms' },
        },
      })
    );

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnEncryptedOrWrongKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              props.encryptionKey.keyArn,
          },
        },
      })
    );
  }
}
```

### lib/constructs/api-gateway.ts

```typescript
import {
  aws_certificatemanager as acm,
  aws_apigateway as apigw,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiGatewayProps {
  restApiName: string;
  handler: import('aws-cdk-lib').aws_lambda.IFunction;
  customDomainName?: string;
  certificateArn?: string; // Must be in same region as stack
}

export class SecureApiGateway extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = new apigw.RestApi(this, 'Api', {
      restApiName: props.restApiName,
      endpointConfiguration: { types: [apigw.EndpointType.REGIONAL] },
    });

    const integration = new apigw.LambdaIntegration(props.handler, {
      proxy: true,
    });
    this.api.root.addMethod('GET', integration);
    this.api.root.addMethod('PUT', integration);

    if (props.customDomainName && props.certificateArn) {
      const cert = acm.Certificate.fromCertificateArn(
        this,
        'ImportedCert',
        props.certificateArn
      );
      const domain = new apigw.DomainName(this, 'CustomDomain', {
        domainName: props.customDomainName,
        certificate: cert,
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        endpointType: apigw.EndpointType.REGIONAL,
      });
      new apigw.BasePathMapping(this, 'BasePathMapping', {
        domainName: domain,
        restApi: this.api,
      });
    }
  }
}
```

### lib/constructs/api-lambda.ts

```typescript
import { Duration, aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiLambdaProps {
  role: import('aws-cdk-lib').aws_iam.Role;
  bucketName: string;
  code?: lambda.Code;
}

export class ApiLambda extends Construct {
  public readonly func: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    if (!props || !props.role) {
      throw new Error('ApiLambda: "role" prop is required');
    }
    if (
      props.bucketName === undefined ||
      props.bucketName === null ||
      props.bucketName === ''
    ) {
      throw new Error('ApiLambda: "bucketName" prop is required');
    }

    this.func = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: props.role,
      timeout: Duration.seconds(10),
      environment: { BUCKET_NAME: props.bucketName },
      code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
        const s3 = new S3Client({});
        const { BUCKET_NAME } = process.env;
        exports.handler = async (event) => {
          const method = (event.httpMethod || '').toUpperCase();
          const key = (event.queryStringParameters && event.queryStringParameters.key) || 'example.txt';
          if (method === 'PUT') {
            const body = event.body || 'hello';
            await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ServerSideEncryption: 'aws:kms' }));
            return { statusCode: 200, body: JSON.stringify({ ok: true, wrote: key }) };
          }
          if (method === 'GET') {
            const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
            const streamToString = (stream) => new Promise((resolve, reject) => {
              const chunks = [];
              stream.on('data', (c) => chunks.push(c));
              stream.on('error', reject);
              stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            });
            const body = await streamToString(res.Body);
            return { statusCode: 200, body };
          }
          return { statusCode: 405, body: 'Method Not Allowed' };
        };
      `),
    });
  }
}
```

### lib/constructs/iam-role.ts

```typescript
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiLambdaRoleProps {
  bucketArnForObjects: string; // e.g., bucket.arnForObjects('*')
  kmsKeyArn: string;
}

export class ApiLambdaRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ApiLambdaRoleProps) {
    super(scope, id);

    if (!props || !props.bucketArnForObjects) {
      throw new Error('ApiLambdaRole: "bucketArnForObjects" prop is required');
    }
    if (!props.kmsKeyArn) {
      throw new Error('ApiLambdaRole: "kmsKeyArn" prop is required');
    }

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege role for API Lambda',
    });

    // CloudWatch Logs
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Object-level S3 access, no ListBucket
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [props.bucketArnForObjects],
      })
    );

    // KMS limited to specific key
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey',
          'kms:DescribeKey',
        ],
        resources: [props.kmsKeyArn],
      })
    );
  }
}
```

### lib/constructs/kms-key.ts

```typescript
import { aws_kms as kms, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DataKmsKeyProps {
  alias?: string;
  description?: string;
  removalPolicy?: RemovalPolicy;
}

export class DataKmsKey extends Construct {
  public readonly key: kms.Key;
  public readonly description: string;
  public readonly alias?: string;
  public readonly removalPolicy: RemovalPolicy;
  public readonly enableKeyRotation: boolean = true;

  constructor(scope: Construct, id: string, props: DataKmsKeyProps = {}) {
    super(scope, id);

    this.description =
      props.description ?? 'CMK for encrypting S3 objects and data keys';
    this.alias = props.alias;
    this.removalPolicy = props.removalPolicy ?? RemovalPolicy.RETAIN;

    this.key = new kms.Key(this, 'Key', {
      enableKeyRotation: this.enableKeyRotation,
      alias: this.alias,
      description: this.description,
      removalPolicy: this.removalPolicy,
    });
  }
}
```

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';
import { SecureApiGateway } from './constructs/api-gateway';
import { ApiLambda } from './constructs/api-lambda';
import { ApiLambdaRole } from './constructs/iam-role';
import { DataKmsKey } from './constructs/kms-key';
import { SecureBucket } from './constructs/s3-bucket';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  customDomainName?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // KMS
    const key = new DataKmsKey(this, 'DataKmsKey', {
      alias: `alias/data-kms-key-${this.region}`,
      removalPolicy:
        this.node.tryGetContext('removalPolicy') === 'destroy'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
    }).key;

    // S3
    const bucket = new SecureBucket(this, 'DataBucket', { encryptionKey: key })
      .bucket;

    // IAM Role
    const role = new ApiLambdaRole(this, 'ApiLambdaRole', {
      bucketArnForObjects: bucket.arnForObjects('*'),
      kmsKeyArn: key.keyArn,
    }).role;

    // Lambda
    const lambda = new ApiLambda(this, 'ApiLambda', {
      role,
      bucketName: bucket.bucketName,
    }).func;

    // API Gateway
    new SecureApiGateway(this, 'SecureApi', {
      restApiName: `secure-api-${this.region}`,
      handler: lambda,
      customDomainName: props?.customDomainName,
      certificateArn: props?.certificateArn,
    });
  }
}
```

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

---
