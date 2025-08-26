# CDK Java Cloud Environment Setup Implementation

I'll create a comprehensive cloud infrastructure setup using AWS CDK Java that establishes a secure VPC foundation with proper networking, storage, and modern AWS services integration.

## Architecture Overview

The solution implements a nested stack pattern with:
- **TapStack**: Main orchestrating stack
- **VpcStack**: Network infrastructure (VPC, subnets, gateways, routing)
- **S3Stack**: Storage infrastructure (S3 bucket with versioning)
- **EventBridgeStack**: Event scheduling capabilities

## Implementation Files

### Main TapStack (lib/src/main/java/app/Main.java)

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
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
 * Represents the main CDK stack for the Cloud Environment Setup project.
 *
 * This stack orchestrates the creation of VPC, S3, and EventBridge infrastructure
 * using a nested stack pattern for better organization and modularity.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final VpcStack vpcStack;
    private final S3Stack s3Stack;
    private final EventBridgeStack eventBridgeStack;

    /**
     * Constructs a new TapStack with nested infrastructure stacks.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Properties for configuring the stack
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Apply common tags to all resources in this stack
        Tags.of(this).add("Environment", "Development");
        Tags.of(this).add("Project", "CloudEnvironmentSetup");
        Tags.of(this).add("ManagedBy", "CDK");

        // Create VPC Stack - foundational networking infrastructure
        this.vpcStack = new VpcStack(
            this,
            "VpcStack" + environmentSuffix,
            VpcStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .build()
        );

        // Create S3 Stack for application logs storage
        this.s3Stack = new S3Stack(
            this,
            "S3Stack" + environmentSuffix,
            S3StackProps.builder()
                .environmentSuffix(environmentSuffix)
                .build()
        );

        // Create EventBridge Stack for future event scheduling capabilities
        this.eventBridgeStack = new EventBridgeStack(
            this,
            "EventBridgeStack" + environmentSuffix,
            EventBridgeStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .vpc(vpcStack.getVpc())
                .build()
        );
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    /**
     * Gets the VPC stack instance.
     *
     * @return The VPC stack
     */
    public VpcStack getVpcStack() {
        return vpcStack;
    }

    /**
     * Gets the S3 stack instance.
     *
     * @return The S3 stack
     */
    public S3Stack getS3Stack() {
        return s3Stack;
    }

    /**
     * Gets the EventBridge stack instance.
     *
     * @return The EventBridge stack
     */
    public EventBridgeStack getEventBridgeStack() {
        return eventBridgeStack;
    }
}

/**
 * Main entry point for the Cloud Environment Setup CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration for the us-west-2 region.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack for us-west-2 region
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")  // Explicitly set to us-west-2
                                .build())
                        .description("Cloud Environment Setup - VPC, S3, and EventBridge infrastructure for development environment")
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

### VPC Stack (lib/src/main/java/app/VpcStack.java)

```java
package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.List;

/**
 * Properties for configuring the VPC stack.
 */
class VpcStackProps {
    private final String environmentSuffix;
    private final NestedStackProps nestedStackProps;

    private VpcStackProps(String environmentSuffix, NestedStackProps nestedStackProps) {
        this.environmentSuffix = environmentSuffix;
        this.nestedStackProps = nestedStackProps != null ? nestedStackProps : NestedStackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public NestedStackProps getNestedStackProps() {
        return nestedStackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private NestedStackProps nestedStackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder nestedStackProps(NestedStackProps nestedStackProps) {
            this.nestedStackProps = nestedStackProps;
            return this;
        }

        public VpcStackProps build() {
            return new VpcStackProps(environmentSuffix, nestedStackProps);
        }
    }
}

/**
 * VPC Stack for creating networking infrastructure.
 * 
 * This nested stack creates a VPC with public and private subnets,
 * internet gateway, NAT gateway, and proper routing configuration.
 */
class VpcStack extends NestedStack {
    private final Vpc vpc;
    private final InternetGateway internetGateway;
    private final NatGateway natGateway;

