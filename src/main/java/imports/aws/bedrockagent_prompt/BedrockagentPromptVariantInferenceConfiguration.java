package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantInferenceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantInferenceConfiguration.Jsii$Proxy.class)
public interface BedrockagentPromptVariantInferenceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * text block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantInferenceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantInferenceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantInferenceConfiguration> {
        java.lang.Object text;

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfiguration#getText}
         * @param text text block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
         * @return {@code this}
         */
        public Builder text(com.hashicorp.cdktf.IResolvable text) {
            this.text = text;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantInferenceConfiguration#getText}
         * @param text text block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
         * @return {@code this}
         */
        public Builder text(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfigurationText> text) {
            this.text = text;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantInferenceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantInferenceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantInferenceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantInferenceConfiguration {
        private final java.lang.Object text;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.text = builder.text;
        }

        @Override
        public final java.lang.Object getText() {
            return this.text;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getText() != null) {
                data.set("text", om.valueToTree(this.getText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantInferenceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantInferenceConfiguration.Jsii$Proxy that = (BedrockagentPromptVariantInferenceConfiguration.Jsii$Proxy) o;

            return this.text != null ? this.text.equals(that.text) : that.text == null;
        }

        @Override
        public final int hashCode() {
            int result = this.text != null ? this.text.hashCode() : 0;
            return result;
        }
    }
}
