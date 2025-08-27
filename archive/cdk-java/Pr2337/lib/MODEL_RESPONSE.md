I'd be happy to help you build a secure infrastructure setup using AWS CDK Java! Based on your requirements, I'll create a comprehensive solution that follows AWS security best practices and incorporates some of the latest features.

Let me break this down into a well-structured CDK Java implementation:

## Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.events.EventBus;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.RuleProps;
import software.amazon.awscdk.services.events.EventPattern;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeyProps;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceProps;
import software.amazon.awscdk.services.rds.InstanceClass;
import software.amazon.awscdk.services.rds.InstanceSize;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.StorageEncrypted;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.rds.SubnetGroupProps;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.PublicAccessBlockConfiguration;
import software.amazon.awscdk.services.s3.notifications.EventBridgeDestination;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretProps;
import software.amazon.awscdk.services.secretsmanager.SecretStringGenerator;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.Port;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
 * Secure Infrastructure Stack for Security Configuration as Code.
 * 
 * This stack creates a comprehensive secure infrastructure setup including:
 * - VPC with private subnets for isolation
 * - S3 bucket with strict security controls
 * - Lambda function for log processing
 * - RDS database with encryption at rest
 * - EventBridge for event-driven architecture
 * - Secrets Manager for credential management
 */
class TapStackSecurityConfig extends Stack {
    private final String environmentSuffix;

    public TapStackSecurityConfig(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("SecurityConfig");

        // Apply consistent tagging
        Tags.of(this).add("Project", "SecurityConfig");
        Tags.of(this).add("Environment", environmentSuffix);

        // Create VPC for network isolation
        Vpc vpc = new Vpc(this, "SecureVPC", VpcProps.builder()
                .cidr("10.0.0.0/16")
                .maxAzs(2)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("private-subnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build(),
                    SubnetConfiguration.builder()
                        .cidrMask(24)
                        .name("public-subnet")
                        .subnetType(SubnetType.PUBLIC)
                        .build()
                ))
                .build());

        // Create KMS key for encryption
        Key encryptionKey = new Key(this, "SecurityConfigKMSKey", KeyProps.builder()
                .description("KMS key for SecurityConfig project encryption")
                .build());

        // Create S3 bucket with strict security controls
        Bucket confidentialLogsBucket = new Bucket(this, "ConfidentialLogsBucket", BucketProps.builder()
                .encryption(BucketEncryption.S3_MANAGED)
                .publicAccessBlockConfiguration(PublicAccessBlockConfiguration.builder()
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build())
                .versioned(true)
                .build());

        // Generate database credentials in Secrets Manager
        Secret dbSecret = new Secret(this, "DatabaseSecret", SecretProps.builder()
                .description("RDS database credentials for SecurityConfig")
                .generateSecretString(SecretStringGenerator.builder()
                        .secretStringTemplate("{\"username\": \"securityadmin\"}")
                        .generateStringKey("password")
                        .excludeCharacters("\"@/\\")
                        .build())
                .build());

        // Create security group for RDS
        SecurityGroup rdsSecurityGroup = new SecurityGroup(this, "RDSSecurityGroup", SecurityGroupProps.builder()
                .vpc(vpc)
                .description("Security group for RDS database")
                .build());

        // Create RDS subnet group
        SubnetGroup rdsSubnetGroup = new SubnetGroup(this, "RDSSubnetGroup", SubnetGroupProps.builder()
                .description("Subnet group for RDS database")
                .vpc(vpc)
                .subnets(vpc.getPrivateSubnets())
                .build());

        // Create RDS database with encryption
        DatabaseInstance database = new DatabaseInstance(this, "SecureDatabase", DatabaseInstanceProps.builder()
                .engine(DatabaseInstance.engineFromEngineAttributes(DatabaseInstanceEngine.postgres(PostgresEngineVersion.VER_15)))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .credentials(software.amazon.awscdk.services.rds.Credentials.fromSecret(dbSecret))
                .vpc(vpc)
                .subnetGroup(rdsSubnetGroup)
                .securityGroups(Arrays.asList(rdsSecurityGroup))
                .storageEncrypted(true)
                .storageEncryptionKey(encryptionKey)
                .publiclyAccessible(false)
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deletionProtection(false)
                .build());

        // Create Lambda execution role with least privilege
        Role lambdaRole = new Role(this, "LogProcessorRole", RoleProps.builder()
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .build());

        // Add specific permissions for S3, RDS, and Secrets Manager
        lambdaRole.addToPolicy(PolicyStatement.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                .resources(Arrays.asList(confidentialLogsBucket.getBucketArn() + "/*"))
                .build());

