package imports.aws.spot_fleet_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance")
@software.amazon.jsii.Jsii.Proxy(SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance.Jsii$Proxy.class)
public interface SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replacement_strategy SpotFleetRequest#replacement_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplacementStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance> {
        java.lang.String replacementStrategy;

        /**
         * Sets the value of {@link SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance#getReplacementStrategy}
         * @param replacementStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#replacement_strategy SpotFleetRequest#replacement_strategy}.
         * @return {@code this}
         */
        public Builder replacementStrategy(java.lang.String replacementStrategy) {
            this.replacementStrategy = replacementStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance {
        private final java.lang.String replacementStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replacementStrategy = software.amazon.jsii.Kernel.get(this, "replacementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replacementStrategy = builder.replacementStrategy;
        }

        @Override
        public final java.lang.String getReplacementStrategy() {
            return this.replacementStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReplacementStrategy() != null) {
                data.set("replacementStrategy", om.valueToTree(this.getReplacementStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotFleetRequest.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance.Jsii$Proxy that = (SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance.Jsii$Proxy) o;

            return this.replacementStrategy != null ? this.replacementStrategy.equals(that.replacementStrategy) : that.replacementStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.replacementStrategy != null ? this.replacementStrategy.hashCode() : 0;
            return result;
        }
    }
}
