package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose.Jsii$Proxy.class)
public interface MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#enabled MskconnectConnector#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#delivery_stream MskconnectConnector#delivery_stream}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStream() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose> {
        java.lang.Object enabled;
        java.lang.String deliveryStream;

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#enabled MskconnectConnector#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#enabled MskconnectConnector#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose#getDeliveryStream}
         * @param deliveryStream Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#delivery_stream MskconnectConnector#delivery_stream}.
         * @return {@code this}
         */
        public Builder deliveryStream(java.lang.String deliveryStream) {
            this.deliveryStream = deliveryStream;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose {
        private final java.lang.Object enabled;
        private final java.lang.String deliveryStream;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deliveryStream = software.amazon.jsii.Kernel.get(this, "deliveryStream", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.deliveryStream = builder.deliveryStream;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getDeliveryStream() {
            return this.deliveryStream;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getDeliveryStream() != null) {
                data.set("deliveryStream", om.valueToTree(this.getDeliveryStream()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose.Jsii$Proxy that = (MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.deliveryStream != null ? this.deliveryStream.equals(that.deliveryStream) : that.deliveryStream == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.deliveryStream != null ? this.deliveryStream.hashCode() : 0);
            return result;
        }
    }
}
