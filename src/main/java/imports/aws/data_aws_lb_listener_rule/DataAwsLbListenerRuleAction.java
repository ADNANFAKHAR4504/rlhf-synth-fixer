package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.735Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleAction")
@software.amazon.jsii.Jsii.Proxy(DataAwsLbListenerRuleAction.Jsii$Proxy.class)
public interface DataAwsLbListenerRuleAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * forward block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#forward DataAwsLbListenerRule#forward}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward getForward() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLbListenerRuleAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLbListenerRuleAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLbListenerRuleAction> {
        imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward forward;

        /**
         * Sets the value of {@link DataAwsLbListenerRuleAction#getForward}
         * @param forward forward block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#forward DataAwsLbListenerRule#forward}
         * @return {@code this}
         */
        public Builder forward(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward forward) {
            this.forward = forward;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLbListenerRuleAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLbListenerRuleAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLbListenerRuleAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLbListenerRuleAction {
        private final imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward forward;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.forward = software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.forward = builder.forward;
        }

        @Override
        public final imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForward getForward() {
            return this.forward;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getForward() != null) {
                data.set("forward", om.valueToTree(this.getForward()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLbListenerRule.DataAwsLbListenerRuleAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLbListenerRuleAction.Jsii$Proxy that = (DataAwsLbListenerRuleAction.Jsii$Proxy) o;

            return this.forward != null ? this.forward.equals(that.forward) : that.forward == null;
        }

        @Override
        public final int hashCode() {
            int result = this.forward != null ? this.forward.hashCode() : 0;
            return result;
        }
    }
}
