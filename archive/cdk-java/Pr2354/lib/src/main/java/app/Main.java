package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceProps;
import software.amazon.awscdk.services.rds.IInstanceEngine;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.Schedule;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String environmentSuffix, final StackProps stackProps) {
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

        public Builder environmentSuffix(final String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Main CDK stack for the startup web application infrastructure.
 * Follows TapStack naming convention and includes all required resources.
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create S3 bucket for application assets
        Bucket appBucket = new Bucket(this, "AppAssetsBucket" + environmentSuffix, BucketProps.builder()
                .bucketName("startup-app-assets-" + environmentSuffix.toLowerCase())
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ACLS)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build());

        // Create IAM role for Lambda function
        Role lambdaRole = new Role(this, "ProcessorLambdaRole" + environmentSuffix,
                software.amazon.awscdk.services.iam.RoleProps.builder()
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .build());

        // Add S3 permissions to Lambda role
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                ))
                .resources(Arrays.asList(
                        appBucket.getBucketArn(),
                        appBucket.getBucketArn() + "/*"
                ))
                .build());

        // Create VPC for RDS
        Vpc vpc = new Vpc(this, "StartupVpc" + environmentSuffix, software.amazon.awscdk.services.ec2.VpcProps.builder()
                .maxAzs(2)
                .natGateways(0)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build());

        // Create RDS MySQL database
        IInstanceEngine mysqlEngine = DatabaseInstanceEngine.mysql(
                software.amazon.awscdk.services.rds.MySqlInstanceEngineProps.builder()
                .version(MysqlEngineVersion.VER_8_0)
                .build()
        );

        DatabaseInstance database = new DatabaseInstance(this, "StartupDatabase" + environmentSuffix,
                DatabaseInstanceProps.builder()
                .engine(mysqlEngine)
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                        software.amazon.awscdk.services.ec2.InstanceClass.T3,
                        software.amazon.awscdk.services.ec2.InstanceSize.MICRO
                ))
                .storageType(StorageType.GP2)
                .allocatedStorage(20)
                .backupRetention(Duration.days(7))
                .deleteAutomatedBackups(false)
                .deletionProtection(false)
                .credentials(Credentials.fromGeneratedSecret("admin"))
                .databaseName("startupdb")
                .build());

        // Add RDS permissions to Lambda role
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "rds:DescribeDBInstances",
                        "rds-db:connect"
                ))
                .resources(Arrays.asList(database.getInstanceArn()))
                .build());

        // Create Lambda function for background processing
        Function processorFunction = new Function(this, "BackgroundProcessor" + environmentSuffix,
                FunctionProps.builder()
                .runtime(Runtime.PYTHON_3_11)
                .handler("lambda_function.lambda_handler")
                .code(Code.fromAsset("lib/lambda-code"))
                .role(lambdaRole)
                .timeout(Duration.minutes(5))
                .environment(java.util.Map.of(
                        "BUCKET_NAME", appBucket.getBucketName(),
                        "DB_HOST", database.getInstanceEndpoint().getHostname()
                ))
                .build());

        // Create EventBridge Rule for time-based tasks
        Rule backgroundRule = new Rule(this, "BackgroundProcessingRule" + environmentSuffix,
                software.amazon.awscdk.services.events.RuleProps.builder()
                .schedule(Schedule.rate(Duration.hours(1)))
                .description("Hourly background processing for startup application")
                .build());
        
        backgroundRule.addTarget(new LambdaFunction(processorFunction));

        // Stack outputs for integration testing and application reference
        new CfnOutput(this, "S3BucketName" + environmentSuffix, CfnOutputProps.builder()
                .value(appBucket.getBucketName())
                .description("S3 bucket name for application assets")
                .exportName("StartupAppBucket" + environmentSuffix)
                .build());

        new CfnOutput(this, "DatabaseEndpoint" + environmentSuffix, CfnOutputProps.builder()
                .value(database.getInstanceEndpoint().getHostname())
                .description("RDS MySQL database endpoint")
                .exportName("StartupDbEndpoint" + environmentSuffix)
                .build());

        new CfnOutput(this, "LambdaFunctionName" + environmentSuffix, CfnOutputProps.builder()
                .value(processorFunction.getFunctionName())
                .description("Background processing Lambda function name")
                .exportName("StartupProcessorFunction" + environmentSuffix)
                .build());

        new CfnOutput(this, "ScheduleName" + environmentSuffix, CfnOutputProps.builder()
                .value(backgroundRule.getRuleName())
                .description("EventBridge Rule for background processing")
                .exportName("StartupProcessingRule" + environmentSuffix)
                .build());
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

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
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
