package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#collection_arn BedrockagentKnowledgeBase#collection_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCollectionArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_index_name BedrockagentKnowledgeBase#vector_index_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVectorIndexName();

    /**
     * field_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldMapping() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration> {
        java.lang.String collectionArn;
        java.lang.String vectorIndexName;
        java.lang.Object fieldMapping;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration#getCollectionArn}
         * @param collectionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#collection_arn BedrockagentKnowledgeBase#collection_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder collectionArn(java.lang.String collectionArn) {
            this.collectionArn = collectionArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration#getVectorIndexName}
         * @param vectorIndexName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_index_name BedrockagentKnowledgeBase#vector_index_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder vectorIndexName(java.lang.String vectorIndexName) {
            this.vectorIndexName = vectorIndexName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(com.hashicorp.cdktf.IResolvable fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfigurationFieldMapping> fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration {
        private final java.lang.String collectionArn;
        private final java.lang.String vectorIndexName;
        private final java.lang.Object fieldMapping;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.collectionArn = software.amazon.jsii.Kernel.get(this, "collectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vectorIndexName = software.amazon.jsii.Kernel.get(this, "vectorIndexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldMapping = software.amazon.jsii.Kernel.get(this, "fieldMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.collectionArn = java.util.Objects.requireNonNull(builder.collectionArn, "collectionArn is required");
            this.vectorIndexName = java.util.Objects.requireNonNull(builder.vectorIndexName, "vectorIndexName is required");
            this.fieldMapping = builder.fieldMapping;
        }

        @Override
        public final java.lang.String getCollectionArn() {
            return this.collectionArn;
        }

        @Override
        public final java.lang.String getVectorIndexName() {
            return this.vectorIndexName;
        }

        @Override
        public final java.lang.Object getFieldMapping() {
            return this.fieldMapping;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("collectionArn", om.valueToTree(this.getCollectionArn()));
            data.set("vectorIndexName", om.valueToTree(this.getVectorIndexName()));
            if (this.getFieldMapping() != null) {
                data.set("fieldMapping", om.valueToTree(this.getFieldMapping()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration.Jsii$Proxy) o;

            if (!collectionArn.equals(that.collectionArn)) return false;
            if (!vectorIndexName.equals(that.vectorIndexName)) return false;
            return this.fieldMapping != null ? this.fieldMapping.equals(that.fieldMapping) : that.fieldMapping == null;
        }

        @Override
        public final int hashCode() {
            int result = this.collectionArn.hashCode();
            result = 31 * result + (this.vectorIndexName.hashCode());
            result = 31 * result + (this.fieldMapping != null ? this.fieldMapping.hashCode() : 0);
            return result;
        }
    }
}
