package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * inline_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inline_configurations KendraDataSource#inline_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInlineConfigurations() {
        return null;
    }

    /**
     * post_extraction_hook_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#post_extraction_hook_configuration KendraDataSource#post_extraction_hook_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration getPostExtractionHookConfiguration() {
        return null;
    }

    /**
     * pre_extraction_hook_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#pre_extraction_hook_configuration KendraDataSource#pre_extraction_hook_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration getPreExtractionHookConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#role_arn KendraDataSource#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfiguration> {
        java.lang.Object inlineConfigurations;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration postExtractionHookConfiguration;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration preExtractionHookConfiguration;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration#getInlineConfigurations}
         * @param inlineConfigurations inline_configurations block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inline_configurations KendraDataSource#inline_configurations}
         * @return {@code this}
         */
        public Builder inlineConfigurations(com.hashicorp.cdktf.IResolvable inlineConfigurations) {
            this.inlineConfigurations = inlineConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration#getInlineConfigurations}
         * @param inlineConfigurations inline_configurations block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inline_configurations KendraDataSource#inline_configurations}
         * @return {@code this}
         */
        public Builder inlineConfigurations(java.util.List<? extends imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations> inlineConfigurations) {
            this.inlineConfigurations = inlineConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration#getPostExtractionHookConfiguration}
         * @param postExtractionHookConfiguration post_extraction_hook_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#post_extraction_hook_configuration KendraDataSource#post_extraction_hook_configuration}
         * @return {@code this}
         */
        public Builder postExtractionHookConfiguration(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration postExtractionHookConfiguration) {
            this.postExtractionHookConfiguration = postExtractionHookConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration#getPreExtractionHookConfiguration}
         * @param preExtractionHookConfiguration pre_extraction_hook_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#pre_extraction_hook_configuration KendraDataSource#pre_extraction_hook_configuration}
         * @return {@code this}
         */
        public Builder preExtractionHookConfiguration(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration preExtractionHookConfiguration) {
            this.preExtractionHookConfiguration = preExtractionHookConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#role_arn KendraDataSource#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfiguration {
        private final java.lang.Object inlineConfigurations;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration postExtractionHookConfiguration;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration preExtractionHookConfiguration;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inlineConfigurations = software.amazon.jsii.Kernel.get(this, "inlineConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.postExtractionHookConfiguration = software.amazon.jsii.Kernel.get(this, "postExtractionHookConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration.class));
            this.preExtractionHookConfiguration = software.amazon.jsii.Kernel.get(this, "preExtractionHookConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inlineConfigurations = builder.inlineConfigurations;
            this.postExtractionHookConfiguration = builder.postExtractionHookConfiguration;
            this.preExtractionHookConfiguration = builder.preExtractionHookConfiguration;
            this.roleArn = builder.roleArn;
        }

        @Override
        public final java.lang.Object getInlineConfigurations() {
            return this.inlineConfigurations;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPostExtractionHookConfiguration getPostExtractionHookConfiguration() {
            return this.postExtractionHookConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration getPreExtractionHookConfiguration() {
            return this.preExtractionHookConfiguration;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInlineConfigurations() != null) {
                data.set("inlineConfigurations", om.valueToTree(this.getInlineConfigurations()));
            }
            if (this.getPostExtractionHookConfiguration() != null) {
                data.set("postExtractionHookConfiguration", om.valueToTree(this.getPostExtractionHookConfiguration()));
            }
            if (this.getPreExtractionHookConfiguration() != null) {
                data.set("preExtractionHookConfiguration", om.valueToTree(this.getPreExtractionHookConfiguration()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfiguration.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfiguration.Jsii$Proxy) o;

            if (this.inlineConfigurations != null ? !this.inlineConfigurations.equals(that.inlineConfigurations) : that.inlineConfigurations != null) return false;
            if (this.postExtractionHookConfiguration != null ? !this.postExtractionHookConfiguration.equals(that.postExtractionHookConfiguration) : that.postExtractionHookConfiguration != null) return false;
            if (this.preExtractionHookConfiguration != null ? !this.preExtractionHookConfiguration.equals(that.preExtractionHookConfiguration) : that.preExtractionHookConfiguration != null) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inlineConfigurations != null ? this.inlineConfigurations.hashCode() : 0;
            result = 31 * result + (this.postExtractionHookConfiguration != null ? this.postExtractionHookConfiguration.hashCode() : 0);
            result = 31 * result + (this.preExtractionHookConfiguration != null ? this.preExtractionHookConfiguration.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}
