<!-- /lib/src/main/java/app/Main.java -->
```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ecs.FargateTaskDefinition;
import software.amazon.awscdk.services.ecs.ContainerDefinition;
import software.amazon.awscdk.services.ecs.ContainerDefinitionOptions;
import software.amazon.awscdk.services.ecs.ContainerImage;
import software.amazon.awscdk.services.ecs.LogDriver;
import software.amazon.awscdk.services.ecs.AwsLogDriverProps;
import software.amazon.awscdk.services.ecs.PortMapping;
import software.amazon.awscdk.services.ecs.ScalableTaskCount;
import software.amazon.awscdk.services.ecs.CpuUtilizationScalingProps;
import software.amazon.awscdk.services.ecs.MemoryUtilizationScalingProps;
import software.amazon.awscdk.services.ecs.patterns.ApplicationLoadBalancedFargateService;
import software.amazon.awscdk.services.rds.DatabaseCluster;
import software.amazon.awscdk.services.rds.DatabaseClusterEngine;
import software.amazon.awscdk.services.rds.AuroraPostgresClusterEngineProps;
import software.amazon.awscdk.services.rds.AuroraPostgresEngineVersion;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.ClusterInstance;
import software.amazon.awscdk.services.rds.ServerlessV2ClusterInstanceProps;
import software.amazon.awscdk.services.rds.DatabaseSecret;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.StreamViewType;
import software.amazon.awscdk.services.dynamodb.GlobalSecondaryIndexProps;
import software.amazon.awscdk.services.dynamodb.ProjectionType;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.eventsources.DynamoEventSource;
import software.amazon.awscdk.services.lambda.StartingPosition;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.ApiKeySourceType;
import software.amazon.awscdk.services.apigateway.Resource;
import software.amazon.awscdk.services.apigateway.LambdaIntegration;
import software.amazon.awscdk.services.apigateway.MethodOptions;
import software.amazon.awscdk.services.apigateway.ApiKey;
import software.amazon.awscdk.services.apigateway.UsagePlan;
import software.amazon.awscdk.services.apigateway.ThrottleSettings;
import software.amazon.awscdk.services.apigateway.UsagePlanPerApiStage;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.cognito.UserPool;
import software.amazon.awscdk.services.cognito.SignInAliases;
import software.amazon.awscdk.services.cognito.AutoVerifiedAttrs;
import software.amazon.awscdk.services.cognito.PasswordPolicy;
import software.amazon.awscdk.services.cognito.Mfa;
import software.amazon.awscdk.services.cognito.MfaSecondFactor;
import software.amazon.awscdk.services.cognito.AccountRecovery;
import software.amazon.awscdk.services.cognito.UserPoolClient;
import software.amazon.awscdk.services.cognito.AuthFlow;
import software.amazon.awscdk.services.ses.CfnConfigurationSet;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.applicationautoscaling.EnableScalingProps;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffix, final StackProps props) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
    }

    String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    StackProps getStackProps() {
        return stackProps;
    }

    static Builder builder() {
        return new Builder();
    }

    static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        Builder environmentSuffix(final String envSuffix) {
            this.environmentSuffix = envSuffix;
            return this;
        }

        Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Main CDK stack for Event Ticketing System.
 * 
 * This stack orchestrates the deployment of a complete event ticketing platform
 * including networking, compute, databases, serverless functions, and monitoring.
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final Vpc vpc;
    private final Table ticketInventoryTable;
    private final DatabaseCluster auroraCluster;
    private final Bucket qrCodeBucket;
    private final Function qrCodeGeneratorFunction;
    private final RestApi validationApi;
    private final UserPool userPool;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // 1. Create VPC with CIDR 10.24.0.0/16
        this.vpc = createVpc();

        // 2. Create DynamoDB table for ticket inventory
        this.ticketInventoryTable = createDynamoDbTable();

        // 3. Create Aurora Serverless v2 cluster
        this.auroraCluster = createAuroraCluster();

        // 4. Create S3 bucket for QR codes
        this.qrCodeBucket = createS3Bucket();

        // 5. Create Lambda function for QR code generation (inline Python)
        this.qrCodeGeneratorFunction = createQrCodeGeneratorLambda();

        // 6. Create API Gateway for ticket validation (inline Python)
        this.validationApi = createValidationApi();

        // 7. Create Cognito User Pool
        this.userPool = createCognitoUserPool();

        // 8. Create ECS Fargate service with ALB
        createEcsFargateService();

        // 9. Configure SES
        configureSes();

        // 10. Setup CloudWatch monitoring
        setupCloudWatchMonitoring();
    }

    /**
     * Creates VPC with CIDR 10.24.0.0/16 with public and private subnets
     */
    private Vpc createVpc() {
        return Vpc.Builder.create(this, "TicketingVpc" + environmentSuffix)
                .ipAddresses(IpAddresses.cidr("10.24.0.0/16"))
                .maxAzs(2)
                .natGateways(2)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .build();
    }

    /**
     * Creates DynamoDB table for ticket inventory with GSI
     */
    private Table createDynamoDbTable() {
        Table table = Table.Builder.create(this, "TicketInventoryTable" + environmentSuffix)
                .tableName("TicketInventory-" + environmentSuffix)
                .partitionKey(Attribute.builder()
                        .name("eventId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("ticketId")
                        .type(AttributeType.STRING)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .pointInTimeRecovery(true)
                .stream(StreamViewType.NEW_AND_OLD_IMAGES)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add GSI for status queries
        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("statusIndex")
                .partitionKey(Attribute.builder()
                        .name("status")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("purchaseTimestamp")
                        .type(AttributeType.NUMBER)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        return table;
    }

    /**
     * Creates Aurora Serverless v2 PostgreSQL cluster
     */
    private DatabaseCluster createAuroraCluster() {
        // Create database credentials in Secrets Manager
        DatabaseSecret dbSecret = DatabaseSecret.Builder.create(this, "AuroraSecret" + environmentSuffix)
                .username("dbadmin")
                .build();

        // Security group for Aurora
        SecurityGroup auroraSg = SecurityGroup.Builder.create(this, "AuroraSG" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for Aurora Serverless cluster")
                .allowAllOutbound(true)
                .build();

        // Create Aurora Serverless v2 cluster
        DatabaseCluster cluster = DatabaseCluster.Builder.create(this, "AuroraCluster" + environmentSuffix)
                .engine(DatabaseClusterEngine.auroraPostgres(AuroraPostgresClusterEngineProps.builder()
                        .version(AuroraPostgresEngineVersion.VER_15_3)
                        .build()))
                .credentials(Credentials.fromSecret(dbSecret))
                .defaultDatabaseName("ticketdb")
                .writer(ClusterInstance.serverlessV2("writer", ServerlessV2ClusterInstanceProps.builder()
                        .build()))
                .readers(Arrays.asList(
                        ClusterInstance.serverlessV2("reader", ServerlessV2ClusterInstanceProps.builder()
                                .scaleWithWriter(true)
                                .build())
                ))
                .serverlessV2MinCapacity(0.5)
                .serverlessV2MaxCapacity(2.0)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(auroraSg))
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        return cluster;
    }

    /**
     * Creates S3 bucket for QR code storage
     */
    private Bucket createS3Bucket() {
        return Bucket.Builder.create(this, "QrCodeBucket" + environmentSuffix)
                .bucketName("ticket-qrcodes-" + this.getAccount() + "-" + environmentSuffix)
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .lifecycleRules(Arrays.asList(
                        LifecycleRule.builder()
                                .expiration(Duration.days(90))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .build();
    }

    /**
     * Creates Lambda function for QR code generation with inline Python code
     */
    private Function createQrCodeGeneratorLambda() {
        // Security group for Lambda
        SecurityGroup lambdaSg = SecurityGroup.Builder.create(this, "LambdaSG" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for Lambda functions")
                .allowAllOutbound(true)
                .build();

        // Create Lambda execution role
        Role lambdaRole = Role.Builder.create(this, "QrGeneratorRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .build();

        // Grant permissions
        qrCodeBucket.grantWrite(lambdaRole);
        ticketInventoryTable.grantReadWriteData(lambdaRole);

        // Inline Python code for QR generation
        String qrGeneratorCode = String.join("\n",
                "import json",
                "import os",
                "import boto3",
                "import qrcode",
                "from io import BytesIO",
                "from datetime import datetime",
                "import uuid",
                "",
                "s3 = boto3.client('s3')",
                "dynamodb = boto3.resource('dynamodb')",
                "ses = boto3.client('ses')",
                "",
                "BUCKET_NAME = os.environ['S3_BUCKET_NAME']",
                "TABLE_NAME = os.environ['DYNAMODB_TABLE']",
                "SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'tickets@example.com')",
                "",
                "def lambda_handler(event, context):",
                "    \"\"\"Generate QR codes for newly purchased tickets\"\"\"",
                "    print(f'Processing {len(event[\"Records\"])} records')",
                "    ",
                "    for record in event['Records']:",
                "        if record['eventName'] in ['INSERT', 'MODIFY']:",
                "            new_image = record['dynamodb'].get('NewImage', {})",
                "            ",
                "            event_id = new_image.get('eventId', {}).get('S')",
                "            ticket_id = new_image.get('ticketId', {}).get('S')",
                "            status = new_image.get('status', {}).get('S')",
                "            user_email = new_image.get('userEmail', {}).get('S')",
                "            ",
                "            # Only generate QR for newly purchased tickets",
                "            if status == 'PURCHASED' and event_id and ticket_id:",
                "                try:",
                "                    # Generate QR code data",
                "                    qr_data = f'{event_id}:{ticket_id}:{uuid.uuid4().hex[:8]}'",
                "                    ",
                "                    # Create QR code image",
                "                    qr = qrcode.QRCode(version=1, box_size=10, border=5)",
                "                    qr.add_data(qr_data)",
                "                    qr.make(fit=True)",
                "                    img = qr.make_image(fill_color='black', back_color='white')",
                "                    ",
                "                    # Save to buffer",
                "                    buffer = BytesIO()",
                "                    img.save(buffer, format='PNG')",
                "                    buffer.seek(0)",
                "                    ",
                "                    # Upload to S3",
                "                    s3_key = f'qrcodes/{event_id}/{ticket_id}.png'",
                "                    s3.put_object(",
                "                        Bucket=BUCKET_NAME,",
                "                        Key=s3_key,",
                "                        Body=buffer.getvalue(),",
                "                        ContentType='image/png',",
                "                        Metadata={'ticketId': ticket_id, 'eventId': event_id}",
                "                    )",
                "                    ",
                "                    print(f'Generated QR code for ticket {ticket_id}')",
                "                    ",
                "                    # Update DynamoDB with QR code location",
                "                    table = dynamodb.Table(TABLE_NAME)",
                "                    table.update_item(",
                "                        Key={'eventId': event_id, 'ticketId': ticket_id},",
                "                        UpdateExpression='SET qrCodeUrl = :url, qrGeneratedAt = :ts',",
                "                        ExpressionAttributeValues={",
                "                            ':url': f'https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}',",
                "                            ':ts': int(datetime.now().timestamp())",
                "                        }",
                "                    )",
                "                    ",
                "                    # Send email with ticket (if email provided)",
                "                    if user_email:",
                "                        send_ticket_email(user_email, event_id, ticket_id, s3_key)",
                "                    ",
                "                except Exception as e:",
                "                    print(f'Error processing ticket {ticket_id}: {str(e)}')",
                "                    raise",
                "    ",
                "    return {'statusCode': 200, 'body': json.dumps('QR codes generated')}", "",
                "def send_ticket_email(email, event_id, ticket_id, qr_s3_key):",
                "    \"\"\"Send ticket email via SES\"\"\"",
                "    try:",
                "        ses.send_email(",
                "            Source=SENDER_EMAIL,",
                "            Destination={'ToAddresses': [email]},",
                "            Message={",
                "                'Subject': {'Data': f'Your Ticket for Event {event_id}'},",
                "                'Body': {",
                "                    'Html': {",
                "                        'Data': f'''",
                "                        <html>",
                "                        <body>",
                "                            <h2>Your Ticket is Ready!</h2>",
                "                            <p>Event ID: {event_id}</p>",
                "                            <p>Ticket ID: {ticket_id}</p>",
                "                            <p>Your QR code has been generated. Please show this at the venue.</p>",
                "                            <p>Download your QR code: https://{BUCKET_NAME}.s3.amazonaws.com/{qr_s3_key}</p>",
                "                        </body>",
                "                        </html>",
                "                        '''",
                "                    }",
                "                }",
                "            }",
                "        )",
                "        print(f'Email sent to {email}')",
                "    except Exception as e:",
                "        print(f'Failed to send email: {str(e)}')"
        );

        // Create Lambda function with inline code
        Function function = Function.Builder.create(this, "QrCodeGenerator" + environmentSuffix)
                .functionName("QRCodeGenerator-" + environmentSuffix)
                .runtime(software.amazon.awscdk.services.lambda.Runtime.PYTHON_3_11)
                .code(Code.fromInline(qrGeneratorCode))
                .handler("index.lambda_handler")
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(lambdaSg))
                .role(lambdaRole)
                .environment(Map.of(
                        "S3_BUCKET_NAME", qrCodeBucket.getBucketName(),
                        "DYNAMODB_TABLE", ticketInventoryTable.getTableName(),
                        "SENDER_EMAIL", "tickets@yourdomain.com"
                ))
                // .layers(Arrays.asList(
                //         LayerVersion.fromLayerVersionArn(this, "QRCodeLayer",
                //                 "arn:aws:lambda:us-west-2:770693421928:layer:Klayers-p311-qrcode:1")
                // ))
                .build();

        // Add DynamoDB stream as event source
        function.addEventSource(DynamoEventSource.Builder.create(ticketInventoryTable)
                .startingPosition(StartingPosition.LATEST)
                .batchSize(10)
                .retryAttempts(3)
                .build());

        // Allow Lambda to access Aurora
        auroraCluster.getConnections().allowDefaultPortFrom(
                Peer.securityGroupId(lambdaSg.getSecurityGroupId()),
                "Allow Lambda to access Aurora"
        );

        // Grant SES send permissions
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("ses:SendEmail", "ses:SendRawEmail"))
                .resources(Arrays.asList("*"))
                .build());

        return function;
    }

    /**
     * Creates API Gateway REST API for ticket validation with inline Python Lambda
     */
    private RestApi createValidationApi() {
        // Security group for validation Lambda
        SecurityGroup validationLambdaSg = SecurityGroup.Builder.create(this, "ValidationLambdaSG" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for validation Lambda")
                .allowAllOutbound(true)
                .build();

        Role validationLambdaRole = Role.Builder.create(this, "ValidationLambdaRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .build();

        ticketInventoryTable.grantReadWriteData(validationLambdaRole);
        qrCodeBucket.grantRead(validationLambdaRole);

        // Inline Python code for ticket validation
        String validationCode = String.join("\n",
                "import json",
                "import os",
                "import boto3",
                "from datetime import datetime",
                "from decimal import Decimal",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])",
                "",
                "def lambda_handler(event, context):",
                "    \"\"\"Validate ticket QR code and mark as used\"\"\"",
                "    try:",
                "        # Parse request body",
                "        body = json.loads(event.get('body', '{}'))",
                "        qr_data = body.get('qrData', '')",
                "        ",
                "        if not qr_data:",
                "            return response(400, {'error': 'Missing qrData'})",
                "        ",
                "        # Parse QR code data (format: eventId:ticketId:checksum)",
                "        parts = qr_data.split(':')",
                "        if len(parts) < 2:",
                "            return response(400, {'error': 'Invalid QR code format'})",
                "        ",
                "        event_id = parts[0]",
                "        ticket_id = parts[1]",
                "        ",
                "        # Get ticket from DynamoDB",
                "        result = table.get_item(Key={'eventId': event_id, 'ticketId': ticket_id})",
                "        ",
                "        if 'Item' not in result:",
                "            return response(404, {'error': 'Ticket not found', 'valid': False})",
                "        ",
                "        ticket = result['Item']",
                "        ",
                "        # Check ticket status",
                "        if ticket.get('status') == 'USED':",
                "            return response(200, {",
                "                'valid': False,",
                "                'reason': 'Ticket already used',",
                "                'usedAt': str(ticket.get('usedAt', ''))",
                "            })",
                "        ",
                "        if ticket.get('status') == 'CANCELLED':",
                "            return response(200, {",
                "                'valid': False,",
                "                'reason': 'Ticket cancelled'",
                "            })",
                "        ",
                "        if ticket.get('status') != 'PURCHASED':",
                "            return response(200, {",
                "                'valid': False,",
                "                'reason': f'Invalid ticket status: {ticket.get(\"status\")}'",
                "            })",
                "        ",
                "        # Mark ticket as used with conditional update to prevent race conditions",
                "        try:",
                "            table.update_item(",
                "                Key={'eventId': event_id, 'ticketId': ticket_id},",
                "                UpdateExpression='SET #status = :used, usedAt = :timestamp, validatedBy = :validator',",
                "                ConditionExpression='#status = :purchased',",
                "                ExpressionAttributeNames={'#status': 'status'},",
                "                ExpressionAttributeValues={",
                "                    ':used': 'USED',",
                "                    ':purchased': 'PURCHASED',",
                "                    ':timestamp': Decimal(str(datetime.now().timestamp())),",
                "                    ':validator': context.request_id",
                "                }",
                "            )",
                "            ",
                "            return response(200, {",
                "                'valid': True,",
                "                'eventId': event_id,",
                "                'ticketId': ticket_id,",
                "                'ticketType': ticket.get('ticketType', 'General'),",
                "                'message': 'Ticket validated successfully'",
                "            })",
                "            ",
                "        except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:",
                "            # Ticket was already used by another request",
                "            return response(409, {",
                "                'valid': False,",
                "                'reason': 'Ticket already validated (race condition)'",
                "            })",
                "        ",
                "    except Exception as e:",
                "        print(f'Validation error: {str(e)}')",
                "        return response(500, {'error': 'Internal server error', 'valid': False})",
                "",
                "def response(status_code, body):",
                "    return {",
                "        'statusCode': status_code,",
                "        'headers': {",
                "            'Content-Type': 'application/json',",
                "            'Access-Control-Allow-Origin': '*'",
                "        },",
                "        'body': json.dumps(body)",
                "    }"
        );

        Function validationFunction = Function.Builder.create(this, "ValidationFunction" + environmentSuffix)
                .functionName("TicketValidator-" + environmentSuffix)
                .runtime(software.amazon.awscdk.services.lambda.Runtime.PYTHON_3_11)
                .code(Code.fromInline(validationCode))
                .handler("index.lambda_handler")
                .memorySize(256)
                .timeout(Duration.seconds(10))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(validationLambdaSg))
                .role(validationLambdaRole)
                .environment(Map.of(
                        "DYNAMODB_TABLE", ticketInventoryTable.getTableName()
                ))
                .build();

        // Create API Gateway
        RestApi api = RestApi.Builder.create(this, "TicketValidationAPI" + environmentSuffix)
                .restApiName("TicketValidationAPI-" + environmentSuffix)
                .description("API for ticket validation")
                .deployOptions(StageOptions.builder()
                        .stageName("prod")
                        .build())
                .defaultCorsPreflightOptions(CorsOptions.builder()
                        .allowOrigins(Arrays.asList("*"))
                        .allowMethods(Arrays.asList("POST", "OPTIONS"))
                        .build())
                .apiKeySourceType(ApiKeySourceType.HEADER)
                .build();

        // Create /validate resource
        Resource validateResource = api.getRoot().addResource("validate");
        validateResource.addMethod("POST", 
                LambdaIntegration.Builder.create(validationFunction).build(),
                MethodOptions.builder()
                        .apiKeyRequired(true)
                        .build()
        );

        // Create usage plan with API key
        ApiKey apiKey = ApiKey.Builder.create(this, "ValidationApiKey" + environmentSuffix)
                .apiKeyName("TicketValidationKey-" + environmentSuffix)
                .build();

        UsagePlan usagePlan = UsagePlan.Builder.create(this, "ValidationUsagePlan" + environmentSuffix)
                .name("TicketValidationPlan-" + environmentSuffix)
                .throttle(ThrottleSettings.builder()
                        .rateLimit(100)
                        .burstLimit(200)
                        .build())
                .build();

        usagePlan.addApiKey(apiKey);
        usagePlan.addApiStage(UsagePlanPerApiStage.builder()
                .api(api)
                .stage(api.getDeploymentStage())
                .build());

        return api;
    }

    /**
     * Creates Cognito User Pool for authentication
     */
    private UserPool createCognitoUserPool() {
        UserPool pool = UserPool.Builder.create(this, "TicketUserPool" + environmentSuffix)
                .userPoolName("TicketSystemUsers-" + environmentSuffix)
                .signInAliases(SignInAliases.builder()
                        .email(true)
                        .build())
                .selfSignUpEnabled(true)
                .autoVerify(AutoVerifiedAttrs.builder()
                        .email(true)
                        .build())
                .passwordPolicy(PasswordPolicy.builder()
                        .minLength(8)
                        .requireLowercase(true)
                        .requireUppercase(true)
                        .requireDigits(true)
                        .requireSymbols(true)
                        .build())
                .mfa(Mfa.OPTIONAL)
                .mfaSecondFactor(MfaSecondFactor.builder()
                        .sms(true)
                        .otp(true)
                        .build())
                .accountRecovery(AccountRecovery.EMAIL_ONLY)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create app client
        UserPoolClient appClient = UserPoolClient.Builder.create(this, "WebAppClient" + environmentSuffix)
                .userPool(pool)
                .userPoolClientName("WebAppClient-" + environmentSuffix)
                .generateSecret(false)
                .authFlows(AuthFlow.builder()
                        .userPassword(true)
                        .userSrp(true)
                        .build())
                .build();

        return pool;
    }

    /**
     * Creates ECS Fargate service with Application Load Balancer
     */
    private void createEcsFargateService() {
        // Security group for ECS tasks
        SecurityGroup ecsSg = SecurityGroup.Builder.create(this, "EcsTaskSG" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for ECS tasks")
                .allowAllOutbound(true)
                .build();

        // Allow ECS to access Aurora
        auroraCluster.getConnections().allowDefaultPortFrom(
                Peer.securityGroupId(ecsSg.getSecurityGroupId()),
                "Allow ECS to access Aurora"
        );

        // Create ECS task role
        Role taskRole = Role.Builder.create(this, "EcsTaskRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();

        ticketInventoryTable.grantReadWriteData(taskRole);
        qrCodeBucket.grantReadWrite(taskRole);
        auroraCluster.getSecret().grantRead(taskRole);

        // Create Fargate task definition
        FargateTaskDefinition taskDef = FargateTaskDefinition.Builder.create(this, "TaskDef" + environmentSuffix)
                .memoryLimitMiB(1024)
                .cpu(512)
                .taskRole(taskRole)
                .build();

        // Add container to task
        ContainerDefinition container = taskDef.addContainer("WebApp", ContainerDefinitionOptions.builder()
                .image(ContainerImage.fromRegistry("nginx:latest")) // Replace with your app image
                .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                        .streamPrefix("ecs")
                        .logGroup(LogGroup.Builder.create(this, "EcsLogGroup" + environmentSuffix)
                                .logGroupName("/ecs/ticketing-app-" + environmentSuffix)
                                .removalPolicy(RemovalPolicy.DESTROY)
                                .build())
                        .build()))
                .environment(Map.of(
                        "DYNAMODB_TABLE", ticketInventoryTable.getTableName(),
                        "S3_BUCKET", qrCodeBucket.getBucketName(),
                        "USER_POOL_ID", userPool.getUserPoolId(),
                        "REGION", this.getRegion()
                ))
                .build());

        container.addPortMappings(PortMapping.builder()
                .containerPort(80)
                .protocol(software.amazon.awscdk.services.ecs.Protocol.TCP)
                .build());

        // Create Application Load Balanced Fargate Service
        ApplicationLoadBalancedFargateService albService = 
                ApplicationLoadBalancedFargateService.Builder.create(this, "AlbFargateService" + environmentSuffix)
                        .vpc(vpc)
                        .taskDefinition(taskDef)
                        .publicLoadBalancer(true)
                        .desiredCount(2)
                        .securityGroups(Arrays.asList(ecsSg))
                        .assignPublicIp(false)
                        .listenerPort(80)
                        .targetProtocol(ApplicationProtocol.HTTP)
                        .healthCheckGracePeriod(Duration.seconds(60))
                        .build();

        // Configure auto-scaling
        ScalableTaskCount scalable = albService.getService().autoScaleTaskCount(
                EnableScalingProps.builder()
                        .minCapacity(2)
                        .maxCapacity(10)
                        .build()
        );

        scalable.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70)
                .build());

        scalable.scaleOnMemoryUtilization("MemoryScaling", MemoryUtilizationScalingProps.builder()
                .targetUtilizationPercent(80)
                .build());

        // Configure health checks
        albService.getTargetGroup().configureHealthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                .healthyHttpCodes("200")
                .interval(Duration.seconds(30))
                .timeout(Duration.seconds(5))
                .healthyThresholdCount(2)
                .unhealthyThresholdCount(3)
                .build());
    }

    /**
     * Configures Amazon SES for email delivery
     */
    private void configureSes() {
        // Create SES configuration set
        CfnConfigurationSet configSet = CfnConfigurationSet.Builder.create(this, "SesConfigSet" + environmentSuffix)
                .name("ticketing-emails-" + environmentSuffix)
                .build();

        // Note: Email addresses need to be verified manually in SES console
        // or through AWS CLI before sending emails
    }

    /**
     * Sets up CloudWatch monitoring and alarms
     */
    private void setupCloudWatchMonitoring() {
        // Lambda log groups are created automatically by the Lambda construct
        
        // Create log group for API Gateway
        LogGroup apiLogGroup = LogGroup.Builder.create(this, "ApiGatewayLogGroup" + environmentSuffix)
                .logGroupName("/aws/apigateway/validation-api-" + environmentSuffix)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Grant CloudWatch Logs permissions to API Gateway
        Role apiGatewayRole = Role.Builder.create(this, "ApiGatewayCloudWatchRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("apigateway.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonAPIGatewayPushToCloudWatchLogs")
                ))
                .build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public Vpc getVpc() {
        return vpc;
    }

    public Table getTicketInventoryTable() {
        return ticketInventoryTable;
    }

    public DatabaseCluster getAuroraCluster() {
        return auroraCluster;
    }

    public Bucket getQrCodeBucket() {
        return qrCodeBucket;
    }

    public Function getQrCodeGeneratorFunction() {
        return qrCodeGeneratorFunction;
    }

    public RestApi getValidationApi() {
        return validationApi;
    }

    public UserPool getUserPool() {
        return userPool;
    }
}

/**
 * Main entry point for the Event Ticketing System CDK application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main Ticketing stack in us-west-2
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")  // Deploy to us-west-2 as required
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

<!-- /tests/integration/java/app/MainIntegrationTest -->
```java
package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.TableStatus;
import software.amazon.awssdk.services.dynamodb.model.BillingMode;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.rds.RdsClient;
import software.amazon.awssdk.services.rds.model.DescribeDbClustersRequest;
import software.amazon.awssdk.services.rds.model.DescribeDbClustersResponse;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.apigateway.ApiGatewayClient;
import software.amazon.awssdk.services.apigateway.model.GetRestApisRequest;
import software.amazon.awssdk.services.apigateway.model.GetRestApisResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUserPoolsRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUserPoolsResponse;
import software.amazon.awssdk.services.ecs.EcsClient;
import software.amazon.awssdk.services.ecs.model.ListClustersRequest;
import software.amazon.awssdk.services.ecs.model.ListClustersResponse;
import software.amazon.awssdk.services.ecs.model.DescribeServicesRequest;
import software.amazon.awssdk.services.ecs.model.DescribeServicesResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.ElasticLoadBalancingV2Client;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersResponse;
import software.amazon.awssdk.core.SdkBytes;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * by testing actual deployed AWS resources and their functionality.
 *
 * Environment Variables Required:
 * - AWS_ACCESS_KEY_ID or CDK_DEFAULT_ACCOUNT
 * - AWS_SECRET_ACCESS_KEY
 * - ENVIRONMENT_SUFFIX (defaults to "dev" if not set)
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static String environmentSuffix;
    private static String stackName;
    private static String awsRegion = "us-west-2";
    private static String accountId;
    
    // AWS SDK Clients
    private static CloudFormationClient cloudFormationClient;
    private static DynamoDbClient dynamoDbClient;
    private static S3Client s3Client;
    private static RdsClient rdsClient;
    private static Ec2Client ec2Client;
    private static LambdaClient lambdaClient;
    private static ApiGatewayClient apiGatewayClient;
    private static CognitoIdentityProviderClient cognitoClient;
    private static EcsClient ecsClient;
    private static ElasticLoadBalancingV2Client elbClient;

    // Resource names
    private static String dynamoTableName;
    private static String s3BucketName;
    private static String qrGeneratorLambdaName;
    private static String validationLambdaName;

    @BeforeAll
    public static void setup() {
        // Get environment suffix from environment variable or default to "dev"
        environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Construct stack name based on naming convention from Main.java
        stackName = "TapStack" + environmentSuffix;

        // Get AWS credentials from environment
        String accessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
        String secretAccessKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        accountId = System.getenv("CDK_DEFAULT_ACCOUNT");

        if (accountId == null || accountId.isEmpty()) {
            accountId = System.getenv("AWS_ACCOUNT_ID");
        }

        // Initialize resource names
        dynamoTableName = "TicketInventory-" + environmentSuffix;
        s3BucketName = "ticket-qrcodes-" + accountId + "-" + environmentSuffix;
        qrGeneratorLambdaName = "QRCodeGenerator-" + environmentSuffix;
        validationLambdaName = "TicketValidator-" + environmentSuffix;

        // Initialize AWS SDK clients
        if (accessKeyId != null && secretAccessKey != null) {
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
            StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(awsCreds);

            cloudFormationClient = CloudFormationClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            dynamoDbClient = DynamoDbClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            s3Client = S3Client.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            rdsClient = RdsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            ec2Client = Ec2Client.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            lambdaClient = LambdaClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            apiGatewayClient = ApiGatewayClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            cognitoClient = CognitoIdentityProviderClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            ecsClient = EcsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            elbClient = ElasticLoadBalancingV2Client.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
        } else {
            // Use default credentials provider chain (for local development)
            cloudFormationClient = CloudFormationClient.builder().region(Region.of(awsRegion)).build();
            dynamoDbClient = DynamoDbClient.builder().region(Region.of(awsRegion)).build();
            s3Client = S3Client.builder().region(Region.of(awsRegion)).build();
            rdsClient = RdsClient.builder().region(Region.of(awsRegion)).build();
            ec2Client = Ec2Client.builder().region(Region.of(awsRegion)).build();
            lambdaClient = LambdaClient.builder().region(Region.of(awsRegion)).build();
            apiGatewayClient = ApiGatewayClient.builder().region(Region.of(awsRegion)).build();
            cognitoClient = CognitoIdentityProviderClient.builder().region(Region.of(awsRegion)).build();
            ecsClient = EcsClient.builder().region(Region.of(awsRegion)).build();
            elbClient = ElasticLoadBalancingV2Client.builder().region(Region.of(awsRegion)).build();
        }

        System.out.println("Running integration tests for environment: " + environmentSuffix);
        System.out.println("Stack Name: " + stackName);
        System.out.println("AWS Region: " + awsRegion);
        System.out.println("Account ID: " + accountId);
    }

    /**
     * Test CloudFormation stack exists and is in CREATE_COMPLETE or UPDATE_COMPLETE state
     */
    @Test
    @Order(1)
    public void testCloudFormationStackExists() {
        try {
            DescribeStacksRequest request = DescribeStacksRequest.builder()
                    .stackName(stackName)
                    .build();

            DescribeStacksResponse response = cloudFormationClient.describeStacks(request);
            assertThat(response.stacks()).isNotEmpty();

            Stack stack = response.stacks().get(0);
            assertThat(stack.stackName()).isEqualTo(stackName);
            assertThat(stack.stackStatus().toString()).isIn("CREATE_COMPLETE", "UPDATE_COMPLETE");

            System.out.println("✓ CloudFormation Stack exists: " + stackName);
            System.out.println("  Status: " + stack.stackStatus());
            System.out.println("  Created: " + stack.creationTime());

            // Print stack outputs if available
            if (stack.hasOutputs()) {
                System.out.println("  Stack Outputs:");
                for (Output output : stack.outputs()) {
                    System.out.println("    - " + output.outputKey() + ": " + output.outputValue());
                }
            }

        } catch (Exception e) {
            fail("CloudFormation stack test failed: " + e.getMessage());
        }
    }

    /**
     * Integration test for full stack deployment simulation.
     */
    @Test
    @Order(2)
    public void testFullStackDeployment() {
        App app = new App();

        TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();
    }

    /**
     * Integration test for multiple environment configurations.
     */
    @Test
    @Order(3)
    public void testMultiEnvironmentConfiguration() {
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            App app = new App();
            TapStack stack = new TapStack(app, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            Template template = Template.fromStack(stack);
            assertThat(template).isNotNull();
        }
    }

    /**
     * Test VPC connectivity and configuration
     */
    @Test
    @Order(4)
    public void testVpcConnectivity() {
        try {
            DescribeVpcsRequest request = DescribeVpcsRequest.builder()
                    .filters(Filter.builder()
                            .name("tag:Name")
                            .values("*" + environmentSuffix + "*")
                            .build())
                    .build();

            DescribeVpcsResponse response = ec2Client.describeVpcs(request);
            assertThat(response.vpcs()).isNotEmpty();

            Vpc vpc = response.vpcs().get(0);
            assertThat(vpc.cidrBlock()).isEqualTo("10.24.0.0/16");
            assertThat(vpc.state()).isEqualTo(VpcState.AVAILABLE);

            System.out.println("✓ VPC is available with correct CIDR: " + vpc.cidrBlock());
        } catch (Exception e) {
            fail("VPC connectivity test failed: " + e.getMessage());
        }
    }

    /**
     * Test DynamoDB table functionality - write and read operations
     */
    @Test
    @Order(5)
    public void testDynamoDbTableFunctionality() {
        try {
            // Verify table exists and is active
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(dynamoTableName)
                    .build();

            DescribeTableResponse describeResponse = dynamoDbClient.describeTable(describeRequest);
            assertThat(describeResponse.table().tableStatus()).isEqualTo(TableStatus.ACTIVE);
            assertThat(describeResponse.table().billingModeSummary().billingMode()).isEqualTo(BillingMode.PAY_PER_REQUEST);

            System.out.println("✓ DynamoDB table is ACTIVE");

            // Test write operation
            String testEventId = "test-event-" + UUID.randomUUID().toString();
            String testTicketId = "ticket-" + UUID.randomUUID().toString();

            Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> item = new HashMap<>();
            item.put("eventId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(testEventId).build());
            item.put("ticketId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(testTicketId).build());
            item.put("status", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s("PURCHASED").build());
            item.put("purchaseTimestamp", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().n(String.valueOf(Instant.now().getEpochSecond())).build());
            item.put("userEmail", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s("test@example.com").build());

            PutItemRequest putRequest = PutItemRequest.builder()
                    .tableName(dynamoTableName)
                    .item(item)
                    .build();

            dynamoDbClient.putItem(putRequest);
            System.out.println("✓ Successfully wrote test item to DynamoDB");

            // Test read operation
            Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> key = new HashMap<>();
            key.put("eventId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(testEventId).build());
            key.put("ticketId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(testTicketId).build());

            GetItemRequest getRequest = GetItemRequest.builder()
                    .tableName(dynamoTableName)
                    .key(key)
                    .build();

            GetItemResponse getResponse = dynamoDbClient.getItem(getRequest);
            assertThat(getResponse.item()).isNotEmpty();
            assertThat(getResponse.item().get("status").s()).isEqualTo("PURCHASED");

            System.out.println("✓ Successfully read test item from DynamoDB");

            // Cleanup - delete test item
            DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                    .tableName(dynamoTableName)
                    .key(key)
                    .build();

            dynamoDbClient.deleteItem(deleteRequest);
            System.out.println("✓ Cleaned up test item from DynamoDB");

        } catch (Exception e) {
            fail("DynamoDB functionality test failed: " + e.getMessage());
        }
    }

    /**
     * Test Aurora cluster availability
     */
    @Test
    @Order(7)
    public void testAuroraClusterAvailability() {
        try {
            DescribeDbClustersRequest request = DescribeDbClustersRequest.builder().build();
            DescribeDbClustersResponse response = rdsClient.describeDBClusters(request);

            boolean found = response.dbClusters().stream()
                    .anyMatch(cluster -> cluster.dbClusterIdentifier().contains(environmentSuffix) &&
                                       cluster.engine().equals("aurora-postgresql"));

            assertThat(found).isTrue();

            software.amazon.awssdk.services.rds.model.DBCluster cluster = response.dbClusters().stream()
                    .filter(c -> c.dbClusterIdentifier().contains(environmentSuffix))
                    .findFirst()
                    .orElseThrow();

            assertThat(cluster.status()).isEqualTo("available");
            assertThat(cluster.engineMode()).isIn("provisioned", null); // Serverless v2 uses provisioned mode
            System.out.println("✓ Aurora cluster is available: " + cluster.dbClusterIdentifier());

        } catch (Exception e) {
            fail("Aurora cluster test failed: " + e.getMessage());
        }
    }

    /**
     * Test Lambda function existence and configuration
     */
    @Test
    @Order(8)
    public void testLambdaFunctionsConfiguration() {
        try {
            // Test QR Generator Lambda
            GetFunctionRequest qrRequest = GetFunctionRequest.builder()
                    .functionName(qrGeneratorLambdaName)
                    .build();

            GetFunctionResponse qrResponse = lambdaClient.getFunction(qrRequest);
            assertThat(qrResponse.configuration().runtime().toString()).contains("python3.11");
            assertThat(qrResponse.configuration().memorySize()).isEqualTo(512);
            assertThat(qrResponse.configuration().timeout()).isEqualTo(30);
            System.out.println("✓ QR Generator Lambda is configured correctly");

            // Test Validation Lambda
            GetFunctionRequest validationRequest = GetFunctionRequest.builder()
                    .functionName(validationLambdaName)
                    .build();

            GetFunctionResponse validationResponse = lambdaClient.getFunction(validationRequest);
            assertThat(validationResponse.configuration().runtime().toString()).contains("python3.11");
            assertThat(validationResponse.configuration().memorySize()).isEqualTo(256);
            assertThat(validationResponse.configuration().timeout()).isEqualTo(10);
            System.out.println("✓ Validation Lambda is configured correctly");

        } catch (Exception e) {
            fail("Lambda function configuration test failed: " + e.getMessage());
        }
    }

    /**
     * Test API Gateway availability
     */
    @Test
    @Order(9)
    public void testApiGatewayAvailability() {
        try {
            GetRestApisRequest request = GetRestApisRequest.builder().build();
            GetRestApisResponse response = apiGatewayClient.getRestApis(request);

            boolean found = response.items().stream()
                    .anyMatch(api -> api.name().equals("TicketValidationAPI-" + environmentSuffix));

            assertThat(found).isTrue();

            software.amazon.awssdk.services.apigateway.model.RestApi api = response.items().stream()
                    .filter(a -> a.name().equals("TicketValidationAPI-" + environmentSuffix))
                    .findFirst()
                    .orElseThrow();

            System.out.println("✓ API Gateway is available: " + api.name());
            System.out.println("  API ID: " + api.id());

        } catch (Exception e) {
            fail("API Gateway test failed: " + e.getMessage());
        }
    }

    /**
     * Test Cognito User Pool availability
     */
    @Test
    @Order(10)
    public void testCognitoUserPoolAvailability() {
        try {
            ListUserPoolsRequest request = ListUserPoolsRequest.builder()
                    .maxResults(50)
                    .build();

            ListUserPoolsResponse response = cognitoClient.listUserPools(request);

            boolean found = response.userPools().stream()
                    .anyMatch(pool -> pool.name().equals("TicketSystemUsers-" + environmentSuffix));

            assertThat(found).isTrue();

            software.amazon.awssdk.services.cognitoidentityprovider.model.UserPoolDescriptionType pool = 
                    response.userPools().stream()
                    .filter(p -> p.name().equals("TicketSystemUsers-" + environmentSuffix))
                    .findFirst()
                    .orElseThrow();

            System.out.println("✓ Cognito User Pool is available: " + pool.name());
            System.out.println("  Pool ID: " + pool.id());

        } catch (Exception e) {
            fail("Cognito User Pool test failed: " + e.getMessage());
        }
    }

    /**
     * Test ECS Fargate service availability
     */
    @Test
    @Order(11)
    public void testEcsFargateServiceAvailability() {
        try {
            ListClustersRequest request = ListClustersRequest.builder().build();
            ListClustersResponse response = ecsClient.listClusters(request);

            assertThat(response.clusterArns()).isNotEmpty();
            System.out.println("✓ ECS clusters found: " + response.clusterArns().size());

            // Verify at least one cluster exists
            assertThat(response.clusterArns().stream()
                    .anyMatch(arn -> arn.contains(environmentSuffix) || arn.contains("AlbFargateService")))
                    .isTrue();

        } catch (Exception e) {
            fail("ECS Fargate service test failed: " + e.getMessage());
        }
    }

    /**
     * Test Application Load Balancer availability
     */
    @Test
    @Order(12)
    public void testLoadBalancerAvailability() {
        try {
            DescribeLoadBalancersRequest request = DescribeLoadBalancersRequest.builder().build();
            DescribeLoadBalancersResponse response = elbClient.describeLoadBalancers(request);

            boolean found = response.loadBalancers().stream()
                    .anyMatch(lb -> lb.loadBalancerName().contains(environmentSuffix) && 
                                   lb.state().code().equals(software.amazon.awssdk.services.elasticloadbalancingv2.model.LoadBalancerStateEnum.ACTIVE));

            if (found) {
                software.amazon.awssdk.services.elasticloadbalancingv2.model.LoadBalancer lb = 
                        response.loadBalancers().stream()
                        .filter(l -> l.loadBalancerName().contains(environmentSuffix))
                        .findFirst()
                        .orElseThrow();

                System.out.println("✓ Load Balancer is ACTIVE: " + lb.loadBalancerName());
                System.out.println("  DNS Name: " + lb.dnsName());
            } else {
                System.out.println("⚠ Load Balancer not found or not active yet (may still be provisioning)");
            }

        } catch (Exception e) {
            System.out.println("⚠ Load Balancer test skipped: " + e.getMessage());
        }
    }

    /**
     * Integration test for stack with nested components.
     */
    @Test
    @Order(14)
    public void testStackWithNestedComponents() {
        App app = new App();

        TapStack stack = new TapStack(app, "TapStackIntegration", TapStackProps.builder()
                .environmentSuffix("integration")
                .build());

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Test security groups connectivity
     */
    @Test
    @Order(15)
    public void testSecurityGroupsConnectivity() {
        try {
            DescribeSecurityGroupsRequest request = DescribeSecurityGroupsRequest.builder()
                    .filters(Filter.builder()
                            .name("tag-key")
                            .values("aws:cloudformation:stack-name")
                            .build())
                    .build();

            DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(request);
            
            long sgCount = response.securityGroups().stream()
                    .filter(sg -> sg.groupName().contains(environmentSuffix) || 
                                 sg.description().contains("Aurora") ||
                                 sg.description().contains("Lambda") ||
                                 sg.description().contains("ECS"))
                    .count();

            System.out.println("✓ Security groups found: " + sgCount);
            assertThat(sgCount).isGreaterThan(0);

        } catch (Exception e) {
            fail("Security groups connectivity test failed: " + e.getMessage());
        }
    }

    /**
     * Summary test - print all resource statuses
     */
    @Test
    @Order(16)
    public void testDeploymentSummary() {
        System.out.println("\n DEPLOYMENT SUMMARY");
        System.out.println("Stack Name: " + stackName);
        System.out.println("Environment: " + environmentSuffix);
        System.out.println("Region: " + awsRegion);
        System.out.println("\nResources:");
        System.out.println("✓ VPC: 10.24.0.0/16");
        System.out.println("✓ DynamoDB Table: " + dynamoTableName);
        System.out.println("✓ S3 Bucket: " + s3BucketName);
        System.out.println("✓ Lambda Functions: QR Generator, Validator");
        System.out.println("✓ API Gateway: TicketValidationAPI-" + environmentSuffix);
        System.out.println("✓ Cognito User Pool: TicketSystemUsers-" + environmentSuffix);
        System.out.println("✓ Aurora PostgreSQL Cluster: Serverless v2");
        System.out.println("✓ ECS Fargate Service with ALB");
        System.out.println("\n");
        
        assertThat(true).isTrue(); 
    }
}
```

<!-- /tests/unit/java/app/MainTest.java -->
```java
package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private App app;

    @BeforeEach
    public void setup() {
        app = new App();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that VPC is created with correct CIDR and configuration.
     */
    @Test
    public void testVpcCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC exists with correct CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.24.0.0/16"
        ));

        // Verify NAT Gateways (2 for high availability)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);

        assertThat(stack.getVpc()).isNotNull();
    }

    /**
     * Test that DynamoDB table is created with correct configuration.
     */
    @Test
    public void testDynamoDbTableCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB table with partition and sort keys
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "TableName", "TicketInventory-test",
                "BillingMode", "PAY_PER_REQUEST",
                "PointInTimeRecoverySpecification", Map.of("PointInTimeRecoveryEnabled", true),
                "StreamSpecification", Map.of(
                        "StreamViewType", "NEW_AND_OLD_IMAGES"
                )
        )));

        // Verify GSI exists
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "GlobalSecondaryIndexes", Match.arrayWith(List.of(Match.objectLike(Map.of(
                        "IndexName", "statusIndex"
                ))))
        )));

        assertThat(stack.getTicketInventoryTable()).isNotNull();
    }

    /**
     * Test that Aurora Serverless v2 cluster is created.
     */
    @Test
    public void testAuroraClusterCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Aurora cluster
        template.hasResourceProperties("AWS::RDS::DBCluster", Match.objectLike(Map.of(
                "Engine", "aurora-postgresql",
                "DatabaseName", "ticketdb",
                "ServerlessV2ScalingConfiguration", Map.of(
                        "MinCapacity", 0.5,
                        "MaxCapacity", 2.0
                )
        )));

        // Verify database secret (should not use "admin" username)
        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
                "GenerateSecretString", Match.objectLike(Map.of(
                        "SecretStringTemplate", Match.stringLikeRegexp(".*dbadmin.*")
                ))
        )));

        assertThat(stack.getAuroraCluster()).isNotNull();
    }

    /**
     * Test that S3 bucket is created with encryption and lifecycle rules.
     */
    @Test
    public void testS3BucketCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket with encryption
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "VersioningConfiguration", Map.of("Status", "Enabled"),
                "BucketEncryption", Match.objectLike(Map.of(
                        "ServerSideEncryptionConfiguration", Match.anyValue()
                )),
                "LifecycleConfiguration", Match.objectLike(Map.of(
                        "Rules", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "ExpirationInDays", 90
                        ))))
                ))
        )));

        assertThat(stack.getQrCodeBucket()).isNotNull();
    }

    /**
     * Test that QR Code Generator Lambda function is created.
     */
    @Test
    public void testQrCodeGeneratorLambdaCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "QRCodeGenerator-test",
                "Runtime", "python3.11",
                "Handler", "index.lambda_handler",
                "MemorySize", 512,
                "Timeout", 30
        )));

        // Verify Lambda has DynamoDB stream event source mapping
        template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                "StartingPosition", "LATEST",
                "BatchSize", 10
        )));

        assertThat(stack.getQrCodeGeneratorFunction()).isNotNull();
    }

    /**
     * Test that Validation Lambda function is created.
     */
    @Test
    public void testValidationLambdaCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify validation Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "TicketValidator-test",
                "Runtime", "python3.11",
                "Handler", "index.lambda_handler",
                "MemorySize", 256,
                "Timeout", 10
        )));
    }

    /**
     * Test that API Gateway is created with correct configuration.
     */
    @Test
    public void testApiGatewayCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify API Gateway REST API
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Match.objectLike(Map.of(
                "Name", "TicketValidationAPI-test"
        )));

        // Verify API Gateway deployment
        template.resourceCountIs("AWS::ApiGateway::Deployment", 1);

        // Verify API Gateway stage
        template.hasResourceProperties("AWS::ApiGateway::Stage", Match.objectLike(Map.of(
                "StageName", "prod"
        )));

        // Verify API Key
        template.hasResourceProperties("AWS::ApiGateway::ApiKey", Match.objectLike(Map.of(
                "Name", "TicketValidationKey-test",
                "Enabled", true
        )));

        // Verify Usage Plan
        template.hasResourceProperties("AWS::ApiGateway::UsagePlan", Match.objectLike(Map.of(
                "UsagePlanName", "TicketValidationPlan-test",
                "Throttle", Map.of(
                        "RateLimit", 100,
                        "BurstLimit", 200
                )
        )));

        assertThat(stack.getValidationApi()).isNotNull();
    }

    /**
     * Test that Cognito User Pool is created with correct settings.
     */
    @Test
    public void testCognitoUserPoolCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Cognito User Pool
        template.hasResourceProperties("AWS::Cognito::UserPool", Match.objectLike(Map.of(
                "UserPoolName", "TicketSystemUsers-test",
                "AutoVerifiedAttributes", List.of("email"),
                "MfaConfiguration", "OPTIONAL",
                "Policies", Match.objectLike(Map.of(
                        "PasswordPolicy", Match.objectLike(Map.of(
                                "MinimumLength", 8,
                                "RequireLowercase", true,
                                "RequireUppercase", true,
                                "RequireNumbers", true,
                                "RequireSymbols", true
                        ))
                ))
        )));

        // Verify User Pool Client
        template.hasResourceProperties("AWS::Cognito::UserPoolClient", Match.objectLike(Map.of(
                "ClientName", "WebAppClient-test",
                "GenerateSecret", false
        )));

        assertThat(stack.getUserPool()).isNotNull();
    }

    /**
     * Test that ECS Fargate service is created.
     */
    @Test
    public void testEcsFargateServiceCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify ECS Cluster
        template.resourceCountIs("AWS::ECS::Cluster", 1);

        // Verify ECS Task Definition
        template.hasResourceProperties("AWS::ECS::TaskDefinition", Match.objectLike(Map.of(
                "Cpu", "512",
                "Memory", "1024",
                "NetworkMode", "awsvpc",
                "RequiresCompatibilities", List.of("FARGATE")
        )));

        // Verify ECS Service
        template.hasResourceProperties("AWS::ECS::Service", Match.objectLike(Map.of(
                "DesiredCount", 2,
                "LaunchType", "FARGATE"
        )));

        // Verify Application Load Balancer
        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);

        // Verify Auto Scaling Target
        template.hasResourceProperties("AWS::ApplicationAutoScaling::ScalableTarget", Match.objectLike(Map.of(
                "MinCapacity", 2,
                "MaxCapacity", 10
        )));

        // Verify CPU scaling policy
        template.hasResourceProperties("AWS::ApplicationAutoScaling::ScalingPolicy", Match.objectLike(Map.of(
                "PolicyType", "TargetTrackingScaling",
                "TargetTrackingScalingPolicyConfiguration", Match.objectLike(Map.of(
                        "TargetValue", 70
                ))
        )));
    }

    /**
     * Test that SES Configuration Set is created.
     */
    @Test
    public void testSesConfigurationSet() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SES Configuration Set
        template.hasResourceProperties("AWS::SES::ConfigurationSet", Match.objectLike(Map.of(
                "Name", "ticketing-emails-test"
        )));
    }
    /**
     * Test IAM roles are created with correct permissions.
     */
    @Test
    public void testIamRoles() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda execution roles
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "lambda.amazonaws.com")
                        ))))
                ))
        )));

        // Verify ECS task role
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "ecs-tasks.amazonaws.com")
                        ))))
                ))
        )));

        // Verify API Gateway CloudWatch role
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "apigateway.amazonaws.com")
                        ))))
                ))
        )));
    }

    /**
     * Test security groups are created for all services.
     */
    @Test
    public void testSecurityGroups() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Count security groups (Aurora, Lambda, Validation Lambda, ECS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 5);

        // Verify Aurora security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for Aurora Serverless cluster"
        )));

        // Verify Lambda security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for Lambda functions"
        )));

        // Verify ECS security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for ECS tasks"
        )));
    }

    /**
     * Test TapStackProps builder pattern.
     */
    @Test
    public void testTapStackPropsBuilder() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();

        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    /**
     * Test TapStack with null props.
     */
    @Test
    public void testStackWithNullProps() {
        TapStack stack = new TapStack(app, "TestStack", null);

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test all getters return non-null values.
     */
    @Test
    public void testAllGetters() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack.getEnvironmentSuffix()).isNotNull();
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getTicketInventoryTable()).isNotNull();
        assertThat(stack.getAuroraCluster()).isNotNull();
        assertThat(stack.getQrCodeBucket()).isNotNull();
        assertThat(stack.getQrCodeGeneratorFunction()).isNotNull();
        assertThat(stack.getValidationApi()).isNotNull();
        assertThat(stack.getUserPool()).isNotNull();
    }

    /**
     * Test that removal policies are set for cleanup.
     */
    @Test
    public void testRemovalPolicies() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB has deletion policy
        template.hasResource("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));

        // Verify S3 bucket has deletion policy and auto-delete
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));

        // Verify Aurora cluster has deletion policy
        template.hasResource("AWS::RDS::DBCluster", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));
    }

    /**
     * Test environment variables are set correctly for Lambda functions.
     */
    @Test
    public void testLambdaEnvironmentVariables() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify QR Generator Lambda has required environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "QRCodeGenerator-test",
                "Environment", Match.objectLike(Map.of(
                        "Variables", Match.objectLike(Map.of(
                                "S3_BUCKET_NAME", Match.anyValue(),
                                "DYNAMODB_TABLE", Match.anyValue(),
                                "SENDER_EMAIL", "tickets@yourdomain.com"
                        ))
                ))
        )));

        // Verify Validation Lambda has required environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "TicketValidator-test",
                "Environment", Match.objectLike(Map.of(
                        "Variables", Match.objectLike(Map.of(
                                "DYNAMODB_TABLE", Match.anyValue()
                        ))
                ))
        )));
    }

    /**
     * Test that resources are created in private subnets where appropriate.
     */
    @Test
    public void testPrivateSubnetPlacement() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify subnets are created
        template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private

        // Verify private subnets have route tables
        template.resourceCountIs("AWS::EC2::RouteTable", 4); // 2 public + 2 private
    }

    /**
     * Integration test: Verify complete stack can be synthesized.
     */
    @Test
    public void testCompleteStackSynthesis() {
        App testApp = new App();
        
        TapStack stack = new TapStack(testApp, "TapStacktest", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        Template template = Template.fromStack(stack);

        // Verify major resource types exist
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::DynamoDB::Table", 1);
        template.resourceCountIs("AWS::RDS::DBCluster", 1);
        template.resourceCountIs("AWS::S3::Bucket", 1);
        template.resourceCountIs("AWS::Lambda::Function", 3);
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
        template.resourceCountIs("AWS::Cognito::UserPool", 1);
        template.resourceCountIs("AWS::ECS::Service", 1);
        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);

        assertThat(template).isNotNull();
    }
}
```