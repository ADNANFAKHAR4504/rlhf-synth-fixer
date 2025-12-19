package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.apigateway.DomainName;
import software.amazon.awscdk.services.apigateway.EndpointType;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.SecurityPolicy;
import software.amazon.awscdk.services.certificatemanager.Certificate;
import software.amazon.awscdk.services.certificatemanager.ICertificate;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Architecture;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.IHostedZone;
import software.amazon.awscdk.services.route53.RecordSet;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.RecordType;
import software.amazon.awscdk.services.route53.targets.ApiGatewayDomain;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

/**
 * Main entry point for the TAP CDK Java application.
 * 
 * This class contains the complete serverless video streaming infrastructure implementation
 * including API Gateway, Lambda Functions, S3 Buckets, IAM Roles, CloudWatch monitoring,
 * and Route 53 custom domain configuration.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = Optional.ofNullable((String) app.getNode().tryGetContext("environmentSuffix"))
                .orElse("dev");

        // Create the main TAP stack with all infrastructure inline
        createTapStack(app, environmentSuffix);

        // Synthesize the CDK app
        app.synth();
    }

    private static void createTapStack(final App app, final String environmentSuffix) {
        new Stack(app, "TapStack" + environmentSuffix, StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build()) {
            
            {
                // Create all infrastructure components
                createInfrastructure(environmentSuffix);
            }

            private void createInfrastructure(final String envSuffix) {
                // ===== KMS ENCRYPTION KEY =====
                Key kmsKey = Key.Builder.create(this, "TapKmsKey")
                        .description("KMS key for Tap project encryption - " + envSuffix)
                        .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                        .build();

                // ===== S3 BUCKETS =====
                Bucket videoBucket = createS3Bucket("TapVideoBucket", "tap-video-bucket", envSuffix, kmsKey);
                Bucket logsBucket = createS3Bucket("TapLogsBucket", "tap-logs-bucket", envSuffix, kmsKey);

                // ===== IAM COMPONENTS =====
                PolicyDocument uploadPolicy = createUploadPolicy(videoBucket, kmsKey);
                PolicyDocument processPolicy = createProcessPolicy(videoBucket, kmsKey);
                Role videoUploadRole = createRole("VideoUploadRole", "tap-video-upload-role", envSuffix, uploadPolicy);
                Role videoProcessRole = createRole("VideoProcessRole", "tap-video-process-role", envSuffix, processPolicy);

                // ===== LAMBDA COMPONENTS =====
                LogGroup uploadLogGroup = createLogGroup("VideoUploadLogGroup", "tap-video-upload", envSuffix);
                LogGroup processLogGroup = createLogGroup("VideoProcessLogGroup", "tap-video-process", envSuffix);
                Function videoUploadFunction = createLambdaFunction("VideoUploadFunction", "tap-video-upload", 
                        envSuffix, videoUploadRole, uploadLogGroup, videoBucket, "video_upload_handler");
                Function videoProcessFunction = createLambdaFunction("VideoProcessFunction", "tap-video-process", 
                        envSuffix, videoProcessRole, processLogGroup, videoBucket, "video_process_handler");

                // ===== API GATEWAY =====
                RestApi api = createApiGateway(envSuffix, videoUploadFunction, videoProcessFunction);

                // ===== OPTIONAL CUSTOM DOMAIN =====
                setupCustomDomain(api);

                // ===== MONITORING =====
                createCloudWatchAlarms(envSuffix, videoUploadFunction, videoProcessFunction);

                // ===== OUTPUTS =====
                createStackOutputs(api, videoBucket, envSuffix);
            }

            private Bucket createS3Bucket(final String id, final String namePrefix, final String envSuffix, final Key kmsKey) {
                return Bucket.Builder.create(this, id)
                        .bucketName(namePrefix + "-" + envSuffix + "-" + this.getAccount())
                        .versioned(true)
                        .encryption(BucketEncryption.KMS)
                        .encryptionKey(kmsKey)
                        .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                        .autoDeleteObjects(true)
                        .build();
            }

            private PolicyDocument createUploadPolicy(final Bucket videoBucket, final Key kmsKey) {
                return PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            createBasicLambdaStatement(),
                            createS3Statement("s3:PutObject", videoBucket),
                            createKmsStatement(Arrays.asList("kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", 
                                    "kms:GenerateDataKey*", "kms:DescribeKey"), kmsKey)
                        ))
                        .build();
            }

            private PolicyDocument createProcessPolicy(final Bucket videoBucket, final Key kmsKey) {
                return PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            createBasicLambdaStatement(),
                            createS3Statement("s3:GetObject", videoBucket),
                            createKmsStatement(Arrays.asList("kms:Decrypt", "kms:DescribeKey"), kmsKey)
                        ))
                        .build();
            }

            private PolicyStatement createBasicLambdaStatement() {
                return PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList("logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"))
                        .resources(Arrays.asList("arn:aws:logs:*:*:*"))
                        .build();
            }

            private PolicyStatement createS3Statement(final String action, final Bucket bucket) {
                return PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList(action))
                        .resources(Arrays.asList(bucket.getBucketArn() + "/*"))
                        .build();
            }

            private PolicyStatement createKmsStatement(final java.util.List<String> actions, final Key kmsKey) {
                return PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(actions)
                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                        .build();
            }

            private Role createRole(final String id, final String namePrefix, final String envSuffix, final PolicyDocument policy) {
                return Role.Builder.create(this, id)
                        .roleName(namePrefix + "-" + envSuffix)
                        .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                        .inlinePolicies(Map.of(id + "Policy", policy))
                        .build();
            }

            private LogGroup createLogGroup(final String id, final String namePrefix, final String envSuffix) {
                return LogGroup.Builder.create(this, id)
                        .logGroupName("/aws/lambda/" + namePrefix + "-" + envSuffix)
                        .retention(RetentionDays.TWO_WEEKS)
                        .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                        .build();
            }

            private Function createLambdaFunction(final String id, final String namePrefix, final String envSuffix,
                    final Role role, final LogGroup logGroup, final Bucket videoBucket, final String handler) {
                return Function.Builder.create(this, id)
                        .functionName(namePrefix + "-" + envSuffix)
                        .runtime(Runtime.PYTHON_3_11)
                        .architecture(Architecture.ARM_64)
                        .memorySize(128)
                        .timeout(Duration.seconds(30))
                        .handler("index." + handler)
                        .code(Code.fromInline(getLambdaCode()))
                        .role(role)
                        .logGroup(logGroup)
                        .environment(Map.of("VIDEO_BUCKET_NAME", videoBucket.getBucketName(), "ENVIRONMENT", envSuffix))
                        .build();
            }

            private String getLambdaCode() {
                return """
import json
import boto3
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def video_upload_handler(event, context):
    '''
    Handles video upload requests to S3 bucket.
    '''
    try:
        logger.info('Video upload handler invoked')
        
        # Get environment variables
        bucket_name = os.environ.get('VIDEO_BUCKET_NAME')
        environment = os.environ.get('ENVIRONMENT', 'dev')
        
        if not bucket_name:
            raise ValueError('VIDEO_BUCKET_NAME environment variable not set')
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename', 'default-video.mp4')
        
        logger.info(f'Processing upload for file: {filename} in environment: {environment}')
        
        # Generate presigned URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': filename},
            ExpiresIn=3600  # 1 hour
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Upload URL generated successfully',
                'uploadUrl': presigned_url,
                'filename': filename,
                'environment': environment
            })
        }
        
    except Exception as e:
        logger.error(f'Error in video upload handler: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def video_process_handler(event, context):
    '''
    Handles video processing requests from S3 bucket.
    '''
    try:
        logger.info('Video process handler invoked')
        
        # Get environment variables
        bucket_name = os.environ.get('VIDEO_BUCKET_NAME')
        environment = os.environ.get('ENVIRONMENT', 'dev')
        
        if not bucket_name:
            raise ValueError('VIDEO_BUCKET_NAME environment variable not set')
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename', 'default-video.mp4')
        
        logger.info(f'Processing video: {filename} in environment: {environment}')
        
        # Check if file exists in S3
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=filename)
            file_size = response['ContentLength']
            last_modified = response['LastModified'].isoformat()
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'File not found',
                    'filename': filename
                })
            }
        
        # Simulate video processing
        processing_status = 'completed'
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Video processed successfully',
                'filename': filename,
                'environment': environment,
                'fileSize': file_size,
                'lastModified': last_modified,
                'processingStatus': processing_status
            })
        }
        
    except Exception as e:
        logger.error(f'Error in video process handler: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
                """;
            }

            private RestApi createApiGateway(final String envSuffix, final Function uploadFunction, final Function processFunction) {
                RestApi api = RestApi.Builder.create(this, "TapApi")
                        .restApiName("tap-api-" + envSuffix)
                        .description("Tap Video Streaming API - " + envSuffix)
                        .endpointTypes(Arrays.asList(EndpointType.REGIONAL))
                        .build();

                // Configure endpoints
                api.getRoot().addResource("upload").addMethod("POST", new LambdaIntegration(uploadFunction));
                api.getRoot().addResource("process").addMethod("POST", new LambdaIntegration(processFunction));
                
                return api;
            }

            private void setupCustomDomain(final RestApi api) {
                String certificateArn = (String) this.getNode().tryGetContext("certificateArn");
                String hostedZoneId = (String) this.getNode().tryGetContext("hostedZoneId");
                String domainName = (String) this.getNode().tryGetContext("domainName");

                if (certificateArn != null && hostedZoneId != null && domainName != null) {
                    ICertificate certificate = Certificate.fromCertificateArn(this, "ApiCertificate", certificateArn);
                    
                    DomainName apiDomainName = DomainName.Builder.create(this, "ApiDomainName")
                            .domainName(domainName)
                            .certificate(certificate)
                            .endpointType(EndpointType.REGIONAL)
                            .securityPolicy(SecurityPolicy.TLS_1_2)
                            .build();

                    apiDomainName.addBasePathMapping(api);

                    IHostedZone hostedZone = HostedZone.fromHostedZoneId(this, "HostedZone", hostedZoneId);
                    RecordSet.Builder.create(this, "ApiDomainRecord")
                            .zone(hostedZone)
                            .recordName(domainName)
                            .recordType(RecordType.A)
                            .target(RecordTarget.fromAlias(new ApiGatewayDomain(apiDomainName)))
                            .build();
                }
            }

            private void createCloudWatchAlarms(final String envSuffix, final Function uploadFunction, final Function processFunction) {
                createAlarm("VideoUploadErrorAlarm", "tap-video-upload-errors", envSuffix, uploadFunction);
                createAlarm("VideoProcessErrorAlarm", "tap-video-process-errors", envSuffix, processFunction);
            }

            private void createAlarm(final String id, final String namePrefix, final String envSuffix, final Function function) {
                Alarm.Builder.create(this, id)
                        .alarmName(namePrefix + "-" + envSuffix)
                        .alarmDescription("Function error rate exceeds 5%")
                        .metric(Metric.Builder.create()
                                .namespace("AWS/Lambda")
                                .metricName("ErrorRate")
                                .dimensionsMap(Map.of("FunctionName", function.getFunctionName()))
                                .statistic("Average")
                                .period(Duration.minutes(5))
                                .build())
                        .threshold(5.0)
                        .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                        .evaluationPeriods(1)
                        .treatMissingData(TreatMissingData.NOT_BREACHING)
                        .build();
            }

            private void createStackOutputs(final RestApi api, final Bucket videoBucket, final String envSuffix) {
                CfnOutput.Builder.create(this, "ApiGatewayUrl")
                        .description("API Gateway URL")
                        .value(api.getUrl())
                        .build();

                CfnOutput.Builder.create(this, "VideoBucketName")
                        .description("Video storage bucket name")
                        .value(videoBucket.getBucketName())
                        .build();

                CfnOutput.Builder.create(this, "Environment")
                        .description("Environment suffix")
                        .value(envSuffix)
                        .build();
            }
        };
    }
}
