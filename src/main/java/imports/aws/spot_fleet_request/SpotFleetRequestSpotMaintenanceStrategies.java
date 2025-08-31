package imports.aws.spot_fleet_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequestSpotMaintenanceStrategies")
@software.amazon.jsii.Jsii.Proxy(SpotFleetRequestSpotMaintenanceStrategies.Jsii$Proxy.class)
public interface SpotFleetRequestSpotMaintenanceStrategies extends software.amazon.jsii.JsiiSerializable {

    /**
     * capacity_rebalance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#capacity_rebalance SpotFleetRequest#capacity_rebalance}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance getCapacityRebalance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotFleetRequestSpotMaintenanceStrategies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotFleetRequestSpotMaintenanceStrategies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotFleetRequestSpotMaintenanceStrategies> {
        imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance capacityRebalance;

        /**
         * Sets the value of {@link SpotFleetRequestSpotMaintenanceStrategies#getCapacityRebalance}
         * @param capacityRebalance capacity_rebalance block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#capacity_rebalance SpotFleetRequest#capacity_rebalance}
         * @return {@code this}
         */
        public Builder capacityRebalance(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance capacityRebalance) {
            this.capacityRebalance = capacityRebalance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotFleetRequestSpotMaintenanceStrategies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotFleetRequestSpotMaintenanceStrategies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotFleetRequestSpotMaintenanceStrategies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotFleetRequestSpotMaintenanceStrategies {
        private final imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance capacityRebalance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityRebalance = software.amazon.jsii.Kernel.get(this, "capacityRebalance", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityRebalance = builder.capacityRebalance;
        }

        @Override
        public final imports.aws.spot_fleet_request.SpotFleetRequestSpotMaintenanceStrategiesCapacityRebalance getCapacityRebalance() {
            return this.capacityRebalance;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCapacityRebalance() != null) {
                data.set("capacityRebalance", om.valueToTree(this.getCapacityRebalance()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotFleetRequest.SpotFleetRequestSpotMaintenanceStrategies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotFleetRequestSpotMaintenanceStrategies.Jsii$Proxy that = (SpotFleetRequestSpotMaintenanceStrategies.Jsii$Proxy) o;

            return this.capacityRebalance != null ? this.capacityRebalance.equals(that.capacityRebalance) : that.capacityRebalance == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityRebalance != null ? this.capacityRebalance.hashCode() : 0;
            return result;
        }
    }
}
