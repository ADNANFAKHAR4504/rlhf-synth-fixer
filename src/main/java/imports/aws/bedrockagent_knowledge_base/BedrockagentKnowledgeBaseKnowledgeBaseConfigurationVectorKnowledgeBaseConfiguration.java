package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.172Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_model_arn BedrockagentKnowledgeBase#embedding_model_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEmbeddingModelArn();

    /**
     * embedding_model_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_model_configuration BedrockagentKnowledgeBase#embedding_model_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEmbeddingModelConfiguration() {
        return null;
    }

    /**
     * supplemental_data_storage_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#supplemental_data_storage_configuration BedrockagentKnowledgeBase#supplemental_data_storage_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupplementalDataStorageConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration> {
        java.lang.String embeddingModelArn;
        java.lang.Object embeddingModelConfiguration;
        java.lang.Object supplementalDataStorageConfiguration;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration#getEmbeddingModelArn}
         * @param embeddingModelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_model_arn BedrockagentKnowledgeBase#embedding_model_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder embeddingModelArn(java.lang.String embeddingModelArn) {
            this.embeddingModelArn = embeddingModelArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration#getEmbeddingModelConfiguration}
         * @param embeddingModelConfiguration embedding_model_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_model_configuration BedrockagentKnowledgeBase#embedding_model_configuration}
         * @return {@code this}
         */
        public Builder embeddingModelConfiguration(com.hashicorp.cdktf.IResolvable embeddingModelConfiguration) {
            this.embeddingModelConfiguration = embeddingModelConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration#getEmbeddingModelConfiguration}
         * @param embeddingModelConfiguration embedding_model_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#embedding_model_configuration BedrockagentKnowledgeBase#embedding_model_configuration}
         * @return {@code this}
         */
        public Builder embeddingModelConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationEmbeddingModelConfiguration> embeddingModelConfiguration) {
            this.embeddingModelConfiguration = embeddingModelConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration#getSupplementalDataStorageConfiguration}
         * @param supplementalDataStorageConfiguration supplemental_data_storage_configuration block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#supplemental_data_storage_configuration BedrockagentKnowledgeBase#supplemental_data_storage_configuration}
         * @return {@code this}
         */
        public Builder supplementalDataStorageConfiguration(com.hashicorp.cdktf.IResolvable supplementalDataStorageConfiguration) {
            this.supplementalDataStorageConfiguration = supplementalDataStorageConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration#getSupplementalDataStorageConfiguration}
         * @param supplementalDataStorageConfiguration supplemental_data_storage_configuration block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#supplemental_data_storage_configuration BedrockagentKnowledgeBase#supplemental_data_storage_configuration}
         * @return {@code this}
         */
        public Builder supplementalDataStorageConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfigurationSupplementalDataStorageConfiguration> supplementalDataStorageConfiguration) {
            this.supplementalDataStorageConfiguration = supplementalDataStorageConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration {
        private final java.lang.String embeddingModelArn;
        private final java.lang.Object embeddingModelConfiguration;
        private final java.lang.Object supplementalDataStorageConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.embeddingModelArn = software.amazon.jsii.Kernel.get(this, "embeddingModelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.embeddingModelConfiguration = software.amazon.jsii.Kernel.get(this, "embeddingModelConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supplementalDataStorageConfiguration = software.amazon.jsii.Kernel.get(this, "supplementalDataStorageConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.embeddingModelArn = java.util.Objects.requireNonNull(builder.embeddingModelArn, "embeddingModelArn is required");
            this.embeddingModelConfiguration = builder.embeddingModelConfiguration;
            this.supplementalDataStorageConfiguration = builder.supplementalDataStorageConfiguration;
        }

        @Override
        public final java.lang.String getEmbeddingModelArn() {
            return this.embeddingModelArn;
        }

        @Override
        public final java.lang.Object getEmbeddingModelConfiguration() {
            return this.embeddingModelConfiguration;
        }

        @Override
        public final java.lang.Object getSupplementalDataStorageConfiguration() {
            return this.supplementalDataStorageConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("embeddingModelArn", om.valueToTree(this.getEmbeddingModelArn()));
            if (this.getEmbeddingModelConfiguration() != null) {
                data.set("embeddingModelConfiguration", om.valueToTree(this.getEmbeddingModelConfiguration()));
            }
            if (this.getSupplementalDataStorageConfiguration() != null) {
                data.set("supplementalDataStorageConfiguration", om.valueToTree(this.getSupplementalDataStorageConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration.Jsii$Proxy) o;

            if (!embeddingModelArn.equals(that.embeddingModelArn)) return false;
            if (this.embeddingModelConfiguration != null ? !this.embeddingModelConfiguration.equals(that.embeddingModelConfiguration) : that.embeddingModelConfiguration != null) return false;
            return this.supplementalDataStorageConfiguration != null ? this.supplementalDataStorageConfiguration.equals(that.supplementalDataStorageConfiguration) : that.supplementalDataStorageConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.embeddingModelArn.hashCode();
            result = 31 * result + (this.embeddingModelConfiguration != null ? this.embeddingModelConfiguration.hashCode() : 0);
            result = 31 * result + (this.supplementalDataStorageConfiguration != null ? this.supplementalDataStorageConfiguration.hashCode() : 0);
            return result;
        }
    }
}
