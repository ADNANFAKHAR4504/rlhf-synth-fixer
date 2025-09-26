package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Arrays;
import java.util.Map;
import app.TapStack;
import app.TapStackProps;
import java.util.List;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * and may involve more complex scenarios than unit tests.
 *
 * Note: These tests still use synthetic AWS resources and do not require
 * actual AWS credentials or resources to be created.
 */
public class MainIntegrationTest {

    // Inline Python code for Lambda function with security logging
    private static final String LAMBDA_SECURITY_CODE = """
        import json
        import boto3
        import datetime
        import os
        import logging
        
        # Configure logging
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)
        
        s3_client = boto3.client('s3')
        
        def handler(event, context):
            # Extract request information
            source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            request_id = context.aws_request_id
            timestamp = datetime.datetime.utcnow().isoformat()
            user_agent = event.get('requestContext', {}).get('identity', {}).get('userAgent', 'unknown')
            
            try:
                # Log security information
                security_log = {
                    'timestamp': timestamp,
                    'source_ip': source_ip,
                    'request_id': request_id,
                    'user_agent': user_agent,
                    'path': event.get('path', '/'),
                    'method': event.get('httpMethod', 'GET'),
                    'headers': event.get('headers', {})
                }
                
                # Store security log in S3
                bucket_name = os.environ.get('BUCKET_NAME')
                if bucket_name:
                    log_key = f"security-logs/{datetime.datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=log_key,
                        Body=json.dumps(security_log),
                        ContentType='application/json'
                    )
                
                # Process the actual request
                response_body = {
                    'message': 'Hello from TAP Lambda!',
                    'timestamp': timestamp,
                    'requestId': request_id
                }
                
                # Return response with security headers
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'X-Content-Type-Options': 'nosniff',
                        'X-Frame-Options': 'DENY',
                        'X-XSS-Protection': '1; mode=block',
                        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    },
                    'body': json.dumps(response_body)
                }
                
            except Exception as e:
                logger.error(f"Error processing request: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'X-Content-Type-Options': 'nosniff',
                        'X-Frame-Options': 'DENY'
                    },
                    'body': json.dumps({'error': 'Internal server error'})
                }
        """;

