# AWS CDK Java Implementation: Secure Cloud Infrastructure

## Problem Statement

Your task is to write a **Java program using AWS Cloud Development Kit (CDK)** to set up a secure AWS cloud environment following best practices for security and compliance. The environment includes a collection of interconnected AWS services such as EC2, Lambda, S3, RDS, and others within a VPC. The implementation must adhere to the following security constraints:

## Security Requirements

### 1. IAM Security
- **Requirement 1**: Ensure IAM roles allow only specific actions to the Lambda function
- **Requirement 2**: Enforce MFA for IAM users accessing the application  
- **Requirement 14**: Limit IAM user policies to specific resource ARNs for least privilege

### 2. Network Security
- **Requirement 7**: Ensure that EC2 instances are launched within a VPC
- **Requirement 8**: Ensure no security groups permit inbound SSH access from 0.0.0.0/0
- **Requirement 17**: Deploy a bastion host for SSH access to production servers
- **Requirement 19**: Setup VPC flow logs to monitor and log traffic into the VPC

### 3. Storage Security
- **Requirement 3**: Restrict S3 bucket access to only specific IP addresses
- **Requirement 6**: Encrypt all data at rest using AWS KMS wherever applicable
- **Requirement 13**: Ensure that EBS volumes are encrypted when created
- **Requirement 16**: Require all actions in S3 buckets to be logged with AWS CloudTrail

### 4. Database Security
- **Requirement 4**: Disable public access to all RDS instances within the VPC

### 5. Web Application Security
- **Requirement 9**: Ensure that any CloudFront distribution enforces HTTPS-only traffic
- **Requirement 15**: Ensure that AWS WAF is used for any publicly facing API
- **Requirement 18**: Implement AWS Shield to protect against volumetric DDoS attacks

### 6. Monitoring and Compliance
- **Requirement 5**: Implement CloudTrail to monitor all AWS API calls
- **Requirement 10**: Audit logs should be set with a retention period of at least 365 days
- **Requirement 11**: Deploy GuardDuty to continuously monitor AWS accounts for threats
- **Requirement 12**: Utilize AWS Config to track resource configuration and compliance

## Expected Deliverables

### Core Implementation

Create a **Java program utilizing AWS CDK** with the following components:

#### 1. Security Stack

```java
/**
 * Security Infrastructure Stack
 * 
 * Creates comprehensive security infrastructure including KMS, IAM, GuardDuty,
 * CloudTrail, Config, and WAF components.
 */
class SecurityStack extends Stack {
    private final Key kmsKey;
    private final CfnDetector guardDutyDetector;
    private final Trail cloudTrail;
    private final CfnWebACL webAcl;
    private final LogGroup securityLogGroup;

    SecurityStack(final Construct scope, final String id, 
                  final String environmentSuffix, final List<String> allowedIpAddresses, 
                  final StackProps props) {
        super(scope, id, props);

        // Create KMS Key for encryption at rest
        this.kmsKey = Key.Builder.create(this, "SecurityKmsKey")
                .description("KMS key for encryption at rest - " + environmentSuffix)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create Security Log Group with 365 days retention
        this.securityLogGroup = LogGroup.Builder.create(this, "SecurityLogGroup")
                .logGroupName("/aws/security/tap-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Enable GuardDuty
        this.guardDutyDetector = CfnDetector.Builder.create(this, "GuardDutyDetector")
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .build();

        // Setup CloudTrail, AWS Config, and WAF...
    }
}
```

#### 2. Infrastructure Stack

```java
/**
 * VPC Infrastructure Stack with enhanced security
 */
class InfrastructureStack extends Stack {
    private final Vpc vpc;
    private final Instance ec2Instance;
    private final Instance bastionHost;
    private final SecurityGroup sshSecurityGroup;
    private final SecurityGroup bastionSecurityGroup;
    private final DatabaseInstance rdsInstance;

    InfrastructureStack(final Construct scope, final String id, 
                       final String environmentSuffix, final List<String> allowedIpAddresses,
                       final Key kmsKey, final StackProps props) {
        super(scope, id, props);

        // Create VPC with both public and private subnets
        this.vpc = Vpc.Builder.create(this, "MainVpc")
                .vpcName("tap-" + environmentSuffix + "-vpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .enableDnsSupport(true)
                .enableDnsHostnames(true)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PUBLIC)
                                .name("PublicSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .name("PrivateSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .name("DatabaseSubnet")
                                .cidrMask(28)
                                .build()))
                .natGateways(1)
                .build();

        // Enable VPC Flow Logs
        LogGroup vpcFlowLogGroup = LogGroup.Builder.create(this, "VpcFlowLogGroup")
                .logGroupName("/aws/vpc/flowlogs-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        FlowLog.Builder.create(this, "VpcFlowLog")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .destination(FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup))
                .build();

        // Create bastion host and secure EC2 instances...
    }
}
```

#### 3. Application Stack

