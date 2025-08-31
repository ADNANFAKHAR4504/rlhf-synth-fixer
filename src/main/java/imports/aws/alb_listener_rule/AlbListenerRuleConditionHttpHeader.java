package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.917Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleConditionHttpHeader")
@software.amazon.jsii.Jsii.Proxy(AlbListenerRuleConditionHttpHeader.Jsii$Proxy.class)
public interface AlbListenerRuleConditionHttpHeader extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_header_name AlbListenerRule#http_header_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpHeaderName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#values AlbListenerRule#values}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValues();

    /**
     * @return a {@link Builder} of {@link AlbListenerRuleConditionHttpHeader}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbListenerRuleConditionHttpHeader}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbListenerRuleConditionHttpHeader> {
        java.lang.String httpHeaderName;
        java.util.List<java.lang.String> values;

        /**
         * Sets the value of {@link AlbListenerRuleConditionHttpHeader#getHttpHeaderName}
         * @param httpHeaderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_header_name AlbListenerRule#http_header_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpHeaderName(java.lang.String httpHeaderName) {
            this.httpHeaderName = httpHeaderName;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleConditionHttpHeader#getValues}
         * @param values Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#values AlbListenerRule#values}. This parameter is required.
         * @return {@code this}
         */
        public Builder values(java.util.List<java.lang.String> values) {
            this.values = values;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbListenerRuleConditionHttpHeader}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbListenerRuleConditionHttpHeader build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbListenerRuleConditionHttpHeader}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbListenerRuleConditionHttpHeader {
        private final java.lang.String httpHeaderName;
        private final java.util.List<java.lang.String> values;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpHeaderName = software.amazon.jsii.Kernel.get(this, "httpHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.values = software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpHeaderName = java.util.Objects.requireNonNull(builder.httpHeaderName, "httpHeaderName is required");
            this.values = java.util.Objects.requireNonNull(builder.values, "values is required");
        }

        @Override
        public final java.lang.String getHttpHeaderName() {
            return this.httpHeaderName;
        }

        @Override
        public final java.util.List<java.lang.String> getValues() {
            return this.values;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("httpHeaderName", om.valueToTree(this.getHttpHeaderName()));
            data.set("values", om.valueToTree(this.getValues()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albListenerRule.AlbListenerRuleConditionHttpHeader"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbListenerRuleConditionHttpHeader.Jsii$Proxy that = (AlbListenerRuleConditionHttpHeader.Jsii$Proxy) o;

            if (!httpHeaderName.equals(that.httpHeaderName)) return false;
            return this.values.equals(that.values);
        }

        @Override
        public final int hashCode() {
            int result = this.httpHeaderName.hashCode();
            result = 31 * result + (this.values.hashCode());
            return result;
        }
    }
}
