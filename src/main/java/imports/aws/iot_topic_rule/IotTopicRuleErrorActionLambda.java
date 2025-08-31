package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.416Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionLambda")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleErrorActionLambda.Jsii$Proxy.class)
public interface IotTopicRuleErrorActionLambda extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#function_arn IotTopicRule#function_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFunctionArn();

    /**
     * @return a {@link Builder} of {@link IotTopicRuleErrorActionLambda}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleErrorActionLambda}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleErrorActionLambda> {
        java.lang.String functionArn;

        /**
         * Sets the value of {@link IotTopicRuleErrorActionLambda#getFunctionArn}
         * @param functionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#function_arn IotTopicRule#function_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder functionArn(java.lang.String functionArn) {
            this.functionArn = functionArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleErrorActionLambda}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleErrorActionLambda build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleErrorActionLambda}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleErrorActionLambda {
        private final java.lang.String functionArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.functionArn = software.amazon.jsii.Kernel.get(this, "functionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.functionArn = java.util.Objects.requireNonNull(builder.functionArn, "functionArn is required");
        }

        @Override
        public final java.lang.String getFunctionArn() {
            return this.functionArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("functionArn", om.valueToTree(this.getFunctionArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleErrorActionLambda"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleErrorActionLambda.Jsii$Proxy that = (IotTopicRuleErrorActionLambda.Jsii$Proxy) o;

            return this.functionArn.equals(that.functionArn);
        }

        @Override
        public final int hashCode() {
            int result = this.functionArn.hashCode();
            return result;
        }
    }
}
