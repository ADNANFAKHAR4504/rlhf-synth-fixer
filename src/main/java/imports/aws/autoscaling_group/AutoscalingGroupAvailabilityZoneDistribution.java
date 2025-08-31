package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupAvailabilityZoneDistribution")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupAvailabilityZoneDistribution.Jsii$Proxy.class)
public interface AutoscalingGroupAvailabilityZoneDistribution extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_distribution_strategy AutoscalingGroup#capacity_distribution_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCapacityDistributionStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupAvailabilityZoneDistribution}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupAvailabilityZoneDistribution}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupAvailabilityZoneDistribution> {
        java.lang.String capacityDistributionStrategy;

        /**
         * Sets the value of {@link AutoscalingGroupAvailabilityZoneDistribution#getCapacityDistributionStrategy}
         * @param capacityDistributionStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_distribution_strategy AutoscalingGroup#capacity_distribution_strategy}.
         * @return {@code this}
         */
        public Builder capacityDistributionStrategy(java.lang.String capacityDistributionStrategy) {
            this.capacityDistributionStrategy = capacityDistributionStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupAvailabilityZoneDistribution}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupAvailabilityZoneDistribution build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupAvailabilityZoneDistribution}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupAvailabilityZoneDistribution {
        private final java.lang.String capacityDistributionStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityDistributionStrategy = software.amazon.jsii.Kernel.get(this, "capacityDistributionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityDistributionStrategy = builder.capacityDistributionStrategy;
        }

        @Override
        public final java.lang.String getCapacityDistributionStrategy() {
            return this.capacityDistributionStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCapacityDistributionStrategy() != null) {
                data.set("capacityDistributionStrategy", om.valueToTree(this.getCapacityDistributionStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupAvailabilityZoneDistribution"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupAvailabilityZoneDistribution.Jsii$Proxy that = (AutoscalingGroupAvailabilityZoneDistribution.Jsii$Proxy) o;

            return this.capacityDistributionStrategy != null ? this.capacityDistributionStrategy.equals(that.capacityDistributionStrategy) : that.capacityDistributionStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityDistributionStrategy != null ? this.capacityDistributionStrategy.hashCode() : 0;
            return result;
        }
    }
}
