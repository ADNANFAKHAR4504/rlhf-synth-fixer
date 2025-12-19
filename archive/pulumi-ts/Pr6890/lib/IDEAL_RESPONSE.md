# Multi-Environment Infrastructure Solution

This solution implements a complete multi-environment infrastructure platform using Pulumi with TypeScript. It creates consistent infrastructure across dev, staging, and production environments with proper configuration management and reusable components.

## Architecture Overview

The infrastructure includes:
- Custom VPC component with public/private subnets across 2 AZs
- RDS PostgreSQL instances with environment-specific sizing
- S3 buckets with versioning and lifecycle policies
- Lambda functions with VPC integration
- API Gateway REST APIs
- CloudWatch monitoring and alarms
- IAM roles following least-privilege principles

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration interface for environment-specific settings
interface EnvironmentConfig {
  environment: string;
  vpcCidr: string;
  rdsInstanceClass: string;
  lambdaMemory: number;
  lambdaTimeout: number;
  s3RetentionDays: number;
  logRetentionDays: number;
  rdsAlarmThreshold: number;
  multiAz: boolean;
}

// Custom ComponentResource for VPC infrastructure
class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly internetGateway: aws.ec2.InternetGateway;

  constructor(name: string, args: {
    cidrBlock: string;
    environmentSuffix: string;
    tags: { [key: string]: string };
  }, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:VpcComponent", name, {}, opts);

    const defaultOpts = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${args.environmentSuffix}`, {
      cidrBlock: args.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, defaultOpts);

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: "available",
    });

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`igw-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, defaultOpts);

    // Create public subnets (2 AZs)
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`public-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: pulumi.interpolate`${args.cidrBlock.split('/')[0].split('.').slice(0, 2).join('.')}.${i * 2}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i}-${args.environmentSuffix}`,
          Type: "public",
          ...args.tags,
        },
      }, defaultOpts);
      this.publicSubnets.push(subnet);
    }

    // Create private subnets (2 AZs)
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`private-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: pulumi.interpolate`${args.cidrBlock.split('/')[0].split('.').slice(0, 2).join('.')}.${i * 2 + 1}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        tags: {
          Name: `private-subnet-${i}-${args.environmentSuffix}`,
          Type: "private",
          ...args.tags,
        },
      }, defaultOpts);
      this.privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((subnet, i) =>
      new aws.ec2.Eip(`nat-eip-${i}-${args.environmentSuffix}`, {
        domain: "vpc",
        tags: {
          Name: `nat-eip-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, defaultOpts)
    );

    // Create NAT Gateways in public subnets
    this.natGateways = this.publicSubnets.map((subnet, i) =>
      new aws.ec2.NatGateway(`nat-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        allocationId: eips[i].id,
        tags: {
          Name: `nat-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, defaultOpts)
    );

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `public-rt-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, defaultOpts);

    new aws.ec2.Route(`public-route-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    }, defaultOpts);

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, defaultOpts);
    });

    // Create private route tables (one per AZ)
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${i}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, defaultOpts);

      new aws.ec2.Route(`private-route-${i}-${args.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[i].id,
      }, defaultOpts);

      new aws.ec2.RouteTableAssociation(`private-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, defaultOpts);
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}

