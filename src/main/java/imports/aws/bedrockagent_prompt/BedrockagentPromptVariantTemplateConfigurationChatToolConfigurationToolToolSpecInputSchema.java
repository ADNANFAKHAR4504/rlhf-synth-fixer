package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.183Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#json BedrockagentPrompt#json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJson() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema> {
        java.lang.String json;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema#getJson}
         * @param json Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#json BedrockagentPrompt#json}.
         * @return {@code this}
         */
        public Builder json(java.lang.String json) {
            this.json = json;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema {
        private final java.lang.String json;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.json = software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.json = builder.json;
        }

        @Override
        public final java.lang.String getJson() {
            return this.json;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getJson() != null) {
                data.set("json", om.valueToTree(this.getJson()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema.Jsii$Proxy) o;

            return this.json != null ? this.json.equals(that.json) : that.json == null;
        }

        @Override
        public final int hashCode() {
            int result = this.json != null ? this.json.hashCode() : 0;
            return result;
        }
    }
}
