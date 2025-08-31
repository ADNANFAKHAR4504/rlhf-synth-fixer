package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.146Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailSensitiveInformationPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailSensitiveInformationPolicyConfig.Jsii$Proxy.class)
public interface BedrockGuardrailSensitiveInformationPolicyConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * pii_entities_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#pii_entities_config BedrockGuardrail#pii_entities_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPiiEntitiesConfig() {
        return null;
    }

    /**
     * regexes_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#regexes_config BedrockGuardrail#regexes_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegexesConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailSensitiveInformationPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailSensitiveInformationPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailSensitiveInformationPolicyConfig> {
        java.lang.Object piiEntitiesConfig;
        java.lang.Object regexesConfig;

        /**
         * Sets the value of {@link BedrockGuardrailSensitiveInformationPolicyConfig#getPiiEntitiesConfig}
         * @param piiEntitiesConfig pii_entities_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#pii_entities_config BedrockGuardrail#pii_entities_config}
         * @return {@code this}
         */
        public Builder piiEntitiesConfig(com.hashicorp.cdktf.IResolvable piiEntitiesConfig) {
            this.piiEntitiesConfig = piiEntitiesConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailSensitiveInformationPolicyConfig#getPiiEntitiesConfig}
         * @param piiEntitiesConfig pii_entities_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#pii_entities_config BedrockGuardrail#pii_entities_config}
         * @return {@code this}
         */
        public Builder piiEntitiesConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfigPiiEntitiesConfig> piiEntitiesConfig) {
            this.piiEntitiesConfig = piiEntitiesConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailSensitiveInformationPolicyConfig#getRegexesConfig}
         * @param regexesConfig regexes_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#regexes_config BedrockGuardrail#regexes_config}
         * @return {@code this}
         */
        public Builder regexesConfig(com.hashicorp.cdktf.IResolvable regexesConfig) {
            this.regexesConfig = regexesConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailSensitiveInformationPolicyConfig#getRegexesConfig}
         * @param regexesConfig regexes_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#regexes_config BedrockGuardrail#regexes_config}
         * @return {@code this}
         */
        public Builder regexesConfig(java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfigRegexesConfig> regexesConfig) {
            this.regexesConfig = regexesConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailSensitiveInformationPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailSensitiveInformationPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailSensitiveInformationPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailSensitiveInformationPolicyConfig {
        private final java.lang.Object piiEntitiesConfig;
        private final java.lang.Object regexesConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.piiEntitiesConfig = software.amazon.jsii.Kernel.get(this, "piiEntitiesConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regexesConfig = software.amazon.jsii.Kernel.get(this, "regexesConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.piiEntitiesConfig = builder.piiEntitiesConfig;
            this.regexesConfig = builder.regexesConfig;
        }

        @Override
        public final java.lang.Object getPiiEntitiesConfig() {
            return this.piiEntitiesConfig;
        }

        @Override
        public final java.lang.Object getRegexesConfig() {
            return this.regexesConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPiiEntitiesConfig() != null) {
                data.set("piiEntitiesConfig", om.valueToTree(this.getPiiEntitiesConfig()));
            }
            if (this.getRegexesConfig() != null) {
                data.set("regexesConfig", om.valueToTree(this.getRegexesConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailSensitiveInformationPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailSensitiveInformationPolicyConfig.Jsii$Proxy that = (BedrockGuardrailSensitiveInformationPolicyConfig.Jsii$Proxy) o;

            if (this.piiEntitiesConfig != null ? !this.piiEntitiesConfig.equals(that.piiEntitiesConfig) : that.piiEntitiesConfig != null) return false;
            return this.regexesConfig != null ? this.regexesConfig.equals(that.regexesConfig) : that.regexesConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.piiEntitiesConfig != null ? this.piiEntitiesConfig.hashCode() : 0;
            result = 31 * result + (this.regexesConfig != null ? this.regexesConfig.hashCode() : 0);
            return result;
        }
    }
}