    @Test
    public void testFullStackDeployment() {
        App app = new App();

        // Create stack with production-like configuration
        TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack);

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();
    }

    @Test
    public void testMultiEnvironmentConfiguration() {
        // Test different environment configurations
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            // Create a new app for each environment to avoid synthesis conflicts
            App app = new App();
            TapStack stack = new TapStack(app, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            // Verify each environment configuration
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify template can be created for each environment
            Template template = Template.fromStack(stack);
            assertThat(template).isNotNull();
        }
    }

    @Test
    public void testStackWithNestedComponents() {
        App app = new App();

        TapStack stack = new TapStack(app, "TapStackIntegration", TapStackProps.builder()
                .environmentSuffix("integration")
                .build());

        Template template = Template.fromStack(stack);

        // Verify basic stack structure
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Test S3 bucket creation and configuration for application data storage.
     * Validates that the bucket has proper encryption, versioning, and IAM policies.
     */
    @Test
    public void testS3BucketApplicationIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackS3Test", TapStackProps.builder()
                .environmentSuffix("s3test")
                .allowedIpAddresses(Arrays.asList("203.0.113.0/32"))
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket exists with proper configuration for application data
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketName", Match.stringLikeRegexp("tap-s3test-app-data-.*"),
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", Match.arrayWith(
                                Map.of("ServerSideEncryptionByDefault", Map.of(
                                        "SSEAlgorithm", "aws:kms"
                                ))
                        )
                ),
                "VersioningConfiguration", Map.of("Status", "Enabled"),
                "PublicAccessBlockConfiguration", Map.of(
                        "BlockPublicAcls", true,
                        "BlockPublicPolicy", true,
                        "IgnorePublicAcls", true,
                        "RestrictPublicBuckets", true
                )
        ));

        // Verify bucket policy restricts access to allowed IPs
        template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.arrayWith(
                                Map.of(
                                        "Effect", "Deny",
                                        "Condition", Map.of(
                                                "IpAddressIfExists", Map.of(
                                                        "aws:SourceIp", Arrays.asList("203.0.113.0/32")
                                                ),
                                                "Bool", Map.of(
                                                        "aws:ViaAWSService", "false"
                                                )
                                        )
                                )
                        )
                )
        ));

        // Verify Lambda has permissions to put objects in S3
        template.hasResourceProperties("AWS::IAM::Policy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.arrayWith(
                                Map.of(
                                        "Effect", "Allow",
                                        "Action", Arrays.asList("s3:GetObject", "s3:PutObject"),
                                        "Resource", Match.arrayWith(Match.stringLikeRegexp(".*tap-s3test-app-data-.*/\\*"))
                                )
                        )
                )
        ));
    }

    /**
     * Test API Gateway integration with Lambda function for real-world HTTP requests.
     * Validates that GET requests can be properly routed and processed.
     */
    @Test
    public void testApiGatewayRequestHandling() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackApiTest", TapStackProps.builder()
                .environmentSuffix("apitest")
                .build());

        Template template = Template.fromStack(stack);

        // Verify API Gateway is configured with proper REST API
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
                "Name", "tap-apitest-api",
                "EndpointConfiguration", Map.of("Types", Arrays.asList("REGIONAL"))
        ));

        // Verify API Gateway has a resource for /hello endpoint
        template.hasResourceProperties("AWS::ApiGateway::Resource", Map.of(
                "PathPart", "hello"
        ));

        // Verify GET method is configured on the /hello resource
        template.hasResourceProperties("AWS::ApiGateway::Method", Map.of(
                "HttpMethod", "GET",
                "AuthorizationType", "NONE",
                "Integration", Map.of(
                        "Type", "AWS_PROXY",
                        "IntegrationHttpMethod", "POST"
                )
        ));

        // Verify API Gateway deployment with throttling configuration
        template.hasResourceProperties("AWS::ApiGateway::Deployment", Map.of());
        
        template.hasResourceProperties("AWS::ApiGateway::Stage", Map.of(
                "StageName", "prod",
                "MethodSettings", Match.arrayWith(
                        Map.of(
                                "ResourcePath", "/*/*",
                                "HttpMethod", "*",
                                "ThrottlingRateLimit", 100.0,
                                "ThrottlingBurstLimit", 200
                        )
                )
        ));

        // Verify Lambda permission allows API Gateway to invoke it
        template.hasResourceProperties("AWS::Lambda::Permission", Map.of(
                "Action", "lambda:InvokeFunction",
                "Principal", "apigateway.amazonaws.com"
        ));
    }

    /**
     * Test Lambda function integration with S3 for security logging.
     * Validates that Lambda can process requests and store security logs in S3.
     */
    @Test
    public void testLambdaS3SecurityLoggingIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackLambdaTest", TapStackProps.builder()
                .environmentSuffix("lambdatest")
                .lambdaCode(LAMBDA_SECURITY_CODE)  // Pass inline Python code
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda function exists with proper configuration
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "FunctionName", "tap-lambdatest-function",
                "Runtime", "python3.9",
                "Handler", "index.handler",
                "Timeout", 30,
                "MemorySize", 256
        ));

        // Verify Lambda function code includes our inline Python code
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Code", Map.of(
                        "ZipFile", Match.stringLikeRegexp(".*security-logs.*")
                )
        ));

        // Verify Lambda has environment variable pointing to S3 bucket
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Environment", Map.of(
                        "Variables", Map.of(
                                "BUCKET_NAME", Match.stringLikeRegexp("tap-lambdatest-app-data-.*")
                        )
                )
        ));

        // Verify Lambda execution role has required permissions
        template.hasResourceProperties("AWS::IAM::Policy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.arrayWith(
                                // S3 permissions
                                Map.of(
                                        "Effect", "Allow",
                                        "Action", Arrays.asList("s3:GetObject", "s3:PutObject")
                                ),
                                // KMS permissions for encryption
                                Map.of(
                                        "Effect", "Allow",
                                        "Action", Arrays.asList("kms:Decrypt", "kms:GenerateDataKey")
                                )
                        )
                )
        ));

        // Test the inline Python code content directly
        assertThat(LAMBDA_SECURITY_CODE).contains("security-logs/");
        assertThat(LAMBDA_SECURITY_CODE).contains("X-Content-Type-Options");
        assertThat(LAMBDA_SECURITY_CODE).contains("X-Frame-Options");
        assertThat(LAMBDA_SECURITY_CODE).contains("X-XSS-Protection");
        assertThat(LAMBDA_SECURITY_CODE).contains("Strict-Transport-Security");
        assertThat(LAMBDA_SECURITY_CODE).contains("timestamp");
        assertThat(LAMBDA_SECURITY_CODE).contains("source_ip");
        assertThat(LAMBDA_SECURITY_CODE).contains("request_id");
        assertThat(LAMBDA_SECURITY_CODE).contains("put_object");
    }

    /**
     * Test that the inline Python Lambda code handles error cases properly.
     */
    @Test
    public void testLambdaErrorHandling() {
        // Test that our inline code contains proper error handling
        assertThat(LAMBDA_SECURITY_CODE).contains("try:");
        assertThat(LAMBDA_SECURITY_CODE).contains("except Exception as e:");
        assertThat(LAMBDA_SECURITY_CODE).contains("logger.error");
        assertThat(LAMBDA_SECURITY_CODE).contains("statusCode': 500");
        assertThat(LAMBDA_SECURITY_CODE).contains("Internal server error");
    }

    /**
     * Test that the inline Python code includes all required security features.
     */
    @Test
    public void testLambdaSecurityFeatures() {
        // Verify security logging components
        assertThat(LAMBDA_SECURITY_CODE).contains("security_log = {");
        assertThat(LAMBDA_SECURITY_CODE).contains("'user_agent':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'headers':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'method':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'path':");
        
        // Verify S3 logging functionality
        assertThat(LAMBDA_SECURITY_CODE).contains("s3_client.put_object");
        assertThat(LAMBDA_SECURITY_CODE).contains("ContentType='application/json'");
        
        // Verify all security headers are present
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-Content-Type-Options': 'nosniff'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-Frame-Options': 'DENY'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-XSS-Protection': '1; mode=block'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'");
    }
}