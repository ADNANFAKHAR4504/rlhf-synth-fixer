package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration.Jsii$Proxy.class)
public interface BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#max_length BedrockagentAgent#max_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#stop_sequences BedrockagentAgent#stop_sequences}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStopSequences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#temperature BedrockagentAgent#temperature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTemperature() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_k BedrockagentAgent#top_k}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTopK() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_p BedrockagentAgent#top_p}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTopP() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration> {
        java.lang.Number maxLength;
        java.util.List<java.lang.String> stopSequences;
        java.lang.Number temperature;
        java.lang.Number topK;
        java.lang.Number topP;

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration#getMaxLength}
         * @param maxLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#max_length BedrockagentAgent#max_length}.
         * @return {@code this}
         */
        public Builder maxLength(java.lang.Number maxLength) {
            this.maxLength = maxLength;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration#getStopSequences}
         * @param stopSequences Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#stop_sequences BedrockagentAgent#stop_sequences}.
         * @return {@code this}
         */
        public Builder stopSequences(java.util.List<java.lang.String> stopSequences) {
            this.stopSequences = stopSequences;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration#getTemperature}
         * @param temperature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#temperature BedrockagentAgent#temperature}.
         * @return {@code this}
         */
        public Builder temperature(java.lang.Number temperature) {
            this.temperature = temperature;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration#getTopK}
         * @param topK Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_k BedrockagentAgent#top_k}.
         * @return {@code this}
         */
        public Builder topK(java.lang.Number topK) {
            this.topK = topK;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration#getTopP}
         * @param topP Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_p BedrockagentAgent#top_p}.
         * @return {@code this}
         */
        public Builder topP(java.lang.Number topP) {
            this.topP = topP;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration {
        private final java.lang.Number maxLength;
        private final java.util.List<java.lang.String> stopSequences;
        private final java.lang.Number temperature;
        private final java.lang.Number topK;
        private final java.lang.Number topP;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxLength = software.amazon.jsii.Kernel.get(this, "maxLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stopSequences = software.amazon.jsii.Kernel.get(this, "stopSequences", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.temperature = software.amazon.jsii.Kernel.get(this, "temperature", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.topK = software.amazon.jsii.Kernel.get(this, "topK", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.topP = software.amazon.jsii.Kernel.get(this, "topP", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxLength = builder.maxLength;
            this.stopSequences = builder.stopSequences;
            this.temperature = builder.temperature;
            this.topK = builder.topK;
            this.topP = builder.topP;
        }

        @Override
        public final java.lang.Number getMaxLength() {
            return this.maxLength;
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
        public final java.lang.Number getTopK() {
            return this.topK;
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

            if (this.getMaxLength() != null) {
                data.set("maxLength", om.valueToTree(this.getMaxLength()));
            }
            if (this.getStopSequences() != null) {
                data.set("stopSequences", om.valueToTree(this.getStopSequences()));
            }
            if (this.getTemperature() != null) {
                data.set("temperature", om.valueToTree(this.getTemperature()));
            }
            if (this.getTopK() != null) {
                data.set("topK", om.valueToTree(this.getTopK()));
            }
            if (this.getTopP() != null) {
                data.set("topP", om.valueToTree(this.getTopP()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration.Jsii$Proxy that = (BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration.Jsii$Proxy) o;

            if (this.maxLength != null ? !this.maxLength.equals(that.maxLength) : that.maxLength != null) return false;
            if (this.stopSequences != null ? !this.stopSequences.equals(that.stopSequences) : that.stopSequences != null) return false;
            if (this.temperature != null ? !this.temperature.equals(that.temperature) : that.temperature != null) return false;
            if (this.topK != null ? !this.topK.equals(that.topK) : that.topK != null) return false;
            return this.topP != null ? this.topP.equals(that.topP) : that.topP == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxLength != null ? this.maxLength.hashCode() : 0;
            result = 31 * result + (this.stopSequences != null ? this.stopSequences.hashCode() : 0);
            result = 31 * result + (this.temperature != null ? this.temperature.hashCode() : 0);
            result = 31 * result + (this.topK != null ? this.topK.hashCode() : 0);
            result = 31 * result + (this.topP != null ? this.topP.hashCode() : 0);
            return result;
        }
    }
}
