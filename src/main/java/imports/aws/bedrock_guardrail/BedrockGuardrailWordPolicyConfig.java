package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.147Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailWordPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailWordPolicyConfig.Jsii$Proxy.class)
public interface BedrockGuardrailWordPolicyConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * managed_word_lists_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#managed_word_lists_config BedrockGuardrail#managed_word_lists_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManagedWordListsConfig() {
        return null;
    }

    /**
     * words_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#words_config BedrockGuardrail#words_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWordsConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailWordPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailWordPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailWordPolicyConfig> {
        java.lang.Object managedWordListsConfig;
        java.lang.Object wordsConfig;

        /**
         * Sets the value of {@link BedrockGuardrailWordPolicyConfig#getManagedWordListsConfig}
         * @param managedWordListsConfig managed_word_lists_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#managed_word_lists_config BedrockGuardrail#managed_word_lists_config}
         * @return {@code this}
         */
        public Builder managedWordListsConfig(com.hashicorp.cdktf.IResolvable managedWordListsConfig) {
            this.managedWordListsConfig = managedWordListsConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailWordPolicyConfig#getManagedWordListsConfig}
         * @param managedWordListsConfig managed_word_lists_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#managed_word_lists_config BedrockGuardrail#managed_word_lists_config}
         * @return {@code this}
         */
        public Builder managedWordListsConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfigManagedWordListsConfig> managedWordListsConfig) {
            this.managedWordListsConfig = managedWordListsConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailWordPolicyConfig#getWordsConfig}
         * @param wordsConfig words_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#words_config BedrockGuardrail#words_config}
         * @return {@code this}
         */
        public Builder wordsConfig(com.hashicorp.cdktf.IResolvable wordsConfig) {
            this.wordsConfig = wordsConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailWordPolicyConfig#getWordsConfig}
         * @param wordsConfig words_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#words_config BedrockGuardrail#words_config}
         * @return {@code this}
         */
        public Builder wordsConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfigWordsConfig> wordsConfig) {
            this.wordsConfig = wordsConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailWordPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailWordPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailWordPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailWordPolicyConfig {
        private final java.lang.Object managedWordListsConfig;
        private final java.lang.Object wordsConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.managedWordListsConfig = software.amazon.jsii.Kernel.get(this, "managedWordListsConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.wordsConfig = software.amazon.jsii.Kernel.get(this, "wordsConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.managedWordListsConfig = builder.managedWordListsConfig;
            this.wordsConfig = builder.wordsConfig;
        }

        @Override
        public final java.lang.Object getManagedWordListsConfig() {
            return this.managedWordListsConfig;
        }

        @Override
        public final java.lang.Object getWordsConfig() {
            return this.wordsConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getManagedWordListsConfig() != null) {
                data.set("managedWordListsConfig", om.valueToTree(this.getManagedWordListsConfig()));
            }
            if (this.getWordsConfig() != null) {
                data.set("wordsConfig", om.valueToTree(this.getWordsConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailWordPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailWordPolicyConfig.Jsii$Proxy that = (BedrockGuardrailWordPolicyConfig.Jsii$Proxy) o;

            if (this.managedWordListsConfig != null ? !this.managedWordListsConfig.equals(that.managedWordListsConfig) : that.managedWordListsConfig != null) return false;
            return this.wordsConfig != null ? this.wordsConfig.equals(that.wordsConfig) : that.wordsConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.managedWordListsConfig != null ? this.managedWordListsConfig.hashCode() : 0;
            result = 31 * result + (this.wordsConfig != null ? this.wordsConfig.hashCode() : 0);
            return result;
        }
    }
}
