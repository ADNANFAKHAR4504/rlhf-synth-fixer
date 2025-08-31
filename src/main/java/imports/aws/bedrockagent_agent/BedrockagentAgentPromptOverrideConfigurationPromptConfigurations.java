package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentPromptOverrideConfigurationPromptConfigurations.Jsii$Proxy.class)
public interface BedrockagentAgentPromptOverrideConfigurationPromptConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#base_prompt_template BedrockagentAgent#base_prompt_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasePromptTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#inference_configuration BedrockagentAgent#inference_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInferenceConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#parser_mode BedrockagentAgent#parser_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParserMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_creation_mode BedrockagentAgent#prompt_creation_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPromptCreationMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_state BedrockagentAgent#prompt_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPromptState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_type BedrockagentAgent#prompt_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPromptType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentPromptOverrideConfigurationPromptConfigurations> {
        java.lang.String basePromptTemplate;
        java.lang.Object inferenceConfiguration;
        java.lang.String parserMode;
        java.lang.String promptCreationMode;
        java.lang.String promptState;
        java.lang.String promptType;

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getBasePromptTemplate}
         * @param basePromptTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#base_prompt_template BedrockagentAgent#base_prompt_template}.
         * @return {@code this}
         */
        public Builder basePromptTemplate(java.lang.String basePromptTemplate) {
            this.basePromptTemplate = basePromptTemplate;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getInferenceConfiguration}
         * @param inferenceConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#inference_configuration BedrockagentAgent#inference_configuration}.
         * @return {@code this}
         */
        public Builder inferenceConfiguration(com.hashicorp.cdktf.IResolvable inferenceConfiguration) {
            this.inferenceConfiguration = inferenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getInferenceConfiguration}
         * @param inferenceConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#inference_configuration BedrockagentAgent#inference_configuration}.
         * @return {@code this}
         */
        public Builder inferenceConfiguration(java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration> inferenceConfiguration) {
            this.inferenceConfiguration = inferenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getParserMode}
         * @param parserMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#parser_mode BedrockagentAgent#parser_mode}.
         * @return {@code this}
         */
        public Builder parserMode(java.lang.String parserMode) {
            this.parserMode = parserMode;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getPromptCreationMode}
         * @param promptCreationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_creation_mode BedrockagentAgent#prompt_creation_mode}.
         * @return {@code this}
         */
        public Builder promptCreationMode(java.lang.String promptCreationMode) {
            this.promptCreationMode = promptCreationMode;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getPromptState}
         * @param promptState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_state BedrockagentAgent#prompt_state}.
         * @return {@code this}
         */
        public Builder promptState(java.lang.String promptState) {
            this.promptState = promptState;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations#getPromptType}
         * @param promptType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_type BedrockagentAgent#prompt_type}.
         * @return {@code this}
         */
        public Builder promptType(java.lang.String promptType) {
            this.promptType = promptType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentPromptOverrideConfigurationPromptConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentPromptOverrideConfigurationPromptConfigurations {
        private final java.lang.String basePromptTemplate;
        private final java.lang.Object inferenceConfiguration;
        private final java.lang.String parserMode;
        private final java.lang.String promptCreationMode;
        private final java.lang.String promptState;
        private final java.lang.String promptType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basePromptTemplate = software.amazon.jsii.Kernel.get(this, "basePromptTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inferenceConfiguration = software.amazon.jsii.Kernel.get(this, "inferenceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parserMode = software.amazon.jsii.Kernel.get(this, "parserMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promptCreationMode = software.amazon.jsii.Kernel.get(this, "promptCreationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promptState = software.amazon.jsii.Kernel.get(this, "promptState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promptType = software.amazon.jsii.Kernel.get(this, "promptType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basePromptTemplate = builder.basePromptTemplate;
            this.inferenceConfiguration = builder.inferenceConfiguration;
            this.parserMode = builder.parserMode;
            this.promptCreationMode = builder.promptCreationMode;
            this.promptState = builder.promptState;
            this.promptType = builder.promptType;
        }

        @Override
        public final java.lang.String getBasePromptTemplate() {
            return this.basePromptTemplate;
        }

        @Override
        public final java.lang.Object getInferenceConfiguration() {
            return this.inferenceConfiguration;
        }

        @Override
        public final java.lang.String getParserMode() {
            return this.parserMode;
        }

        @Override
        public final java.lang.String getPromptCreationMode() {
            return this.promptCreationMode;
        }

        @Override
        public final java.lang.String getPromptState() {
            return this.promptState;
        }

        @Override
        public final java.lang.String getPromptType() {
            return this.promptType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBasePromptTemplate() != null) {
                data.set("basePromptTemplate", om.valueToTree(this.getBasePromptTemplate()));
            }
            if (this.getInferenceConfiguration() != null) {
                data.set("inferenceConfiguration", om.valueToTree(this.getInferenceConfiguration()));
            }
            if (this.getParserMode() != null) {
                data.set("parserMode", om.valueToTree(this.getParserMode()));
            }
            if (this.getPromptCreationMode() != null) {
                data.set("promptCreationMode", om.valueToTree(this.getPromptCreationMode()));
            }
            if (this.getPromptState() != null) {
                data.set("promptState", om.valueToTree(this.getPromptState()));
            }
            if (this.getPromptType() != null) {
                data.set("promptType", om.valueToTree(this.getPromptType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentPromptOverrideConfigurationPromptConfigurations.Jsii$Proxy that = (BedrockagentAgentPromptOverrideConfigurationPromptConfigurations.Jsii$Proxy) o;

            if (this.basePromptTemplate != null ? !this.basePromptTemplate.equals(that.basePromptTemplate) : that.basePromptTemplate != null) return false;
            if (this.inferenceConfiguration != null ? !this.inferenceConfiguration.equals(that.inferenceConfiguration) : that.inferenceConfiguration != null) return false;
            if (this.parserMode != null ? !this.parserMode.equals(that.parserMode) : that.parserMode != null) return false;
            if (this.promptCreationMode != null ? !this.promptCreationMode.equals(that.promptCreationMode) : that.promptCreationMode != null) return false;
            if (this.promptState != null ? !this.promptState.equals(that.promptState) : that.promptState != null) return false;
            return this.promptType != null ? this.promptType.equals(that.promptType) : that.promptType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.basePromptTemplate != null ? this.basePromptTemplate.hashCode() : 0;
            result = 31 * result + (this.inferenceConfiguration != null ? this.inferenceConfiguration.hashCode() : 0);
            result = 31 * result + (this.parserMode != null ? this.parserMode.hashCode() : 0);
            result = 31 * result + (this.promptCreationMode != null ? this.promptCreationMode.hashCode() : 0);
            result = 31 * result + (this.promptState != null ? this.promptState.hashCode() : 0);
            result = 31 * result + (this.promptType != null ? this.promptType.hashCode() : 0);
            return result;
        }
    }
}