// Configuration validation function
function validateConfig(config: EnvironmentConfig): void {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    "environment",
    "vpcCidr",
    "rdsInstanceClass",
    "lambdaMemory",
    "lambdaTimeout",
    "s3RetentionDays",
    "logRetentionDays",
    "rdsAlarmThreshold",
  ];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null || config[field] === "") {
      throw new Error(`Missing required configuration value: ${field}`);
    }
  }

  // Validate CIDR format
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(config.vpcCidr)) {
    throw new Error(`Invalid CIDR block format: ${config.vpcCidr}`);
  }
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:TapStack", name, {}, opts);

    const config = new pulumi.Config();
    const environmentSuffix = config.require("environmentSuffix");

    // Load environment-specific configuration
    const envConfig: EnvironmentConfig = {
      environment: config.require("environment"),
      vpcCidr: config.require("vpcCidr"),
      rdsInstanceClass: config.require("rdsInstanceClass"),
      lambdaMemory: config.requireNumber("lambdaMemory"),
      lambdaTimeout: config.requireNumber("lambdaTimeout"),
      s3RetentionDays: config.requireNumber("s3RetentionDays"),
      logRetentionDays: config.requireNumber("logRetentionDays"),
      rdsAlarmThreshold: config.requireNumber("rdsAlarmThreshold"),
      multiAz: config.requireBoolean("multiAz"),
    };

    // Validate configuration
    validateConfig(envConfig);

    const defaultOpts = { parent: this };
    const region = aws.getRegion();

    // Common tags for all resources
    const commonTags = {
      Environment: envConfig.environment,
      ManagedBy: "Pulumi",
      CostCenter: "Engineering",
    };

    // Create VPC using custom component
    const vpcComponent = new VpcComponent(`vpc-component-${environmentSuffix}`, {
      cidrBlock: envConfig.vpcCidr,
      environmentSuffix: environmentSuffix,
      tags: commonTags,
    }, defaultOpts);

    this.vpcId = vpcComponent.vpc.id;

    // Security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${environmentSuffix}`, {
      vpcId: vpcComponent.vpc.id,
      description: "Security group for RDS PostgreSQL",
      ingress: [{
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: [envConfig.vpcCidr],
        description: "PostgreSQL access from VPC",
      }],
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound traffic",
      }],
      tags: {
        Name: `rds-sg-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${environmentSuffix}`, {
      vpcId: vpcComponent.vpc.id,
      description: "Security group for Lambda functions",
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound traffic",
      }],
      tags: {
        Name: `lambda-sg-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // RDS subnet group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(`rds-subnet-group-${environmentSuffix}`, {
      subnetIds: vpcComponent.privateSubnets.map(s => s.id),
      tags: {
        Name: `rds-subnet-group-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // RDS PostgreSQL instance
    const rdsInstance = new aws.rds.Instance(`rds-${environmentSuffix}`, {
      identifier: `rds-${environmentSuffix}`,
      engine: "postgres",
      engineVersion: "15.4",
      instanceClass: envConfig.rdsInstanceClass,
      allocatedStorage: 20,
      storageType: "gp3",
      storageEncrypted: true,
      dbSubnetGroupName: rdsSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: envConfig.multiAz,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "mon:04:00-mon:05:00",
      skipFinalSnapshot: true,
      username: "dbadmin",
      password: config.requireSecret("dbPassword"),
      tags: {
        Name: `rds-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    this.rdsEndpoint = rdsInstance.endpoint;

    // CloudWatch alarm for RDS CPU utilization
    new aws.cloudwatch.MetricAlarm(`rds-cpu-alarm-${environmentSuffix}`, {
      name: `rds-cpu-alarm-${environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: 300,
      statistic: "Average",
      threshold: envConfig.rdsAlarmThreshold,
      dimensions: {
        DBInstanceIdentifier: rdsInstance.identifier,
      },
      alarmDescription: `RDS CPU utilization exceeds ${envConfig.rdsAlarmThreshold}%`,
      tags: commonTags,
    }, defaultOpts);

    // S3 bucket for application data
    const bucket = new aws.s3.Bucket(`app-data-${environmentSuffix}`, {
      bucket: `app-data-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        id: "cleanup-old-versions",
        noncurrentVersionExpiration: {
          days: envConfig.s3RetentionDays,
        },
      }],
      tags: {
        Name: `app-data-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    this.bucketName = bucket.bucket;

    // IAM role for Lambda execution
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
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
        Name: `lambda-role-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // Attach VPC execution policy to Lambda role
    new aws.iam.RolePolicyAttachment(`lambda-vpc-policy-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
    }, defaultOpts);

    // Lambda policy for S3 and CloudWatch
    const lambdaPolicy = new aws.iam.Policy(`lambda-policy-${environmentSuffix}`, {
      policy: pulumi.all([bucket.arn]).apply(([bucketArn]) => JSON.stringify({
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
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "arn:aws:logs:*:*:*",
          },
        ],
      })),
      tags: commonTags,
    }, defaultOpts);

    new aws.iam.RolePolicyAttachment(`lambda-custom-policy-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    }, defaultOpts);

    // CloudWatch log group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(`lambda-logs-${environmentSuffix}`, {
      name: `/aws/lambda/data-processor-${environmentSuffix}`,
      retentionInDays: envConfig.logRetentionDays,
      tags: {
        Name: `lambda-logs-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // Lambda function for data processing
    const lambdaFunction = new aws.lambda.Function(`data-processor-${environmentSuffix}`, {
      name: `data-processor-${environmentSuffix}`,
      runtime: aws.lambda.Runtime.NodeJS20dX,
      handler: "index.handler",
      role: lambdaRole.arn,
      code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processed successfully',
      environment: '${envConfig.environment}',
      timestamp: new Date().toISOString(),
    }),
  };
};
        `),
      }),
      memorySize: envConfig.lambdaMemory,
      timeout: envConfig.lambdaTimeout,
      vpcConfig: {
        subnetIds: vpcComponent.privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      environment: {
        variables: {
          ENVIRONMENT: envConfig.environment,
          RDS_ENDPOINT: rdsInstance.endpoint,
          S3_BUCKET: bucket.bucket,
        },
      },
      tags: {
        Name: `data-processor-${environmentSuffix}`,
        ...commonTags,
      },
    }, { parent: this, dependsOn: [lambdaLogGroup] });

    this.lambdaArn = lambdaFunction.arn;

    // IAM role for API Gateway
    const apiGatewayRole = new aws.iam.Role(`api-gateway-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "apigateway.amazonaws.com",
          },
        }],
      }),
      tags: {
        Name: `api-gateway-role-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // API Gateway policy for Lambda invocation
    const apiGatewayPolicy = new aws.iam.Policy(`api-gateway-policy-${environmentSuffix}`, {
      policy: pulumi.all([lambdaFunction.arn]).apply(([lambdaArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: "lambda:InvokeFunction",
          Resource: lambdaArn,
        }],
      })),
      tags: commonTags,
    }, defaultOpts);

    new aws.iam.RolePolicyAttachment(`api-gateway-policy-attachment-${environmentSuffix}`, {
      role: apiGatewayRole.name,
      policyArn: apiGatewayPolicy.arn,
    }, defaultOpts);

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(`api-${environmentSuffix}`, {
      name: `api-${environmentSuffix}`,
      description: `API Gateway for ${envConfig.environment} environment`,
      tags: {
        Name: `api-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    // API Gateway resource
    const apiResource = new aws.apigateway.Resource(`api-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: "process",
    }, defaultOpts);

    // API Gateway method
    const apiMethod = new aws.apigateway.Method(`api-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: apiResource.id,
      httpMethod: "POST",
      authorization: "AWS_IAM",
    }, defaultOpts);

    // API Gateway integration
    const apiIntegration = new aws.apigateway.Integration(`api-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: apiResource.id,
      httpMethod: apiMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
      credentials: apiGatewayRole.arn,
    }, defaultOpts);

    // Lambda permission for API Gateway
    new aws.lambda.Permission(`api-lambda-permission-${environmentSuffix}`, {
      action: "lambda:InvokeFunction",
      function: lambdaFunction.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, defaultOpts);

    // API Gateway deployment
    const apiDeployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
      restApi: api.id,
      stageName: envConfig.environment,
    }, { parent: this, dependsOn: [apiIntegration] });

    // CloudWatch log group for API Gateway
    new aws.cloudwatch.LogGroup(`api-logs-${environmentSuffix}`, {
      name: `/aws/apigateway/${api.name}`,
      retentionInDays: envConfig.logRetentionDays,
      tags: {
        Name: `api-logs-${environmentSuffix}`,
        ...commonTags,
      },
    }, defaultOpts);

    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${region.then(r => r.name)}.amazonaws.com/${apiDeployment.stageName}`;

    // Export stack outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      bucketName: this.bucketName,
      lambdaArn: this.lambdaArn,
      apiUrl: this.apiUrl,
    });
  }
}
```

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "./tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack(`tap-stack-${environmentSuffix}`);

export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.rdsEndpoint;
export const bucketName = stack.bucketName;
export const lambdaArn = stack.lambdaArn;
export const apiUrl = stack.apiUrl;
```