```java
/**
 * Application Stack with Lambda, S3, and API Gateway
 */
class ApplicationStack extends Stack {
    private final Function lambdaFunction;
    private final Bucket s3Bucket;
    private final RestApi apiGateway;
    private final Distribution cloudFrontDistribution;

    ApplicationStack(final Construct scope, final String id, 
                    final String environmentSuffix, final List<String> allowedIpAddresses,
                    final Key kmsKey, final CfnWebACL webAcl, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket with IP restrictions and encryption
        this.s3Bucket = Bucket.Builder.create(this, "AppBucket")
                .bucketName("tap-" + environmentSuffix + "-app-data-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create IAM role for Lambda with least privilege
        Role lambdaRole = Role.Builder.create(this, "LambdaRole")
                .roleName("tap-" + environmentSuffix + "-lambda-role")
                .assumedBy(ServicePrincipal.Builder.create("lambda.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")))
                .inlinePolicies(Map.of("RestrictedAccess", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                                        .build()))
                        .build()))
                .build();

        // Create API Gateway with WAF protection and rate limiting...
    }
}
```

### Main Stack Orchestration

```java
/**
 * Main CDK stack that orchestrates all components
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final SecurityStack securityStack;
    private final InfrastructureStack infrastructureStack;
    private final ApplicationStack applicationStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix and allowed IPs
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        List<String> allowedIpAddresses = Optional.ofNullable(props)
                .map(TapStackProps::getAllowedIpAddresses)
                .orElse(Arrays.asList("203.0.113.0/32"));

        // Create security stack first
        this.securityStack = new SecurityStack(
                this, "Security", environmentSuffix, allowedIpAddresses,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Security Stack for environment: " + environmentSuffix)
                        .build());

        // Create infrastructure stack
        this.infrastructureStack = new InfrastructureStack(
                this, "Infrastructure", environmentSuffix, allowedIpAddresses,
                securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Infrastructure Stack for environment: " + environmentSuffix)
                        .build());

        // Create application stack
        this.applicationStack = new ApplicationStack(
                this, "Application", environmentSuffix, allowedIpAddresses,
                securityStack.getKmsKey(), securityStack.getWebAcl(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Application Stack for environment: " + environmentSuffix)
                        .build());

        // Add stack dependencies
        infrastructureStack.addDependency(securityStack);
        applicationStack.addDependency(securityStack);
        applicationStack.addDependency(infrastructureStack);
    }
}
```

## Project Structure

```
src/
├── main/
│   └── java/
│       └── app/
│           └── Main.java
└── test/
    └── java/
        └── SecurityComplianceTest.java

build.gradle
cdk.json
README.md
```

## Security Implementation Checklist

### IAM & Access Control
- [ ] **IAM Roles**: Lambda role with specific S3 and KMS permissions only
- [ ] **MFA Enforcement**: IAM policies requiring MFA for user access
- [ ] **Least Privilege**: All IAM policies scoped to specific resource ARNs

### Network Security
- [ ] **VPC Deployment**: All EC2 instances launched within VPC subnets
- [ ] **SSH Security**: No direct SSH from internet, bastion host with IP restrictions
- [ ] **VPC Flow Logs**: Network traffic monitoring and logging enabled

### Storage & Encryption
- [ ] **S3 IP Restrictions**: Bucket policies limiting access to specified IP ranges
- [ ] **KMS Encryption**: All S3 buckets, EBS volumes, RDS instances, and logs encrypted
- [ ] **EBS Encryption**: All EC2 block devices encrypted with KMS

### Database Security
- [ ] **Private RDS**: Database instances in isolated subnets, no public access

### Web Application Security
- [ ] **HTTPS Enforcement**: CloudFront distributions redirect HTTP to HTTPS
- [ ] **WAF Protection**: Web Application Firewall protecting public APIs
- [ ] **Shield Protection**: AWS Shield Standard enabled for DDoS protection

### Monitoring & Compliance
- [ ] **CloudTrail**: Multi-region trail with encryption and 365-day log retention
- [ ] **365-Day Retention**: All CloudWatch log groups configured for 1-year retention
- [ ] **GuardDuty**: Threat detection enabled with S3 and malware protection
- [ ] **AWS Config**: Resource compliance monitoring and configuration tracking
- [ ] **CloudTrail S3 Logging**: All S3 API calls logged and monitored

### Infrastructure Security
- [ ] **Bastion Host**: Secure SSH access through dedicated jump server

## Testing Requirements

The implementation must include **unit tests** that verify security configurations comply with the requirements:

