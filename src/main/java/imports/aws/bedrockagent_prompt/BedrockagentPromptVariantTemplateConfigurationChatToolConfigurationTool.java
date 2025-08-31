package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.182Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool.Jsii$Proxy.class)
public interface BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool extends software.amazon.jsii.JsiiSerializable {

    /**
     * cache_point block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCachePoint() {
        return null;
    }

    /**
     * tool_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_spec BedrockagentPrompt#tool_spec}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getToolSpec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool> {
        java.lang.Object cachePoint;
        java.lang.Object toolSpec;

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(com.hashicorp.cdktf.IResolvable cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool#getCachePoint}
         * @param cachePoint cache_point block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#cache_point BedrockagentPrompt#cache_point}
         * @return {@code this}
         */
        public Builder cachePoint(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolCachePoint> cachePoint) {
            this.cachePoint = cachePoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool#getToolSpec}
         * @param toolSpec tool_spec block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_spec BedrockagentPrompt#tool_spec}
         * @return {@code this}
         */
        public Builder toolSpec(com.hashicorp.cdktf.IResolvable toolSpec) {
            this.toolSpec = toolSpec;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool#getToolSpec}
         * @param toolSpec tool_spec block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#tool_spec BedrockagentPrompt#tool_spec}
         * @return {@code this}
         */
        public Builder toolSpec(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationToolToolSpec> toolSpec) {
            this.toolSpec = toolSpec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool {
        private final java.lang.Object cachePoint;
        private final java.lang.Object toolSpec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cachePoint = software.amazon.jsii.Kernel.get(this, "cachePoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.toolSpec = software.amazon.jsii.Kernel.get(this, "toolSpec", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cachePoint = builder.cachePoint;
            this.toolSpec = builder.toolSpec;
        }

        @Override
        public final java.lang.Object getCachePoint() {
            return this.cachePoint;
        }

        @Override
        public final java.lang.Object getToolSpec() {
            return this.toolSpec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCachePoint() != null) {
                data.set("cachePoint", om.valueToTree(this.getCachePoint()));
            }
            if (this.getToolSpec() != null) {
                data.set("toolSpec", om.valueToTree(this.getToolSpec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool.Jsii$Proxy that = (BedrockagentPromptVariantTemplateConfigurationChatToolConfigurationTool.Jsii$Proxy) o;

            if (this.cachePoint != null ? !this.cachePoint.equals(that.cachePoint) : that.cachePoint != null) return false;
            return this.toolSpec != null ? this.toolSpec.equals(that.toolSpec) : that.toolSpec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cachePoint != null ? this.cachePoint.hashCode() : 0;
            result = 31 * result + (this.toolSpec != null ? this.toolSpec.hashCode() : 0);
            return result;
        }
    }
}
