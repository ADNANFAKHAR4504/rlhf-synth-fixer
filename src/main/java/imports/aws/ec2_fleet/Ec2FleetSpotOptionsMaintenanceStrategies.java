package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategies")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetSpotOptionsMaintenanceStrategies.Jsii$Proxy.class)
public interface Ec2FleetSpotOptionsMaintenanceStrategies extends software.amazon.jsii.JsiiSerializable {

    /**
     * capacity_rebalance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_rebalance Ec2Fleet#capacity_rebalance}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance getCapacityRebalance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetSpotOptionsMaintenanceStrategies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetSpotOptionsMaintenanceStrategies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetSpotOptionsMaintenanceStrategies> {
        imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance capacityRebalance;

        /**
         * Sets the value of {@link Ec2FleetSpotOptionsMaintenanceStrategies#getCapacityRebalance}
         * @param capacityRebalance capacity_rebalance block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_rebalance Ec2Fleet#capacity_rebalance}
         * @return {@code this}
         */
        public Builder capacityRebalance(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance capacityRebalance) {
            this.capacityRebalance = capacityRebalance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetSpotOptionsMaintenanceStrategies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetSpotOptionsMaintenanceStrategies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetSpotOptionsMaintenanceStrategies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetSpotOptionsMaintenanceStrategies {
        private final imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance capacityRebalance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityRebalance = software.amazon.jsii.Kernel.get(this, "capacityRebalance", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityRebalance = builder.capacityRebalance;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance getCapacityRebalance() {
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
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetSpotOptionsMaintenanceStrategies.Jsii$Proxy that = (Ec2FleetSpotOptionsMaintenanceStrategies.Jsii$Proxy) o;

            return this.capacityRebalance != null ? this.capacityRebalance.equals(that.capacityRebalance) : that.capacityRebalance == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityRebalance != null ? this.capacityRebalance.hashCode() : 0;
            return result;
        }
    }
}
