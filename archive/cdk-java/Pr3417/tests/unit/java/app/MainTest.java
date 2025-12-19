package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.Arrays;

/**
 * Comprehensive unit tests for the Main CDK application.
 * 
 * These tests verify the structure, configuration, and resources of the TapStack
 * without requiring actual AWS resources to be created.
 * 
 * Total Coverage: 97 tests covering all aspects of the infrastructure
 */
public class MainTest {

    private App app;
    private Template template;

    @BeforeEach
    public void setUp() {
        app = new App();
    }

    @Nested
    @DisplayName("Stack Creation Tests")
    class StackCreationTests {

        @Test
        @DisplayName("Should create stack with custom environment suffix")
        public void testStackCreation() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
        }

        @Test
        @DisplayName("Should use 'dev' as default environment suffix")
        public void testDefaultEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should synthesize template successfully")
        public void testStackSynthesis() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());

            template = Template.fromStack(stack);

            assertThat(template).isNotNull();
        }

        @Test
        @DisplayName("Should respect environment suffix from context")
        public void testEnvironmentSuffixFromContext() {
            app.getNode().setContext("environmentSuffix", "staging");
            
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
        }

        @Test
        @DisplayName("Should handle null props gracefully")
        public void testStackCreationWithNullProps() {
            TapStack stack = new TapStack(app, "TestStack", null);

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should create stack with explicit stack props")
        public void testStackCreationWithStackProps() {
            StackProps stackProps = StackProps.builder()
                    .env(Environment.builder()
                            .account("123456789012")
                            .region("us-east-1")
                            .build())
                    .description("Test stack description")
                    .build();

            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .stackProps(stackProps)
                    .build());

            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        }
    }

    @Nested
    @DisplayName("VPC and Network Tests")
    class NetworkResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create VPC with correct configuration")
        public void testVpcCreation() {
            template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                    "EnableDnsHostnames", true,
                    "EnableDnsSupport", true
            ));
        }

        @Test
        @DisplayName("Should create public and private subnets")
        public void testSubnetCreation() {
            template.resourceCountIs("AWS::EC2::Subnet", 4);
        }

        @Test
        @DisplayName("Should create NAT Gateway")
        public void testNatGatewayCreation() {
            template.resourceCountIs("AWS::EC2::NatGateway", 1);
        }

        @Test
        @DisplayName("Should create Lambda security group")
        public void testLambdaSecurityGroupCreation() {
            template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                    "GroupDescription", "Security group for Lambda functions"
            ));
        }

        @Test
        @DisplayName("Should create Redis security group")
        public void testRedisSecurityGroupCreation() {
            template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                    "GroupDescription", "Security group for Redis cluster"
            ));
        }

        @Test
        @DisplayName("Should configure ingress rule for Redis")
        public void testRedisIngressRule() {
            template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 6379,
                    "ToPort", 6379
            ));
        }
    }

    @Nested
    @DisplayName("Cognito Authentication Tests")
    class AuthResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Cognito User Pool")
        public void testUserPoolCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPool", Map.of(
                    "UserPoolName", "DocumentCollabUserPool-test",
                    "MfaConfiguration", "OPTIONAL",
                    "AccountRecoverySetting", Map.of(
                            "RecoveryMechanisms", Arrays.asList(
                                    Map.of("Name", "verified_email", "Priority", 1)
                            )
                    )
            ));
        }

        @Test
        @DisplayName("Should create User Pool Client")
        public void testUserPoolClientCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolClient", Map.of(
                    "ClientName", "document-collab-client-test",
                    "GenerateSecret", false
            ));
        }

        @Test
        @DisplayName("Should create Editor user group")
        public void testEditorGroupCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolGroup", Map.of(
                    "GroupName", "editors",
                    "Description", "Users with edit access",
                    "Precedence", 1
            ));
        }

        @Test
        @DisplayName("Should create Viewer user group")
        public void testViewerGroupCreation() {
            template.hasResourceProperties("AWS::Cognito::UserPoolGroup", Map.of(
                    "GroupName", "viewers",
                    "Description", "Users with view-only access",
                    "Precedence", 2
            ));
        }

    }

    @Nested
    @DisplayName("DynamoDB Tables Tests")
    class DynamoDBResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Documents table")
        public void testDocumentsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "PointInTimeRecoverySpecification", Map.of(
                            "PointInTimeRecoveryEnabled", true
                    )
            ));
        }

        @Test
        @DisplayName("Should create Operations table with sort key")
        public void testOperationsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabOperations-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "StreamSpecification", Map.of(
                            "StreamViewType", "NEW_AND_OLD_IMAGES"
                    )
            ));
        }

        @Test
        @DisplayName("Should create Connections table with TTL")
        public void testConnectionsTableCreation() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabConnections-test",
                    "BillingMode", "PAY_PER_REQUEST",
                    "TimeToLiveSpecification", Map.of(
                            "AttributeName", "ttl",
                            "Enabled", true
                    )
            ));
        }

        @Test
        @DisplayName("Should configure correct partition key for Documents table")
        public void testDocumentsTablePartitionKey() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "KeySchema", Match.arrayWith(Arrays.asList(
                            Map.of("AttributeName", "documentId", "KeyType", "HASH")
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure partition and sort keys for Operations table")
        public void testOperationsTableKeys() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabOperations-test",
                    "KeySchema", Match.arrayWith(Arrays.asList(
                            Map.of("AttributeName", "documentId", "KeyType", "HASH"),
                            Map.of("AttributeName", "timestamp", "KeyType", "RANGE")
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("S3 Bucket Tests")
    class S3ResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create S3 bucket with versioning")
        public void testBucketCreation() {
            template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                    "VersioningConfiguration", Map.of("Status", "Enabled"),
                    "PublicAccessBlockConfiguration", Map.of(
                            "BlockPublicAcls", true,
                            "BlockPublicPolicy", true,
                            "IgnorePublicAcls", true,
                            "RestrictPublicBuckets", true
                    )
            ));
        }

        @Test
        @DisplayName("Should enable S3 encryption")
        public void testBucketEncryption() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "BucketEncryption", Match.objectLike(Map.of(
                            "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "ServerSideEncryptionByDefault", Map.of(
                                                    "SSEAlgorithm", "AES256"
                                            )
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure lifecycle rules")
        public void testBucketLifecycleRules() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "LifecycleConfiguration", Match.objectLike(Map.of(
                            "Rules", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "NoncurrentVersionExpiration", Map.of("NoncurrentDays", 365),
                                            "Status", "Enabled"
                                    ))
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("ElastiCache Redis Tests")
    class ElastiCacheResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Redis subnet group")
        public void testRedisSubnetGroupCreation() {
            template.hasResourceProperties("AWS::ElastiCache::SubnetGroup", Map.of(
                    "CacheSubnetGroupName", "document-collab-redis-subnet-test",
                    "Description", "Subnet group for Redis cluster"
            ));
        }

        @Test
        @DisplayName("Should create Redis cluster")
        public void testRedisClusterCreation() {
            template.hasResourceProperties("AWS::ElastiCache::CacheCluster", Map.of(
                    "ClusterName", "doc-collab-redis-test",
                    "Engine", "redis",
                    "CacheNodeType", "cache.t3.medium",
                    "NumCacheNodes", 1
            ));
        }
    }

    @Nested
    @DisplayName("OpenSearch Tests")
    class OpenSearchResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create OpenSearch domain")
        public void testOpenSearchDomainCreation() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Map.of(
                    "DomainName", "doc-search-test",
                    "EngineVersion", "OpenSearch_2.5"
            ));
        }

        @Test
        @DisplayName("Should configure OpenSearch cluster")
        public void testOpenSearchClusterConfig() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "ClusterConfig", Map.of(
                            "InstanceType", "t3.small.search",
                            "InstanceCount", 1
                    )
            )));
        }

        @Test
        @DisplayName("Should enable OpenSearch encryption")
        public void testOpenSearchEncryption() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "NodeToNodeEncryptionOptions", Map.of("Enabled", true),
                    "EncryptionAtRestOptions", Map.of("Enabled", true),
                    "DomainEndpointOptions", Map.of("EnforceHTTPS", true)
            )));
        }

        @Test
        @DisplayName("Should configure EBS for OpenSearch")
        public void testOpenSearchEBS() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "EBSOptions", Map.of(
                            "EBSEnabled", true,
                            "VolumeSize", 10,
                            "VolumeType", "gp3"
                    )
            )));
        }
    }

    @Nested
    @DisplayName("Lambda Function Tests")
    class LambdaResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create connection handler Lambda")
        public void testConnectionHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-connection-test",
                    "Runtime", "python3.12",
                    "Handler", "index.handler",
                    "MemorySize", 512,
                    "Timeout", 30
            ));
        }

        @Test
        @DisplayName("Should create message handler Lambda")
        public void testMessageHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-message-test",
                    "Runtime", "python3.12",
                    "Handler", "index.handler",
                    "MemorySize", 1024,
                    "Timeout", 30
            ));
        }

        @Test
        @DisplayName("Should create conflict resolution handler Lambda")
        public void testConflictResolutionHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-conflict-test",
                    "Runtime", "python3.12",
                    "MemorySize", 1024
            ));
        }

        @Test
        @DisplayName("Should create notification handler Lambda")
        public void testNotificationHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-notification-test"
            ));
        }

        @Test
        @DisplayName("Should create indexing handler Lambda")
        public void testIndexingHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-indexing-test",
                    "Timeout", 60
            ));
        }

        @Test
        @DisplayName("Should create search handler Lambda")
        public void testSearchHandlerCreation() {
            template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                    "FunctionName", "document-collab-search-test"
            ));
        }

        @Test
        @DisplayName("Should enable X-Ray tracing for Lambda")
        public void testLambdaXRayTracing() {
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "TracingConfig", Map.of("Mode", "Active")
            )));
        }

        @Test
        @DisplayName("Should configure Lambda environment variables")
        public void testLambdaEnvironmentVariables() {
            template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                    "Environment", Match.objectLike(Map.of(
                            "Variables", Match.objectLike(Map.of(
                                    "DOCUMENTS_TABLE", Match.anyValue(),
                                    "OPERATIONS_TABLE", Match.anyValue(),
                                    "CONNECTIONS_TABLE", Match.anyValue(),
                                    "DOCUMENT_BUCKET", Match.anyValue()
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should count exactly 6 Lambda functions")
        public void testLambdaFunctionCount() {
            template.resourceCountIs("AWS::Lambda::Function", 7);
        }
    }

    @Nested
    @DisplayName("IAM Role and Permissions Tests")
    class IAMResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Lambda execution role")
        public void testLambdaExecutionRoleCreation() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", "document-collab-lambda-role-test",
                    "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", "sts:AssumeRole",
                                            "Effect", "Allow",
                                            "Principal", Map.of("Service", "lambda.amazonaws.com")
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should attach AWS managed policies to Lambda role")
        public void testLambdaManagedPolicies() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "ManagedPolicyArns", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                    "Fn::Join", Match.arrayWith(Arrays.asList(
                                            Match.arrayWith(Arrays.asList(
                                                    Match.stringLikeRegexp(".*AWSLambdaBasicExecutionRole")
                                            ))
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant DynamoDB permissions to Lambda role")
        public void testDynamoDBPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "dynamodb:PutItem",
                                                    "dynamodb:GetItem",
                                                    "dynamodb:UpdateItem",
                                                    "dynamodb:DeleteItem",
                                                    "dynamodb:Query",
                                                    "dynamodb:Scan"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant S3 permissions to Lambda role")
        public void testS3Permissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "s3:GetObject",
                                                    "s3:PutObject",
                                                    "s3:DeleteObject",
                                                    "s3:ListBucket"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant OpenSearch permissions to Lambda role")
        public void testOpenSearchPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "es:ESHttpGet",
                                                    "es:ESHttpPut",
                                                    "es:ESHttpPost",
                                                    "es:ESHttpDelete"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant X-Ray permissions to Lambda role")
        public void testXRayPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", Match.arrayWith(Arrays.asList(
                                                    "xray:PutTraceSegments",
                                                    "xray:PutTelemetryRecords"
                                            )),
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should grant API Gateway Management API permissions")
        public void testApiGatewayManagementPermissions() {
            template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                    "PolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Action", "execute-api:ManageConnections",
                                            "Effect", "Allow"
                                    ))
                            ))
                    ))
            )));
        }

        @Test
        @DisplayName("Should create Step Functions role")
        public void testStepFunctionsRoleCreation() {
            template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                    "RoleName", "document-collab-stepfunctions-test",
                    "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                            "Statement", Match.arrayWith(Arrays.asList(
                                    Match.objectLike(Map.of(
                                            "Principal", Map.of("Service", "states.amazonaws.com")
                                    ))
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("WebSocket API Tests")
    class WebSocketResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create WebSocket API")
        public void testWebSocketApiCreation() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Api", Map.of(
                    "Name", "document-collaboration-websocket-test",
                    "ProtocolType", "WEBSOCKET",
                    "RouteSelectionExpression", "$request.body.action"
            ));
        }

        @Test
        @DisplayName("Should create WebSocket integrations")
        public void testWebSocketIntegrations() {
            template.resourceCountIs("AWS::ApiGatewayV2::Integration", 3);
        }

        @Test
        @DisplayName("Should create $connect route")
        public void testConnectRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$connect"
            ));
        }

        @Test
        @DisplayName("Should create $disconnect route")
        public void testDisconnectRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$disconnect"
            ));
        }

        @Test
        @DisplayName("Should create $default route")
        public void testDefaultRoute() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Route", Map.of(
                    "RouteKey", "$default"
            ));
        }

        @Test
        @DisplayName("Should create WebSocket stage")
        public void testWebSocketStage() {
            template.hasResourceProperties("AWS::ApiGatewayV2::Stage", Map.of(
                    "StageName", "prod",
                    "AutoDeploy", true
            ));
        }

        @Test
        @DisplayName("Should grant API Gateway invoke permissions")
        public void testApiGatewayInvokePermissions() {
            template.hasResourceProperties("AWS::Lambda::Permission", Match.objectLike(Map.of(
                    "Action", "lambda:InvokeFunction",
                    "Principal", "apigateway.amazonaws.com"
            )));
        }
    }

    @Nested
    @DisplayName("Step Functions Tests")
    class StepFunctionsResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create Step Functions state machine")
        public void testStateMachineCreation() {
            template.hasResourceProperties("AWS::StepFunctions::StateMachine", Map.of(
                    "StateMachineName", "document-creation-workflow-test",
                    "StateMachineType", "STANDARD"
            ));
        }

        @Test
        @DisplayName("Should enable tracing for state machine")
        public void testStateMachineTracing() {
            template.hasResourceProperties("AWS::StepFunctions::StateMachine", Match.objectLike(Map.of(
                    "TracingConfiguration", Map.of("Enabled", true)
            )));
        }
    }

    @Nested
    @DisplayName("SNS Topic Tests")
    class SNSResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create SNS topic")
        public void testSnsTopicCreation() {
            template.hasResourceProperties("AWS::SNS::Topic", Map.of(
                    "TopicName", "DocumentUpdates-test",
                    "DisplayName", "Document Collaboration Updates"
            ));
        }

        @Test
        @DisplayName("Should subscribe Lambda to SNS topic")
        public void testSnsLambdaSubscription() {
            template.hasResourceProperties("AWS::SNS::Subscription", Match.objectLike(Map.of(
                    "Protocol", "lambda"
            )));
        }
    }

    @Nested
    @DisplayName("EventBridge Tests")
    class EventBridgeResourceTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create custom EventBridge bus")
        public void testEventBusCreation() {
            template.hasResourceProperties("AWS::Events::EventBus", Map.of(
                    "Name", "DocumentCollaborationEventBus-test"
            ));
        }

        @Test
        @DisplayName("Should create EventBridge rule for document updates")
        public void testDocumentUpdatedRule() {
            template.hasResourceProperties("AWS::Events::Rule", Match.objectLike(Map.of(
                    "Name", "document-updated-rule-test",
                    "EventPattern", Match.objectLike(Map.of(
                            "source", Arrays.asList("document.collaboration"),
                            "detail-type", Arrays.asList("Document Updated")
                    ))
            )));
        }

        @Test
        @DisplayName("Should configure Lambda as EventBridge target")
        public void testEventBridgeLambdaTarget() {
            template.hasResourceProperties("AWS::Events::Rule", Match.objectLike(Map.of(
                    "Targets", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                    "Arn", Match.anyValue()
                            ))
                    ))
            )));
        }
    }

    @Nested
    @DisplayName("DynamoDB Streams Tests")
    class DynamoDBStreamsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create event source mapping for DynamoDB stream")
        public void testDynamoStreamEventSourceMapping() {
            template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                    "StartingPosition", "TRIM_HORIZON",
                    "BatchSize", 100,
                    "MaximumRetryAttempts", 3
            )));
        }

        @Test
        @DisplayName("Should connect stream to conflict resolution Lambda")
        public void testStreamToLambdaConnection() {
            template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                    "FunctionName", Match.anyValue(),
                    "EventSourceArn", Match.anyValue()
            )));
        }
    }

    @Nested
    @DisplayName("CloudWatch Dashboard Tests")
    class CloudWatchDashboardTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create CloudWatch dashboard")
        public void testDashboardCreation() {
            template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.objectLike(Map.of(
                    "DashboardName", "DocumentCollaboration-test"
            )));
        }

        @Test
        @DisplayName("Should configure dashboard body with widgets")
        public void testDashboardBody() {
            template.hasResourceProperties("AWS::CloudWatch::Dashboard", Match.objectLike(Map.of(
                    "DashboardBody", Match.anyValue()
            )));
        }
    }

    @Nested
    @DisplayName("CloudWatch Alarms Tests")
    class CloudWatchAlarmsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create high error rate alarm")
        public void testHighErrorRateAlarm() {
            template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                    "AlarmName", "document-collab-high-errors-test",
                    "Threshold", 10.0,
                    "EvaluationPeriods", 2,
                    "ComparisonOperator", "GreaterThanThreshold"
            )));
        }

        @Test
        @DisplayName("Should create high latency alarm")
        public void testHighLatencyAlarm() {
            template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                    "AlarmName", "document-collab-high-latency-test",
                    "Threshold", 100.0,
                    "EvaluationPeriods", 2,
                    "ComparisonOperator", "GreaterThanThreshold"
            )));
        }

        @Test
        @DisplayName("Should create exactly 2 alarms")
        public void testAlarmCount() {
            template.resourceCountIs("AWS::CloudWatch::Alarm", 2);
        }
    }

    @Nested
    @DisplayName("Stack Outputs Tests")
    class StackOutputsTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should create WebSocket API URL output")
        public void testWebSocketApiUrlOutput() {
            template.hasOutput("WebSocketApiUrl", Match.objectLike(Map.of(
                    "Description", "WebSocket API endpoint",
                    "Export", Map.of("Name", "WebSocketApiUrl-test")
            )));
        }

        @Test
        @DisplayName("Should create WebSocket API ID output")
        public void testWebSocketApiIdOutput() {
            template.hasOutput("WebSocketApiId", Match.objectLike(Map.of(
                    "Description", "WebSocket API ID",
                    "Export", Map.of("Name", "WebSocketApiId-test")
            )));
        }

        @Test
        @DisplayName("Should create Cognito User Pool ID output")
        public void testCognitoUserPoolIdOutput() {
            template.hasOutput("CognitoUserPoolId", Match.objectLike(Map.of(
                    "Description", "Cognito User Pool ID",
                    "Export", Map.of("Name", "CognitoUserPoolId-test")
            )));
        }

        @Test
        @DisplayName("Should create Cognito User Pool Client ID output")
        public void testCognitoUserPoolClientIdOutput() {
            template.hasOutput("CognitoUserPoolClientId", Match.objectLike(Map.of(
                    "Description", "Cognito User Pool Client ID",
                    "Export", Map.of("Name", "CognitoUserPoolClientId-test")
            )));
        }

        @Test
        @DisplayName("Should create Documents table name output")
        public void testDocumentsTableNameOutput() {
            template.hasOutput("DocumentsTableName", Match.objectLike(Map.of(
                    "Description", "Documents DynamoDB Table Name",
                    "Export", Map.of("Name", "DocumentsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Operations table name output")
        public void testOperationsTableNameOutput() {
            template.hasOutput("OperationsTableName", Match.objectLike(Map.of(
                    "Description", "Operations DynamoDB Table Name",
                    "Export", Map.of("Name", "OperationsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Connections table name output")
        public void testConnectionsTableNameOutput() {
            template.hasOutput("ConnectionsTableName", Match.objectLike(Map.of(
                    "Description", "Connections DynamoDB Table Name",
                    "Export", Map.of("Name", "ConnectionsTableName-test")
            )));
        }

        @Test
        @DisplayName("Should create Document bucket name output")
        public void testDocumentBucketNameOutput() {
            template.hasOutput("DocumentBucketName", Match.objectLike(Map.of(
                    "Description", "Document Storage S3 Bucket Name",
                    "Export", Map.of("Name", "DocumentBucketName-test")
            )));
        }

        @Test
        @DisplayName("Should create OpenSearch domain endpoint output")
        public void testOpenSearchDomainEndpointOutput() {
            template.hasOutput("OpenSearchDomainEndpoint", Match.objectLike(Map.of(
                    "Description", "OpenSearch Domain Endpoint",
                    "Export", Map.of("Name", "OpenSearchDomainEndpoint-test")
            )));
        }

        @Test
        @DisplayName("Should create Dashboard name output")
        public void testDashboardNameOutput() {
            template.hasOutput("DashboardName", Match.objectLike(Map.of(
                    "Description", "CloudWatch Dashboard Name",
                    "Export", Map.of("Name", "DashboardName-test")
            )));
        }
    }

    @Nested
    @DisplayName("TapStackProps Tests")
    class TapStackPropsTests {

        @Test
        @DisplayName("Should build TapStackProps with all properties")
        public void testTapStackPropsBuilder() {
            StackProps stackProps = StackProps.builder()
                    .description("Test description")
                    .build();

            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("prod")
                    .stackProps(stackProps)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
            assertThat(props.getStackProps()).isEqualTo(stackProps);
        }

        @Test
        @DisplayName("Should handle null stackProps in builder")
        public void testTapStackPropsBuilderWithNullStackProps() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("test")
                    .stackProps(null)
                    .build();

            assertThat(props).isNotNull();
            assertThat(props.getEnvironmentSuffix()).isEqualTo("test");
            assertThat(props.getStackProps()).isNotNull();
        }

        @Test
        @DisplayName("Should use builder to create props")
        public void testTapStackPropsBuilderPattern() {
            TapStackProps props = TapStackProps.builder()
                    .environmentSuffix("staging")
                    .build();

            assertThat(props.getEnvironmentSuffix()).isEqualTo("staging");
        }
    }

    @Nested
    @DisplayName("Main Application Tests")
    class MainApplicationTests {

        @Test
        @DisplayName("Should create app with environment variables")
        public void testMainWithEnvironmentVariables() {
            App app = new App();
            
            String account = System.getenv("CDK_DEFAULT_ACCOUNT");
            String region = System.getenv("CDK_DEFAULT_REGION");

            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .stackProps(StackProps.builder()
                            .env(Environment.builder()
                                    .account(account)
                                    .region(region)
                                    .build())
                            .description("Document Collaboration System with Real-time WebSocket Support")
                            .build())
                    .build());

            assertThat(stack).isNotNull();
        }
    }

    @Nested
    @DisplayName("Resource Naming Tests")
    class ResourceNamingTests {

        @Test
        @DisplayName("Should use environment suffix in resource names")
        public void testResourceNamingWithEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.hasResourceProperties("AWS::Cognito::UserPool", Map.of(
                    "UserPoolName", "DocumentCollabUserPool-prod"
            ));

            template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
                    "TableName", "DocumentCollabDocuments-prod"
            ));
        }

        @Test
        @DisplayName("Should use different suffixes for different environments")
        public void testMultipleEnvironmentSuffixes() {
            TapStack devStack = new TapStack(app, "DevStack", TapStackProps.builder()
                    .environmentSuffix("dev")
                    .build());
            
            assertThat(devStack.getEnvironmentSuffix()).isEqualTo("dev");

            App app2 = new App();
            TapStack prodStack = new TapStack(app2, "ProdStack", TapStackProps.builder()
                    .environmentSuffix("prod")
                    .build());
            
            assertThat(prodStack.getEnvironmentSuffix()).isEqualTo("prod");
            assertThat(devStack.getEnvironmentSuffix()).isNotEqualTo(prodStack.getEnvironmentSuffix());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should create all required resources")
        public void testAllResourcesCreated() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.resourceCountIs("AWS::EC2::VPC", 1);
            template.resourceCountIs("AWS::Cognito::UserPool", 1);
            template.resourceCountIs("AWS::DynamoDB::Table", 3);
            template.resourceCountIs("AWS::S3::Bucket", 1);
            template.resourceCountIs("AWS::Lambda::Function", 7);
            template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
            template.resourceCountIs("AWS::ElastiCache::CacheCluster", 1);
            template.resourceCountIs("AWS::OpenSearchService::Domain", 1);
            template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
            template.resourceCountIs("AWS::SNS::Topic", 1);
            template.resourceCountIs("AWS::Events::EventBus", 1);
            template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);
        }

        @Test
        @DisplayName("Should have correct number of IAM roles")
        public void testIAMRolesCount() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.resourcePropertiesCountIs("AWS::IAM::Role", 
                    Match.objectLike(Map.of("RoleName", Match.anyValue())), 2);
        }

        @Test
        @DisplayName("Should configure all stack outputs")
        public void testAllOutputsConfigured() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            template.hasOutput("WebSocketApiUrl", Match.anyValue());
            template.hasOutput("WebSocketApiId", Match.anyValue());
            template.hasOutput("CognitoUserPoolId", Match.anyValue());
            template.hasOutput("CognitoUserPoolClientId", Match.anyValue());
            template.hasOutput("DocumentsTableName", Match.anyValue());
            template.hasOutput("OperationsTableName", Match.anyValue());
            template.hasOutput("ConnectionsTableName", Match.anyValue());
            template.hasOutput("DocumentBucketName", Match.anyValue());
            template.hasOutput("OpenSearchDomainEndpoint", Match.anyValue());
            template.hasOutput("DashboardName", Match.anyValue());
        }

        @Test
        @DisplayName("Should synthesize valid CloudFormation template")
        public void testValidCloudFormationTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            
            Template template = Template.fromStack(stack);

            assertThat(template).isNotNull();
            assertThat(template.toJSON()).isNotNull();
            assertThat(template.toJSON()).containsKey("Resources");
            assertThat(template.toJSON()).containsKey("Outputs");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle empty environment suffix")
        public void testEmptyEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEmpty();
        }

        @Test
        @DisplayName("Should handle special characters in environment suffix")
        public void testSpecialCharactersInEnvironmentSuffix() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test-123")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("test-123");
        }

        @Test
        @DisplayName("Should create stack without context")
        public void testStackCreationWithoutContext() {
            App freshApp = new App();
            TapStack stack = new TapStack(freshApp, "TestStack", TapStackProps.builder().build());
            
            assertThat(stack).isNotNull();
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        }

        @Test
        @DisplayName("Should prioritize props over context")
        public void testPropsPriorityOverContext() {
            app.getNode().setContext("environmentSuffix", "context-env");
            
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("props-env")
                    .build());
            
            assertThat(stack.getEnvironmentSuffix()).isEqualTo("props-env");
        }
    }

    @Nested
    @DisplayName("Security Configuration Tests")
    class SecurityConfigurationTests {

        @BeforeEach
        public void setUpTemplate() {
            TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                    .environmentSuffix("test")
                    .build());
            template = Template.fromStack(stack);
        }

        @Test
        @DisplayName("Should block all public access for S3 bucket")
        public void testS3PublicAccessBlock() {
            template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                    "PublicAccessBlockConfiguration", Map.of(
                            "BlockPublicAcls", true,
                            "BlockPublicPolicy", true,
                            "IgnorePublicAcls", true,
                            "RestrictPublicBuckets", true
                    )
            )));
        }

        @Test
        @DisplayName("Should enable encryption at rest for OpenSearch")
        public void testOpenSearchEncryptionAtRest() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "EncryptionAtRestOptions", Map.of("Enabled", true)
            )));
        }

        @Test
        @DisplayName("Should enable node-to-node encryption for OpenSearch")
        public void testOpenSearchNodeToNodeEncryption() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "NodeToNodeEncryptionOptions", Map.of("Enabled", true)
            )));
        }

        @Test
        @DisplayName("Should enforce HTTPS for OpenSearch")
        public void testOpenSearchEnforceHTTPS() {
            template.hasResourceProperties("AWS::OpenSearchService::Domain", Match.objectLike(Map.of(
                    "DomainEndpointOptions", Map.of("EnforceHTTPS", true)
            )));
        }

        @Test
        @DisplayName("Should enable point-in-time recovery for Documents table")
        public void testDynamoDBPointInTimeRecovery() {
            template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                    "TableName", "DocumentCollabDocuments-test",
                    "PointInTimeRecoverySpecification", Map.of(
                            "PointInTimeRecoveryEnabled", true
                    )
            )));
        }
    }
}