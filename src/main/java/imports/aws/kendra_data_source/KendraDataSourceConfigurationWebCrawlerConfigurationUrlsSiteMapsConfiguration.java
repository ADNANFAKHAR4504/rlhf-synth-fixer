package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#site_maps KendraDataSource#site_maps}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSiteMaps();

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration> {
        java.util.List<java.lang.String> siteMaps;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration#getSiteMaps}
         * @param siteMaps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#site_maps KendraDataSource#site_maps}. This parameter is required.
         * @return {@code this}
         */
        public Builder siteMaps(java.util.List<java.lang.String> siteMaps) {
            this.siteMaps = siteMaps;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration {
        private final java.util.List<java.lang.String> siteMaps;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.siteMaps = software.amazon.jsii.Kernel.get(this, "siteMaps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.siteMaps = java.util.Objects.requireNonNull(builder.siteMaps, "siteMaps is required");
        }

        @Override
        public final java.util.List<java.lang.String> getSiteMaps() {
            return this.siteMaps;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("siteMaps", om.valueToTree(this.getSiteMaps()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration.Jsii$Proxy) o;

            return this.siteMaps.equals(that.siteMaps);
        }

        @Override
        public final int hashCode() {
            int result = this.siteMaps.hashCode();
            return result;
        }
    }
}
