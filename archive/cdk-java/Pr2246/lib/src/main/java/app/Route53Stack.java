package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.route53.*;
import software.constructs.Construct;

import java.util.Optional;

/**
 * Route53StackProps holds configuration for the Route53Stack.
 */
class Route53StackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private Route53StackProps(String environmentSuffix, StackProps stackProps) {
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

        public Route53StackProps build() {
            return new Route53StackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Route53Stack creates DNS failover configuration for multi-region deployment.
 * This provides automatic DNS failover between regions based on health checks.
 */
public class Route53Stack extends Stack {
    private final String environmentSuffix;

    public Route53Stack(final Construct scope, final String id, final Route53StackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(Route53StackProps::getEnvironmentSuffix)
                .orElse("dev");

        // Create hosted zone
        HostedZone hostedZone = HostedZone.Builder.create(this, "WebAppHostedZone" + environmentSuffix)
                .zoneName("myapp-" + environmentSuffix + ".example.org")
                .comment("Hosted zone for multi-region web application")
                .build();

        // Note: In a real implementation, you would reference the ALBs from other stacks
        // For this example, we'll create placeholder health checks and records
        
        // Health check for primary region (us-east-1)
        CfnHealthCheck primaryHealthCheck = CfnHealthCheck.Builder.create(this, "PrimaryHealthCheck" + environmentSuffix)
                .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                        .type("HTTP")
                        .resourcePath("/")
                        .fullyQualifiedDomainName("primary-alb-" + environmentSuffix + ".us-east-1.elb.amazonaws.com")
                        .port(80)
                        .requestInterval(30)
                        .failureThreshold(3)
                        .build())
                .build();

        // Health check for secondary region (us-west-2)
        CfnHealthCheck secondaryHealthCheck = CfnHealthCheck.Builder.create(this, "SecondaryHealthCheck" + environmentSuffix)
                .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                        .type("HTTP")
                        .resourcePath("/")
                        .fullyQualifiedDomainName("secondary-alb-" + environmentSuffix + ".us-west-2.elb.amazonaws.com")
                        .port(80)
                        .requestInterval(30)
                        .failureThreshold(3)
                        .build())
                .build();

        // Primary record (us-east-1)
        // Using latency-based routing instead of geo-routing
        ARecord.Builder.create(this, "PrimaryRecord" + environmentSuffix)
                .zone(hostedZone)
                .recordName("www")
                .target(RecordTarget.fromIpAddresses("192.0.2.1")) // Placeholder IP
                .setIdentifier("primary")
                .region("us-east-1") // Use latency-based routing with region
                .build();

        // Secondary record (us-west-2)
        // Using latency-based routing instead of geo-routing
        ARecord.Builder.create(this, "SecondaryRecord" + environmentSuffix)
                .zone(hostedZone)
                .recordName("www")
                .target(RecordTarget.fromIpAddresses("192.0.2.2")) // Placeholder IP
                .setIdentifier("secondary")
                .region("us-west-2") // Use latency-based routing with region
                .build();
    }
}