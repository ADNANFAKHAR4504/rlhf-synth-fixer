package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorLogDelivery")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorLogDelivery.Jsii$Proxy.class)
public interface MskconnectConnectorLogDelivery extends software.amazon.jsii.JsiiSerializable {

    /**
     * worker_log_delivery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_log_delivery MskconnectConnector#worker_log_delivery}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery getWorkerLogDelivery();

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorLogDelivery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorLogDelivery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorLogDelivery> {
        imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery workerLogDelivery;

        /**
         * Sets the value of {@link MskconnectConnectorLogDelivery#getWorkerLogDelivery}
         * @param workerLogDelivery worker_log_delivery block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_log_delivery MskconnectConnector#worker_log_delivery}
         * @return {@code this}
         */
        public Builder workerLogDelivery(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery workerLogDelivery) {
            this.workerLogDelivery = workerLogDelivery;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorLogDelivery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorLogDelivery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorLogDelivery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorLogDelivery {
        private final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery workerLogDelivery;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.workerLogDelivery = software.amazon.jsii.Kernel.get(this, "workerLogDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.workerLogDelivery = java.util.Objects.requireNonNull(builder.workerLogDelivery, "workerLogDelivery is required");
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery getWorkerLogDelivery() {
            return this.workerLogDelivery;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("workerLogDelivery", om.valueToTree(this.getWorkerLogDelivery()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorLogDelivery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorLogDelivery.Jsii$Proxy that = (MskconnectConnectorLogDelivery.Jsii$Proxy) o;

            return this.workerLogDelivery.equals(that.workerLogDelivery);
        }

        @Override
        public final int hashCode() {
            int result = this.workerLogDelivery.hashCode();
            return result;
        }
    }
}
