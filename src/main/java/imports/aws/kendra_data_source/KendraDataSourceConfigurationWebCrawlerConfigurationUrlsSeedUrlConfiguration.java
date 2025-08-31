package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#seed_urls KendraDataSource#seed_urls}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSeedUrls();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#web_crawler_mode KendraDataSource#web_crawler_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebCrawlerMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration> {
        java.util.List<java.lang.String> seedUrls;
        java.lang.String webCrawlerMode;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration#getSeedUrls}
         * @param seedUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#seed_urls KendraDataSource#seed_urls}. This parameter is required.
         * @return {@code this}
         */
        public Builder seedUrls(java.util.List<java.lang.String> seedUrls) {
            this.seedUrls = seedUrls;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration#getWebCrawlerMode}
         * @param webCrawlerMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#web_crawler_mode KendraDataSource#web_crawler_mode}.
         * @return {@code this}
         */
        public Builder webCrawlerMode(java.lang.String webCrawlerMode) {
            this.webCrawlerMode = webCrawlerMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration {
        private final java.util.List<java.lang.String> seedUrls;
        private final java.lang.String webCrawlerMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.seedUrls = software.amazon.jsii.Kernel.get(this, "seedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.webCrawlerMode = software.amazon.jsii.Kernel.get(this, "webCrawlerMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.seedUrls = java.util.Objects.requireNonNull(builder.seedUrls, "seedUrls is required");
            this.webCrawlerMode = builder.webCrawlerMode;
        }

        @Override
        public final java.util.List<java.lang.String> getSeedUrls() {
            return this.seedUrls;
        }

        @Override
        public final java.lang.String getWebCrawlerMode() {
            return this.webCrawlerMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("seedUrls", om.valueToTree(this.getSeedUrls()));
            if (this.getWebCrawlerMode() != null) {
                data.set("webCrawlerMode", om.valueToTree(this.getWebCrawlerMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.Jsii$Proxy) o;

            if (!seedUrls.equals(that.seedUrls)) return false;
            return this.webCrawlerMode != null ? this.webCrawlerMode.equals(that.webCrawlerMode) : that.webCrawlerMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.seedUrls.hashCode();
            result = 31 * result + (this.webCrawlerMode != null ? this.webCrawlerMode.hashCode() : 0);
            return result;
        }
    }
}
