package app;

import app.stacks.DatabaseStack;
import app.stacks.ECSStack;
import app.stacks.NetworkStack;
import app.stacks.SecurityStack;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffixValue, final StackProps stackPropsValue) {
        this.environmentSuffix = envSuffixValue;
        this.stackProps = stackPropsValue != null ? stackPropsValue : StackProps.builder().build();
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

    public static final class Builder {
        private String envSuffixValue;
        private StackProps stackPropsValue;

        public Builder environmentSuffix(final String envSuffixParam) {
            this.envSuffixValue = envSuffixParam;
            return this;
        }

        public Builder stackProps(final StackProps stackPropsParam) {
            this.stackPropsValue = stackPropsParam;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(envSuffixValue, stackPropsValue);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
final class TapStack extends Stack {
    private final String environmentSuffix;
    private final Environment stackEnvironment;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");
        
        this.stackEnvironment = props != null && props.getStackProps() != null && props.getStackProps().getEnv() != null 
                ? props.getStackProps().getEnv()
                : Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-east-1")
                        .build();

        NetworkStack networkStack = new NetworkStack(
                this,
                "NetworkStack",
                StackProps.builder()
                        .env(this.getStackEnv())
                        .build()
        );

        SecurityStack securityStack = new SecurityStack(
                this,
                "SecurityStack",
                StackProps.builder()
                        .env(this.getStackEnv())
                        .build()
        );

        DatabaseStack databaseStack = new DatabaseStack(
                this,
                "DatabaseStack",
                DatabaseStack.DatabaseStackProps.builder()
                        .stackProps(StackProps.builder()
                                .env(this.getStackEnv())
                                .build())
                        .vpc(networkStack.getVpc())
                        .rdsSecurityGroup(networkStack.getRdsSecurityGroup())
                        .kmsKey(securityStack.getKmsKey())
                        .rdsKmsKey(securityStack.getRdsKmsKey())
                        .build()
        );

        ECSStack ecsStack = new ECSStack(
                this,
                "ECSStack",
                ECSStack.ECSStackProps.builder()
                        .stackProps(StackProps.builder()
                                .env(this.getStackEnv())
                                .build())
                        .vpc(networkStack.getVpc())
                        .ecsSecurityGroup(networkStack.getEcsSecurityGroup())
                        .kmsKey(securityStack.getKmsKey())
                        .ecsTaskRole(securityStack.getEcsTaskRole())
                        .ecsExecutionRole(securityStack.getEcsExecutionRole())
                        .databaseSecret(databaseStack.getDatabaseSecret())
                        .build()
        );

        CfnOutput.Builder.create(this, "VPCId")
                .value(networkStack.getVpc().getVpcId())
                .description("VPC ID")
                .build();
                
        CfnOutput.Builder.create(this, "ClusterName")
                .value(ecsStack.getCluster().getClusterName())
                .description("ECS Cluster Name")
                .build();
                
        CfnOutput.Builder.create(this, "DatabaseEndpoint")
                .value(databaseStack.getDatabase().getDbInstanceEndpointAddress())
                .description("Database Endpoint")
                .build();
                
        CfnOutput.Builder.create(this, "ServiceName")
                .value(ecsStack.getService().getServiceName())
                .description("ECS Service Name")
                .build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public Environment getStackEnv() {
        return this.stackEnvironment;
    }
}

public final class Main {

    private Main() {
    }

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-east-1")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
