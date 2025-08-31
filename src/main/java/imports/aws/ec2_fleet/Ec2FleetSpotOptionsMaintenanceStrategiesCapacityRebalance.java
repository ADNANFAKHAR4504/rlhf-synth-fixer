package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.Jsii$Proxy.class)
public interface Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replacement_strategy Ec2Fleet#replacement_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplacementStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#termination_delay Ec2Fleet#termination_delay}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTerminationDelay() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance> {
        java.lang.String replacementStrategy;
        java.lang.Number terminationDelay;

        /**
         * Sets the value of {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance#getReplacementStrategy}
         * @param replacementStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replacement_strategy Ec2Fleet#replacement_strategy}.
         * @return {@code this}
         */
        public Builder replacementStrategy(java.lang.String replacementStrategy) {
            this.replacementStrategy = replacementStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance#getTerminationDelay}
         * @param terminationDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#termination_delay Ec2Fleet#termination_delay}.
         * @return {@code this}
         */
        public Builder terminationDelay(java.lang.Number terminationDelay) {
            this.terminationDelay = terminationDelay;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance {
        private final java.lang.String replacementStrategy;
        private final java.lang.Number terminationDelay;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replacementStrategy = software.amazon.jsii.Kernel.get(this, "replacementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.terminationDelay = software.amazon.jsii.Kernel.get(this, "terminationDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replacementStrategy = builder.replacementStrategy;
            this.terminationDelay = builder.terminationDelay;
        }

        @Override
        public final java.lang.String getReplacementStrategy() {
            return this.replacementStrategy;
        }

        @Override
        public final java.lang.Number getTerminationDelay() {
            return this.terminationDelay;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReplacementStrategy() != null) {
                data.set("replacementStrategy", om.valueToTree(this.getReplacementStrategy()));
            }
            if (this.getTerminationDelay() != null) {
                data.set("terminationDelay", om.valueToTree(this.getTerminationDelay()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.Jsii$Proxy that = (Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance.Jsii$Proxy) o;

            if (this.replacementStrategy != null ? !this.replacementStrategy.equals(that.replacementStrategy) : that.replacementStrategy != null) return false;
            return this.terminationDelay != null ? this.terminationDelay.equals(that.terminationDelay) : that.terminationDelay == null;
        }

        @Override
        public final int hashCode() {
            int result = this.replacementStrategy != null ? this.replacementStrategy.hashCode() : 0;
            result = 31 * result + (this.terminationDelay != null ? this.terminationDelay.hashCode() : 0);
            return result;
        }
    }
}
