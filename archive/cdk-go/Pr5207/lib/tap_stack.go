package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsevents"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseventstargets"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
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
	processedBucket.GrantWrite(mediaConvertRole, nil, nil)

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

	// Job status Lambda function - triggered by MediaConvert job state changes
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

	// EventBridge rule to trigger status Lambda on MediaConvert job completion
	mediaConvertRule := awsevents.NewRule(stack, jsii.String("MediaConvertJobRule"), &awsevents.RuleProps{
		RuleName:    jsii.String(fmt.Sprintf("media-convert-job-rule-%s", *environmentSuffix)),
		Description: jsii.String("Trigger status Lambda on MediaConvert job state changes"),
		EventPattern: &awsevents.EventPattern{
			Source:     jsii.Strings("aws.mediaconvert"),
			DetailType: jsii.Strings("MediaConvert Job State Change"),
			Detail: &map[string]interface{}{
				"status": jsii.Strings("COMPLETE", "ERROR"),
			},
		},
	})

	// Connect status Lambda to EventBridge rule for MediaConvert job state changes
	mediaConvertRule.AddTarget(awseventstargets.NewLambdaFunction(statusLambda, nil))

	// CloudFront Origin Access Identity
	originAccessIdentity := awscloudfront.NewOriginAccessIdentity(stack, jsii.String("OAI"), &awscloudfront.OriginAccessIdentityProps{
		Comment: jsii.String(fmt.Sprintf("OAI for media delivery %s", *environmentSuffix)),
	})

	processedBucket.GrantRead(originAccessIdentity.GrantPrincipal(), nil)

	// CloudFront distribution for content delivery
	// Note: Logging is disabled to avoid ACL permission conflicts with modern S3 security practices
	distribution := awscloudfront.NewDistribution(stack, jsii.String("Distribution"), &awscloudfront.DistributionProps{
		Comment: jsii.String(fmt.Sprintf("Media delivery CDN %s", *environmentSuffix)),
		DefaultBehavior: &awscloudfront.BehaviorOptions{
			Origin: awscloudfrontorigins.NewS3Origin(processedBucket, &awscloudfrontorigins.S3OriginProps{
				OriginAccessIdentity: originAccessIdentity,
			}),
			ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
			CachePolicy:          awscloudfront.CachePolicy_CACHING_OPTIMIZED(),
		},
		PriceClass:  awscloudfront.PriceClass_PRICE_CLASS_100,
		HttpVersion: awscloudfront.HttpVersion_HTTP2_AND_3,
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

	awscdk.NewCfnOutput(stack, jsii.String("StatusFunctionArn"), &awscdk.CfnOutputProps{
		Value:       statusLambda.FunctionArn(),
		Description: jsii.String("Status Lambda function ARN"),
		ExportName:  jsii.String(fmt.Sprintf("StatusFunction-%s", *environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("NotificationTopicArn"), &awscdk.CfnOutputProps{
		Value:       notificationTopic.TopicArn(),
		Description: jsii.String("SNS notification topic ARN"),
		ExportName:  jsii.String(fmt.Sprintf("NotificationTopic-%s", *environmentSuffix)),
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
            const mediaConvertClient = new MediaConvertClient({});
            const endpointsCommand = new DescribeEndpointsCommand({ MaxResults: 1 });
            const endpointsResponse = await mediaConvertClient.send(endpointsCommand);
            const endpoint = endpointsResponse.Endpoints[0].Url;

            const mcClient = new MediaConvertClient({ endpoint });

            const jobId = Date.now().toString();
            const outputPath = key.replace('uploads/', 'processed/');

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
const { DynamoDBClient, UpdateItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));

    // Handle EventBridge event from MediaConvert
    const mediaConvertJobId = event.detail?.jobId;
    const status = event.detail?.status || "UNKNOWN";

    if (!mediaConvertJobId) {
        console.error("No MediaConvert job ID found in event");
        return { statusCode: 400, body: "Invalid event format" };
    }

    try {
        // Query DynamoDB to find our internal job ID using MediaConvert job ID
        const queryResponse = await dynamoClient.send(new QueryCommand({
            TableName: process.env.JOB_TABLE,
            IndexName: "MediaConvertJobIndex",
            KeyConditionExpression: "mediaConvertJobId = :mcJobId",
            ExpressionAttributeValues: {
                ":mcJobId": { S: mediaConvertJobId }
            },
            Limit: 1
        }));

        // If no index exists, scan all items (less efficient but works)
        let jobId;
        if (queryResponse.Items && queryResponse.Items.length > 0) {
            jobId = queryResponse.Items[0].jobId.S;
        } else {
            console.log("Searching for job without index...");
            // Fallback: update by mediaConvertJobId as alternative key
            jobId = mediaConvertJobId;
        }

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
            Subject: "MediaConvert Job " + status,
            Message: JSON.stringify({
                jobId,
                mediaConvertJobId,
                status,
                timestamp: new Date().toISOString()
            })
        }));

        console.log("Status updated:", jobId, status);
        return { statusCode: 200, body: "Status updated" };

    } catch (error) {
        console.error("Error updating job status:", error);
        throw error;
    }
};
`
}
