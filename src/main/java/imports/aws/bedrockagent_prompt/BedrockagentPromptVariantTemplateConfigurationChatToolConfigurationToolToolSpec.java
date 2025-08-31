package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.182Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#name BedrockagentPrompt#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#description BedrockagentPrompt#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * input_schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_schema BedrockagentPrompt#input_schema}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputSchema() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec> {
        java.lang.String name;
        java.lang.String description;
        java.lang.Object inputSchema;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#name BedrockagentPrompt#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#description BedrockagentPrompt#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec#getInputSchema}
         * @param inputSchema input_schema block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_schema BedrockagentPrompt#input_schema}
         * @return {@code this}
         */
        public Builder inputSchema(com.hashicorp.cdktf.IResolvable inputSchema) {
            this.inputSchema = inputSchema;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec#getInputSchema}
         * @param inputSchema input_schema block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_schema BedrockagentPrompt#input_schema}
         * @return {@code this}
         */
        public Builder inputSchema(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpecInputSchema> inputSchema) {
            this.inputSchema = inputSchema;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec {
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Object inputSchema;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputSchema = software.amazon.jsii.Kernel.get(this, "inputSchema", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.inputSchema = builder.inputSchema;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getInputSchema() {
            return this.inputSchema;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getInputSchema() != null) {
                data.set("inputSchema", om.valueToTree(this.getInputSchema()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.inputSchema != null ? this.inputSchema.equals(that.inputSchema) : that.inputSchema == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.inputSchema != null ? this.inputSchema.hashCode() : 0);
            return result;
        }
    }
}
