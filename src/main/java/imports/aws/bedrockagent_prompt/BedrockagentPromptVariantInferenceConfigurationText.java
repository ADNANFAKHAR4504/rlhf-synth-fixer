package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantInferenceConfigurationText")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantInferenceConfigurationText.Jsii$Proxy.class)
public interface BedrockagentPromptVariantInferenceConfigurationText extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#max_tokens BedrockagentPrompt#max_tokens}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxTokens() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#stop_sequences BedrockagentPrompt#stop_sequences}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStopSequences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#temperature BedrockagentPrompt#temperature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTemperature() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#top_p BedrockagentPrompt#top_p}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTopP() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantInferenceConfigurationText}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantInferenceConfigurationText}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantInferenceConfigurationText> {
        java.lang.Number maxTokens;
        java.util.List<java.lang.String> stopSequences;
        java.lang.Number temperature;
        java.lang.Number topP;

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfigurationText#getMaxTokens}
         * @param maxTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#max_tokens BedrockagentPrompt#max_tokens}.
         * @return {@code this}
         */
        public Builder maxTokens(java.lang.Number maxTokens) {
            this.maxTokens = maxTokens;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfigurationText#getStopSequences}
         * @param stopSequences Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#stop_sequences BedrockagentPrompt#stop_sequences}.
         * @return {@code this}
         */
        public Builder stopSequences(java.util.List<java.lang.String> stopSequences) {
            this.stopSequences = stopSequences;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfigurationText#getTemperature}
         * @param temperature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#temperature BedrockagentPrompt#temperature}.
         * @return {@code this}
         */
        public Builder temperature(java.lang.Number temperature) {
            this.temperature = temperature;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfigurationText#getTopP}
         * @param topP Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#top_p BedrockagentPrompt#top_p}.
         * @return {@code this}
         */
        public Builder topP(java.lang.Number topP) {
            this.topP = topP;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantInferenceConfigurationText}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantInferenceConfigurationText build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantInferenceConfigurationText}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantInferenceConfigurationText {
        private final java.lang.Number maxTokens;
        private final java.util.List<java.lang.String> stopSequences;
        private final java.lang.Number temperature;
        private final java.lang.Number topP;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxTokens = software.amazon.jsii.Kernel.get(this, "maxTokens", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stopSequences = software.amazon.jsii.Kernel.get(this, "stopSequences", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.temperature = software.amazon.jsii.Kernel.get(this, "temperature", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.topP = software.amazon.jsii.Kernel.get(this, "topP", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxTokens = builder.maxTokens;
            this.stopSequences = builder.stopSequences;
            this.temperature = builder.temperature;
            this.topP = builder.topP;
        }

        @Override
        public final java.lang.Number getMaxTokens() {
            return this.maxTokens;
        }

        @Override
        public final java.util.List<java.lang.String> getStopSequences() {
            return this.stopSequences;
        }

        @Override
        public final java.lang.Number getTemperature() {
            return this.temperature;
        }

        @Override
        public final java.lang.Number getTopP() {
            return this.topP;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxTokens() != null) {
                data.set("maxTokens", om.valueToTree(this.getMaxTokens()));
            }
            if (this.getStopSequences() != null) {
                data.set("stopSequences", om.valueToTree(this.getStopSequences()));
            }
            if (this.getTemperature() != null) {
                data.set("temperature", om.valueToTree(this.getTemperature()));
            }
            if (this.getTopP() != null) {
                data.set("topP", om.valueToTree(this.getTopP()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantInferenceConfigurationText"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantInferenceConfigurationText.Jsii$Proxy that = (BedrockagentPromptVariantInferenceConfigurationText.Jsii$Proxy) o;

            if (this.maxTokens != null ? !this.maxTokens.equals(that.maxTokens) : that.maxTokens != null) return false;
            if (this.stopSequences != null ? !this.stopSequences.equals(that.stopSequences) : that.stopSequences != null) return false;
            if (this.temperature != null ? !this.temperature.equals(that.temperature) : that.temperature != null) return false;
            return this.topP != null ? this.topP.equals(that.topP) : that.topP == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxTokens != null ? this.maxTokens.hashCode() : 0;
            result = 31 * result + (this.stopSequences != null ? this.stopSequences.hashCode() : 0);
            result = 31 * result + (this.temperature != null ? this.temperature.hashCode() : 0);
            result = 31 * result + (this.topP != null ? this.topP.hashCode() : 0);
            return result;
        }
    }
}
