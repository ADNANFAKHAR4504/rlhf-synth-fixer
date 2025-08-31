package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.736Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleConditionQueryString")
@software.amazon.jsii.Jsii.Proxy(DataAwsLbListenerRuleConditionQueryString.Jsii$Proxy.class)
public interface DataAwsLbListenerRuleConditionQueryString extends software.amazon.jsii.JsiiSerializable {

    /**
     * values block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#values DataAwsLbListenerRule#values}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLbListenerRuleConditionQueryString}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLbListenerRuleConditionQueryString}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLbListenerRuleConditionQueryString> {
        java.lang.Object values;

        /**
         * Sets the value of {@link DataAwsLbListenerRuleConditionQueryString#getValues}
         * @param values values block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#values DataAwsLbListenerRule#values}
         * @return {@code this}
         */
        public Builder values(com.hashicorp.cdktf.IResolvable values) {
            this.values = values;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLbListenerRuleConditionQueryString#getValues}
         * @param values values block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#values DataAwsLbListenerRule#values}
         * @return {@code this}
         */
        public Builder values(java.util.List<? extends imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryStringValues> values) {
            this.values = values;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLbListenerRuleConditionQueryString}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLbListenerRuleConditionQueryString build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLbListenerRuleConditionQueryString}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLbListenerRuleConditionQueryString {
        private final java.lang.Object values;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.values = software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.values = builder.values;
        }

        @Override
        public final java.lang.Object getValues() {
            return this.values;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getValues() != null) {
                data.set("values", om.valueToTree(this.getValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLbListenerRule.DataAwsLbListenerRuleConditionQueryString"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLbListenerRuleConditionQueryString.Jsii$Proxy that = (DataAwsLbListenerRuleConditionQueryString.Jsii$Proxy) o;

            return this.values != null ? this.values.equals(that.values) : that.values == null;
        }

        @Override
        public final int hashCode() {
            int result = this.values != null ? this.values.hashCode() : 0;
            return result;
        }
    }
}
