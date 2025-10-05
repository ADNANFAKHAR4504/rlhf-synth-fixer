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