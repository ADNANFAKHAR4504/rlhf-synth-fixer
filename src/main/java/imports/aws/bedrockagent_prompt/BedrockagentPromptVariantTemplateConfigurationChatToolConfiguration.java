package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.181Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * tool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTool() {
        return null;
    }

    /**
     * tool_choice block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_choice BedrockagentPrompt#tool_choice}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getToolChoice() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration> {
        java.lang.Object tool;
        java.lang.Object toolChoice;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration#getTool}
         * @param tool tool block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
         * @return {@code this}
         */
        public Builder tool(com.hashicorp.cdktf.IResolvable tool) {
            this.tool = tool;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration#getTool}
         * @param tool tool block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
         * @return {@code this}
         */
        public Builder tool(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool> tool) {
            this.tool = tool;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration#getToolChoice}
         * @param toolChoice tool_choice block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_choice BedrockagentPrompt#tool_choice}
         * @return {@code this}
         */
        public Builder toolChoice(com.hashicorp.cdktf.IResolvable toolChoice) {
            this.toolChoice = toolChoice;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration#getToolChoice}
         * @param toolChoice tool_choice block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_choice BedrockagentPrompt#tool_choice}
         * @return {@code this}
         */
        public Builder toolChoice(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice> toolChoice) {
            this.toolChoice = toolChoice;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration {
        private final java.lang.Object tool;
        private final java.lang.Object toolChoice;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tool = software.amazon.jsii.Kernel.get(this, "tool", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.toolChoice = software.amazon.jsii.Kernel.get(this, "toolChoice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tool = builder.tool;
            this.toolChoice = builder.toolChoice;
        }

        @Override
        public final java.lang.Object getTool() {
            return this.tool;
        }

        @Override
        public final java.lang.Object getToolChoice() {
            return this.toolChoice;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTool() != null) {
                data.set("tool", om.valueToTree(this.getTool()));
            }
            if (this.getToolChoice() != null) {
                data.set("toolChoice", om.valueToTree(this.getToolChoice()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration.Jsii$Proxy) o;

            if (this.tool != null ? !this.tool.equals(that.tool) : that.tool != null) return false;
            return this.toolChoice != null ? this.toolChoice.equals(that.toolChoice) : that.toolChoice == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tool != null ? this.tool.hashCode() : 0;
            result = 31 * result + (this.toolChoice != null ? this.toolChoice.hashCode() : 0);
            return result;
        }
    }
}
