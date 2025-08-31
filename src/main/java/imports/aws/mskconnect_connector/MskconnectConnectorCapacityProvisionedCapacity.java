package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityProvisionedCapacity")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorCapacityProvisionedCapacity.Jsii$Proxy.class)
public interface MskconnectConnectorCapacityProvisionedCapacity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_count MskconnectConnector#worker_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWorkerCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#mcu_count MskconnectConnector#mcu_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMcuCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorCapacityProvisionedCapacity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorCapacityProvisionedCapacity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorCapacityProvisionedCapacity> {
        java.lang.Number workerCount;
        java.lang.Number mcuCount;

        /**
         * Sets the value of {@link MskconnectConnectorCapacityProvisionedCapacity#getWorkerCount}
         * @param workerCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_count MskconnectConnector#worker_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder workerCount(java.lang.Number workerCount) {
            this.workerCount = workerCount;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacityProvisionedCapacity#getMcuCount}
         * @param mcuCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#mcu_count MskconnectConnector#mcu_count}.
         * @return {@code this}
         */
        public Builder mcuCount(java.lang.Number mcuCount) {
            this.mcuCount = mcuCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorCapacityProvisionedCapacity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorCapacityProvisionedCapacity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorCapacityProvisionedCapacity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorCapacityProvisionedCapacity {
        private final java.lang.Number workerCount;
        private final java.lang.Number mcuCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.workerCount = software.amazon.jsii.Kernel.get(this, "workerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mcuCount = software.amazon.jsii.Kernel.get(this, "mcuCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.workerCount = java.util.Objects.requireNonNull(builder.workerCount, "workerCount is required");
            this.mcuCount = builder.mcuCount;
        }

        @Override
        public final java.lang.Number getWorkerCount() {
            return this.workerCount;
        }

        @Override
        public final java.lang.Number getMcuCount() {
            return this.mcuCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("workerCount", om.valueToTree(this.getWorkerCount()));
            if (this.getMcuCount() != null) {
                data.set("mcuCount", om.valueToTree(this.getMcuCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorCapacityProvisionedCapacity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorCapacityProvisionedCapacity.Jsii$Proxy that = (MskconnectConnectorCapacityProvisionedCapacity.Jsii$Proxy) o;

            if (!workerCount.equals(that.workerCount)) return false;
            return this.mcuCount != null ? this.mcuCount.equals(that.mcuCount) : that.mcuCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.workerCount.hashCode();
            result = 31 * result + (this.mcuCount != null ? this.mcuCount.hashCode() : 0);
            return result;
        }
    }
}
