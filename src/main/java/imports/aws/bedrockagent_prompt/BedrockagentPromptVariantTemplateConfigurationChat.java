package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChat")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChat.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChat extends software.amazon.jsii.JsiiSerializable {

    /**
     * input_variable block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputVariable() {
        return null;
    }

    /**
     * message block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#message BedrockagentPrompt#message}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMessage() {
        return null;
    }

    /**
     * system block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#system BedrockagentPrompt#system}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSystemAttribute() {
        return null;
    }

    /**
     * tool_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_configuration BedrockagentPrompt#tool_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getToolConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChat}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChat}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChat> {
        java.lang.Object inputVariable;
        java.lang.Object message;
        java.lang.Object systemAttribute;
        java.lang.Object toolConfiguration;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getInputVariable}
         * @param inputVariable input_variable block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
         * @return {@code this}
         */
        public Builder inputVariable(com.hashicorp.cdktf.IResolvable inputVariable) {
            this.inputVariable = inputVariable;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getInputVariable}
         * @param inputVariable input_variable block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
         * @return {@code this}
         */
        public Builder inputVariable(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatInputVariable> inputVariable) {
            this.inputVariable = inputVariable;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getMessage}
         * @param message message block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#message BedrockagentPrompt#message}
         * @return {@code this}
         */
        public Builder message(com.hashicorp.cdktf.IResolvable message) {
            this.message = message;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getMessage}
         * @param message message block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#message BedrockagentPrompt#message}
         * @return {@code this}
         */
        public Builder message(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatMessage> message) {
            this.message = message;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getSystemAttribute}
         * @param systemAttribute system block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#system BedrockagentPrompt#system}
         * @return {@code this}
         */
        public Builder systemAttribute(com.hashicorp.cdktf.IResolvable systemAttribute) {
            this.systemAttribute = systemAttribute;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getSystemAttribute}
         * @param systemAttribute system block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#system BedrockagentPrompt#system}
         * @return {@code this}
         */
        public Builder systemAttribute(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystem> systemAttribute) {
            this.systemAttribute = systemAttribute;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getToolConfiguration}
         * @param toolConfiguration tool_configuration block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_configuration BedrockagentPrompt#tool_configuration}
         * @return {@code this}
         */
        public Builder toolConfiguration(com.hashicorp.cdktf.IResolvable toolConfiguration) {
            this.toolConfiguration = toolConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChat#getToolConfiguration}
         * @param toolConfiguration tool_configuration block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_configuration BedrockagentPrompt#tool_configuration}
         * @return {@code this}
         */
        public Builder toolConfiguration(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfiguration> toolConfiguration) {
            this.toolConfiguration = toolConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChat}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChat build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChat}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChat {
        private final java.lang.Object inputVariable;
        private final java.lang.Object message;
        private final java.lang.Object systemAttribute;
        private final java.lang.Object toolConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputVariable = software.amazon.jsii.Kernel.get(this, "inputVariable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.message = software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.systemAttribute = software.amazon.jsii.Kernel.get(this, "systemAttribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.toolConfiguration = software.amazon.jsii.Kernel.get(this, "toolConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputVariable = builder.inputVariable;
            this.message = builder.message;
            this.systemAttribute = builder.systemAttribute;
            this.toolConfiguration = builder.toolConfiguration;
        }

        @Override
        public final java.lang.Object getInputVariable() {
            return this.inputVariable;
        }

        @Override
        public final java.lang.Object getMessage() {
            return this.message;
        }

        @Override
        public final java.lang.Object getSystemAttribute() {
            return this.systemAttribute;
        }

        @Override
        public final java.lang.Object getToolConfiguration() {
            return this.toolConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInputVariable() != null) {
                data.set("inputVariable", om.valueToTree(this.getInputVariable()));
            }
            if (this.getMessage() != null) {
                data.set("message", om.valueToTree(this.getMessage()));
            }
            if (this.getSystemAttribute() != null) {
                data.set("systemAttribute", om.valueToTree(this.getSystemAttribute()));
            }
            if (this.getToolConfiguration() != null) {
                data.set("toolConfiguration", om.valueToTree(this.getToolConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChat"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChat.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChat.Jsii$Proxy) o;

            if (this.inputVariable != null ? !this.inputVariable.equals(that.inputVariable) : that.inputVariable != null) return false;
            if (this.message != null ? !this.message.equals(that.message) : that.message != null) return false;
            if (this.systemAttribute != null ? !this.systemAttribute.equals(that.systemAttribute) : that.systemAttribute != null) return false;
            return this.toolConfiguration != null ? this.toolConfiguration.equals(that.toolConfiguration) : that.toolConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputVariable != null ? this.inputVariable.hashCode() : 0;
            result = 31 * result + (this.message != null ? this.message.hashCode() : 0);
            result = 31 * result + (this.systemAttribute != null ? this.systemAttribute.hashCode() : 0);
            result = 31 * result + (this.toolConfiguration != null ? this.toolConfiguration.hashCode() : 0);
            return result;
        }
    }
}
