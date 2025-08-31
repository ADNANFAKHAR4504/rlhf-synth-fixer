package imports.aws.emr_instance_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.200Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrInstanceFleet.EmrInstanceFleetLaunchSpecificationsOnDemandSpecification")
@software.amazon.jsii.Jsii.Proxy(EmrInstanceFleetLaunchSpecificationsOnDemandSpecification.Jsii$Proxy.class)
public interface EmrInstanceFleetLaunchSpecificationsOnDemandSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#allocation_strategy EmrInstanceFleet#allocation_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy();

    /**
     * @return a {@link Builder} of {@link EmrInstanceFleetLaunchSpecificationsOnDemandSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrInstanceFleetLaunchSpecificationsOnDemandSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrInstanceFleetLaunchSpecificationsOnDemandSpecification> {
        java.lang.String allocationStrategy;

        /**
         * Sets the value of {@link EmrInstanceFleetLaunchSpecificationsOnDemandSpecification#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#allocation_strategy EmrInstanceFleet#allocation_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrInstanceFleetLaunchSpecificationsOnDemandSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrInstanceFleetLaunchSpecificationsOnDemandSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrInstanceFleetLaunchSpecificationsOnDemandSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrInstanceFleetLaunchSpecificationsOnDemandSpecification {
        private final java.lang.String allocationStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allocationStrategy = software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allocationStrategy = java.util.Objects.requireNonNull(builder.allocationStrategy, "allocationStrategy is required");
        }

        @Override
        public final java.lang.String getAllocationStrategy() {
            return this.allocationStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allocationStrategy", om.valueToTree(this.getAllocationStrategy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrInstanceFleet.EmrInstanceFleetLaunchSpecificationsOnDemandSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrInstanceFleetLaunchSpecificationsOnDemandSpecification.Jsii$Proxy that = (EmrInstanceFleetLaunchSpecificationsOnDemandSpecification.Jsii$Proxy) o;

            return this.allocationStrategy.equals(that.allocationStrategy);
        }

        @Override
        public final int hashCode() {
            int result = this.allocationStrategy.hashCode();
            return result;
        }
    }
}
