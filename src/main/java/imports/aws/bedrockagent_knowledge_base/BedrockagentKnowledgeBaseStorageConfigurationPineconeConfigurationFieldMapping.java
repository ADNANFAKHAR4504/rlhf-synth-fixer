package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping extends software.amazon.jsii.JsiiSerializable {

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
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping> {
        java.lang.String metadataField;
        java.lang.String textField;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping#getMetadataField}
         * @param metadataField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#metadata_field BedrockagentKnowledgeBase#metadata_field}.
         * @return {@code this}
         */
        public Builder metadataField(java.lang.String metadataField) {
            this.metadataField = metadataField;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping#getTextField}
         * @param textField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#text_field BedrockagentKnowledgeBase#text_field}.
         * @return {@code this}
         */
        public Builder textField(java.lang.String textField) {
            this.textField = textField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping {
        private final java.lang.String metadataField;
        private final java.lang.String textField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metadataField = software.amazon.jsii.Kernel.get(this, "metadataField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.textField = software.amazon.jsii.Kernel.get(this, "textField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metadataField = builder.metadataField;
            this.textField = builder.textField;
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

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping.Jsii$Proxy) o;

            if (this.metadataField != null ? !this.metadataField.equals(that.metadataField) : that.metadataField != null) return false;
            return this.textField != null ? this.textField.equals(that.textField) : that.textField == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metadataField != null ? this.metadataField.hashCode() : 0;
            result = 31 * result + (this.textField != null ? this.textField.hashCode() : 0);
            return result;
        }
    }
}
