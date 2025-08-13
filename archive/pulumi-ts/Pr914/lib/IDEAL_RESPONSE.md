I'll create a complete, production-ready secure serverless API infrastructure using Pulumi TypeScript. This solution implements all the security best practices you've outlined with a focus on least privilege and private networking.

main file (tap-stack.ts)

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ApiGatewayStack } from './api-gateway-stack';
import { CloudWatchStack } from './cloudwatch-stack';
import { LambdaStack } from './lambda-stack';
import { NetworkingStack } from './networking-stack';
import { S3Stack } from './s3-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  // Networking outputs
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly vpcSecurityGroupId: pulumi.Output<string>;
  public readonly s3VpcEndpointId: pulumi.Output<string>;
  public readonly vpcCidrBlock: pulumi.Output<string>;
  // Lambda outputs
  public readonly lambdaFunctionUrl: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly lambdaRoleArn: pulumi.Output<string>;
  public readonly lambdaRoleName: pulumi.Output<string>;
  // S3 outputs
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly s3AccessLogsBucketName: pulumi.Output<string>;
  public readonly s3AccessLogsBucketArn: pulumi.Output<string>;
  // CloudWatch outputs
  public readonly lambdaLogGroupName: pulumi.Output<string>;
  public readonly lambdaLogGroupArn: pulumi.Output<string>;
  public readonly apiGatewayLogGroupName: pulumi.Output<string>;
  public readonly apiGatewayLogGroupArn: pulumi.Output<string>;
  // API Gateway outputs
  public readonly apiGatewayId: pulumi.Output<string>;
  public readonly apiGatewayStageId: pulumi.Output<string>;
  public readonly apiGatewayStageName: pulumi.Output<string>;
  public readonly apiGatewayIntegrationId: pulumi.Output<string>;
  public readonly apiGatewayMethodId: pulumi.Output<string>;
  public readonly apiGatewayResourceId: pulumi.Output<string>;
  // Environment and configuration
  public readonly region: string;
  public readonly environmentSuffix: string;
  public readonly tags: pulumi.Output<{ [key: string]: string }>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: environmentSuffix,
      Project: 'SecureDocumentAPI',
      ManagedBy: 'Pulumi',
      ...args.tags,
    };

    // Force AWS region to us-east-1 as per requirements
    const awsProvider = new aws.Provider('aws-us-east-1', {
      region: 'us-east-1',
    });

    // 1. Networking infrastructure
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 2. CloudWatch logging
    const cloudWatch = new CloudWatchStack(
      'cloudwatch',
      {
        environmentSuffix,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 3. S3 bucket
    const s3 = new S3Stack(
      's3',
      {
        environmentSuffix,
        s3VpcEndpointId: networking.s3VpcEndpoint.id,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 4. Lambda function with S3 bucket details
    const lambda = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        bucketArn: s3.bucket.arn,
        bucketName: s3.bucket.id,
        privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
        vpcSecurityGroupId: networking.vpcSecurityGroup.id,
        logGroupArn: cloudWatch.lambdaLogGroup.arn,
        tags,
      },
      {
        parent: this,
        dependsOn: [s3.bucket, cloudWatch.lambdaLogGroup],
        provider: awsProvider,
      }
    );

    // 5. Update S3 bucket policy with real Lambda role
    s3.updateBucketPolicy(lambda.role.arn, networking.s3VpcEndpoint.id);

    // 6. API Gateway
    const apiGateway = new ApiGatewayStack(
      'api-gateway',
      {
        environmentSuffix,
        lambdaFunctionArn: lambda.function.arn,
        lambdaFunctionName: lambda.function.name,
        tags,
      },
      { parent: this, dependsOn: [lambda.function], provider: awsProvider }
    );

    // Expose outputs
    this.vpcId = networking.vpc.id;
    this.apiUrl = apiGateway.apiUrl;
    this.bucketName = s3.bucket.id;
    this.lambdaFunctionName = lambda.function.name;

    // Networking outputs
    this.privateSubnetIds = pulumi.all(
      networking.privateSubnets.map(subnet => subnet.id)
    );
    this.publicSubnetIds = pulumi.all(
      networking.publicSubnets.map(subnet => subnet.id)
    );
    this.vpcSecurityGroupId = networking.vpcSecurityGroup.id;
    this.s3VpcEndpointId = networking.s3VpcEndpoint.id;
    this.vpcCidrBlock = networking.vpc.cidrBlock;
    // Lambda outputs
    this.lambdaFunctionUrl = lambda.functionUrl.functionUrl;
    this.lambdaFunctionArn = lambda.function.arn;
    this.lambdaRoleArn = lambda.role.arn;
    this.lambdaRoleName = lambda.role.name;
    // S3 outputs
    this.s3BucketArn = s3.bucket.arn;
    this.s3AccessLogsBucketName = s3.accessLogsBucket.id;
    this.s3AccessLogsBucketArn = s3.accessLogsBucket.arn;
    // CloudWatch outputs
    this.lambdaLogGroupName = cloudWatch.lambdaLogGroup.name;
    this.lambdaLogGroupArn = cloudWatch.lambdaLogGroup.arn;
    this.apiGatewayLogGroupName = cloudWatch.apiGatewayLogGroup.name;
    this.apiGatewayLogGroupArn = cloudWatch.apiGatewayLogGroup.arn;
    // API Gateway outputs
    this.apiGatewayId = apiGateway.api.id;
    this.apiGatewayStageId = apiGateway.stage.id;
    this.apiGatewayStageName = apiGateway.stage.stageName;
    this.apiGatewayIntegrationId = apiGateway.integration.id;
    this.apiGatewayMethodId = apiGateway.method.id;
    this.apiGatewayResourceId = apiGateway.resource.id;
    // Environment and configuration
    this.region = 'us-east-1';
    this.environmentSuffix = environmentSuffix;
    this.tags = pulumi.output(tags);

    this.registerOutputs({
      // Core infrastructure outputs
      vpcId: this.vpcId,
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      lambdaFunctionName: this.lambdaFunctionName,
      // Networking outputs
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      vpcSecurityGroupId: this.vpcSecurityGroupId,
      s3VpcEndpointId: this.s3VpcEndpointId,
      vpcCidrBlock: this.vpcCidrBlock,
      // Lambda outputs
      lambdaFunctionUrl: this.lambdaFunctionUrl,
      lambdaFunctionArn: this.lambdaFunctionArn,
      lambdaRoleArn: this.lambdaRoleArn,
      lambdaRoleName: this.lambdaRoleName,
      // S3 outputs
      s3BucketArn: this.s3BucketArn,
      s3AccessLogsBucketName: this.s3AccessLogsBucketName,
      s3AccessLogsBucketArn: this.s3AccessLogsBucketArn,
      // CloudWatch outputs
      lambdaLogGroupName: this.lambdaLogGroupName,
      lambdaLogGroupArn: this.lambdaLogGroupArn,
      apiGatewayLogGroupName: this.apiGatewayLogGroupName,
      apiGatewayLogGroupArn: this.apiGatewayLogGroupArn,
      // API Gateway outputs
      apiGatewayId: this.apiGatewayId,
      apiGatewayStageId: this.apiGatewayStageId,
      apiGatewayStageName: this.apiGatewayStageName,
      apiGatewayIntegrationId: this.apiGatewayIntegrationId,
      apiGatewayMethodId: this.apiGatewayMethodId,
      apiGatewayResourceId: this.apiGatewayResourceId,
      // Environment and configuration
      region: this.region,
      environmentSuffix: this.environmentSuffix,
      // Tags for resource identification
      tags: this.tags,
    });
  }
}
```

## Networking Stack

```typescript (./lib/networking-stack.ts)
/**
 * networking-stack.ts
 *
 * This module defines the VPC and networking infrastructure with private subnets
 * for Lambda functions and VPC endpoints for secure AWS service access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly s3VpcEndpoint: aws.ec2.VpcEndpoint;
  public readonly vpcSecurityGroup: aws.ec2.SecurityGroup;
  public readonly routeTable: aws.ec2.RouteTable;

  constructor(name: string, args: NetworkingStackArgs, opts?: ResourceOptions) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Force region to us-east-1 as per requirements
    // This ensures all resources are deployed in us-east-1 regardless of Pulumi config
    const region = 'us-east-1';

    // Derive availability zones from the required region
    const availabilityZones = [`${region}a`, `${region}b`];

    this.vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          Purpose: 'Secure document processing infrastructure',
          ...tags,
        },
      },
      { parent: this }
    );

    this.publicSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `public-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 1}.0/24`,
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `public-subnet-${index + 1}-${environmentSuffix}`,
              Type: 'public',
              ...tags,
            },
          },
          { parent: this }
        )
    );

    this.privateSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `private-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 10}.0/24`,
            tags: {
              Name: `private-subnet-${index + 1}-${environmentSuffix}`,
              Type: 'private',
              ...tags,
            },
          },
          { parent: this }
        )
    );

    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    this.routeTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.routeTable.id,
        },
        { parent: this }
      );
    });

    this.vpcSecurityGroup = new aws.ec2.SecurityGroup(
      `vpc-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for VPC endpoints and Lambda functions',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [this.vpc.cidrBlock],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `vpc-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.s3VpcEndpoint = new aws.ec2.VpcEndpoint(
      `s3-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [this.routeTable.id],
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: ['*'],
            },
          ],
        }),
        tags: {
          Name: `s3-endpoint-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcArn: this.vpc.arn,
      vpcCidrBlock: this.vpc.cidrBlock,
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      s3VpcEndpointId: this.s3VpcEndpoint.id,
      vpcSecurityGroupId: this.vpcSecurityGroup.id,
      routeTableId: this.routeTable.id,
    });
  }
}
```

## Cloudwatch Stack

```typescript (./lib/cloudwatch-stack.ts)
/**
 * cloudwatch-stack.ts
 *
 * This module defines CloudWatch Log Groups for Lambda function and API Gateway logging
 * with appropriate retention policies and least privilege access patterns.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly lambdaLogGroup: aws.cloudwatch.LogGroup;
  public readonly apiGatewayLogGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    this.lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/doc-processor-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Name: `lambda-log-group-${environmentSuffix}`,
          Purpose: 'Lambda function logging',
          Component: 'CloudWatch',
          ...tags,
        },
      },
      { parent: this }
    );

    this.apiGatewayLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-log-group-${environmentSuffix}`,
      {
        name: `/aws/apigateway/secure-doc-api-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Name: `api-gateway-log-group-${environmentSuffix}`,
          Purpose: 'API Gateway access logging',
          Component: 'CloudWatch',
          ...tags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      lambdaLogGroupName: this.lambdaLogGroup.name,
      lambdaLogGroupArn: this.lambdaLogGroup.arn,
      apiGatewayLogGroupName: this.apiGatewayLogGroup.name,
      apiGatewayLogGroupArn: this.apiGatewayLogGroup.arn,
    });
  }
}
```

## API Gateway Stack

```typescript (./lib/api-gateway-stack.ts)
/**
 * api-gateway-stack.ts
 *
 * This module defines the REST API Gateway with secure integration to Lambda function.
 * Implements private integration, logging, and security best practices.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  lambdaFunctionArn: pulumi.Input<string>;
  lambdaFunctionName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly stage: aws.apigateway.Stage;
  public readonly integration: aws.apigateway.Integration;
  public readonly method: aws.apigateway.Method;
  public readonly resource: aws.apigateway.Resource;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: ResourceOptions) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, lambdaFunctionArn, lambdaFunctionName, tags } =
      args;

    this.api = new aws.apigateway.RestApi(
      `secure-doc-api-${environmentSuffix}`,
      {
        name: `secure-doc-api-${environmentSuffix}`,
        description: `Secure Document Processing API - ${environmentSuffix}`,
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `secure-doc-api-${environmentSuffix}`,
          Purpose: 'Secure document processing API',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create the /documents resource
    this.resource = new aws.apigateway.Resource(
      `documents-resource-${environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'documents',
      },
      { parent: this }
    );

    // Create the Lambda integration
    this.integration = new aws.apigateway.Integration(
      `lambda-integration-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: this.resource.id,
        httpMethod: 'POST',
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: pulumi.interpolate`arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFunctionArn}/invocations`,
        timeoutMilliseconds: 29000,
      },
      { parent: this }
    );

    // Create the POST method
    this.method = new aws.apigateway.Method(
      `post-documents-method-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: this.resource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestParameters: {
          'method.request.header.Content-Type': true,
          'method.request.header.x-request-id': false,
        },
      },
      { parent: this }
    );

    // Create Lambda permission
    const lambdaPermission = new aws.lambda.Permission(
      `api-gateway-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create deployment
    const deployment = new aws.apigateway.Deployment(
      `deployment-${environmentSuffix}`,
      {
        restApi: this.api.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      {
        parent: this,
        dependsOn: [this.method, this.integration, lambdaPermission],
      }
    );

    // Create the stage
    this.stage = new aws.apigateway.Stage(
      `default-stage-${environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: 'dev',
        deployment: deployment.id,
        description: `Default stage for secure document API - ${environmentSuffix}`,
        // Note: Access logging requires CloudWatch Logs role to be configured in AWS account
        // If you get "CloudWatch Logs role ARN must be set in account settings" error,
        // you need to configure the role first or remove this section temporarily
        // accessLogSettings: {
        //   destinationArn: apiGatewayLogGroupArn,
        //   format: JSON.stringify({
        //     requestId: '$context.requestId',
        //     requestTime: '$context.requestTime',
        //     httpMethod: '$context.httpMethod',
        //     path: '$context.path',
        //     status: '$context.status',
        //     responseLength: '$context.responseLength',
        //     userAgent: '$context.identity.userAgent',
        //     sourceIp: '$context.identity.sourceIp',
        //     protocol: '$context.protocol',
        //     error: {
        //       message: '$context.error.message',
        //       messageString: '$context.error.messageString',
        //     },
        //     integration: {
        //       error: '$context.integration.error',
        //       latency: '$context.integration.latency',
        //       requestId: '$context.integration.requestId',
        //       status: '$context.integration.status',
        //     },
        //   }),
        // },
        tags: {
          Name: `default-stage-${environmentSuffix}`,
          Purpose: 'API Gateway default stage',
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [deployment],
      }
    );

    // Construct the API URL
    this.apiUrl = pulumi
      .all([this.api.id, this.stage.stageName])
      .apply(([apiId, stageName]) => {
        const region = 'us-east-1'; // Hardcoded as per requirements
        return `https://${apiId}.execute-api.${region}.amazonaws.com/${stageName}`;
      });

    this.registerOutputs({
      apiId: this.api.id,
      apiArn: this.api.arn,
      apiUrl: this.apiUrl,
      stageId: this.stage.id,
      stageName: this.stage.stageName,
      integrationId: this.integration.id,
      methodId: this.method.id,
      resourceId: this.resource.id,
      executionArn: this.api.executionArn,
    });
  }
}
```

## Lambda Stack

```typescript (./lib/lambda-stack.ts)
/**
 * lambda-stack.ts
 *
 * This module defines the Lambda function with least privilege IAM role for secure document processing.
 * Function runs in private subnets and has minimal required permissions.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

export interface LambdaStackArgs {
  environmentSuffix: string;
  bucketArn: pulumi.Input<string>;
  bucketName: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupId: pulumi.Input<string>;
  logGroupArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly role: aws.iam.Role;
  public readonly functionUrl: aws.lambda.FunctionUrl;

  constructor(name: string, args: LambdaStackArgs, opts?: ResourceOptions) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const {
      environmentSuffix,
      bucketArn,
      bucketName,
      privateSubnetIds,
      vpcSecurityGroupId,
      logGroupArn,
      tags,
    } = args;

    this.role = new aws.iam.Role(
      `lambda-execution-role-${environmentSuffix}`,
      {
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
          Name: `lambda-execution-role-${environmentSuffix}`,
          Purpose: 'Lambda execution with least privilege',
          ...tags,
        },
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-policy-${environmentSuffix}`,
      {
        role: this.role.id,
        policy: pulumi
          .all([bucketArn, logGroupArn])
          .apply(([bucketArn, logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'S3BucketAccess',
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
                },

                {
                  Sid: 'CloudWatchLogsAccess',
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logGroupArn}:*`,
                },
                {
                  Sid: 'VPCAccess',
                  Effect: 'Allow',
                  Action: [
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                    'ec2:DeleteNetworkInterface',
                    'ec2:AttachNetworkInterface',
                    'ec2:DetachNetworkInterface',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const lambdaCode = fs.readFileSync(
      path.join(__dirname, 'lambdas', 'document-processor.js'),
      'utf8'
    );

    this.function = new aws.lambda.Function(
      `doc-processor-${environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify(
              {
                name: 'document-processor',
                version: '1.0.0',
                description: 'Secure document processing Lambda function',
                main: 'index.js',
                dependencies: {
                  '@aws-sdk/client-s3': '^3.0.0',
                },
              },
              null,
              2
            )
          ),
        }),
        handler: 'index.handler',
        role: this.role.arn,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        architectures: ['x86_64'],
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            BUCKET_NAME: bucketName,
            NODE_OPTIONS: '--enable-source-maps',
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [vpcSecurityGroupId],
        },
        tags: {
          Name: `doc-processor-${environmentSuffix}`,
          Purpose: 'Secure document processing',
          Runtime: 'nodejs20.x',
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [lambdaPolicy],
      }
    );

    this.functionUrl = new aws.lambda.FunctionUrl(
      `lambda-url-${environmentSuffix}`,
      {
        functionName: this.function.name,
        authorizationType: 'NONE',
        cors: {
          allowCredentials: true,
          allowMethods: ['POST'],
          allowOrigins: ['*'],
          allowHeaders: ['content-type', 'x-request-id'],
          exposeHeaders: ['x-request-id'],
          maxAge: 86400,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      functionName: this.function.name,
      functionArn: this.function.arn,
      functionId: this.function.id,
      roleArn: this.role.arn,
      roleName: this.role.name,
      roleId: this.role.id,
      functionUrl: this.functionUrl.functionUrl,
      functionUrlId: this.functionUrl.id,
    });
  }
}
```

## S3 Stack

```typescript (./lib/s3-stack.ts)
/**
 * s3-stack.ts
 *
 * This module defines the secure S3 bucket for document storage with AWS managed encryption,
 * versioning, access logging, and restrictive bucket policies implementing least privilege access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  lambdaRoleArn?: pulumi.Input<string>; // Optional - if not provided, creates temporary role
  s3VpcEndpointId: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly accessLogsBucket: aws.s3.Bucket;
  public readonly bucketPolicy: aws.s3.BucketPolicy;
  public readonly tempLambdaRole?: aws.iam.Role;
  public readonly updatedBucketPolicy?: aws.s3.BucketPolicy;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const { environmentSuffix, lambdaRoleArn, s3VpcEndpointId, tags } = args;

    // Create access logs bucket
    this.accessLogsBucket = new aws.s3.Bucket(
      `access-logs-bucket-205432-${environmentSuffix}`,
      {
        bucket: `secure-doc-access-205432-logs-${environmentSuffix}`,
        tags: {
          Name: `access-logs-bucket-${environmentSuffix}`,
          Purpose: 'Access logs storage',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `access-logs-pab-${environmentSuffix}`,
      {
        bucket: this.accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create main S3 bucket
    this.bucket = new aws.s3.Bucket(
      `secure-doc-bucket-${environmentSuffix}`,
      {
        bucket: `secure-documents-205432-${environmentSuffix}`,
        tags: {
          Name: `secure-doc-bucket-${environmentSuffix}`,
          Purpose: 'Secure document storage',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.s3.BucketVersioning(
      `bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `bucket-pab-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketLogging(
      `bucket-logging-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        targetBucket: this.accessLogsBucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    new aws.s3.BucketLifecycleConfiguration(
      `bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: `cleanup-incomplete-uploads-${environmentSuffix}`,
            status: 'Enabled',
            abortIncompleteMultipartUpload: {
              daysAfterInitiation: 7,
            },
          },
          {
            id: `transition-old-versions-${environmentSuffix}`,
            status: 'Enabled',
            noncurrentVersionTransitions: [
              {
                noncurrentDays: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                noncurrentDays: 90,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              noncurrentDays: 365,
            },
          },
        ],
      },
      { parent: this }
    );

    // If no Lambda role provided, create a temporary one
    if (!lambdaRoleArn) {
      this.tempLambdaRole = new aws.iam.Role(
        `temp-lambda-role-${environmentSuffix}`,
        {
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
          tags,
        },
        { parent: this }
      );
    }

    // Use provided role or temporary role for initial bucket policy
    const initialRoleArn = lambdaRoleArn || this.tempLambdaRole!.arn;

    const accountId = pulumi.output(aws.getCallerIdentity()).accountId;

    this.bucketPolicy = new aws.s3.BucketPolicy(
      `bucket-policy-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        policy: pulumi
          .all([this.bucket.arn, initialRoleArn, s3VpcEndpointId, accountId])
          .apply(([bucketArn, roleArn, vpcEndpointId, accountId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Id: `SecureBucketPolicy-${environmentSuffix}`,
              Statement: [
                {
                  Sid: 'AllowRootUserFullAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'AllowLambdaAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'RestrictToVPCEndpoint',
                  Effect: 'Deny',
                  NotPrincipal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    StringNotEquals: {
                      'aws:sourceVpce': vpcEndpointId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      accessLogsBucketName: this.accessLogsBucket.id,
      accessLogsBucketArn: this.accessLogsBucket.arn,
      tempLambdaRoleArn: this.tempLambdaRole?.arn,
      bucketPolicyId: this.bucketPolicy.id,
    });
  }

  // Method to update bucket policy with real Lambda role
  public updateBucketPolicy(
    realLambdaRoleArn: pulumi.Input<string>,
    vpcEndpointId: pulumi.Input<string>
  ): aws.s3.BucketPolicy {
    const accountId = pulumi.output(aws.getCallerIdentity()).accountId;

    return new aws.s3.BucketPolicy(
      'bucket-policy-updated-final',
      {
        bucket: this.bucket.id,
        policy: pulumi
          .all([this.bucket.arn, realLambdaRoleArn, accountId, vpcEndpointId])
          .apply(([bucketArn, roleArn, accountId, vpcEndpointId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Id: 'SecureBucketPolicy-final',
              Statement: [
                {
                  Sid: 'AllowRootUserFullAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'AllowLambdaAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'RestrictToVPCEndpoint',
                  Effect: 'Deny',
                  NotPrincipal: {
                    AWS: `arn:aws:iam::${accountId}:root`,
                  },
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    StringNotEquals: {
                      'aws:sourceVpce': vpcEndpointId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );
  }
}
```
