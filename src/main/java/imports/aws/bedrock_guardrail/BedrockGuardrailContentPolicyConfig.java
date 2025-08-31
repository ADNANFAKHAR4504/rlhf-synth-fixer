package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.145Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailContentPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailContentPolicyConfig.Jsii$Proxy.class)
public interface BedrockGuardrailContentPolicyConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * filters_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#filters_config BedrockGuardrail#filters_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFiltersConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailContentPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailContentPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailContentPolicyConfig> {
        java.lang.Object filtersConfig;

        /**
         * Sets the value of {@link BedrockGuardrailContentPolicyConfig#getFiltersConfig}
         * @param filtersConfig filters_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#filters_config BedrockGuardrail#filters_config}
         * @return {@code this}
         */
        public Builder filtersConfig(com.hashicorp.cdktf.IResolvable filtersConfig) {
            this.filtersConfig = filtersConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailContentPolicyConfig#getFiltersConfig}
         * @param filtersConfig filters_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#filters_config BedrockGuardrail#filters_config}
         * @return {@code this}
         */
        public Builder filtersConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfigFiltersConfig> filtersConfig) {
            this.filtersConfig = filtersConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailContentPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailContentPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailContentPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailContentPolicyConfig {
        private final java.lang.Object filtersConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.filtersConfig = software.amazon.jsii.Kernel.get(this, "filtersConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.filtersConfig = builder.filtersConfig;
        }

        @Override
        public final java.lang.Object getFiltersConfig() {
            return this.filtersConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFiltersConfig() != null) {
                data.set("filtersConfig", om.valueToTree(this.getFiltersConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailContentPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailContentPolicyConfig.Jsii$Proxy that = (BedrockGuardrailContentPolicyConfig.Jsii$Proxy) o;

            return this.filtersConfig != null ? this.filtersConfig.equals(that.filtersConfig) : that.filtersConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.filtersConfig != null ? this.filtersConfig.hashCode() : 0;
            return result;
        }
    }
}
