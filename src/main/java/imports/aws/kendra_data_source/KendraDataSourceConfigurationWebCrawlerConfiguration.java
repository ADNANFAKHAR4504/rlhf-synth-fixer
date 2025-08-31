package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * urls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#urls KendraDataSource#urls}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls getUrls();

    /**
     * authentication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#authentication_configuration KendraDataSource#authentication_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration getAuthenticationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#crawl_depth KendraDataSource#crawl_depth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCrawlDepth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_content_size_per_page_in_mega_bytes KendraDataSource#max_content_size_per_page_in_mega_bytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxContentSizePerPageInMegaBytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_links_per_page KendraDataSource#max_links_per_page}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxLinksPerPage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_urls_per_minute_crawl_rate KendraDataSource#max_urls_per_minute_crawl_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxUrlsPerMinuteCrawlRate() {
        return null;
    }

    /**
     * proxy_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#proxy_configuration KendraDataSource#proxy_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration getProxyConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#url_exclusion_patterns KendraDataSource#url_exclusion_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUrlExclusionPatterns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#url_inclusion_patterns KendraDataSource#url_inclusion_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUrlInclusionPatterns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfiguration> {
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls urls;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration authenticationConfiguration;
        java.lang.Number crawlDepth;
        java.lang.Number maxContentSizePerPageInMegaBytes;
        java.lang.Number maxLinksPerPage;
        java.lang.Number maxUrlsPerMinuteCrawlRate;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration proxyConfiguration;
        java.util.List<java.lang.String> urlExclusionPatterns;
        java.util.List<java.lang.String> urlInclusionPatterns;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getUrls}
         * @param urls urls block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#urls KendraDataSource#urls}
         * @return {@code this}
         */
        public Builder urls(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls urls) {
            this.urls = urls;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getAuthenticationConfiguration}
         * @param authenticationConfiguration authentication_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#authentication_configuration KendraDataSource#authentication_configuration}
         * @return {@code this}
         */
        public Builder authenticationConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration authenticationConfiguration) {
            this.authenticationConfiguration = authenticationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getCrawlDepth}
         * @param crawlDepth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#crawl_depth KendraDataSource#crawl_depth}.
         * @return {@code this}
         */
        public Builder crawlDepth(java.lang.Number crawlDepth) {
            this.crawlDepth = crawlDepth;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getMaxContentSizePerPageInMegaBytes}
         * @param maxContentSizePerPageInMegaBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_content_size_per_page_in_mega_bytes KendraDataSource#max_content_size_per_page_in_mega_bytes}.
         * @return {@code this}
         */
        public Builder maxContentSizePerPageInMegaBytes(java.lang.Number maxContentSizePerPageInMegaBytes) {
            this.maxContentSizePerPageInMegaBytes = maxContentSizePerPageInMegaBytes;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getMaxLinksPerPage}
         * @param maxLinksPerPage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_links_per_page KendraDataSource#max_links_per_page}.
         * @return {@code this}
         */
        public Builder maxLinksPerPage(java.lang.Number maxLinksPerPage) {
            this.maxLinksPerPage = maxLinksPerPage;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getMaxUrlsPerMinuteCrawlRate}
         * @param maxUrlsPerMinuteCrawlRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#max_urls_per_minute_crawl_rate KendraDataSource#max_urls_per_minute_crawl_rate}.
         * @return {@code this}
         */
        public Builder maxUrlsPerMinuteCrawlRate(java.lang.Number maxUrlsPerMinuteCrawlRate) {
            this.maxUrlsPerMinuteCrawlRate = maxUrlsPerMinuteCrawlRate;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getProxyConfiguration}
         * @param proxyConfiguration proxy_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#proxy_configuration KendraDataSource#proxy_configuration}
         * @return {@code this}
         */
        public Builder proxyConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration proxyConfiguration) {
            this.proxyConfiguration = proxyConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getUrlExclusionPatterns}
         * @param urlExclusionPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#url_exclusion_patterns KendraDataSource#url_exclusion_patterns}.
         * @return {@code this}
         */
        public Builder urlExclusionPatterns(java.util.List<java.lang.String> urlExclusionPatterns) {
            this.urlExclusionPatterns = urlExclusionPatterns;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfiguration#getUrlInclusionPatterns}
         * @param urlInclusionPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#url_inclusion_patterns KendraDataSource#url_inclusion_patterns}.
         * @return {@code this}
         */
        public Builder urlInclusionPatterns(java.util.List<java.lang.String> urlInclusionPatterns) {
            this.urlInclusionPatterns = urlInclusionPatterns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfiguration {
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls urls;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration authenticationConfiguration;
        private final java.lang.Number crawlDepth;
        private final java.lang.Number maxContentSizePerPageInMegaBytes;
        private final java.lang.Number maxLinksPerPage;
        private final java.lang.Number maxUrlsPerMinuteCrawlRate;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration proxyConfiguration;
        private final java.util.List<java.lang.String> urlExclusionPatterns;
        private final java.util.List<java.lang.String> urlInclusionPatterns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.urls = software.amazon.jsii.Kernel.get(this, "urls", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls.class));
            this.authenticationConfiguration = software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.class));
            this.crawlDepth = software.amazon.jsii.Kernel.get(this, "crawlDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxContentSizePerPageInMegaBytes = software.amazon.jsii.Kernel.get(this, "maxContentSizePerPageInMegaBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxLinksPerPage = software.amazon.jsii.Kernel.get(this, "maxLinksPerPage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxUrlsPerMinuteCrawlRate = software.amazon.jsii.Kernel.get(this, "maxUrlsPerMinuteCrawlRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.proxyConfiguration = software.amazon.jsii.Kernel.get(this, "proxyConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration.class));
            this.urlExclusionPatterns = software.amazon.jsii.Kernel.get(this, "urlExclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.urlInclusionPatterns = software.amazon.jsii.Kernel.get(this, "urlInclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.urls = java.util.Objects.requireNonNull(builder.urls, "urls is required");
            this.authenticationConfiguration = builder.authenticationConfiguration;
            this.crawlDepth = builder.crawlDepth;
            this.maxContentSizePerPageInMegaBytes = builder.maxContentSizePerPageInMegaBytes;
            this.maxLinksPerPage = builder.maxLinksPerPage;
            this.maxUrlsPerMinuteCrawlRate = builder.maxUrlsPerMinuteCrawlRate;
            this.proxyConfiguration = builder.proxyConfiguration;
            this.urlExclusionPatterns = builder.urlExclusionPatterns;
            this.urlInclusionPatterns = builder.urlInclusionPatterns;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls getUrls() {
            return this.urls;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration getAuthenticationConfiguration() {
            return this.authenticationConfiguration;
        }

        @Override
        public final java.lang.Number getCrawlDepth() {
            return this.crawlDepth;
        }

        @Override
        public final java.lang.Number getMaxContentSizePerPageInMegaBytes() {
            return this.maxContentSizePerPageInMegaBytes;
        }

        @Override
        public final java.lang.Number getMaxLinksPerPage() {
            return this.maxLinksPerPage;
        }

        @Override
        public final java.lang.Number getMaxUrlsPerMinuteCrawlRate() {
            return this.maxUrlsPerMinuteCrawlRate;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration getProxyConfiguration() {
            return this.proxyConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getUrlExclusionPatterns() {
            return this.urlExclusionPatterns;
        }

        @Override
        public final java.util.List<java.lang.String> getUrlInclusionPatterns() {
            return this.urlInclusionPatterns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("urls", om.valueToTree(this.getUrls()));
            if (this.getAuthenticationConfiguration() != null) {
                data.set("authenticationConfiguration", om.valueToTree(this.getAuthenticationConfiguration()));
            }
            if (this.getCrawlDepth() != null) {
                data.set("crawlDepth", om.valueToTree(this.getCrawlDepth()));
            }
            if (this.getMaxContentSizePerPageInMegaBytes() != null) {
                data.set("maxContentSizePerPageInMegaBytes", om.valueToTree(this.getMaxContentSizePerPageInMegaBytes()));
            }
            if (this.getMaxLinksPerPage() != null) {
                data.set("maxLinksPerPage", om.valueToTree(this.getMaxLinksPerPage()));
            }
            if (this.getMaxUrlsPerMinuteCrawlRate() != null) {
                data.set("maxUrlsPerMinuteCrawlRate", om.valueToTree(this.getMaxUrlsPerMinuteCrawlRate()));
            }
            if (this.getProxyConfiguration() != null) {
                data.set("proxyConfiguration", om.valueToTree(this.getProxyConfiguration()));
            }
            if (this.getUrlExclusionPatterns() != null) {
                data.set("urlExclusionPatterns", om.valueToTree(this.getUrlExclusionPatterns()));
            }
            if (this.getUrlInclusionPatterns() != null) {
                data.set("urlInclusionPatterns", om.valueToTree(this.getUrlInclusionPatterns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfiguration.Jsii$Proxy) o;

            if (!urls.equals(that.urls)) return false;
            if (this.authenticationConfiguration != null ? !this.authenticationConfiguration.equals(that.authenticationConfiguration) : that.authenticationConfiguration != null) return false;
            if (this.crawlDepth != null ? !this.crawlDepth.equals(that.crawlDepth) : that.crawlDepth != null) return false;
            if (this.maxContentSizePerPageInMegaBytes != null ? !this.maxContentSizePerPageInMegaBytes.equals(that.maxContentSizePerPageInMegaBytes) : that.maxContentSizePerPageInMegaBytes != null) return false;
            if (this.maxLinksPerPage != null ? !this.maxLinksPerPage.equals(that.maxLinksPerPage) : that.maxLinksPerPage != null) return false;
            if (this.maxUrlsPerMinuteCrawlRate != null ? !this.maxUrlsPerMinuteCrawlRate.equals(that.maxUrlsPerMinuteCrawlRate) : that.maxUrlsPerMinuteCrawlRate != null) return false;
            if (this.proxyConfiguration != null ? !this.proxyConfiguration.equals(that.proxyConfiguration) : that.proxyConfiguration != null) return false;
            if (this.urlExclusionPatterns != null ? !this.urlExclusionPatterns.equals(that.urlExclusionPatterns) : that.urlExclusionPatterns != null) return false;
            return this.urlInclusionPatterns != null ? this.urlInclusionPatterns.equals(that.urlInclusionPatterns) : that.urlInclusionPatterns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.urls.hashCode();
            result = 31 * result + (this.authenticationConfiguration != null ? this.authenticationConfiguration.hashCode() : 0);
            result = 31 * result + (this.crawlDepth != null ? this.crawlDepth.hashCode() : 0);
            result = 31 * result + (this.maxContentSizePerPageInMegaBytes != null ? this.maxContentSizePerPageInMegaBytes.hashCode() : 0);
            result = 31 * result + (this.maxLinksPerPage != null ? this.maxLinksPerPage.hashCode() : 0);
            result = 31 * result + (this.maxUrlsPerMinuteCrawlRate != null ? this.maxUrlsPerMinuteCrawlRate.hashCode() : 0);
            result = 31 * result + (this.proxyConfiguration != null ? this.proxyConfiguration.hashCode() : 0);
            result = 31 * result + (this.urlExclusionPatterns != null ? this.urlExclusionPatterns.hashCode() : 0);
            result = 31 * result + (this.urlInclusionPatterns != null ? this.urlInclusionPatterns.hashCode() : 0);
            return result;
        }
    }
}
