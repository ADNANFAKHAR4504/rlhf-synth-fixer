import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class IamStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:IamStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        // Lambda execution role
        this.lambdaRole = new aws.iam.Role(`tap-lambda-role-${environmentSuffix}`, {
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
                ...tags,
                Name: `tap-lambda-role-${environmentSuffix}`,
            },
        }, { parent: this });

        // Attach basic Lambda execution policy
        const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(`tap-lambda-basic-${environmentSuffix}`, {
            role: this.lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        }, { parent: this });

        // Attach VPC execution policy for Lambda
        const lambdaVpcExecution = new aws.iam.RolePolicyAttachment(`tap-lambda-vpc-${environmentSuffix}`, {
            role: this.lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { parent: this });

        // Custom policy for RDS and S3 access
        const lambdaCustomPolicy = new aws.iam.Policy(`tap-lambda-policy-${environmentSuffix}`, {
            description: "Custom policy for Lambda to access RDS and S3",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:GetObject",
                            "s3:PutObject",
                        ],
                        Resource: "arn:aws:s3:::tap-app-bucket-*/*",
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances",
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
            tags: tags,
        }, { parent: this });

        // Attach custom policy to Lambda role
        const lambdaCustomPolicyAttachment = new aws.iam.RolePolicyAttachment(`tap-lambda-custom-${environmentSuffix}`, {
            role: this.lambdaRole.name,
            policyArn: lambdaCustomPolicy.arn,
        }, { parent: this });

        this.registerOutputs({
            lambdaRoleArn: this.lambdaRole.arn,
            lambdaPolicyArn: lambdaCustomPolicy.arn,
        });
    }
}