```java
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.cdk.assertions.Template;
import software.amazon.awscdk.cdk.assertions.Match;

class SecurityComplianceTest {

    @Test
    void testSecurityGroupRestrictionsCompliance() {
        // Arrange
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .allowedIpAddresses(Arrays.asList("203.0.113.0/32"))
                .build());

        // Act
        Template template = Template.fromStack(stack);

        // Assert - Verify no security groups allow SSH from 0.0.0.0/0
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "SecurityGroupIngress", Match.arrayWith(
                        Match.objectLike(Map.of(
                                "IpProtocol", "tcp",
                                "FromPort", 22,
                                "CidrIp", Match.not("0.0.0.0/0")
                        ))
                )
        ));
    }

    @Test
    void testS3BucketEncryptionCompliance() {
        // Verify all S3 buckets use KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", Match.arrayWith(
                                Match.objectLike(Map.of(
                                        "ServerSideEncryptionByDefault", Map.of(
                                                "SSEAlgorithm", "aws:kms"
                                        )
                                ))
                        )
                )
        ));
    }

    @Test
    void testRDSPrivateAccessCompliance() {
        // Verify RDS instances are not publicly accessible
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "PubliclyAccessible", false
        ));
    }

    @Test
    void testCloudTrailEncryptionCompliance() {
        // Verify CloudTrail uses KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
                "KMSKeyId", Match.anyValue(),
                "IncludeGlobalServiceEvents", true,
                "IsMultiRegionTrail", true
        ));
    }

    @Test
    void testVPCFlowLogsCompliance() {
        // Verify VPC Flow Logs are enabled
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::EC2::FlowLog", Map.of(
                "ResourceType", "VPC"
        ));
    }
}
```

## Environment Configuration

The implementation should support environment-specific configuration through environment variables and context:

```java
/**
 * Main entry point for the CDK Java application
 */
public final class Main {

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Get allowed IP addresses from environment or use defaults
        String allowedIpsEnv = System.getenv("ALLOWED_IP_ADDRESSES");
        List<String> allowedIpAddresses;
        if (allowedIpsEnv != null && !allowedIpsEnv.isEmpty()) {
            allowedIpAddresses = Arrays.asList(allowedIpsEnv.split(","));
        } else {
            // Default to example IP - replace with your actual IPs
            allowedIpAddresses = Arrays.asList("203.0.113.0/32", "198.51.100.0/32");
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .allowedIpAddresses(allowedIpAddresses)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-1")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

## Build Configuration

### build.gradle

```gradle
plugins {
    id 'application'
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'software.amazon.awscdk:aws-cdk-lib:2.90.0'
    implementation 'software.constructs:constructs:10.2.69'
    
    testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
    testImplementation 'software.amazon.awscdk:cdk-assertions:2.90.0'
}

application {
    mainClass = 'app.Main'
}

test {
    useJUnitPlatform()
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}

compileJava {
    options.compilerArgs += ['-Xlint:unchecked', '-Xlint:deprecation']
}
```

### cdk.json

```json
{
  "app": "./gradlew run",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "build/**",
      ".gradle/**",
      "node_modules/**",
      "*.iml"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## Deployment Instructions

### Prerequisites

1. **Install required tools:**
   ```bash
   # Install Node.js (required for CDK)
   brew install node
   
   # Install AWS CLI
   brew install awscli
   
   # Install CDK CLI
   npm install -g aws-cdk
   
   # Install Java 11+
   brew install openjdk@11
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

### Environment Setup

```bash
# Set environment variables
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-west-1
export ENVIRONMENT_SUFFIX=prod
export ALLOWED_IP_ADDRESSES="YOUR.IP.ADDRESS/32"

# Find your current IP address
curl -s https://ipinfo.io/ip
```

### Deployment Steps

1. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

2. **Build the project:**
   ```bash
   ./gradlew clean build
   ```

3. **Synthesize CloudFormation templates:**
   ```bash
   cdk synth
   ```

4. **Run security tests:**
   ```bash
   ./gradlew test
   ```

5. **Deploy the infrastructure:**
   ```bash
   cdk deploy
   ```

6. **Clean up (when needed):**
   ```bash
   cdk destroy
   ```

## Success Criteria

Once deployed, the infrastructure must:

1. **✅ Pass all security compliance checks**
2. **✅ Successfully deploy without errors**  
3. **✅ Allow secure access only through designated entry points**
4. **✅ Maintain comprehensive audit trails**
5. **✅ Encrypt all data at rest and in transit**
6. **✅ Provide real-time threat monitoring**
7. **✅ Enforce least-privilege access patterns**
8. **✅ Meet all 19 specified security requirements**

## Validation Commands

After deployment, verify security compliance:

```bash
# Verify CloudTrail is enabled
aws cloudtrail describe-trails --region us-west-1

# Verify GuardDuty is enabled  
aws guardduty list-detectors --region us-west-1

# Verify S3 bucket encryption
aws s3api get-bucket-encryption --bucket YOUR-BUCKET-NAME

# Verify RDS encryption
aws rds describe-db-instances --region us-west-1 --query 'DBInstances[*].{DBInstanceIdentifier:DBInstanceIdentifier,StorageEncrypted:StorageEncrypted}'

# Verify VPC Flow Logs
aws ec2 describe-flow-logs --region us-west-1

# Verify security group rules
aws ec2 describe-security-groups --region us-west-1 --query 'SecurityGroups[*].{GroupId:GroupId,IpPermissions:IpPermissions}'
```

The final implementation should serve as a **production-ready, security-compliant AWS infrastructure** that can be used as a foundation for secure cloud applications.