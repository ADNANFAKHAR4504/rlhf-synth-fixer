package imports.aws.connect_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQueue.ConnectQueueOutboundCallerConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectQueueOutboundCallerConfig.Jsii$Proxy.class)
public interface ConnectQueueOutboundCallerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_caller_id_name ConnectQueue#outbound_caller_id_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutboundCallerIdName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_caller_id_number_id ConnectQueue#outbound_caller_id_number_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutboundCallerIdNumberId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_flow_id ConnectQueue#outbound_flow_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutboundFlowId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectQueueOutboundCallerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectQueueOutboundCallerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectQueueOutboundCallerConfig> {
        java.lang.String outboundCallerIdName;
        java.lang.String outboundCallerIdNumberId;
        java.lang.String outboundFlowId;

        /**
         * Sets the value of {@link ConnectQueueOutboundCallerConfig#getOutboundCallerIdName}
         * @param outboundCallerIdName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_caller_id_name ConnectQueue#outbound_caller_id_name}.
         * @return {@code this}
         */
        public Builder outboundCallerIdName(java.lang.String outboundCallerIdName) {
            this.outboundCallerIdName = outboundCallerIdName;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQueueOutboundCallerConfig#getOutboundCallerIdNumberId}
         * @param outboundCallerIdNumberId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_caller_id_number_id ConnectQueue#outbound_caller_id_number_id}.
         * @return {@code this}
         */
        public Builder outboundCallerIdNumberId(java.lang.String outboundCallerIdNumberId) {
            this.outboundCallerIdNumberId = outboundCallerIdNumberId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQueueOutboundCallerConfig#getOutboundFlowId}
         * @param outboundFlowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_queue#outbound_flow_id ConnectQueue#outbound_flow_id}.
         * @return {@code this}
         */
        public Builder outboundFlowId(java.lang.String outboundFlowId) {
            this.outboundFlowId = outboundFlowId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectQueueOutboundCallerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectQueueOutboundCallerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectQueueOutboundCallerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectQueueOutboundCallerConfig {
        private final java.lang.String outboundCallerIdName;
        private final java.lang.String outboundCallerIdNumberId;
        private final java.lang.String outboundFlowId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outboundCallerIdName = software.amazon.jsii.Kernel.get(this, "outboundCallerIdName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outboundCallerIdNumberId = software.amazon.jsii.Kernel.get(this, "outboundCallerIdNumberId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outboundFlowId = software.amazon.jsii.Kernel.get(this, "outboundFlowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outboundCallerIdName = builder.outboundCallerIdName;
            this.outboundCallerIdNumberId = builder.outboundCallerIdNumberId;
            this.outboundFlowId = builder.outboundFlowId;
        }

        @Override
        public final java.lang.String getOutboundCallerIdName() {
            return this.outboundCallerIdName;
        }

        @Override
        public final java.lang.String getOutboundCallerIdNumberId() {
            return this.outboundCallerIdNumberId;
        }

        @Override
        public final java.lang.String getOutboundFlowId() {
            return this.outboundFlowId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOutboundCallerIdName() != null) {
                data.set("outboundCallerIdName", om.valueToTree(this.getOutboundCallerIdName()));
            }
            if (this.getOutboundCallerIdNumberId() != null) {
                data.set("outboundCallerIdNumberId", om.valueToTree(this.getOutboundCallerIdNumberId()));
            }
            if (this.getOutboundFlowId() != null) {
                data.set("outboundFlowId", om.valueToTree(this.getOutboundFlowId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectQueue.ConnectQueueOutboundCallerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectQueueOutboundCallerConfig.Jsii$Proxy that = (ConnectQueueOutboundCallerConfig.Jsii$Proxy) o;

            if (this.outboundCallerIdName != null ? !this.outboundCallerIdName.equals(that.outboundCallerIdName) : that.outboundCallerIdName != null) return false;
            if (this.outboundCallerIdNumberId != null ? !this.outboundCallerIdNumberId.equals(that.outboundCallerIdNumberId) : that.outboundCallerIdNumberId != null) return false;
            return this.outboundFlowId != null ? this.outboundFlowId.equals(that.outboundFlowId) : that.outboundFlowId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outboundCallerIdName != null ? this.outboundCallerIdName.hashCode() : 0;
            result = 31 * result + (this.outboundCallerIdNumberId != null ? this.outboundCallerIdNumberId.hashCode() : 0);
            result = 31 * result + (this.outboundFlowId != null ? this.outboundFlowId.hashCode() : 0);
            return result;
        }
    }
}
