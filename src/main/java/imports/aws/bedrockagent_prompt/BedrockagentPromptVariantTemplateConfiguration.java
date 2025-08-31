package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfiguration.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * chat block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#chat BedrockagentPrompt#chat}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getChat() {
        return null;
    }

    /**
     * text block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfiguration> {
        java.lang.Object chat;
        java.lang.Object text;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfiguration#getChat}
         * @param chat chat block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#chat BedrockagentPrompt#chat}
         * @return {@code this}
         */
        public Builder chat(com.hashicorp.cdktf.IResolvable chat) {
            this.chat = chat;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfiguration#getChat}
         * @param chat chat block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#chat BedrockagentPrompt#chat}
         * @return {@code this}
         */
        public Builder chat(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChat> chat) {
            this.chat = chat;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfiguration#getText}
         * @param text text block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
         * @return {@code this}
         */
        public Builder text(com.hashicorp.cdktf.IResolvable text) {
            this.text = text;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfiguration#getText}
         * @param text text block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}
         * @return {@code this}
         */
        public Builder text(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationText> text) {
            this.text = text;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfiguration {
        private final java.lang.Object chat;
        private final java.lang.Object text;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.chat = software.amazon.jsii.Kernel.get(this, "chat", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.chat = builder.chat;
            this.text = builder.text;
        }

        @Override
        public final java.lang.Object getChat() {
            return this.chat;
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

            if (this.getChat() != null) {
                data.set("chat", om.valueToTree(this.getChat()));
            }
            if (this.getText() != null) {
                data.set("text", om.valueToTree(this.getText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfiguration.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfiguration.Jsii$Proxy) o;

            if (this.chat != null ? !this.chat.equals(that.chat) : that.chat != null) return false;
            return this.text != null ? this.text.equals(that.text) : that.text == null;
        }

        @Override
        public final int hashCode() {
            int result = this.chat != null ? this.chat.hashCode() : 0;
            result = 31 * result + (this.text != null ? this.text.hashCode() : 0);
            return result;
        }
    }
}
