package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.175Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#metadata_field BedrockagentKnowledgeBase#metadata_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetadataField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#text_field BedrockagentKnowledgeBase#text_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTextField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_field BedrockagentKnowledgeBase#vector_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVectorField() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping> {
        java.lang.String metadataField;
        java.lang.String textField;
        java.lang.String vectorField;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping#getMetadataField}
         * @param metadataField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#metadata_field BedrockagentKnowledgeBase#metadata_field}.
         * @return {@code this}
         */
        public Builder metadataField(java.lang.String metadataField) {
            this.metadataField = metadataField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping#getTextField}
         * @param textField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#text_field BedrockagentKnowledgeBase#text_field}.
         * @return {@code this}
         */
        public Builder textField(java.lang.String textField) {
            this.textField = textField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping#getVectorField}
         * @param vectorField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_field BedrockagentKnowledgeBase#vector_field}.
         * @return {@code this}
         */
        public Builder vectorField(java.lang.String vectorField) {
            this.vectorField = vectorField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping {
        private final java.lang.String metadataField;
        private final java.lang.String textField;
        private final java.lang.String vectorField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metadataField = software.amazon.jsii.Kernel.get(this, "metadataField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.textField = software.amazon.jsii.Kernel.get(this, "textField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vectorField = software.amazon.jsii.Kernel.get(this, "vectorField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metadataField = builder.metadataField;
            this.textField = builder.textField;
            this.vectorField = builder.vectorField;
        }

        @Override
        public final java.lang.String getMetadataField() {
            return this.metadataField;
        }

        @Override
        public final java.lang.String getTextField() {
            return this.textField;
        }

        @Override
        public final java.lang.String getVectorField() {
            return this.vectorField;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMetadataField() != null) {
                data.set("metadataField", om.valueToTree(this.getMetadataField()));
            }
            if (this.getTextField() != null) {
                data.set("textField", om.valueToTree(this.getTextField()));
            }
            if (this.getVectorField() != null) {
                data.set("vectorField", om.valueToTree(this.getVectorField()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping.Jsii$Proxy) o;

            if (this.metadataField != null ? !this.metadataField.equals(that.metadataField) : that.metadataField != null) return false;
            if (this.textField != null ? !this.textField.equals(that.textField) : that.textField != null) return false;
            return this.vectorField != null ? this.vectorField.equals(that.vectorField) : that.vectorField == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metadataField != null ? this.metadataField.hashCode() : 0;
            result = 31 * result + (this.textField != null ? this.textField.hashCode() : 0);
            result = 31 * result + (this.vectorField != null ? this.vectorField.hashCode() : 0);
            return result;
        }
    }
}
