package imports.aws.data_aws_lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.735Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLbListenerRule.DataAwsLbListenerRuleActionForward")
@software.amazon.jsii.Jsii.Proxy(DataAwsLbListenerRuleActionForward.Jsii$Proxy.class)
public interface DataAwsLbListenerRuleActionForward extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#target_group DataAwsLbListenerRule#target_group}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLbListenerRuleActionForward}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLbListenerRuleActionForward}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLbListenerRuleActionForward> {
        java.lang.Object targetGroup;

        /**
         * Sets the value of {@link DataAwsLbListenerRuleActionForward#getTargetGroup}
         * @param targetGroup target_group block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#target_group DataAwsLbListenerRule#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(com.hashicorp.cdktf.IResolvable targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLbListenerRuleActionForward#getTargetGroup}
         * @param targetGroup target_group block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lb_listener_rule#target_group DataAwsLbListenerRule#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(java.util.List<? extends imports.aws.data_aws_lb_listener_rule.DataAwsLbListenerRuleActionForwardTargetGroup> targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLbListenerRuleActionForward}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLbListenerRuleActionForward build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLbListenerRuleActionForward}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLbListenerRuleActionForward {
        private final java.lang.Object targetGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroup = software.amazon.jsii.Kernel.get(this, "targetGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroup = builder.targetGroup;
        }

        @Override
        public final java.lang.Object getTargetGroup() {
            return this.targetGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetGroup() != null) {
                data.set("targetGroup", om.valueToTree(this.getTargetGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLbListenerRule.DataAwsLbListenerRuleActionForward"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLbListenerRuleActionForward.Jsii$Proxy that = (DataAwsLbListenerRuleActionForward.Jsii$Proxy) o;

            return this.targetGroup != null ? this.targetGroup.equals(that.targetGroup) : that.targetGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroup != null ? this.targetGroup.hashCode() : 0;
            return result;
        }
    }
}
