package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.175Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#metadata_field BedrockagentKnowledgeBase#metadata_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetadataField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#primary_key_field BedrockagentKnowledgeBase#primary_key_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrimaryKeyField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#text_field BedrockagentKnowledgeBase#text_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTextField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_field BedrockagentKnowledgeBase#vector_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVectorField();

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping> {
        java.lang.String metadataField;
        java.lang.String primaryKeyField;
        java.lang.String textField;
        java.lang.String vectorField;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping#getMetadataField}
         * @param metadataField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#metadata_field BedrockagentKnowledgeBase#metadata_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder metadataField(java.lang.String metadataField) {
            this.metadataField = metadataField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping#getPrimaryKeyField}
         * @param primaryKeyField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#primary_key_field BedrockagentKnowledgeBase#primary_key_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder primaryKeyField(java.lang.String primaryKeyField) {
            this.primaryKeyField = primaryKeyField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping#getTextField}
         * @param textField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#text_field BedrockagentKnowledgeBase#text_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder textField(java.lang.String textField) {
            this.textField = textField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping#getVectorField}
         * @param vectorField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_field BedrockagentKnowledgeBase#vector_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder vectorField(java.lang.String vectorField) {
            this.vectorField = vectorField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping {
        private final java.lang.String metadataField;
        private final java.lang.String primaryKeyField;
        private final java.lang.String textField;
        private final java.lang.String vectorField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metadataField = software.amazon.jsii.Kernel.get(this, "metadataField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.primaryKeyField = software.amazon.jsii.Kernel.get(this, "primaryKeyField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.textField = software.amazon.jsii.Kernel.get(this, "textField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vectorField = software.amazon.jsii.Kernel.get(this, "vectorField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metadataField = java.util.Objects.requireNonNull(builder.metadataField, "metadataField is required");
            this.primaryKeyField = java.util.Objects.requireNonNull(builder.primaryKeyField, "primaryKeyField is required");
            this.textField = java.util.Objects.requireNonNull(builder.textField, "textField is required");
            this.vectorField = java.util.Objects.requireNonNull(builder.vectorField, "vectorField is required");
        }

        @Override
        public final java.lang.String getMetadataField() {
            return this.metadataField;
        }

        @Override
        public final java.lang.String getPrimaryKeyField() {
            return this.primaryKeyField;
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

            data.set("metadataField", om.valueToTree(this.getMetadataField()));
            data.set("primaryKeyField", om.valueToTree(this.getPrimaryKeyField()));
            data.set("textField", om.valueToTree(this.getTextField()));
            data.set("vectorField", om.valueToTree(this.getVectorField()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping.Jsii$Proxy) o;

            if (!metadataField.equals(that.metadataField)) return false;
            if (!primaryKeyField.equals(that.primaryKeyField)) return false;
            if (!textField.equals(that.textField)) return false;
            return this.vectorField.equals(that.vectorField);
        }

        @Override
        public final int hashCode() {
            int result = this.metadataField.hashCode();
            result = 31 * result + (this.primaryKeyField.hashCode());
            result = 31 * result + (this.textField.hashCode());
            result = 31 * result + (this.vectorField.hashCode());
            return result;
        }
    }
}
