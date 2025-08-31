package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.427Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_configuration KendraDataSource#s3_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration getS3Configuration() {
        return null;
    }

    /**
     * template_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#template_configuration KendraDataSource#template_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration getTemplateConfiguration() {
        return null;
    }

    /**
     * web_crawler_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#web_crawler_configuration KendraDataSource#web_crawler_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration getWebCrawlerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfiguration> {
        imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration s3Configuration;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration templateConfiguration;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration webCrawlerConfiguration;

        /**
         * Sets the value of {@link KendraDataSourceConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_configuration KendraDataSource#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfiguration#getTemplateConfiguration}
         * @param templateConfiguration template_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#template_configuration KendraDataSource#template_configuration}
         * @return {@code this}
         */
        public Builder templateConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration templateConfiguration) {
            this.templateConfiguration = templateConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfiguration#getWebCrawlerConfiguration}
         * @param webCrawlerConfiguration web_crawler_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#web_crawler_configuration KendraDataSource#web_crawler_configuration}
         * @return {@code this}
         */
        public Builder webCrawlerConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration webCrawlerConfiguration) {
            this.webCrawlerConfiguration = webCrawlerConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfiguration {
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration s3Configuration;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration templateConfiguration;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration webCrawlerConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration.class));
            this.templateConfiguration = software.amazon.jsii.Kernel.get(this, "templateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration.class));
            this.webCrawlerConfiguration = software.amazon.jsii.Kernel.get(this, "webCrawlerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Configuration = builder.s3Configuration;
            this.templateConfiguration = builder.templateConfiguration;
            this.webCrawlerConfiguration = builder.webCrawlerConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationTemplateConfiguration getTemplateConfiguration() {
            return this.templateConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration getWebCrawlerConfiguration() {
            return this.webCrawlerConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Configuration() != null) {
                data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            }
            if (this.getTemplateConfiguration() != null) {
                data.set("templateConfiguration", om.valueToTree(this.getTemplateConfiguration()));
            }
            if (this.getWebCrawlerConfiguration() != null) {
                data.set("webCrawlerConfiguration", om.valueToTree(this.getWebCrawlerConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfiguration.Jsii$Proxy that = (KendraDataSourceConfiguration.Jsii$Proxy) o;

            if (this.s3Configuration != null ? !this.s3Configuration.equals(that.s3Configuration) : that.s3Configuration != null) return false;
            if (this.templateConfiguration != null ? !this.templateConfiguration.equals(that.templateConfiguration) : that.templateConfiguration != null) return false;
            return this.webCrawlerConfiguration != null ? this.webCrawlerConfiguration.equals(that.webCrawlerConfiguration) : that.webCrawlerConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Configuration != null ? this.s3Configuration.hashCode() : 0;
            result = 31 * result + (this.templateConfiguration != null ? this.templateConfiguration.hashCode() : 0);
            result = 31 * result + (this.webCrawlerConfiguration != null ? this.webCrawlerConfiguration.hashCode() : 0);
            return result;
        }
    }
}
