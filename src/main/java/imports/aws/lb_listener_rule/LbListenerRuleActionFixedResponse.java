package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.531Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleActionFixedResponse")
@software.amazon.jsii.Jsii.Proxy(LbListenerRuleActionFixedResponse.Jsii$Proxy.class)
public interface LbListenerRuleActionFixedResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#content_type LbListenerRule#content_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#message_body LbListenerRule#message_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#status_code LbListenerRule#status_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatusCode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerRuleActionFixedResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerRuleActionFixedResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerRuleActionFixedResponse> {
        java.lang.String contentType;
        java.lang.String messageBody;
        java.lang.String statusCode;

        /**
         * Sets the value of {@link LbListenerRuleActionFixedResponse#getContentType}
         * @param contentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#content_type LbListenerRule#content_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder contentType(java.lang.String contentType) {
            this.contentType = contentType;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionFixedResponse#getMessageBody}
         * @param messageBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#message_body LbListenerRule#message_body}.
         * @return {@code this}
         */
        public Builder messageBody(java.lang.String messageBody) {
            this.messageBody = messageBody;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionFixedResponse#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#status_code LbListenerRule#status_code}.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerRuleActionFixedResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerRuleActionFixedResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerRuleActionFixedResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerRuleActionFixedResponse {
        private final java.lang.String contentType;
        private final java.lang.String messageBody;
        private final java.lang.String statusCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentType = software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.messageBody = software.amazon.jsii.Kernel.get(this, "messageBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentType = java.util.Objects.requireNonNull(builder.contentType, "contentType is required");
            this.messageBody = builder.messageBody;
            this.statusCode = builder.statusCode;
        }

        @Override
        public final java.lang.String getContentType() {
            return this.contentType;
        }

        @Override
        public final java.lang.String getMessageBody() {
            return this.messageBody;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contentType", om.valueToTree(this.getContentType()));
            if (this.getMessageBody() != null) {
                data.set("messageBody", om.valueToTree(this.getMessageBody()));
            }
            if (this.getStatusCode() != null) {
                data.set("statusCode", om.valueToTree(this.getStatusCode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListenerRule.LbListenerRuleActionFixedResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerRuleActionFixedResponse.Jsii$Proxy that = (LbListenerRuleActionFixedResponse.Jsii$Proxy) o;

            if (!contentType.equals(that.contentType)) return false;
            if (this.messageBody != null ? !this.messageBody.equals(that.messageBody) : that.messageBody != null) return false;
            return this.statusCode != null ? this.statusCode.equals(that.statusCode) : that.statusCode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.contentType.hashCode();
            result = 31 * result + (this.messageBody != null ? this.messageBody.hashCode() : 0);
            result = 31 * result + (this.statusCode != null ? this.statusCode.hashCode() : 0);
            return result;
        }
    }
}
