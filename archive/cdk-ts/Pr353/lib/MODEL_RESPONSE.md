To create a reusable and configurable AWS CDK application in TypeScript for a multi-region web application infrastructure, follow the steps below. This example includes constructs for VPC, S3, RDS, and EC2, and demonstrates how to manage environment configurations and tagging.

### Step 1: Initialize CDK Project

```bash
mkdir cdk-multi-region-webapp
cd cdk-multi-region-webapp
cdk init app --language typescript
```

### Step 2: Install Required Dependencies

```bash
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-s3 @aws-cdk/aws-rds @aws-cdk/aws-ecs
```

### Step 3: Define Reusable Constructs

Create a `lib/web-app-stack.ts` file with reusable constructs for the web application infrastructure.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  envConfig: {
    vpcCidr: string;
    instanceType: ec2.InstanceType;
    databaseInstanceType: ec2.InstanceType;
  };
}

export class WebAppStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bucket: s3.Bucket;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: props.envConfig.vpcCidr,
      maxAzs: 3,
    });

    // S3 Bucket
    this.bucket = new s3.Bucket(this, 'Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // RDS Database
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: props.envConfig.databaseInstanceType,
      vpc: this.vpc,
      multiAz: false,
      allocatedStorage: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deleteAutomatedBackups: true,
    });

    // EC2 Instance
    new ec2.Instance(this, 'Instance', {
      vpc: this.vpc,
      instanceType: props.envConfig.instanceType,
      machineImage: ec2.MachineImage.latestAmazonLinux(),
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', this.node.tryGetContext('envName'));
    cdk.Tags.of(this).add('Project', 'WebApp');
  }
}
```

### Step 4: Define Environment Configurations

Update `cdk.context.json` to manage environment-specific configurations.

```json
{
  "dev": {
    "envName": "dev",
    "config": {
      "vpcCidr": "10.0.0.0/16",
      "instanceType": "t2.micro",
      "databaseInstanceType": "t3.micro"
    }
  },
  "prod": {
    "envName": "prod",
    "config": {
      "vpcCidr": "10.1.0.0/16",
      "instanceType": "m5.large",
      "databaseInstanceType": "db.m5.large"
    }
  }
}
```

### Step 5: Define the Main CDK App

Update `bin/cdk-multi-region-webapp.ts` to deploy the stacks in multiple regions.

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebAppStack } from '../lib/web-app-stack';

const app = new cdk.App();

// Define environments
const environments = ['dev', 'prod'];
const regions = ['us-west-1', 'us-east-1'];

environments.forEach((env) => {
  const config = app.node.tryGetContext(env).config;

  regions.forEach((region) => {
    const envConfig = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    };

    new WebAppStack(app, `WebAppStack-${env}-${region}`, {
      env: envConfig,
      envConfig: config,
      stackName: `WebAppStack-${env}-${region}`,
    });
  });
});

app.synth();
```

### Step 6: Deploy the CDK Application

```bash
cdk bootstrap aws://ACCOUNT_ID/us-west-1
cdk bootstrap aws://ACCOUNT_ID/us-east-1
cdk deploy --all
```

### Explanation

- **Reusable Constructs**: The `WebAppStack` class encapsulates the infrastructure components (VPC, S3, RDS, EC2) and can be reused across different environments and regions.
- **Environment Configuration**: The `cdk.context.json` file holds environment-specific configurations, which are passed to the stack as properties.
- **Comprehensive Tagging**: Tags are applied to all resources using `cdk.Tags.of(this).add(...)`.
- **Cross-Stack Dependencies**: The example demonstrates how to reference resources within the same stack, but you can extend this to cross-stack references using `stack.exportValue` and `Fn.importValue`.
- **Logical Naming**: Resources are named logically with environment and region suffixes to avoid conflicts.

This setup ensures a consistent and reusable infrastructure across multiple AWS regions and environments, adhering to best practices for CDK applications.