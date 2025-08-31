package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.173Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#dimensions BedrockagentKnowledgeBase#dimensions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDimensions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_data_type BedrockagentKnowledgeBase#embedding_data_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmbeddingDataType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration> {
        java.lang.Number dimensions;
        java.lang.String embeddingDataType;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration#getDimensions}
         * @param dimensions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#dimensions BedrockagentKnowledgeBase#dimensions}.
         * @return {@code this}
         */
        public Builder dimensions(java.lang.Number dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration#getEmbeddingDataType}
         * @param embeddingDataType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_data_type BedrockagentKnowledgeBase#embedding_data_type}.
         * @return {@code this}
         */
        public Builder embeddingDataType(java.lang.String embeddingDataType) {
            this.embeddingDataType = embeddingDataType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration {
        private final java.lang.Number dimensions;
        private final java.lang.String embeddingDataType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dimensions = software.amazon.jsii.Kernel.get(this, "dimensions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.embeddingDataType = software.amazon.jsii.Kernel.get(this, "embeddingDataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dimensions = builder.dimensions;
            this.embeddingDataType = builder.embeddingDataType;
        }

        @Override
        public final java.lang.Number getDimensions() {
            return this.dimensions;
        }

        @Override
        public final java.lang.String getEmbeddingDataType() {
            return this.embeddingDataType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDimensions() != null) {
                data.set("dimensions", om.valueToTree(this.getDimensions()));
            }
            if (this.getEmbeddingDataType() != null) {
                data.set("embeddingDataType", om.valueToTree(this.getEmbeddingDataType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfigurationBedrockEmbeddingModelConfiguration.Jsii$Proxy) o;

            if (this.dimensions != null ? !this.dimensions.equals(that.dimensions) : that.dimensions != null) return false;
            return this.embeddingDataType != null ? this.embeddingDataType.equals(that.embeddingDataType) : that.embeddingDataType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dimensions != null ? this.dimensions.hashCode() : 0;
            result = 31 * result + (this.embeddingDataType != null ? this.embeddingDataType.hashCode() : 0);
            return result;
        }
    }
}
