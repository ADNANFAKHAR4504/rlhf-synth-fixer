package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition KendraDataSource#condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition getCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#document_content_deletion KendraDataSource#document_content_deletion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDocumentContentDeletion() {
        return null;
    }

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target KendraDataSource#target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget getTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations> {
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition condition;
        java.lang.Object documentContentDeletion;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget target;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition KendraDataSource#condition}
         * @return {@code this}
         */
        public Builder condition(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations#getDocumentContentDeletion}
         * @param documentContentDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#document_content_deletion KendraDataSource#document_content_deletion}.
         * @return {@code this}
         */
        public Builder documentContentDeletion(java.lang.Boolean documentContentDeletion) {
            this.documentContentDeletion = documentContentDeletion;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations#getDocumentContentDeletion}
         * @param documentContentDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#document_content_deletion KendraDataSource#document_content_deletion}.
         * @return {@code this}
         */
        public Builder documentContentDeletion(com.hashicorp.cdktf.IResolvable documentContentDeletion) {
            this.documentContentDeletion = documentContentDeletion;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#target KendraDataSource#target}
         * @return {@code this}
         */
        public Builder target(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget target) {
            this.target = target;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations {
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition condition;
        private final java.lang.Object documentContentDeletion;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget target;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition.class));
            this.documentContentDeletion = software.amazon.jsii.Kernel.get(this, "documentContentDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.condition = builder.condition;
            this.documentContentDeletion = builder.documentContentDeletion;
            this.target = builder.target;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.Object getDocumentContentDeletion() {
            return this.documentContentDeletion;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget getTarget() {
            return this.target;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }
            if (this.getDocumentContentDeletion() != null) {
                data.set("documentContentDeletion", om.valueToTree(this.getDocumentContentDeletion()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations.Jsii$Proxy) o;

            if (this.condition != null ? !this.condition.equals(that.condition) : that.condition != null) return false;
            if (this.documentContentDeletion != null ? !this.documentContentDeletion.equals(that.documentContentDeletion) : that.documentContentDeletion != null) return false;
            return this.target != null ? this.target.equals(that.target) : that.target == null;
        }

        @Override
        public final int hashCode() {
            int result = this.condition != null ? this.condition.hashCode() : 0;
            result = 31 * result + (this.documentContentDeletion != null ? this.documentContentDeletion.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            return result;
        }
    }
}
