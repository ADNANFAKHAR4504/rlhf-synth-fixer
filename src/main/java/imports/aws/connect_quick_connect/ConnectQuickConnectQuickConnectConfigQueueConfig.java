package imports.aws.connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigQueueConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectQuickConnectQuickConnectConfigQueueConfig.Jsii$Proxy.class)
public interface ConnectQuickConnectQuickConnectConfigQueueConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#contact_flow_id ConnectQuickConnect#contact_flow_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContactFlowId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#queue_id ConnectQuickConnect#queue_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueueId();

    /**
     * @return a {@link Builder} of {@link ConnectQuickConnectQuickConnectConfigQueueConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectQuickConnectQuickConnectConfigQueueConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectQuickConnectQuickConnectConfigQueueConfig> {
        java.lang.String contactFlowId;
        java.lang.String queueId;

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfigQueueConfig#getContactFlowId}
         * @param contactFlowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#contact_flow_id ConnectQuickConnect#contact_flow_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder contactFlowId(java.lang.String contactFlowId) {
            this.contactFlowId = contactFlowId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfigQueueConfig#getQueueId}
         * @param queueId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#queue_id ConnectQuickConnect#queue_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder queueId(java.lang.String queueId) {
            this.queueId = queueId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectQuickConnectQuickConnectConfigQueueConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectQuickConnectQuickConnectConfigQueueConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectQuickConnectQuickConnectConfigQueueConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectQuickConnectQuickConnectConfigQueueConfig {
        private final java.lang.String contactFlowId;
        private final java.lang.String queueId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contactFlowId = software.amazon.jsii.Kernel.get(this, "contactFlowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queueId = software.amazon.jsii.Kernel.get(this, "queueId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contactFlowId = java.util.Objects.requireNonNull(builder.contactFlowId, "contactFlowId is required");
            this.queueId = java.util.Objects.requireNonNull(builder.queueId, "queueId is required");
        }

        @Override
        public final java.lang.String getContactFlowId() {
            return this.contactFlowId;
        }

        @Override
        public final java.lang.String getQueueId() {
            return this.queueId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contactFlowId", om.valueToTree(this.getContactFlowId()));
            data.set("queueId", om.valueToTree(this.getQueueId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigQueueConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectQuickConnectQuickConnectConfigQueueConfig.Jsii$Proxy that = (ConnectQuickConnectQuickConnectConfigQueueConfig.Jsii$Proxy) o;

            if (!contactFlowId.equals(that.contactFlowId)) return false;
            return this.queueId.equals(that.queueId);
        }

        @Override
        public final int hashCode() {
            int result = this.contactFlowId.hashCode();
            result = 31 * result + (this.queueId.hashCode());
            return result;
        }
    }
}
