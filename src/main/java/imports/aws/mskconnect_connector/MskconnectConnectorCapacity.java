package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacity")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorCapacity.Jsii$Proxy.class)
public interface MskconnectConnectorCapacity extends software.amazon.jsii.JsiiSerializable {

    /**
     * autoscaling block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#autoscaling MskconnectConnector#autoscaling}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling getAutoscaling() {
        return null;
    }

    /**
     * provisioned_capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#provisioned_capacity MskconnectConnector#provisioned_capacity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity getProvisionedCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorCapacity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorCapacity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorCapacity> {
        imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling autoscaling;
        imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity provisionedCapacity;

        /**
         * Sets the value of {@link MskconnectConnectorCapacity#getAutoscaling}
         * @param autoscaling autoscaling block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#autoscaling MskconnectConnector#autoscaling}
         * @return {@code this}
         */
        public Builder autoscaling(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling autoscaling) {
            this.autoscaling = autoscaling;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacity#getProvisionedCapacity}
         * @param provisionedCapacity provisioned_capacity block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#provisioned_capacity MskconnectConnector#provisioned_capacity}
         * @return {@code this}
         */
        public Builder provisionedCapacity(imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity provisionedCapacity) {
            this.provisionedCapacity = provisionedCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorCapacity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorCapacity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorCapacity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorCapacity {
        private final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling autoscaling;
        private final imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity provisionedCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoscaling = software.amazon.jsii.Kernel.get(this, "autoscaling", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling.class));
            this.provisionedCapacity = software.amazon.jsii.Kernel.get(this, "provisionedCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoscaling = builder.autoscaling;
            this.provisionedCapacity = builder.provisionedCapacity;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling getAutoscaling() {
            return this.autoscaling;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity getProvisionedCapacity() {
            return this.provisionedCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoscaling() != null) {
                data.set("autoscaling", om.valueToTree(this.getAutoscaling()));
            }
            if (this.getProvisionedCapacity() != null) {
                data.set("provisionedCapacity", om.valueToTree(this.getProvisionedCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorCapacity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorCapacity.Jsii$Proxy that = (MskconnectConnectorCapacity.Jsii$Proxy) o;

            if (this.autoscaling != null ? !this.autoscaling.equals(that.autoscaling) : that.autoscaling != null) return false;
            return this.provisionedCapacity != null ? this.provisionedCapacity.equals(that.provisionedCapacity) : that.provisionedCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoscaling != null ? this.autoscaling.hashCode() : 0;
            result = 31 * result + (this.provisionedCapacity != null ? this.provisionedCapacity.hashCode() : 0);
            return result;
        }
    }
}
