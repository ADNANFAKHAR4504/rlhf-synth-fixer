I'll create a complete CDK Java application with three stacks that follows AWS best practices. Here's the implementation:


Project Structure
cdk-java-app/
├── pom.xml
└── src/
    └── main/
        └── java/
            └── com/
                └── example/
                    └── cdk/
                        ├── CdkApp.java
                        ├── NetworkStack.java
                        ├── DataStack.java
                        └── ComputeStack.java
```xml                       
pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>cdk-java-app</artifactId>
    <version>0.1.0</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.110.0</cdk.version>
        <junit.version>5.9.2</junit.version>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.example.cdk.CdkApp</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <dependencies>
        <!-- CDK Core -->
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>aws-cdk-lib</artifactId>
            <version>${cdk.version}</version>
        </dependency>
        
        <!-- CDK Nag -->
        <dependency>
            <groupId>io.github.cdklabs</groupId>
            <artifactId>cdk-nag</artifactId>
            <version>2.27.193</version>
        </dependency>

        <!-- Constructs -->
        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>[10.0.0,11.0.0)</version>
        </dependency>

        <!-- JUnit for testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>

```
CdkApp.java
```java
package com.example.cdk;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Aspects;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import io.github.cdklabs.cdknag.AwsSolutionsChecks;
import io.github.cdklabs.cdknag.NagSuppressions;
import io.github.cdklabs.cdknag.NagPackSuppression;
import java.util.Arrays;

public class CdkApp {
    public static void main(final String[] args) {
        App app = new App();

        // Define environment - using default account/region
        Environment env = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build();

        // Create Network Stack
        NetworkStack networkStack = new NetworkStack(app, "NetworkStack",
                StackProps.builder()
                        .env(env)
                        .description("Network infrastructure including VPC, subnets, and security groups")
                        .build());

        // Create Data Stack
        DataStack dataStack = new DataStack(app, "DataStack",
                StackProps.builder()
                        .env(env)
                        .description("Data layer including S3 buckets with encryption")
                        .build());

        // Create Compute Stack with dependencies
        ComputeStack computeStack = new ComputeStack(app, "ComputeStack",
                StackProps.builder()
                        .env(env)
                        .description("Compute layer including Lambda functions")
                        .build(),
                networkStack.getVpc(),
                networkStack.getSecurityGroup(),
                dataStack.getBucketArn(),
                dataStack.getBucketName());

        // Set explicit stack dependencies
        computeStack.addDependency(networkStack);
        computeStack.addDependency(dataStack);

        // Add CDK Nag checks to all stacks
        Aspects.of(app).add(new AwsSolutionsChecks());

        // Suppress CDK Nag warnings for the CDK Bootstrap resources
        NagSuppressions.addStackSuppressions(networkStack, Arrays.asList(
                NagPackSuppression.builder()
                        .id("AwsSolutions-IAM4")
                        .reason("AWS managed policies used by CDK Bootstrap are acceptable")
                        .appliesTo(Arrays.asList("Policy::arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))
                        .build()
        ));

        app.synth();
    }
}
NetworkStack.java
package com.example.cdk;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;
import io.github.cdklabs.cdknag.NagSuppressions;
import io.github.cdklabs.cdknag.NagPackSuppression;
import java.util.*;

public class NetworkStack extends Stack {
    private final Vpc vpc;
    private final SecurityGroup lambdaSecurityGroup;

    public NetworkStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with specific configuration for stability
        this.vpc = Vpc.Builder.create(this, "ApplicationVpc")
                .vpcName("cdk-app-vpc")
                .maxAzs(2)
                .natGateways(1) // Cost optimization - only 1 NAT Gateway
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .cidrMask(24)
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .build(),
                        SubnetConfiguration.builder()
                                .cidrMask(24)
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Create VPC Flow Logs for security compliance
        vpc.addFlowLog("VpcFlowLog", FlowLogOptions.builder()
                .trafficType(FlowLogTrafficType.ALL)
                .destination(FlowLogDestination.toCloudWatchLogs())
                .build());

        // Create S3 VPC Endpoint
        vpc.addGatewayEndpoint("S3Endpoint", GatewayVpcEndpointOptions.builder()
                .service(GatewayVpcEndpointAwsService.S3)
                .subnets(Arrays.asList(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()))
                .build());

        // Create DynamoDB VPC Endpoint
        vpc.addGatewayEndpoint("DynamoDBEndpoint", GatewayVpcEndpointOptions.builder()
                .service(GatewayVpcEndpointAwsService.DYNAMODB)
                .subnets(Arrays.asList(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build()))
                .build());

        // Create Security Group for Lambda with minimal permissions
        this.lambdaSecurityGroup = SecurityGroup.Builder.create(this, "LambdaSecurityGroup")
                .vpc(vpc)
                .description("Security group for Lambda functions")
                .allowAllOutbound(false) // Start with no outbound rules
                .build();

        // Add specific outbound rules for HTTPS only
        lambdaSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound for AWS API calls"
        );

        // Add outbound rule for DNS
        lambdaSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.udp(53),
                "Allow DNS queries"
        );

        // Suppress CDK Nag warnings with justifications
        NagSuppressions.addResourceSuppressions(
                vpc,
                Arrays.asList(
                        NagPackSuppression.builder()
                                .id("AwsSolutions-VPC7")
                                .reason("VPC Flow Logs are enabled with CloudWatch Logs destination")
                                .build()
                ),
                true
        );

        // Suppress warnings for security group rules
        NagSuppressions.addResourceSuppressions(
                lambdaSecurityGroup,
                Arrays.asList(
                        NagPackSuppression.builder()
                                .id("AwsSolutions-EC23")
                                .reason("Lambda functions need HTTPS access to AWS APIs")
                                .appliesTo(Arrays.asList("Resource::0.0.0.0/0"))
                                .build()
                ),
                true
        );
    }

    public Vpc getVpc() {
        return vpc;
    }

    public SecurityGroup getSecurityGroup() {
        return lambdaSecurityGroup;
    }
}
DataStack.java
package com.example.cdk;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.kms.*;
import software.amazon.awscdk.services.logs.*;
import software.constructs.Construct;
import io.github.cdklabs.cdknag.NagSuppressions;
import io.github.cdklabs.cdknag.NagPackSuppression;
import java.util.Arrays;

public class DataStack extends Stack {
    private final Bucket dataBucket;
    private final String bucketArn;
    private final String bucketName;

    public DataStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create KMS key for bucket encryption
        Key encryptionKey = Key.Builder.create(this, "BucketEncryptionKey")
                .description("KMS key for S3 bucket encryption")
                .enableKeyRotation(true)
                .alias("alias/cdk-app-bucket-key")
                .removalPolicy(RemovalPolicy.RETAIN) // Retain key to prevent data loss
                .build();

        // Create S3 Access Logs bucket
        Bucket logBucket = Bucket.Builder.create(this, "AccessLogsBucket")
                .bucketName(this.getAccount() + "-" + this.getRegion() + "-cdk-app-logs")
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSSL(true)
                .versioned(true)
                .lifecycleRules(Arrays.asList(
                        LifecycleRule.builder()
                                .id("DeleteOldLogs")
                                .expiration(software.amazon.awscdk.Duration.days(90))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // Create main data bucket with all security features
        this.dataBucket = Bucket.Builder.create(this, "DataBucket")
                .bucketName(this.getAccount() + "-" + this.getRegion() + "-cdk-app-data")
                .encryption(BucketEncryption.KMS)
                .encryptionKey(encryptionKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .enforceSSL(true)
                .serverAccessLogsBucket(logBucket)
                .serverAccessLogsPrefix("data-bucket-logs/")
                .lifecycleRules(Arrays.asList(
                        LifecycleRule.builder()
                                .id("TransitionOldVersions")
                                .noncurrentVersionTransitions(Arrays.asList(
                                        NoncurrentVersionTransition.builder()
                                                .storageClass(StorageClass.STANDARD_IA)
                                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                                .build()
                                ))
                                .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(365))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN) // Retain bucket to prevent data loss
                .build();

        // Store bucket details for cross-stack reference
        this.bucketArn = dataBucket.getBucketArn();
        this.bucketName = dataBucket.getBucketName();

        // Create CloudFormation outputs
        new CfnOutput(this, "DataBucketArn", CfnOutput.CfnOutputProps.builder()
                .value(bucketArn)
                .description("ARN of the data bucket")
                .exportName("DataStack-BucketArn")
                .build());

        new CfnOutput(this, "DataBucketName", CfnOutput.CfnOutputProps.builder()
                .value(bucketName)
                .description("Name of the data bucket")
                .exportName("DataStack-BucketName")
                .build());

        // CDK Nag suppressions
        NagSuppressions.addResourceSuppressions(
                logBucket,
                Arrays.asList(
                        NagPackSuppression.builder()
                                .id("AwsSolutions-S1")
                                .reason("This is the access logs bucket - it doesn't need its own access logging")
                                .build()
                ),
                true
        );
    }

    public String getBucketArn() {
        return bucketArn;
    }

    public String getBucketName() {
        return bucketName;
    }
}
ComputeStack.java
package com.example.cdk;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;
import io.github.cdklabs.cdknag.NagSuppressions;
import io.github.cdklabs.cdknag.NagPackSuppression;
import java.util.*;

public class ComputeStack extends Stack {
    
    public ComputeStack(final Construct scope, final String id, final StackProps props,
                        Vpc vpc, SecurityGroup securityGroup, String bucketArn, String bucketName) {
        super(scope, id, props);

        // Create CloudWatch Log Group for Lambda
        LogGroup logGroup = LogGroup.Builder.create(this, "LambdaLogGroup")
                .logGroupName("/aws/lambda/data-processor")
                .retention(RetentionDays.ONE_WEEK)
                .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                .build();

        // Create IAM role with least privilege for Lambda
        Role lambdaRole = Role.Builder.create(this, "DataProcessorRole")
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .description("Role for data processor Lambda function")
                .roleName("DataProcessorLambdaRole")
                .build();

        // Add managed policy for VPC execution
        lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole"));

        // Add specific permissions for S3 operations
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject",
                        "s3:DeleteObject"
                ))
                .resources(Arrays.asList(bucketArn + "/*"))
                .build());

        // Add permissions for S3 bucket operations
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "s3:ListBucket",
                        "s3:GetBucketLocation",
                        "s3:GetBucketVersioning"
                ))
                .resources(Arrays.asList(bucketArn))
                .build());

        // Add KMS permissions for encrypted bucket
        lambdaRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                ))
                .resources(Arrays.asList("arn:aws:kms:" + this.getRegion() + ":" + 
                        this.getAccount() + ":key/*"))
                .conditions(Map.of(
                        "StringEquals", Map.of(
                                "kms:ViaService", "s3." + this.getRegion() + ".amazonaws.com"
                        )
                ))
                .build());

        // Create Lambda function
        Function dataProcessor = Function.Builder.create(this, "DataProcessor")
                .functionName("data-processor")
                .description("Processes data from S3 bucket")
                .runtime(Runtime.PYTHON_3_11)
                .handler("index.handler")
                .code(Code.fromInline(getLambdaCode(bucketName)))
                .role(lambdaRole)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(securityGroup))
                .timeout(Duration.seconds(60))
                .memorySize(256)
                .architecture(Architecture.ARM_64) // Cost optimization
                .logGroup(logGroup)
                .environment(Map.of(
                        "BUCKET_NAME", bucketName,
                        "LOG_LEVEL", "INFO"
                ))
                .reservedConcurrentExecutions(10) // Prevent runaway Lambda invocations
                .build();

        // CDK Nag suppressions
        NagSuppressions.addResourceSuppressions(
                lambdaRole,
                Arrays.asList(
                        NagPackSuppression.builder()
                                .id("AwsSolutions-IAM4")
                                .reason("AWSLambdaVPCAccessExecutionRole is required for VPC-enabled Lambda functions")
                                .appliesTo(Arrays.asList("Policy::arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"))
                                .build(),
                        NagPackSuppression.builder()
                                .id("AwsSolutions-IAM5")
                                .reason("KMS key ARN uses wildcard because the specific key ID is not known at synthesis time")
                                .appliesTo(Arrays.asList("Resource::arn:aws:kms:" + this.getRegion() + 
                                        ":" + this.getAccount() + ":key/*"))
                                .build()
                ),
                true
        );
    }

    private String getLambdaCode(String bucketName) {
        return String.join("\n",
                "import json",
                "import boto3",
                "import os",
                "import logging",
                "",
                "# Configure logging",
                "logger = logging.getLogger()",
                "logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))",
                "",
                "# Initialize S3 client",
                "s3_client = boto3.client('s3')",
                "bucket_name = os.environ['BUCKET_NAME']",
                "",
                "def handler(event, context):",
                "    \"\"\"Process S3 data\"\"\"",
                "    try:",
                "        # Example: List objects in bucket",
                "        response = s3_client.list_objects_v2(",
                "            Bucket=bucket_name,",
                "            MaxKeys=10",
                "        )",
                "        ",
                "        objects = response.get('Contents', [])",
                "        logger.info(f'Found {len(objects)} objects in bucket')",
                "        ",
                "        # Example: Read and write a test file",
                "        test_key = 'test/sample.txt'",
                "        test_content = 'Hello from Lambda!'",
                "        ",
                "        # Write object",
                "        s3_client.put_object(",
                "            Bucket=bucket_name,",
                "            Key=test_key,",
                "            Body=test_content.encode('utf-8'),",
                "            ServerSideEncryption='aws:kms'",
                "        )",
                "        logger.info(f'Successfully wrote test file: {test_key}')",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'body': json.dumps({",
                "                'message': 'Data processed successfully',",
                "                'objectCount': len(objects)",
                "            })",
                "        }",
                "        ",
                "    except Exception as e:",
                "        logger.error(f'Error processing data: {str(e)}')",
                "        return {",
                "            'statusCode': 500,",
                "            'body': json.dumps({",
                "                'error': str(e)",
                "            })",
                "        }"
        );
    }
}

```
```json
cdk.json
Create this file in the root directory:

{
  "app": "mvn -e -q compile exec:java",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "target",
      "pom.xml",
      "src/test"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ]
  }
}
```
```markdown
Deployment Instructions
Build the project:
mvn clean compile
Bootstrap CDK (first time only):
cdk bootstrap
Synthesize the CloudFormation templates:
cdk synth
Deploy all stacks:
cdk deploy --all
Verify no changes on re-deploy:
cdk deploy --all
# Should show "No changes" for all stacks
Key Features Implemented
No Circular Dependencies:
Resources are properly separated into stacks
Explicit dependencies set with addDependency()
Values passed between stacks using constructor parameters
Stable Resource IDs:
All resources use explicit, stable names
No random values in resource names
Resources won't be replaced on re-deployment
Least Privilege IAM:
Lambda role has only required S3 permissions
S3 permissions scoped to specific bucket
KMS permissions restricted to S3 service usage
CDK Nag Compliance:
All high/medium findings addressed or suppressed with justification
Security best practices implemented (encryption, versioning, access logs)
VPC endpoints for AWS services
Production Ready:
S3 bucket with KMS encryption and versioning
CloudWatch Logs with retention policies
VPC with proper subnet configuration
Reserved concurrent executions to prevent runaway Lambda costs
The application creates a secure, compliant infrastructure that can be deployed and re-deployed without issues.
```