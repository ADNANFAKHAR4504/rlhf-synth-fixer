package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.147Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailTopicPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailTopicPolicyConfig.Jsii$Proxy.class)
public interface BedrockGuardrailTopicPolicyConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * topics_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topics_config BedrockGuardrail#topics_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTopicsConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailTopicPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailTopicPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailTopicPolicyConfig> {
        java.lang.Object topicsConfig;

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfig#getTopicsConfig}
         * @param topicsConfig topics_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topics_config BedrockGuardrail#topics_config}
         * @return {@code this}
         */
        public Builder topicsConfig(com.hashicorp.cdktf.IResolvable topicsConfig) {
            this.topicsConfig = topicsConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfig#getTopicsConfig}
         * @param topicsConfig topics_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topics_config BedrockGuardrail#topics_config}
         * @return {@code this}
         */
        public Builder topicsConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfigTopicsConfig> topicsConfig) {
            this.topicsConfig = topicsConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailTopicPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailTopicPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailTopicPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailTopicPolicyConfig {
        private final java.lang.Object topicsConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicsConfig = software.amazon.jsii.Kernel.get(this, "topicsConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicsConfig = builder.topicsConfig;
        }

        @Override
        public final java.lang.Object getTopicsConfig() {
            return this.topicsConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTopicsConfig() != null) {
                data.set("topicsConfig", om.valueToTree(this.getTopicsConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailTopicPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailTopicPolicyConfig.Jsii$Proxy that = (BedrockGuardrailTopicPolicyConfig.Jsii$Proxy) o;

            return this.topicsConfig != null ? this.topicsConfig.equals(that.topicsConfig) : that.topicsConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.topicsConfig != null ? this.topicsConfig.hashCode() : 0;
            return result;
        }
    }
}
