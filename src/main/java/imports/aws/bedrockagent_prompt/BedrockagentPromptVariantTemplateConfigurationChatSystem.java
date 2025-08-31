package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.178Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatSystem")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatSystem.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatSystem extends software.amazon.jsii.JsiiSerializable {

    /**
     * cache_point block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCachePoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatSystem}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatSystem}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatSystem> {
        java.lang.Object cachePoint;
        java.lang.String text;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatSystem#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(com.hashicorp.cdktf.IResolvable cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatSystem#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatSystemCachePoint> cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatSystem#getText}
         * @param text Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#text BedrockagentPrompt#text}.
         * @return {@code this}
         */
        public Builder text(java.lang.String text) {
            this.text = text;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatSystem}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatSystem build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatSystem}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatSystem {
        private final java.lang.Object cachePoint;
        private final java.lang.String text;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cachePoint = software.amazon.jsii.Kernel.get(this, "cachePoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cachePoint = builder.cachePoint;
            this.text = builder.text;
        }

        @Override
        public final java.lang.Object getCachePoint() {
            return this.cachePoint;
        }

        @Override
        public final java.lang.String getText() {
            return this.text;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCachePoint() != null) {
                data.set("cachePoint", om.valueToTree(this.getCachePoint()));
            }
            if (this.getText() != null) {
                data.set("text", om.valueToTree(this.getText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatSystem"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatSystem.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatSystem.Jsii$Proxy) o;

            if (this.cachePoint != null ? !this.cachePoint.equals(that.cachePoint) : that.cachePoint != null) return false;
            return this.text != null ? this.text.equals(that.text) : that.text == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cachePoint != null ? this.cachePoint.hashCode() : 0;
            result = 31 * result + (this.text != null ? this.text.hashCode() : 0);
            return result;
        }
    }
}