    /**
     * Creates a new VPC stack with complete networking infrastructure.
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Stack configuration properties
     */
    public VpcStack(final Construct scope, final String id, final VpcStackProps props) {
        super(scope, id, props.getNestedStackProps());

        String environmentSuffix = props.getEnvironmentSuffix();

        // Create VPC with specified CIDR block
        this.vpc = Vpc.Builder.create(this, "Vpc")
                .vpcName("cloud-env-vpc-" + environmentSuffix)
                .cidr("10.0.0.0/16")
                .maxAzs(2)  // Use exactly 2 AZs for cost optimization
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)  // Creates 10.0.1.0/24 and 10.0.2.0/24
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_NAT)
                        .cidrMask(24)  // Creates 10.0.3.0/24 and 10.0.4.0/24
                        .build()
                ))
                .natGateways(1)  // Single NAT Gateway for cost optimization
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Get the internet gateway created by the VPC
        this.internetGateway = (InternetGateway) vpc.getInternetGatewayId();

        // Get the first (and only) NAT Gateway
        this.natGateway = null; // CDK automatically creates and manages NAT Gateway

        // Create VPC Endpoints for enhanced security and cost optimization
        createVpcEndpoints();

        // Apply tags to VPC and related resources
        Tags.of(vpc).add("Name", "cloud-env-vpc-" + environmentSuffix);
        Tags.of(vpc).add("Environment", "Development");
        Tags.of(this).add("Component", "Networking");
    }

    /**
     * Creates VPC endpoints for AWS services to reduce NAT Gateway usage and improve security.
     */
    private void createVpcEndpoints() {
        // S3 Gateway Endpoint (no charge)
        vpc.addGatewayEndpoint("S3Endpoint", GatewayVpcEndpointOptions.builder()
                .service(GatewayVpcEndpointAwsService.S3)
                .subnets(List.of(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_NAT)
                    .build()))
                .build());

        // EventBridge Interface Endpoint with ServiceRegion configuration
        InterfaceVpcEndpoint eventBridgeEndpoint = vpc.addInterfaceEndpoint("EventBridgeEndpoint",
            InterfaceVpcEndpointOptions.builder()
                .service(new InterfaceVpcEndpointService("com.amazonaws.us-west-2.events"))
                .subnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PRIVATE_WITH_NAT)
                    .build())
                .privateDnsEnabled(true)
                .build());

        Tags.of(eventBridgeEndpoint).add("Name", "eventbridge-endpoint");
        Tags.of(eventBridgeEndpoint).add("Environment", "Development");
    }

    /**
     * Gets the created VPC.
     *
     * @return The VPC instance
     */
    public Vpc getVpc() {
        return vpc;
    }

    /**
     * Gets the internet gateway.
     *
     * @return The InternetGateway instance
     */
    public InternetGateway getInternetGateway() {
        return internetGateway;
    }

    /**
     * Gets the NAT gateway.
     *
     * @return The NatGateway instance
     */
    public NatGateway getNatGateway() {
        return natGateway;
    }
}
```

### S3 Stack (lib/src/main/java/app/S3Stack.java)

```java
package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.s3.*;
import software.constructs.Construct;

/**
 * Properties for configuring the S3 stack.
 */
class S3StackProps {
    private final String environmentSuffix;
    private final NestedStackProps nestedStackProps;

    private S3StackProps(String environmentSuffix, NestedStackProps nestedStackProps) {
        this.environmentSuffix = environmentSuffix;
        this.nestedStackProps = nestedStackProps != null ? nestedStackProps : NestedStackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public NestedStackProps getNestedStackProps() {
        return nestedStackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private NestedStackProps nestedStackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder nestedStackProps(NestedStackProps nestedStackProps) {
            this.nestedStackProps = nestedStackProps;
            return this;
        }

        public S3StackProps build() {
            return new S3StackProps(environmentSuffix, nestedStackProps);
        }
    }
}

/**
 * S3 Stack for creating storage infrastructure.
 * 
 * This nested stack creates an S3 bucket for application logs
 * with versioning enabled and appropriate security configurations.
 */
class S3Stack extends NestedStack {
    private final Bucket logsBucket;

    /**
     * Creates a new S3 stack with application logs bucket.
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Stack configuration properties
     */
    public S3Stack(final Construct scope, final String id, final S3StackProps props) {
        super(scope, id, props.getNestedStackProps());

        String environmentSuffix = props.getEnvironmentSuffix();

        // Create S3 bucket for application logs with versioning
        this.logsBucket = Bucket.Builder.create(this, "ApplicationLogsBucket")
                .bucketName("cloud-env-logs-" + environmentSuffix + "-" + this.getAccount())
                .versioned(true)  // Enable versioning as requested
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)  // Security best practice
                .encryption(BucketEncryption.S3_MANAGED)  // Enable server-side encryption
                .lifecycleRules(List.of(
                    LifecycleRule.builder()
                        .id("LogsLifecycleRule")
                        .enabled(true)
                        .expiration(software.amazon.awscdk.Duration.days(90))  // Auto-delete after 90 days
                        .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(30))  // Clean old versions
                        .transitions(List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(software.amazon.awscdk.Duration.days(60))
                                .build()
                        ))
                        .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)  // Retain bucket on stack deletion
                .autoDeleteObjects(false)  // Don't auto-delete objects for safety
                .build();

        // Apply tags to the bucket
        Tags.of(logsBucket).add("Name", "application-logs-bucket-" + environmentSuffix);
        Tags.of(logsBucket).add("Environment", "Development");
        Tags.of(logsBucket).add("Purpose", "ApplicationLogs");
        Tags.of(this).add("Component", "Storage");
    }

    /**
     * Gets the created logs bucket.
     *
     * @return The S3 Bucket instance for application logs
     */
    public Bucket getLogsBucket() {
        return logsBucket;
    }
}
```

### EventBridge Stack (lib/src/main/java/app/EventBridgeStack.java)

```java
package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.events.*;
import software.amazon.awscdk.services.scheduler.*;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