        lambdaRole.addToPolicy(PolicyStatement.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("secretsmanager:GetSecretValue"))
                .resources(Arrays.asList(dbSecret.getSecretArn()))
                .build());

        lambdaRole.addToPolicy(PolicyStatement.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList("rds:DescribeDBInstances"))
                .resources(Arrays.asList("*"))
                .build());

        // Create security group for Lambda
        SecurityGroup lambdaSecurityGroup = new SecurityGroup(this, "LambdaSecurityGroup", SecurityGroupProps.builder()
                .vpc(vpc)
                .description("Security group for Lambda function")
                .build());

        // Allow Lambda to access RDS
        rdsSecurityGroup.addIngressRule(lambdaSecurityGroup, Port.tcp(5432), "Allow Lambda access");

        // Create Lambda function for log processing
        Function logProcessorFunction = new Function(this, "LogProcessorFunction", FunctionProps.builder()
                .runtime(Runtime.PYTHON_3_11)
                .code(Code.fromInline("""
                    import json
                    import boto3
                    import psycopg2
                    import os
                    from botocore.exceptions import ClientError

                    def lambda_handler(event, context):
                        print(f"Received event: {json.dumps(event)}")
                        
                        # Process S3 event from EventBridge
                        for record in event.get('Records', []):
                            if 'eventBridge' in record:
                                s3_event = record['eventBridge']['detail']
                                bucket = s3_event['bucket']['name']
                                key = s3_event['object']['key']
                                
                                print(f"Processing file: {key} from bucket: {bucket}")
                                
                                # Here you would implement your log processing logic
                                # For example: read from S3, process data, write to RDS
                                
                        return {
                            'statusCode': 200,
                            'body': json.dumps('Log processing completed successfully')
                        }
                    """))
                .handler("index.lambda_handler")
                .role(lambdaRole)
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(lambdaSecurityGroup))
                .environment(Map.of(
                    "BUCKET_NAME", confidentialLogsBucket.getBucketName(),
                    "DB_SECRET_ARN", dbSecret.getSecretArn(),
                    "DB_ENDPOINT", database.getInstanceEndpoint().getHostname()
                ))
                .timeout(software.amazon.awscdk.Duration.minutes(5))
                .build());

        // Create EventBridge rule for S3 events
        EventBus eventBus = EventBus.fromEventBusName(this, "DefaultEventBus", "default");
        
        Rule s3EventRule = new Rule(this, "S3LogProcessingRule", RuleProps.builder()
                .eventBus(eventBus)
                .eventPattern(EventPattern.builder()
                        .source(Arrays.asList("aws.s3"))
                        .detailType(Arrays.asList("Object Created"))
                        .detail(Map.of(
                            "bucket", Map.of("name", Arrays.asList(confidentialLogsBucket.getBucketName()))
                        ))
                        .build())
                .targets(Arrays.asList(new LambdaFunction(logProcessorFunction)))
                .build());

        // Configure S3 to send events to EventBridge
        confidentialLogsBucket.addEventNotification(
            software.amazon.awscdk.services.s3.EventType.OBJECT_CREATED,
            new EventBridgeDestination()
        );

        // Create outputs for integration testing
        new CfnOutput(this, "BucketName", software.amazon.awscdk.CfnOutputProps.builder()
                .value(confidentialLogsBucket.getBucketName())
                .description("Name of the confidential logs S3 bucket")
                .exportName("SecurityConfig-BucketName-" + environmentSuffix)
                .build());

        new CfnOutput(this, "LambdaFunctionArn", software.amazon.awscdk.CfnOutputProps.builder()
                .value(logProcessorFunction.getFunctionArn())
                .description("ARN of the log processor Lambda function")
                .exportName("SecurityConfig-LambdaArn-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DatabaseEndpoint", software.amazon.awscdk.CfnOutputProps.builder()
                .value(database.getInstanceEndpoint().getHostname())
                .description("RDS database endpoint")
                .exportName("SecurityConfig-DatabaseEndpoint-" + environmentSuffix)
                .build());

        new CfnOutput(this, "VpcId", software.amazon.awscdk.CfnOutputProps.builder()
                .value(vpc.getVpcId())
                .description("VPC ID for the secure infrastructure")
                .exportName("SecurityConfig-VpcId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "KmsKeyId", software.amazon.awscdk.CfnOutputProps.builder()
                .value(encryptionKey.getKeyId())
                .description("KMS key ID for encryption")
                .exportName("SecurityConfig-KmsKeyId-" + environmentSuffix)
                .build());

        new CfnOutput(this, "DatabaseSecretArn", software.amazon.awscdk.CfnOutputProps.builder()
                .value(dbSecret.getSecretArn())
                .description("ARN of the database credentials secret")
                .exportName("SecurityConfig-DbSecretArn-" + environmentSuffix)
                .build());
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the Security Configuration CDK Java application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'SecurityConfig'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "SecurityConfig";
        }

        // Create the Security Configuration stack
        new TapStackSecurityConfig(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

This implementation provides:

1. **VPC Isolation**: All resources are deployed within a VPC with private subnets for maximum security
2. **S3 Security**: Bucket with SSE-S3 encryption and complete public access blocking
3. **Lambda Security**: Least privilege IAM role with only necessary permissions
4. **RDS Security**: Database with KMS encryption, private subnets, and no public access
5. **Secrets Management**: Database credentials stored securely in AWS Secrets Manager
6. **EventBridge Integration**: Modern event-driven architecture using EventBridge for S3 notifications
7. **Latest AWS Features**: Incorporates EventBridge (the modern replacement for S3 Events), IAM best practices, and enhanced security configurations

Key security features implemented:
- All resources are tagged for compliance tracking
- VPC with private subnets isolates database traffic
- Security groups restrict access appropriately
- KMS encryption for RDS storage
- Secrets Manager for credential management
- Comprehensive CloudFormation outputs for integration testing

The Lambda function includes a basic framework for processing S3 events and connecting to your RDS database. You'll want to expand the processing logic based on your specific requirements, but this gives you a solid, secure foundation to build upon.