package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;

import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.EventType;
import software.amazon.awscdk.services.s3.notifications.LambdaDestination;

import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.destinations.SqsDestination;

import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sqs.Queue;

import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;


import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.Instant;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Main CDK stack for serverless file processing infrastructure.
 * 
 * This stack creates:
 * - S3 bucket with encryption and versioning
 * - Lambda function triggered by S3 events
 * - SNS topic for notifications
 * - SQS dead-letter queue for error handling
 * - Proper IAM roles and permissions
 */
class TapStackProd extends Stack {
    private final String environmentSuffix;

    public TapStackProd(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("Prod");

        // Add timestamp to make function names unique and avoid conflicts
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        // Create SQS Dead Letter Queue for Lambda failures
        Queue deadLetterQueue = Queue.Builder.create(this, "FileProcessorDLQ" + environmentSuffix + "Primary3")
                .queueName("file-processor-dlq-" + environmentSuffix.toLowerCase() + "-primary-3")
                .build();

        // Create SNS Topic for notifications
        Topic notificationTopic = Topic.Builder.create(this, "FileProcessorTopic" + environmentSuffix + "Primary3")
                .topicName("file-processor-notifications-" + environmentSuffix.toLowerCase() + "-primary-3")
                .build();

        // Create IAM role for Lambda function
        Role lambdaRole = Role.Builder.create(this, "FileProcessorRole" + environmentSuffix + "Primary3")
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .build();

        // Add basic Lambda execution policy
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                ))
                .resources(List.of("arn:aws:logs:" + this.getRegion() + ":" + this.getAccount() + ":log-group:/aws/lambda/file-processor-" + environmentSuffix.toLowerCase() + "-primary-3-" + timestamp + "*"))
                .build());

        // Add S3 permissions
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                ))
                .resources(List.of("arn:aws:s3:::*/*"))
                .build());

        // Add SNS publish permissions
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of("sns:Publish"))
                .resources(List.of(notificationTopic.getTopicArn()))
                .build());

        // Add SQS permissions for dead letter queue
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of("sqs:SendMessage"))
                .resources(List.of(deadLetterQueue.getQueueArn()))
                .build());

        // Create Lambda function
        Function fileProcessorFunction = Function.Builder.create(this, "FileProcessorFunction" + environmentSuffix + "Primary3")
                .functionName("file-processor-" + environmentSuffix.toLowerCase() + "-primary-3-" + timestamp)
                .runtime(Runtime.PYTHON_3_12)
                .handler("index.handler")
                .code(Code.fromInline(
                        "import json\n" +
                        "import boto3\n" +
                        "import logging\n" +
                        "import os\n" +
                        "from urllib.parse import unquote_plus\n" +
                        "\n" +
                        "# Configure logging\n" +
                        "logger = logging.getLogger()\n" +
                        "logger.setLevel(logging.INFO)\n" +
                        "\n" +
                        "# Initialize AWS clients\n" +
                        "sns_client = boto3.client('sns')\n" +
                        "\n" +
                        "def handler(event, context):\n" +
                        "    \"\"\"Process S3 bucket events and notify via SNS\"\"\"\n" +
                        "    \n" +
                        "    try:\n" +
                        "        # Log the incoming event\n" +
                        "        logger.info('Received event: %s', json.dumps(event))\n" +
                        "        \n" +
                        "        # Process each record in the S3 event\n" +
                        "        for record in event['Records']:\n" +
                        "            # Extract S3 information\n" +
                        "            bucket_name = record['s3']['bucket']['name']\n" +
                        "            object_key = unquote_plus(record['s3']['object']['key'])\n" +
                        "            event_name = record['eventName']\n" +
                        "            \n" +
                        "            logger.info('Processing file: %s in bucket: %s (event: %s)', \n" +
                        "                       object_key, bucket_name, event_name)\n" +
                        "            \n" +
                        "            # Create notification message\n" +
                        "            message = {\n" +
                        "                'bucket': bucket_name,\n" +
                        "                'key': object_key,\n" +
                        "                'eventName': event_name,\n" +
                        "                'timestamp': record['eventTime'],\n" +
                        "                'region': record['awsRegion']\n" +
                        "            }\n" +
                        "            \n" +
                        "            # Publish to SNS topic\n" +
                        "            sns_response = sns_client.publish(\n" +
                        "                TopicArn=os.environ['SNS_TOPIC_ARN'],\n" +
                        "                Subject=f'File {event_name}: {object_key}',\n" +
                        "                Message=json.dumps(message, indent=2)\n" +
                        "            )\n" +
                        "            \n" +
                        "            logger.info('SNS message published: %s', sns_response['MessageId'])\n" +
                        "        \n" +
                        "        return {\n" +
                        "            'statusCode': 200,\n" +
                        "            'body': json.dumps('Successfully processed S3 event')\n" +
                        "        }\n" +
                        "        \n" +
                        "    except Exception as e:\n" +
                        "        logger.error('Error processing S3 event: %s', str(e))\n" +
                        "        raise e"
                ))
                .role(lambdaRole)
                .maxEventAge(Duration.hours(2))
                .retryAttempts(2)
                .onFailure(new SqsDestination(deadLetterQueue))
                .environment(Map.of(
                        "SNS_TOPIC_ARN", notificationTopic.getTopicArn(),
                        "AWS_ENDPOINT_URL", "http://localhost:4566"
                ))
                .build();

        // Create S3 bucket with encryption and versioning
        Bucket fileBucket = Bucket.Builder.create(this, "FileProcessorBucket" + environmentSuffix + "Primary3")
                .bucketName("file-processor-bucket-" + environmentSuffix.toLowerCase() + "-primary-3-" +
                           this.getAccount() + "-" + this.getRegion())
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();

        // Add S3 bucket permissions to Lambda role
        fileBucket.grantRead(lambdaRole);

        // Add S3 event notification
        fileBucket.addEventNotification(
                EventType.OBJECT_CREATED,
                new LambdaDestination(fileProcessorFunction)
        );

        // Add Environment tag to all resources
        Tags.of(this).add("Environment", "Production");

        // Create CloudFormation outputs for integration testing
        CfnOutput.Builder.create(this, "LambdaFunctionArn" + environmentSuffix + "Primary3")
                .exportName("FileProcessorLambdaArn" + environmentSuffix + "Primary3")
                .value(fileProcessorFunction.getFunctionArn())
                .description("ARN of the file processor Lambda function")
                .build();

        CfnOutput.Builder.create(this, "S3BucketName" + environmentSuffix + "Primary3")
                .exportName("FileProcessorS3Bucket" + environmentSuffix + "Primary3")
                .value(fileBucket.getBucketName())
                .description("Name of the file processor S3 bucket")
                .build();

        CfnOutput.Builder.create(this, "SNSTopicArn" + environmentSuffix + "Primary3")
                .exportName("FileProcessorSNSTopicArn" + environmentSuffix + "Primary3")
                .value(notificationTopic.getTopicArn())
                .description("ARN of the SNS notification topic")
                .build();

        CfnOutput.Builder.create(this, "SQSDeadLetterQueueUrl" + environmentSuffix + "Primary3")
                .exportName("FileProcessorDLQUrl" + environmentSuffix + "Primary3")
                .value(deadLetterQueue.getQueueUrl())
                .description("URL of the SQS dead letter queue")
                .build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the CDK application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'Prod'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "Prod";
        }

        // Create the serverless stack
        new TapStackProd(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
