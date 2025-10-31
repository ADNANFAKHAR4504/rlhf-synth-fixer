# Streaming Media Pipeline Infrastructure - CDK Go Implementation

This implementation provides a complete streaming media processing pipeline using AWS CDK with Go. The architecture handles video ingestion, transcoding via MediaConvert, and content delivery through CloudFront.

## Architecture Overview

The pipeline implements:
- S3 buckets for source uploads and processed content
- Lambda functions for workflow orchestration
- MediaConvert for video transcoding
- CloudFront for content delivery
- DynamoDB for job tracking
- SNS for notifications

## File: lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambdaeventsources"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix *string
}

type TapStack struct {
	awscdk.Stack
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	environmentSuffix := jsii.String("dev")
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = props.EnvironmentSuffix
	}

	// Source bucket for video uploads
	sourceBucket := awss3.NewBucket(stack, jsii.String("SourceBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("media-source-%s", *environmentSuffix)),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		Versioned:         jsii.Bool(false),
	})

	// Processed content bucket
	processedBucket := awss3.NewBucket(stack, jsii.String("ProcessedBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("media-processed-%s", *environmentSuffix)),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		Versioned:         jsii.Bool(false),
	})

	// DynamoDB table for job tracking
	jobTable := awsdynamodb.NewTable(stack, jsii.String("JobTable"), &awsdynamodb.TableProps{
		TableName:     jsii.String(fmt.Sprintf("media-jobs-%s", *environmentSuffix)),
		PartitionKey:  &awsdynamodb.Attribute{Name: jsii.String("jobId"), Type: awsdynamodb.AttributeType_STRING},
		BillingMode:   awsdynamodb.BillingMode_PAY_PER_REQUEST,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// SNS topic for notifications
	notificationTopic := awssns.NewTopic(stack, jsii.String("NotificationTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("media-notifications-%s", *environmentSuffix)),
		DisplayName: jsii.String("Media Pipeline Notifications"),
	})

	// IAM role for MediaConvert
	mediaConvertRole := awsiam.NewRole(stack, jsii.String("MediaConvertRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("media-convert-role-%s", *environmentSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("mediaconvert.amazonaws.com"), nil),
	})

	sourceBucket.GrantRead(mediaConvertRole, nil)
	processedBucket.GrantWrite(mediaConvertRole, nil)

	// Lambda execution role
	lambdaRole := awsiam.NewRole(stack, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("media-lambda-role-%s", *environmentSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	sourceBucket.GrantRead(lambdaRole, nil)
	processedBucket.GrantReadWrite(lambdaRole, nil)
	jobTable.GrantReadWriteData(lambdaRole)
	notificationTopic.GrantPublish(lambdaRole)

	lambdaRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Actions: jsii.Strings(
			"mediaconvert:CreateJob",
			"mediaconvert:GetJob",
			"mediaconvert:DescribeEndpoints",
		),
		Resources: jsii.Strings("*"),
	}))

	lambdaRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Actions:   jsii.Strings("iam:PassRole"),
		Resources: jsii.Strings(*mediaConvertRole.RoleArn()),
	}))

	// Transcoding Lambda function
	transcodeLambda := awslambda.NewFunction(stack, jsii.String("TranscodeFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("media-transcode-%s", *environmentSuffix)),
		Runtime:      awslambda.Runtime_NODEJS_18_X(),
		Handler:      jsii.String("index.handler"),
		Code:         awslambda.Code_FromInline(jsii.String(getTranscodeLambdaCode())),
		Role:         lambdaRole,
		Timeout:      awscdk.Duration_Seconds(jsii.Number(300)),
		Environment: &map[string]*string{
			"PROCESSED_BUCKET":      processedBucket.BucketName(),
			"JOB_TABLE":             jobTable.TableName(),
			"MEDIACONVERT_ROLE_ARN": mediaConvertRole.RoleArn(),
			"NOTIFICATION_TOPIC":    notificationTopic.TopicArn(),
		},
		LogRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// S3 event notification to trigger Lambda
	sourceBucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(transcodeLambda),
		&awss3.NotificationKeyFilter{
			Prefix: jsii.String("uploads/"),
		},
	)

	// Job status Lambda function
	statusLambda := awslambda.NewFunction(stack, jsii.String("StatusFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("media-status-%s", *environmentSuffix)),
		Runtime:      awslambda.Runtime_NODEJS_18_X(),
		Handler:      jsii.String("index.handler"),
		Code:         awslambda.Code_FromInline(jsii.String(getStatusLambdaCode())),
		Role:         lambdaRole,
		Timeout:      awscdk.Duration_Seconds(jsii.Number(60)),
		Environment: &map[string]*string{
			"JOB_TABLE":          jobTable.TableName(),
			"NOTIFICATION_TOPIC": notificationTopic.TopicArn(),
		},
		LogRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// CloudFront Origin Access Identity
	originAccessIdentity := awscloudfront.NewOriginAccessIdentity(stack, jsii.String("OAI"), &awscloudfront.OriginAccessIdentityProps{
		Comment: jsii.String(fmt.Sprintf("OAI for media delivery %s", *environmentSuffix)),
	})

	processedBucket.GrantRead(originAccessIdentity.GrantPrincipal(), nil)

	// CloudFront distribution
	distribution := awscloudfront.NewDistribution(stack, jsii.String("Distribution"), &awscloudfront.DistributionProps{
		Comment: jsii.String(fmt.Sprintf("Media delivery CDN %s", *environmentSuffix)),
		DefaultBehavior: &awscloudfront.BehaviorOptions{
			Origin: awscloudfrontorigins.NewS3Origin(processedBucket, &awscloudfrontorigins.S3OriginProps{
				OriginAccessIdentity: originAccessIdentity,
			}),
			ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
			CachePolicy:          awscloudfront.CachePolicy_CACHING_OPTIMIZED(),
		},
		PriceClass:    awscloudfront.PriceClass_PRICE_CLASS_100,
		HttpVersion:   awscloudfront.HttpVersion_HTTP2_AND_3,
		EnableLogging: jsii.Bool(true),
	})
	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("SourceBucketName"), &awscdk.CfnOutputProps{
		Value:       sourceBucket.BucketName(),
		Description: jsii.String("Source bucket for video uploads"),
		ExportName:  jsii.String(fmt.Sprintf("SourceBucket-%s", *environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ProcessedBucketName"), &awscdk.CfnOutputProps{
		Value:       processedBucket.BucketName(),
		Description: jsii.String("Bucket for processed videos"),
		ExportName:  jsii.String(fmt.Sprintf("ProcessedBucket-%s", *environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("JobTableName"), &awscdk.CfnOutputProps{
		Value:       jobTable.TableName(),
		Description: jsii.String("DynamoDB table for job tracking"),
		ExportName:  jsii.String(fmt.Sprintf("JobTable-%s", *environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DistributionDomainName"), &awscdk.CfnOutputProps{
		Value:       distribution.DistributionDomainName(),
		Description: jsii.String("CloudFront distribution domain"),
		ExportName:  jsii.String(fmt.Sprintf("DistributionDomain-%s", *environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("TranscodeFunctionArn"), &awscdk.CfnOutputProps{
		Value:       transcodeLambda.FunctionArn(),
		Description: jsii.String("Transcode Lambda function ARN"),
		ExportName:  jsii.String(fmt.Sprintf("TranscodeFunction-%s", *environmentSuffix)),
	})

	return stack
}

func getTranscodeLambdaCode() string {
	return `
const { MediaConvertClient, CreateJobCommand, DescribeEndpointsCommand } = require("@aws-sdk/client-mediaconvert");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log("Processing:", bucket, key);

        try {
            // Get MediaConvert endpoint
            const mediaConvertClient = new MediaConvertClient({});
            const endpointsCommand = new DescribeEndpointsCommand({ MaxResults: 1 });
            const endpointsResponse = await mediaConvertClient.send(endpointsCommand);
            const endpoint = endpointsResponse.Endpoints[0].Url;

            // Create client with endpoint
            const mcClient = new MediaConvertClient({ endpoint });

            const jobId = Date.now().toString();
            const outputPath = key.replace('uploads/', 'processed/');

            // Create MediaConvert job
            const jobParams = {
                Role: process.env.MEDIACONVERT_ROLE_ARN,
                Settings: {
                    Inputs: [{
                        FileInput: "s3://" + bucket + "/" + key,
                        AudioSelectors: {
                            "Audio Selector 1": { DefaultSelection: "DEFAULT" }
                        },
                        VideoSelector: {}
                    }],
                    OutputGroups: [{
                        Name: "File Group",
                        OutputGroupSettings: {
                            Type: "FILE_GROUP_SETTINGS",
                            FileGroupSettings: {
                                Destination: "s3://" + process.env.PROCESSED_BUCKET + "/" + outputPath
                            }
                        },
                        Outputs: [
                            {
                                ContainerSettings: { Container: "MP4" },
                                VideoDescription: {
                                    CodecSettings: {
                                        Codec: "H_264",
                                        H264Settings: {
                                            Bitrate: 5000000,
                                            RateControlMode: "CBR",
                                            CodecProfile: "HIGH"
                                        }
                                    }
                                },
                                AudioDescriptions: [{
                                    CodecSettings: {
                                        Codec: "AAC",
                                        AacSettings: {
                                            Bitrate: 128000,
                                            CodingMode: "CODING_MODE_2_0",
                                            SampleRate: 48000
                                        }
                                    }
                                }]
                            }
                        ]
                    }]
                }
            };

            const createJobCommand = new CreateJobCommand(jobParams);
            const jobResponse = await mcClient.send(createJobCommand);

            // Store in DynamoDB
            await dynamoClient.send(new PutItemCommand({
                TableName: process.env.JOB_TABLE,
                Item: {
                    jobId: { S: jobId },
                    mediaConvertJobId: { S: jobResponse.Job.Id },
                    sourceKey: { S: key },
                    status: { S: "SUBMITTED" },
                    timestamp: { N: Date.now().toString() }
                }
            }));

            // Send SNS notification
            await snsClient.send(new PublishCommand({
                TopicArn: process.env.NOTIFICATION_TOPIC,
                Subject: "Transcoding Job Started",
                Message: JSON.stringify({ jobId, sourceKey: key, status: "SUBMITTED" })
            }));

            console.log("Job created:", jobResponse.Job.Id);

        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    return { statusCode: 200, body: "Processing complete" };
};
`
}

func getStatusLambdaCode() string {
	return `
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));

    const jobId = event.jobId;
    const status = event.status || "UNKNOWN";

    try {
        // Update job status in DynamoDB
        await dynamoClient.send(new UpdateItemCommand({
            TableName: process.env.JOB_TABLE,
            Key: { jobId: { S: jobId } },
            UpdateExpression: "SET #status = :status, #timestamp = :timestamp",
            ExpressionAttributeNames: {
                "#status": "status",
                "#timestamp": "updatedAt"
            },
            ExpressionAttributeValues: {
                ":status": { S: status },
                ":timestamp": { N: Date.now().toString() }
            }
        }));

        // Send notification
        await snsClient.send(new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC,
            Subject: "Job Status Update",
            Message: JSON.stringify({ jobId, status })
        }));

        return { statusCode: 200, body: "Status updated" };

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};
`
}
```

## File: main.go

```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"tap/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Region: jsii.String("eu-south-1"),
			},
		},
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	app.Synth(nil)
}
```

## File: go.mod

```go
module tap

go 1.21

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.133.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.97.0
)
```

## Deployment Instructions

1. Install dependencies:
```bash
go mod download
```

2. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX=your-unique-suffix
```

3. Synthesize CloudFormation:
```bash
cdk synth
```

4. Deploy the stack:
```bash
cdk deploy
```

## Testing the Pipeline

1. Upload a video to the source bucket:
```bash
aws s3 cp test-video.mp4 s3://media-source-${ENVIRONMENT_SUFFIX}/uploads/test-video.mp4
```

2. Monitor the transcoding job in DynamoDB and CloudWatch logs

3. Access processed videos via CloudFront distribution domain
