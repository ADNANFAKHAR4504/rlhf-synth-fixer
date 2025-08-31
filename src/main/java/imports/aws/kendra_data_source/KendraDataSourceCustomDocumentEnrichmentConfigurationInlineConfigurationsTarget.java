package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_key KendraDataSource#target_document_attribute_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetDocumentAttributeKey() {
        return null;
    }

    /**
     * target_document_attribute_value block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_value KendraDataSource#target_document_attribute_value}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue getTargetDocumentAttributeValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_value_deletion KendraDataSource#target_document_attribute_value_deletion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetDocumentAttributeValueDeletion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget> {
        java.lang.String targetDocumentAttributeKey;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue targetDocumentAttributeValue;
        java.lang.Object targetDocumentAttributeValueDeletion;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget#getTargetDocumentAttributeKey}
         * @param targetDocumentAttributeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_key KendraDataSource#target_document_attribute_key}.
         * @return {@code this}
         */
        public Builder targetDocumentAttributeKey(java.lang.String targetDocumentAttributeKey) {
            this.targetDocumentAttributeKey = targetDocumentAttributeKey;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget#getTargetDocumentAttributeValue}
         * @param targetDocumentAttributeValue target_document_attribute_value block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_value KendraDataSource#target_document_attribute_value}
         * @return {@code this}
         */
        public Builder targetDocumentAttributeValue(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue targetDocumentAttributeValue) {
            this.targetDocumentAttributeValue = targetDocumentAttributeValue;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget#getTargetDocumentAttributeValueDeletion}
         * @param targetDocumentAttributeValueDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_value_deletion KendraDataSource#target_document_attribute_value_deletion}.
         * @return {@code this}
         */
        public Builder targetDocumentAttributeValueDeletion(java.lang.Boolean targetDocumentAttributeValueDeletion) {
            this.targetDocumentAttributeValueDeletion = targetDocumentAttributeValueDeletion;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget#getTargetDocumentAttributeValueDeletion}
         * @param targetDocumentAttributeValueDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target_document_attribute_value_deletion KendraDataSource#target_document_attribute_value_deletion}.
         * @return {@code this}
         */
        public Builder targetDocumentAttributeValueDeletion(com.hashicorp.cdktf.IResolvable targetDocumentAttributeValueDeletion) {
            this.targetDocumentAttributeValueDeletion = targetDocumentAttributeValueDeletion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget {
        private final java.lang.String targetDocumentAttributeKey;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue targetDocumentAttributeValue;
        private final java.lang.Object targetDocumentAttributeValueDeletion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetDocumentAttributeKey = software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetDocumentAttributeValue = software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.class));
            this.targetDocumentAttributeValueDeletion = software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValueDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetDocumentAttributeKey = builder.targetDocumentAttributeKey;
            this.targetDocumentAttributeValue = builder.targetDocumentAttributeValue;
            this.targetDocumentAttributeValueDeletion = builder.targetDocumentAttributeValueDeletion;
        }

        @Override
        public final java.lang.String getTargetDocumentAttributeKey() {
            return this.targetDocumentAttributeKey;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue getTargetDocumentAttributeValue() {
            return this.targetDocumentAttributeValue;
        }

        @Override
        public final java.lang.Object getTargetDocumentAttributeValueDeletion() {
            return this.targetDocumentAttributeValueDeletion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetDocumentAttributeKey() != null) {
                data.set("targetDocumentAttributeKey", om.valueToTree(this.getTargetDocumentAttributeKey()));
            }
            if (this.getTargetDocumentAttributeValue() != null) {
                data.set("targetDocumentAttributeValue", om.valueToTree(this.getTargetDocumentAttributeValue()));
            }
            if (this.getTargetDocumentAttributeValueDeletion() != null) {
                data.set("targetDocumentAttributeValueDeletion", om.valueToTree(this.getTargetDocumentAttributeValueDeletion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.Jsii$Proxy) o;

            if (this.targetDocumentAttributeKey != null ? !this.targetDocumentAttributeKey.equals(that.targetDocumentAttributeKey) : that.targetDocumentAttributeKey != null) return false;
            if (this.targetDocumentAttributeValue != null ? !this.targetDocumentAttributeValue.equals(that.targetDocumentAttributeValue) : that.targetDocumentAttributeValue != null) return false;
            return this.targetDocumentAttributeValueDeletion != null ? this.targetDocumentAttributeValueDeletion.equals(that.targetDocumentAttributeValueDeletion) : that.targetDocumentAttributeValueDeletion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetDocumentAttributeKey != null ? this.targetDocumentAttributeKey.hashCode() : 0;
            result = 31 * result + (this.targetDocumentAttributeValue != null ? this.targetDocumentAttributeValue.hashCode() : 0);
            result = 31 * result + (this.targetDocumentAttributeValueDeletion != null ? this.targetDocumentAttributeValueDeletion.hashCode() : 0);
            return result;
        }
    }
}
