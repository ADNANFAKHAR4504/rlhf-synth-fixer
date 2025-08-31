package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrls")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationUrls.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationUrls extends software.amazon.jsii.JsiiSerializable {

    /**
     * seed_url_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#seed_url_configuration KendraDataSource#seed_url_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration getSeedUrlConfiguration() {
        return null;
    }

    /**
     * site_maps_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#site_maps_configuration KendraDataSource#site_maps_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration getSiteMapsConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationUrls> {
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration seedUrlConfiguration;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration siteMapsConfiguration;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls#getSeedUrlConfiguration}
         * @param seedUrlConfiguration seed_url_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#seed_url_configuration KendraDataSource#seed_url_configuration}
         * @return {@code this}
         */
        public Builder seedUrlConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration seedUrlConfiguration) {
            this.seedUrlConfiguration = seedUrlConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls#getSiteMapsConfiguration}
         * @param siteMapsConfiguration site_maps_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#site_maps_configuration KendraDataSource#site_maps_configuration}
         * @return {@code this}
         */
        public Builder siteMapsConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration siteMapsConfiguration) {
            this.siteMapsConfiguration = siteMapsConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationUrls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationUrls {
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration seedUrlConfiguration;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration siteMapsConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.seedUrlConfiguration = software.amazon.jsii.Kernel.get(this, "seedUrlConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.class));
            this.siteMapsConfiguration = software.amazon.jsii.Kernel.get(this, "siteMapsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.seedUrlConfiguration = builder.seedUrlConfiguration;
            this.siteMapsConfiguration = builder.siteMapsConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration getSeedUrlConfiguration() {
            return this.seedUrlConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration getSiteMapsConfiguration() {
            return this.siteMapsConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSeedUrlConfiguration() != null) {
                data.set("seedUrlConfiguration", om.valueToTree(this.getSeedUrlConfiguration()));
            }
            if (this.getSiteMapsConfiguration() != null) {
                data.set("siteMapsConfiguration", om.valueToTree(this.getSiteMapsConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationUrls.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationUrls.Jsii$Proxy) o;

            if (this.seedUrlConfiguration != null ? !this.seedUrlConfiguration.equals(that.seedUrlConfiguration) : that.seedUrlConfiguration != null) return false;
            return this.siteMapsConfiguration != null ? this.siteMapsConfiguration.equals(that.siteMapsConfiguration) : that.siteMapsConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.seedUrlConfiguration != null ? this.seedUrlConfiguration.hashCode() : 0;
            result = 31 * result + (this.siteMapsConfiguration != null ? this.siteMapsConfiguration.hashCode() : 0);
            return result;
        }
    }
}
