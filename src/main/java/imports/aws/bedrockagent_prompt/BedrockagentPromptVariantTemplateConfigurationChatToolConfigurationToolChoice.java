package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.182Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice extends software.amazon.jsii.JsiiSerializable {

    /**
     * any block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#any BedrockagentPrompt#any}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAny() {
        return null;
    }

    /**
     * auto block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#auto BedrockagentPrompt#auto}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAuto() {
        return null;
    }

    /**
     * tool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTool() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice> {
        java.lang.Object any;
        java.lang.Object auto;
        java.lang.Object tool;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getAny}
         * @param any any block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#any BedrockagentPrompt#any}
         * @return {@code this}
         */
        public Builder any(com.hashicorp.cdktf.IResolvable any) {
            this.any = any;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getAny}
         * @param any any block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#any BedrockagentPrompt#any}
         * @return {@code this}
         */
        public Builder any(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoiceAny> any) {
            this.any = any;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getAuto}
         * @param auto auto block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#auto BedrockagentPrompt#auto}
         * @return {@code this}
         */
        public Builder auto(com.hashicorp.cdktf.IResolvable auto) {
            this.auto = auto;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getAuto}
         * @param auto auto block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#auto BedrockagentPrompt#auto}
         * @return {@code this}
         */
        public Builder auto(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoiceAuto> auto) {
            this.auto = auto;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getTool}
         * @param tool tool block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
         * @return {@code this}
         */
        public Builder tool(com.hashicorp.cdktf.IResolvable tool) {
            this.tool = tool;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice#getTool}
         * @param tool tool block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool BedrockagentPrompt#tool}
         * @return {@code this}
         */
        public Builder tool(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoiceTool> tool) {
            this.tool = tool;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice {
        private final java.lang.Object any;
        private final java.lang.Object auto;
        private final java.lang.Object tool;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.any = software.amazon.jsii.Kernel.get(this, "any", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.auto = software.amazon.jsii.Kernel.get(this, "auto", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tool = software.amazon.jsii.Kernel.get(this, "tool", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.any = builder.any;
            this.auto = builder.auto;
            this.tool = builder.tool;
        }

        @Override
        public final java.lang.Object getAny() {
            return this.any;
        }

        @Override
        public final java.lang.Object getAuto() {
            return this.auto;
        }

        @Override
        public final java.lang.Object getTool() {
            return this.tool;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAny() != null) {
                data.set("any", om.valueToTree(this.getAny()));
            }
            if (this.getAuto() != null) {
                data.set("auto", om.valueToTree(this.getAuto()));
            }
            if (this.getTool() != null) {
                data.set("tool", om.valueToTree(this.getTool()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolChoice.Jsii$Proxy) o;

            if (this.any != null ? !this.any.equals(that.any) : that.any != null) return false;
            if (this.auto != null ? !this.auto.equals(that.auto) : that.auto != null) return false;
            return this.tool != null ? this.tool.equals(that.tool) : that.tool == null;
        }

        @Override
        public final int hashCode() {
            int result = this.any != null ? this.any.hashCode() : 0;
            result = 31 * result + (this.auto != null ? this.auto.hashCode() : 0);
            result = 31 * result + (this.tool != null ? this.tool.hashCode() : 0);
            return result;
        }
    }
}
