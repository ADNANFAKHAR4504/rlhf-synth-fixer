package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantGenAiResource")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariantGenAiResource.Jsii$Proxy.class)
public interface BedrockagentPromptVariantGenAiResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * agent block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#agent BedrockagentPrompt#agent}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAgent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariantGenAiResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariantGenAiResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariantGenAiResource> {
        java.lang.Object agent;

        /**
         * Sets the value of {@link BedrockagentPromptVariantGenAiResource#getAgent}
         * @param agent agent block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#agent BedrockagentPrompt#agent}
         * @return {@code this}
         */
        public Builder agent(com.hashicorp.cdktf.IResolvable agent) {
            this.agent = agent;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariantGenAiResource#getAgent}
         * @param agent agent block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#agent BedrockagentPrompt#agent}
         * @return {@code this}
         */
        public Builder agent(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResourceAgent> agent) {
            this.agent = agent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariantGenAiResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariantGenAiResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariantGenAiResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariantGenAiResource {
        private final java.lang.Object agent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.agent = software.amazon.jsii.Kernel.get(this, "agent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.agent = builder.agent;
        }

        @Override
        public final java.lang.Object getAgent() {
            return this.agent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAgent() != null) {
                data.set("agent", om.valueToTree(this.getAgent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariantGenAiResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariantGenAiResource.Jsii$Proxy that = (BedrockagentPromptVariantGenAiResource.Jsii$Proxy) o;

            return this.agent != null ? this.agent.equals(that.agent) : that.agent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.agent != null ? this.agent.hashCode() : 0;
            return result;
        }
    }
}