## File: Pulumi.dev.yaml

```yaml
config:
  tap-stack:environment: dev
  tap-stack:environmentSuffix: dev-001
  tap-stack:vpcCidr: 10.0.0.0/16
  tap-stack:rdsInstanceClass: db.t3.micro
  tap-stack:lambdaMemory: 128
  tap-stack:lambdaTimeout: 30
  tap-stack:s3RetentionDays: 7
  tap-stack:logRetentionDays: 7
  tap-stack:rdsAlarmThreshold: 80
  tap-stack:multiAz: false
  tap-stack:dbPassword:
    secure: your-encrypted-password-here
```

## File: Pulumi.staging.yaml

```yaml
config:
  tap-stack:environment: staging
  tap-stack:environmentSuffix: staging-001
  tap-stack:vpcCidr: 10.1.0.0/16
  tap-stack:rdsInstanceClass: db.t3.small
  tap-stack:lambdaMemory: 256
  tap-stack:lambdaTimeout: 60
  tap-stack:s3RetentionDays: 30
  tap-stack:logRetentionDays: 14
  tap-stack:rdsAlarmThreshold: 70
  tap-stack:multiAz: true
  tap-stack:dbPassword:
    secure: your-encrypted-password-here
```

## File: Pulumi.prod.yaml

```yaml
config:
  tap-stack:environment: prod
  tap-stack:environmentSuffix: prod-001
  tap-stack:vpcCidr: 10.2.0.0/16
  tap-stack:rdsInstanceClass: db.t3.medium
  tap-stack:lambdaMemory: 512
  tap-stack:lambdaTimeout: 120
  tap-stack:s3RetentionDays: 90
  tap-stack:logRetentionDays: 30
  tap-stack:rdsAlarmThreshold: 75
  tap-stack:multiAz: true
  tap-stack:dbPassword:
    secure: your-encrypted-password-here
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure

This Pulumi TypeScript project deploys consistent infrastructure across dev, staging, and production environments.

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Architecture

- **VPC**: Custom component with public/private subnets across 2 AZs
- **RDS**: PostgreSQL instances with environment-specific sizing
- **S3**: Buckets with versioning and lifecycle policies
- **Lambda**: Data processing functions with VPC integration
- **API Gateway**: REST APIs with IAM authorization
- **CloudWatch**: Monitoring, logging, and alarms

## Environment Configuration

Each environment has specific configuration:

### Dev
- VPC: 10.0.0.0/16
- RDS: t3.micro
- Lambda: 128MB memory, 30s timeout
- S3 retention: 7 days
- Multi-AZ: false

### Staging
- VPC: 10.1.0.0/16
- RDS: t3.small
- Lambda: 256MB memory, 60s timeout
- S3 retention: 30 days
- Multi-AZ: true

### Prod
- VPC: 10.2.0.0/16
- RDS: t3.medium
- Lambda: 512MB memory, 120s timeout
- S3 retention: 90 days
- Multi-AZ: true

## Deployment

### Initial Setup

```bash
# Install dependencies
npm install

