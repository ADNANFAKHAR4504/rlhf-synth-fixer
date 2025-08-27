package app;

import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.events.*;
import software.amazon.awscdk.services.scheduler.*;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

import java.util.List;

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