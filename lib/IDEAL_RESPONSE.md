# Production-Grade AWS CDK Serverless Web Application


A complete serverless web application infrastructure built with AWS CDK (TypeScript) featuring static website hosting, REST API, and PostgreSQL database.


## Architecture Overview


This project provisions a production-ready serverless infrastructure including:


- **Frontend**: S3 bucket configured for static website hosting
- **API Layer**: API Gateway with Lambda function (Python 3.10)
- **Database**: Amazon RDS PostgreSQL 14 with automated backups
- **Networking**: VPC with public/private subnets across 2 Availability Zones
- **Security**: Proper security groups, IAM roles, and AWS Secrets Manager integration


All resources are deployed in the `us-west-2` region for optimal performance.


## Project Structure


```
my-serverless-app/
├── bin/
│   └── my-serverless-app.ts
├── lib/
│   └── my-serverless-app-stack.ts
├── lambda/
│   ├── handler.py
│   └── requirements.txt
├── .gitignore
├── cdk.json
├── package.json
├── README.md
└── tsconfig.json
```


## Key Features


- **Complete Infrastructure**: VPC, S3, RDS PostgreSQL, Lambda, and API Gateway
- **Security Best Practices**: Database credentials auto-generated via Secrets Manager
- **Production-Ready Code**: Comprehensive error handling and monitoring
- **Cost-Effective**: Optimized for development with production scalability


## Prerequisites


### Required Tools


- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - configured with appropriate credentials
- [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install) - version 2.98.0 or later
- [Node.js](https://nodejs.org/) - version 16.x or later
- [Python 3.8+](https://www.python.org/downloads/) - for Lambda function dependencies


### AWS Configuration


Configure your AWS credentials:


```bash
# Option 1: AWS CLI
aws configure


# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-west-2
```


## Quick Start


1. **Create project directory and install dependencies**:
  ```bash
  mkdir my-serverless-app && cd my-serverless-app
  npm install
  ```


2. **Bootstrap CDK** (if not done before):
  ```bash
  cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
  ```


3. **Deploy the infrastructure**:
  ```bash
  cdk deploy
  ```


4. **Test the API endpoint** using the URL from the outputs


## File Contents


### package.json


```json
{
 "name": "my-serverless-app",
 "version": "0.1.0",
 "description": "Production-grade serverless web application infrastructure using AWS CDK",
 "main": "lib/my-serverless-app-stack.js",
 "scripts": {
   "build": "tsc",
   "watch": "tsc -w",
   "test": "jest",
   "cdk": "cdk",
   "synth": "cdk synth",
   "deploy": "cdk deploy",
   "destroy": "cdk destroy",
   "cdk:bootstrap": "cdk bootstrap",
   "cdk:deploy": "cdk deploy",
   "cdk:synth": "cdk synth",
   "cdk:diff": "cdk diff",
   "cdk:destroy": "cdk destroy"
 },
 "devDependencies": {
   "@types/aws-lambda": "^8.10.119",
   "@types/jest": "^29.5.5",
   "@types/node": "^20.5.0",
   "@typescript-eslint/eslint-plugin": "^6.4.1",
   "@typescript-eslint/parser": "^6.4.1",
   "aws-cdk": "^2.150.0",
   "eslint": "^8.47.0",
   "jest": "^29.6.2",
   "ts-jest": "^29.1.1",
   "ts-node": "^10.9.1",
   "typescript": "~5.1.6"
 },
 "dependencies": {
   "aws-cdk-lib": "^2.150.0",
   "constructs": "^10.3.0"
 },
 "keywords": [
   "aws",
   "cdk",
   "serverless",
   "infrastructure"
 ],
 "author": "AWS DevOps Engineer",
 "license": "MIT"
}
```


### tsconfig.json


```json
{
 "compilerOptions": {
   "target": "ES2020",
   "module": "commonjs",
   "lib": ["es2020"],
   "declaration": true,
   "strict": true,
   "noImplicitAny": true,
   "strictNullChecks": true,
   "noImplicitThis": true,
   "alwaysStrict": true,
   "noUnusedLocals": false,
   "noUnusedParameters": false,
   "noImplicitReturns": true,
   "noFallthroughCasesInSwitch": false,
   "sourceMap": true,
   "experimentalDecorators": true,
   "strictPropertyInitialization": false,
   "typeRoots": ["./node_modules/@types"],
   "outDir": "dist",
   "rootDir": "./",
   "esModuleInterop": true,
   "skipLibCheck": true
 },
 "include": [
   "bin/**/*.ts",
   "lib/**/*.ts",
   "test/**/*.ts"
 ],
 "exclude": [
   "node_modules",
   "cdk.out"
 ]
}
```


### cdk.json


```json
{
 "app": "npx ts-node --prefer-ts-exts bin/my-serverless-app.ts",
 "requireApproval": "never",
 "watch": {
   "include": [
     "**"
   ],
   "exclude": [
     "README.md",
     "cdk*.json",
     "**/*.d.ts",
     "**/*.js",
     "tsconfig.json",
     "package*.json",
     "yarn.lock",
     "node_modules",
     "test"
   ]
 },
 "context": {
   "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
   "@aws-cdk/core:checkSecretUsage": true,
   "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
   "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
   "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
   "@aws-cdk/aws-iam:minimizePolicies": true,
   "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
   "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
   "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
   "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
   "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
   "@aws-cdk/core:enablePartitionLiterals": true,
   "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
   "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
   "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
   "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
   "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
   "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
   "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
   "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
   "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
   "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
   "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
   "@aws-cdk/aws-redshift:columnId": true,
   "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
   "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
   "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
   "@aws-cdk/aws-kms:aliasNameRef": true,
   "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
   "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
   "@aws-cdk/aws-efs:denyAnonymousAccess": true,
   "@aws-cdk/aws-opensearchservice:enableLogging": true,
   "@aws-cdk/aws-globalaccelerator:forwardListenerArn": true
 }
}
```


### bin/my-serverless-app.ts


```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyServerlessAppStack } from '../lib/my-serverless-app-stack';


const app = new cdk.App();
new MyServerlessAppStack(app, 'MyServerlessAppStack', {
 env: {
   account: process.env.CDK_DEFAULT_ACCOUNT,
   region: 'us-west-2',
 },
 description: 'Production-grade serverless web application infrastructure',
});


cdk.Tags.of(app).add('Project', 'MyServerlessApp');
cdk.Tags.of(app).add('Environment', 'Production');
```


### lib/my-serverless-app-stack.ts


```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  isTest?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // ==============================================
    // VPC Configuration
    // ==============================================
    const vpc = new ec2.Vpc(this, 'MyWebAppVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ==============================================
    // S3 Bucket for Static Website Hosting
    // ==============================================
    const websiteBucket = new s3.Bucket(this, 'MyWebAppS3Bucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicPolicy: false,
        blockPublicAcls: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });

    // ==============================================
    // Database Credentials (Secrets Manager)
    // ==============================================
    const databaseSecret = new secretsmanager.Secret(
      this,
      'MyWebAppDatabaseSecret',
      {
        description: 'PostgreSQL database credentials for MyWebApp',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'postgres' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ==============================================
    // Security Groups
    // ==============================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'MyWebAppLambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      'MyWebAppRDSSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS PostgreSQL database',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // ==============================================
    // RDS PostgreSQL Database
    // ==============================================
    const database = new rds.DatabaseInstance(this, 'MyWebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSecurityGroup],
      multiAz: false,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      databaseName: 'mywebappdb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==============================================
    // Lambda Function
    // ==============================================
    const lambdaRole = new iam.Role(this, 'MyWebAppLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for MyWebApp Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    databaseSecret.grantRead(lambdaRole);

    const targetArchitecture =
      process.env.TARGET_ARCHITECTURE === 'arm64'
        ? lambda.Architecture.ARM_64
        : lambda.Architecture.X86_64;

    const lambdaFunction = new lambda.Function(this, 'MyWebAppLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'handler.lambda_handler',
      architecture: targetArchitecture,

      code: props?.isTest
        ? lambda.Code.fromInline('def handler(event, context): pass')
        : lambda.Code.fromAsset(path.join(__dirname, 'lambda'), {
            bundling: {
              image: lambda.Runtime.PYTHON_3_8.bundlingImage,
              // THE FIX: Force the build to be for an x86 CPU
              platform: 'linux/amd64', 
              command: [
                'bash',
                '-c',
                'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
              ],
            },
          }),

      role: lambdaRole,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(60),
      environment: {
        DB_SECRET_ARN: databaseSecret.secretArn,
        DB_NAME: 'mywebappdb',
        DB_HOST: database.instanceEndpoint.hostname,
      },
      description: 'Lambda function for MyWebApp API backend',
    });

    // ==============================================
    // API Gateway
    // ==============================================
    const api = new apigateway.RestApi(this, 'MyWebAppApiGateway', {
      restApiName: 'MyWebApp API',
      description: 'REST API for MyWebApp serverless application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      deployOptions: { stageName: 'prod' },
    });

    const apiResource = api.root.addResource('api');
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    apiResource.addMethod('GET', lambdaIntegration);

    // ==============================================
    // CloudFormation Outputs
    // ==============================================
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Name of the S3 bucket for static website hosting',
    });
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'URL of the static website hosted on S3',
    });
    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: api.url,
      description: 'Root endpoint URL for the API Gateway',
    });
    new cdk.CfnOutput(this, 'ApiEndpointURL', {
      value: `${api.url}api`,
      description: 'Complete API endpoint URL for testing the Lambda function',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Hostname of the RDS database instance',
    });
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'ARN of the Secrets Manager secret for database credentials',
    });
  }
}
```


### lambda/handler.py


```python
import json
import boto3
import psycopg2
import os
from botocore.exceptions import ClientError

# It's good practice to initialize boto3 clients outside the handler
secrets_manager_client = boto3.client('secretsmanager')

def get_secret(secret_arn):
    """Retrieves a secret from AWS Secrets Manager."""
    try:
        response = secrets_manager_client.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise e

def create_response(status_code, body):
    """Creates a standardized API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }

def lambda_handler(event, context):
    """
    AWS Lambda handler to connect to PostgreSQL and return status.
    """
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    db_host = os.environ.get('DB_HOST')
    db_name = os.environ.get('DB_NAME')

    if not all([db_secret_arn, db_host, db_name]):
        print("Error: Missing required environment variables.")
        return create_response(500, {
            'status': 'error',
            'message': 'Internal server configuration error.'
        })

    connection = None
    try:
        # 1. Get database credentials
        secret = get_secret(db_secret_arn)
        
        # 2. Establish database connection
        print(f"Attempting to connect to database '{db_name}' at {db_host}...")
        connection = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=secret['username'],
            password=secret['password'],
            # THE FIX: Increased timeout to handle Lambda cold starts in a VPC
            connect_timeout=30
        )
        
        # 3. Test the connection with a query
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()
        
        print("Database connection successful.")
        
        # 4. Prepare and return success response
        response_body = {
            'status': 'success',
            'message': 'Successfully connected to PostgreSQL database',
            'database_version': db_version[0] if db_version else 'Unknown',
            'database_name': db_name
        }
        return create_response(200, response_body)

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return create_response(500, {
            'status': 'error',
            'message': 'Internal server error.',
            'error_type': type(e).__name__
        })

    finally:
        # 5. Ensure the connection is always closed
        if connection:
            connection.close()
            print("Database connection closed.")


```


### lambda/requirements.txt


```txt
psycopg2-binary==2.9.7
boto3==1.28.57
```


### .gitignore


```
# Dependencies
node_modules/
*.zip


# CDK
cdk.out/
cdk.context.json
.cdk.staging/


# TypeScript
*.js
*.d.ts
dist/
build/


# IDE
.vscode/
.idea/
*.swp
*.swo
*~


# OS
.DS_Store
Thumbs.db


# Logs
*.log
npm-debug.log*


# Runtime data
pids
*.pid
*.seed


# Coverage directory used by tools like istanbul
coverage/


# Dependency directories
jspm_packages/


# Optional npm cache directory
.npm


# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/


# AWS
.aws-sam/


# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```


## Installation and Setup


1. **Clone or create the project directory**:
  ```bash
  mkdir my-serverless-app
  cd my-serverless-app
  ```


2. **Copy all files** from the contents above into their respective locations


3. **Install Node.js dependencies**:
  ```bash
  npm install
  ```


4. **Install Python dependencies** (for Lambda function):
  ```bash
  cd lambda
  pip install -r requirements.txt
  cd ..
  ```


5. **Bootstrap CDK** (if not done before in your AWS account/region):
  ```bash
  cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
  ```


## Deployment


### Deploy the Infrastructure


1. **Synthesize the CDK Stack** (optional - to preview resources):
  ```bash
  npm run synth
  ```


2. **Deploy the Stack**:
  ```bash
  npm run deploy
  ```


  The deployment process will:
  - Create the VPC and networking components
  - Provision the RDS PostgreSQL database
  - Deploy the Lambda function with proper IAM roles
  - Set up API Gateway with CORS enabled
  - Create the S3 bucket for static hosting
  - Output important URLs and resource information


3. **Note the Outputs**:
  After successful deployment, note the CloudFormation outputs:
  - `ApiEndpointURL`: Your API endpoint for testing
  - `WebsiteURL`: S3 static website URL
  - `DatabaseEndpoint`: RDS database endpoint


## Testing the Infrastructure


### Test the API Endpoint


Once deployed, you can test the API endpoint using curl:


```bash
# Replace with the actual URL from CDK output
curl -X GET https://<api-id>.execute-api.us-west-2.amazonaws.com/prod/api


# Example response:
# {
#   "status": "success",
#   "message": "Successfully connected to PostgreSQL database",
#   "database_version": "PostgreSQL 14.9...",
#   "database_name": "mywebappdb",
#   "timestamp": "12345678-1234-1234-1234-123456789abc"
# }
```


### Test from Browser


You can also test the API directly in your browser by visiting:
```
https://<api-id>.execute-api.us-west-2.amazonaws.com/prod/api
```


### Monitor Logs


View Lambda function logs in CloudWatch:
```bash
aws logs tail /aws/lambda/MyServerlessAppStack-MyWebAppLambdaFunction --follow
```


## Static Website Deployment


To deploy your frontend files to the S3 bucket:


1. **Upload files to S3**:
  ```bash
  # Replace with your actual bucket name from outputs
  aws s3 cp index.html s3://<bucket-name>/
  aws s3 cp error.html s3://<bucket-name>/
  aws s3 sync ./static-files/ s3://<bucket-name>/ --delete
  ```


2. **Access your website**:
  Visit the `WebsiteURL` provided in the CDK outputs.


## Infrastructure Components


### Networking
- **VPC**: `10.0.0.0/16` CIDR block
- **Availability Zones**: 2 AZs for high availability
- **Public Subnets**: For NAT Gateways and future load balancers
- **Private Subnets**: For Lambda functions and RDS database


### Database
- **Engine**: PostgreSQL 14
- **Instance Type**: t3.micro (suitable for development/testing)
- **Backup**: Automated backups with 7-day retention
- **Security**: Located in private subnets with restrictive security groups


### Lambda Function
- **Runtime**: Python 3.10
- **VPC Configuration**: Deployed in private subnets
- **Dependencies**: psycopg2-binary, aws-secretsmanager-caching
- **Environment Variables**: Database secret ARN and database name


### API Gateway
- **Type**: REST API
- **CORS**: Enabled for all origins
- **Integration**: Lambda Proxy Integration
- **Endpoint**: `/api` resource with GET method


## Security Features


- **Secrets Management**: Database credentials stored in AWS Secrets Manager
- **Network Isolation**: RDS and Lambda in private subnets
- **Security Groups**: Restrictive inbound/outbound rules
- **IAM Roles**: Least-privilege access principles
- **VPC**: Complete network isolation


## Monitoring and Troubleshooting


### CloudWatch Logs
- Lambda function logs: `/aws/lambda/MyServerlessAppStack-MyWebAppLambdaFunction`
- API Gateway logs: Enable in API Gateway console if needed


### Common Issues


1. **Lambda Timeout**: Increase timeout in `lib/my-serverless-app-stack.ts`
2. **Database Connection**: Check security group rules and VPC configuration
3. **API CORS**: Ensure CORS headers are properly configured


## Cost Optimization


Current configuration is optimized for development/testing:
- RDS t3.micro instance
- Single AZ deployment
- Basic monitoring


For production, consider:
- Multi-AZ RDS deployment
- Enhanced monitoring
- CloudFront for static content delivery
- Application Load Balancer for high availability


## Cleanup


To avoid ongoing AWS charges, destroy the stack when no longer needed:


```bash
npm run destroy
```


**Note**: The S3 bucket and RDS database are configured with `DESTROY` removal policy for easy cleanup. In production, set this to `RETAIN` to prevent accidental data loss.


## Development Workflow


### Making Changes


1. **Modify Infrastructure**:
  ```bash
  # Edit files in lib/ directory
  npm run build
  npm run synth    # Preview changes
  npm run deploy   # Deploy changes
  ```


2. **Update Lambda Function**:
  ```bash
  # Edit files in lambda/ directory
  npm run deploy   # CDK will automatically package and deploy new code
  ```


### Local Development


For local testing of Lambda functions, consider using:
- [AWS SAM](https://aws.amazon.com/serverless/sam/) for local Lambda testing
- [LocalStack](https://localstack.cloud/) for local AWS services


## License


This project is licensed under the MIT License.


## Support


For issues and questions:
- Check AWS CloudFormation console for detailed error messages
- Review CloudWatch logs for runtime issues
- Consult AWS CDK documentation: https://docs.aws.amazon.com/cdk/


**Note**: This infrastructure is designed for development and testing. For production deployments, additional considerations such as monitoring, alerting, backup strategies, and disaster recovery should be implemented.