# Set database password for environment
pulumi config set --secret tap-stack:dbPassword YOUR_SECURE_PASSWORD --stack dev
```

### Deploy to Dev

```bash
pulumi stack select dev
pulumi up
```

### Deploy to Staging

```bash
pulumi stack select staging
pulumi up
```

### Deploy to Production

```bash
pulumi stack select prod
pulumi up
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Stack Outputs

Each stack exports:
- `vpcId`: VPC identifier
- `rdsEndpoint`: RDS connection endpoint
- `bucketName`: S3 bucket name
- `lambdaArn`: Lambda function ARN
- `apiUrl`: API Gateway endpoint URL

## Cross-Stack References

Use Pulumi stack references to share outputs between environments:

```typescript
import * as pulumi from "@pulumi/pulumi";

const devStack = new pulumi.StackReference("organization/project/dev");
const devVpcId = devStack.getOutput("vpcId");
```

## Cleanup

```bash
# Destroy environment
pulumi destroy

# Remove stack
pulumi stack rm <stack-name>
```

## Security Considerations

- All resources use encryption at rest
- IAM roles follow least-privilege principle
- RDS instances in private subnets
- Lambda functions use VPC integration
- API Gateway uses IAM authorization

## Cost Optimization

- Dev uses t3.micro instances and lower retention
- Serverless architecture minimizes idle costs
- NAT gateways can be replaced with VPC endpoints for further savings
- Multi-AZ disabled in dev to reduce costs

## Troubleshooting

### RDS Connection Issues
- Verify security group rules
- Check Lambda is in correct VPC subnets
- Validate RDS endpoint in environment variables

### Lambda Timeouts
- Increase timeout in stack configuration
- Check VPC NAT gateway configuration
- Review CloudWatch logs for details

### API Gateway Errors
- Verify IAM role permissions
- Check Lambda function is accessible
- Review API Gateway CloudWatch logs
```

## Deployment Instructions

1. Install dependencies: `npm install`
2. Configure AWS credentials: `aws configure`
3. Set database password: `pulumi config set --secret tap-stack:dbPassword YOUR_PASSWORD --stack dev`
4. Deploy: `pulumi up --stack dev`
5. Test API: Use the exported `apiUrl` output
6. Repeat for staging and prod stacks

## Key Features

- **Reusable VPC Component**: Custom ComponentResource for consistent networking
- **Configuration Validation**: Fail-fast validation of required values
- **Environment-Specific Settings**: All configurations via Pulumi config files
- **Comprehensive Monitoring**: CloudWatch logs and alarms for all services
- **Security Best Practices**: Least-privilege IAM, encryption, private subnets
- **Cost Optimization**: Environment-appropriate resource sizing
- **Full Destroyability**: No retention policies, clean teardown with `pulumi destroy`
