package imports.aws.gamelift_game_server_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameServerGroup.GameliftGameServerGroupAutoScalingPolicy")
@software.amazon.jsii.Jsii.Proxy(GameliftGameServerGroupAutoScalingPolicy.Jsii$Proxy.class)
public interface GameliftGameServerGroupAutoScalingPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_tracking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#target_tracking_configuration GameliftGameServerGroup#target_tracking_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration getTargetTrackingConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#estimated_instance_warmup GameliftGameServerGroup#estimated_instance_warmup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getEstimatedInstanceWarmup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftGameServerGroupAutoScalingPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftGameServerGroupAutoScalingPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftGameServerGroupAutoScalingPolicy> {
        imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration targetTrackingConfiguration;
        java.lang.Number estimatedInstanceWarmup;

        /**
         * Sets the value of {@link GameliftGameServerGroupAutoScalingPolicy#getTargetTrackingConfiguration}
         * @param targetTrackingConfiguration target_tracking_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#target_tracking_configuration GameliftGameServerGroup#target_tracking_configuration}
         * @return {@code this}
         */
        public Builder targetTrackingConfiguration(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration targetTrackingConfiguration) {
            this.targetTrackingConfiguration = targetTrackingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupAutoScalingPolicy#getEstimatedInstanceWarmup}
         * @param estimatedInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#estimated_instance_warmup GameliftGameServerGroup#estimated_instance_warmup}.
         * @return {@code this}
         */
        public Builder estimatedInstanceWarmup(java.lang.Number estimatedInstanceWarmup) {
            this.estimatedInstanceWarmup = estimatedInstanceWarmup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftGameServerGroupAutoScalingPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftGameServerGroupAutoScalingPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftGameServerGroupAutoScalingPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftGameServerGroupAutoScalingPolicy {
        private final imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration targetTrackingConfiguration;
        private final java.lang.Number estimatedInstanceWarmup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetTrackingConfiguration = software.amazon.jsii.Kernel.get(this, "targetTrackingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration.class));
            this.estimatedInstanceWarmup = software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetTrackingConfiguration = java.util.Objects.requireNonNull(builder.targetTrackingConfiguration, "targetTrackingConfiguration is required");
            this.estimatedInstanceWarmup = builder.estimatedInstanceWarmup;
        }

        @Override
        public final imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyTargetTrackingConfiguration getTargetTrackingConfiguration() {
            return this.targetTrackingConfiguration;
        }

        @Override
        public final java.lang.Number getEstimatedInstanceWarmup() {
            return this.estimatedInstanceWarmup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetTrackingConfiguration", om.valueToTree(this.getTargetTrackingConfiguration()));
            if (this.getEstimatedInstanceWarmup() != null) {
                data.set("estimatedInstanceWarmup", om.valueToTree(this.getEstimatedInstanceWarmup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftGameServerGroup.GameliftGameServerGroupAutoScalingPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftGameServerGroupAutoScalingPolicy.Jsii$Proxy that = (GameliftGameServerGroupAutoScalingPolicy.Jsii$Proxy) o;

            if (!targetTrackingConfiguration.equals(that.targetTrackingConfiguration)) return false;
            return this.estimatedInstanceWarmup != null ? this.estimatedInstanceWarmup.equals(that.estimatedInstanceWarmup) : that.estimatedInstanceWarmup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetTrackingConfiguration.hashCode();
            result = 31 * result + (this.estimatedInstanceWarmup != null ? this.estimatedInstanceWarmup.hashCode() : 0);
            return result;
        }
    }
}