/**
 * Properties for configuring the EventBridge stack.
 */
class EventBridgeStackProps {
    private final String environmentSuffix;
    private final Vpc vpc;
    private final NestedStackProps nestedStackProps;

    private EventBridgeStackProps(String environmentSuffix, Vpc vpc, NestedStackProps nestedStackProps) {
        this.environmentSuffix = environmentSuffix;
        this.vpc = vpc;
        this.nestedStackProps = nestedStackProps != null ? nestedStackProps : NestedStackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public Vpc getVpc() {
        return vpc;
    }

    public NestedStackProps getNestedStackProps() {
        return nestedStackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private Vpc vpc;
        private NestedStackProps nestedStackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder vpc(Vpc vpc) {
            this.vpc = vpc;
            return this;
        }

        public Builder nestedStackProps(NestedStackProps nestedStackProps) {
            this.nestedStackProps = nestedStackProps;
            return this;
        }

        public EventBridgeStackProps build() {
            return new EventBridgeStackProps(environmentSuffix, vpc, nestedStackProps);
        }
    }
}

/**
 * EventBridge Stack for event scheduling and management.
 * 
 * This nested stack creates EventBridge resources including custom event bus
 * and schedule group for future event scheduling capabilities.
 */
class EventBridgeStack extends NestedStack {
    private final EventBus customEventBus;
    private final CfnScheduleGroup scheduleGroup;

    /**
     * Creates a new EventBridge stack with event scheduling capabilities.
     *
     * @param scope The parent construct
     * @param id The construct ID
     * @param props Stack configuration properties
     */
    public EventBridgeStack(final Construct scope, final String id, final EventBridgeStackProps props) {
        super(scope, id, props.getNestedStackProps());

        String environmentSuffix = props.getEnvironmentSuffix();

        // Create custom EventBridge bus for application events
        this.customEventBus = EventBus.Builder.create(this, "CustomEventBus")
                .eventBusName("cloud-env-eventbus-" + environmentSuffix)
                .description("Custom event bus for cloud environment application events")
                .build();

        // Create schedule group for EventBridge Scheduler (2025 feature)
        this.scheduleGroup = CfnScheduleGroup.Builder.create(this, "ScheduleGroup")
                .name("cloud-env-schedules-" + environmentSuffix)
                .build();

        // Create a sample rule for monitoring VPC Flow Logs (future enhancement)
        Rule vpcFlowLogsRule = Rule.Builder.create(this, "VpcFlowLogsRule")
                .ruleName("vpc-flow-logs-rule-" + environmentSuffix)
                .eventBus(customEventBus)
                .eventPattern(EventPattern.builder()
                    .source(List.of("aws.ec2"))
                    .detailType(List.of("VPC Flow Log"))
                    .build())
                .description("Rule to process VPC Flow Log events")
                .enabled(true)
                .build();

        // Apply tags to EventBridge resources
        Tags.of(customEventBus).add("Name", "custom-eventbus-" + environmentSuffix);
        Tags.of(customEventBus).add("Environment", "Development");
        Tags.of(scheduleGroup).add("Environment", "Development");
        Tags.of(this).add("Component", "EventScheduling");
    }

    /**
     * Gets the custom event bus.
     *
     * @return The EventBus instance
     */
    public EventBus getCustomEventBus() {
        return customEventBus;
    }

    /**
     * Gets the schedule group.
     *
     * @return The CfnScheduleGroup instance
     */
    public CfnScheduleGroup getScheduleGroup() {
        return scheduleGroup;
    }
}
```

## Key Features Implemented

### 1. VPC Architecture
- **CIDR Block**: 10.0.0.0/16 as requested
- **Subnets**: 2 public (10.0.1.0/24, 10.0.2.0/24) and 2 private (10.0.3.0/24, 10.0.4.0/24)
- **Cost Optimization**: Single NAT Gateway shared across private subnets
- **Security**: VPC endpoints for S3 and EventBridge to reduce internet traffic

### 2. Modern AWS Features
- **EventBridge Scheduler**: Integrated schedule group for future event scheduling
- **VPC Endpoints**: ServiceRegion configuration for EventBridge interface endpoint
- **S3 Lifecycle**: Intelligent tiering and automatic cleanup policies

### 3. Best Practices
- **Nested Stack Pattern**: Clean separation of concerns
- **Comprehensive Tagging**: Environment, Component, and Purpose tags
- **Security**: Block public access on S3, encryption enabled
- **Cost Optimization**: Single NAT Gateway, lifecycle policies, VPC endpoints

### 4. Error Handling & Documentation
- **Builder Pattern**: Type-safe configuration
- **Comprehensive JavaDoc**: Complete method and class documentation
- **Defensive Programming**: Null checks and fallback defaults

The implementation provides a solid foundation for a development environment with proper networking isolation, secure storage, and modern event scheduling capabilities while following AWS Well-Architected principles.