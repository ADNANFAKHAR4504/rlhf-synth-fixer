import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class LambdaStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:LambdaStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        const bucketName = args.bucketName;
        const lambdaRole = args.lambdaRole;
        const rdsEndpoint = args.rdsEndpoint;
        const vpcId = args.vpcId;
        const privateSubnetIds = args.privateSubnetIds;

        // Create security group for Lambda
        const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`tap-lambda-sg-${environmentSuffix}`, {
            vpcId: vpcId,
            description: "Security group for Lambda function",
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: "-1",
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            tags: {
                ...tags,
                Name: `tap-lambda-sg-${environmentSuffix}`,
            },
        }, { parent: this });

        // Create Lambda function with S3 code source and VPC configuration
        const lambdaFunction = new aws.lambda.Function(`tap-lambda-${environmentSuffix}`, {
            role: lambdaRole.arn,
            handler: "index.handler",
            runtime: "nodejs18.x", // Latest supported Node.js runtime
            s3Bucket: bucketName,
            s3Key: "lambda-function.zip",
            vpcConfig: {
                subnetIds: privateSubnetIds,
                securityGroupIds: [lambdaSecurityGroup.id],
            },
            environment: {
                variables: {
                    RDS_ENDPOINT: rdsEndpoint,
                    ENVIRONMENT: environmentSuffix,
                },
            },
            timeout: 30,
            memorySize: 256,
            tags: {
                ...tags,
                Name: `tap-lambda-${environmentSuffix}`,
            },
        }, { parent: this });

        // Enable CloudWatch Logs for Lambda
        const logGroup = new aws.cloudwatch.LogGroup(`tap-lambda-logs-${environmentSuffix}`, {
            name: pulumi.interpolate`/aws/lambda/${lambdaFunction.name}`,
            retentionInDays: 7,
            tags: tags,
        }, { parent: this });

        this.functionName = lambdaFunction.name;
        this.functionArn = lambdaFunction.arn;

        this.registerOutputs({
            functionName: this.functionName,
            functionArn: this.functionArn,
        });
    }
}