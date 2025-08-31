package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.173Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * bedrock_embedding_model_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#bedrock_embedding_model_configuration BedrockagentKnowledgeBase#bedrock_embedding_model_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBedrockEmbeddingModelConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration> {
        java.lang.Object bedrockEmbeddingModelConfiguration;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration#getBedrockEmbeddingModelConfiguration}
         * @param bedrockEmbeddingModelConfiguration bedrock_embedding_model_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#bedrock_embedding_model_configuration BedrockagentKnowledgeBase#bedrock_embedding_model_configuration}
         * @return {@code this}
         */
        public Builder bedrockEmbeddingModelConfiguration(com.hashicorp.cdktf.IResolvable bedrockEmbeddingModelConfiguration) {
            this.bedrockEmbeddingModelConfiguration = bedrockEmbeddingModelConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration#getBedrockEmbeddingModelConfiguration}
         * @param bedrockEmbeddingModelConfiguration bedrock_embedding_model_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#bedrock_embedding_model_configuration BedrockagentKnowledgeBase#bedrock_embedding_model_configuration}
         * @return {@code this}
         */
        public Builder bedrockEmbeddingModelConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration> bedrockEmbeddingModelConfiguration) {
            this.bedrockEmbeddingModelConfiguration = bedrockEmbeddingModelConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration {
        private final java.lang.Object bedrockEmbeddingModelConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bedrockEmbeddingModelConfiguration = software.amazon.jsii.Kernel.get(this, "bedrockEmbeddingModelConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bedrockEmbeddingModelConfiguration = builder.bedrockEmbeddingModelConfiguration;
        }

        @Override
        public final java.lang.Object getBedrockEmbeddingModelConfiguration() {
            return this.bedrockEmbeddingModelConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBedrockEmbeddingModelConfiguration() != null) {
                data.set("bedrockEmbeddingModelConfiguration", om.valueToTree(this.getBedrockEmbeddingModelConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration.Jsii$Proxy) o;

            return this.bedrockEmbeddingModelConfiguration != null ? this.bedrockEmbeddingModelConfiguration.equals(that.bedrockEmbeddingModelConfiguration) : that.bedrockEmbeddingModelConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bedrockEmbeddingModelConfiguration != null ? this.bedrockEmbeddingModelConfiguration.hashCode() : 0;
            return result;
        }
    }
}
