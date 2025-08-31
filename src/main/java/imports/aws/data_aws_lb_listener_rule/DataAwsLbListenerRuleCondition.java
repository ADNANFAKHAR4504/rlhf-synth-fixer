package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.735Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleCondition")
@software.amazon.jsii.Jsii.Proxy(DataAwsLbListenerRuleCondition.Jsii$Proxy.class)
public interface DataAwsLbListenerRuleCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * query_string block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#query_string DataAwsLbListenerRule#query_string}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString getQueryString() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLbListenerRuleCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLbListenerRuleCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLbListenerRuleCondition> {
        imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString queryString;

        /**
         * Sets the value of {@link DataAwsLbListenerRuleCondition#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#query_string DataAwsLbListenerRule#query_string}
         * @return {@code this}
         */
        public Builder queryString(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLbListenerRuleCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLbListenerRuleCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLbListenerRuleCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLbListenerRuleCondition {
        private final imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString queryString;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.queryString = builder.queryString;
        }

        @Override
        public final imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleConditionQueryString getQueryString() {
            return this.queryString;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getQueryString() != null) {
                data.set("queryString", om.valueToTree(this.getQueryString()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLbListenerRule.DataAwsLbListenerRuleCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLbListenerRuleCondition.Jsii$Proxy that = (DataAwsLbListenerRuleCondition.Jsii$Proxy) o;

            return this.queryString != null ? this.queryString.equals(that.queryString) : that.queryString == null;
        }

        @Override
        public final int hashCode() {
            int result = this.queryString != null ? this.queryString.hashCode() : 0;
            return result;
        }
    }
}
