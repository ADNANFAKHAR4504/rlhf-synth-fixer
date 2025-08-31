package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.183Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationText")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationText.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationText extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getText();

    /**
     * cache_point block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCachePoint() {
        return null;
    }

    /**
     * input_variable block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputVariable() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationText}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationText}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationText> {
        java.lang.String text;
        java.lang.Object cachePoint;
        java.lang.Object inputVariable;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationText#getText}
         * @param text Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}. This parameter is required.
         * @return {@code this}
         */
        public Builder text(java.lang.String text) {
            this.text = text;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationText#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(com.hashicorp.cdktf.IResolvable cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationText#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationTextCachePoint> cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationText#getInputVariable}
         * @param inputVariable input_variable block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
         * @return {@code this}
         */
        public Builder inputVariable(com.hashicorp.cdktf.IResolvable inputVariable) {
            this.inputVariable = inputVariable;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationText#getInputVariable}
         * @param inputVariable input_variable block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#input_variable BedrockagentPrompt#input_variable}
         * @return {@code this}
         */
        public Builder inputVariable(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationTextInputVariable> inputVariable) {
            this.inputVariable = inputVariable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationText}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationText build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationText}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationText {
        private final java.lang.String text;
        private final java.lang.Object cachePoint;
        private final java.lang.Object inputVariable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cachePoint = software.amazon.jsii.Kernel.get(this, "cachePoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inputVariable = software.amazon.jsii.Kernel.get(this, "inputVariable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.text = java.util.Objects.requireNonNull(builder.text, "text is required");
            this.cachePoint = builder.cachePoint;
            this.inputVariable = builder.inputVariable;
        }

        @Override
        public final java.lang.String getText() {
            return this.text;
        }

        @Override
        public final java.lang.Object getCachePoint() {
            return this.cachePoint;
        }

        @Override
        public final java.lang.Object getInputVariable() {
            return this.inputVariable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("text", om.valueToTree(this.getText()));
            if (this.getCachePoint() != null) {
                data.set("cachePoint", om.valueToTree(this.getCachePoint()));
            }
            if (this.getInputVariable() != null) {
                data.set("inputVariable", om.valueToTree(this.getInputVariable()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationText"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationText.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationText.Jsii$Proxy) o;

            if (!text.equals(that.text)) return false;
            if (this.cachePoint != null ? !this.cachePoint.equals(that.cachePoint) : that.cachePoint != null) return false;
            return this.inputVariable != null ? this.inputVariable.equals(that.inputVariable) : that.inputVariable == null;
        }

        @Override
        public final int hashCode() {
            int result = this.text.hashCode();
            result = 31 * result + (this.cachePoint != null ? this.cachePoint.hashCode() : 0);
            result = 31 * result + (this.inputVariable != null ? this.inputVariable.hashCode() : 0);
            return result;
        }
    }
}
