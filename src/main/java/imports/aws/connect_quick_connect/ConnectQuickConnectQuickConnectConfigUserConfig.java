package imports.aws.connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigUserConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectQuickConnectQuickConnectConfigUserConfig.Jsii$Proxy.class)
public interface ConnectQuickConnectQuickConnectConfigUserConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#contact_flow_id ConnectQuickConnect#contact_flow_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContactFlowId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#user_id ConnectQuickConnect#user_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserId();

    /**
     * @return a {@link Builder} of {@link ConnectQuickConnectQuickConnectConfigUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectQuickConnectQuickConnectConfigUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectQuickConnectQuickConnectConfigUserConfig> {
        java.lang.String contactFlowId;
        java.lang.String userId;

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfigUserConfig#getContactFlowId}
         * @param contactFlowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#contact_flow_id ConnectQuickConnect#contact_flow_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder contactFlowId(java.lang.String contactFlowId) {
            this.contactFlowId = contactFlowId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfigUserConfig#getUserId}
         * @param userId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#user_id ConnectQuickConnect#user_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userId(java.lang.String userId) {
            this.userId = userId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectQuickConnectQuickConnectConfigUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectQuickConnectQuickConnectConfigUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectQuickConnectQuickConnectConfigUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectQuickConnectQuickConnectConfigUserConfig {
        private final java.lang.String contactFlowId;
        private final java.lang.String userId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contactFlowId = software.amazon.jsii.Kernel.get(this, "contactFlowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userId = software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contactFlowId = java.util.Objects.requireNonNull(builder.contactFlowId, "contactFlowId is required");
            this.userId = java.util.Objects.requireNonNull(builder.userId, "userId is required");
        }

        @Override
        public final java.lang.String getContactFlowId() {
            return this.contactFlowId;
        }

        @Override
        public final java.lang.String getUserId() {
            return this.userId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contactFlowId", om.valueToTree(this.getContactFlowId()));
            data.set("userId", om.valueToTree(this.getUserId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectQuickConnectQuickConnectConfigUserConfig.Jsii$Proxy that = (ConnectQuickConnectQuickConnectConfigUserConfig.Jsii$Proxy) o;

            if (!contactFlowId.equals(that.contactFlowId)) return false;
            return this.userId.equals(that.userId);
        }

        @Override
        public final int hashCode() {
            int result = this.contactFlowId.hashCode();
            result = 31 * result + (this.userId.hashCode());
            return result;
        }
    }
}
