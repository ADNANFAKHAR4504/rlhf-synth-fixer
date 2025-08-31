package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#host KendraDataSource#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#port KendraDataSource#port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#credentials KendraDataSource#credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCredentials() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration> {
        java.lang.String host;
        java.lang.Number port;
        java.lang.String credentials;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#host KendraDataSource#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#port KendraDataSource#port}. This parameter is required.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration#getCredentials}
         * @param credentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#credentials KendraDataSource#credentials}.
         * @return {@code this}
         */
        public Builder credentials(java.lang.String credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration {
        private final java.lang.String host;
        private final java.lang.Number port;
        private final java.lang.String credentials;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.port = java.util.Objects.requireNonNull(builder.port, "port is required");
            this.credentials = builder.credentials;
        }

        @Override
        public final java.lang.String getHost() {
            return this.host;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getCredentials() {
            return this.credentials;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("host", om.valueToTree(this.getHost()));
            data.set("port", om.valueToTree(this.getPort()));
            if (this.getCredentials() != null) {
                data.set("credentials", om.valueToTree(this.getCredentials()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration.Jsii$Proxy) o;

            if (!host.equals(that.host)) return false;
            if (!port.equals(that.port)) return false;
            return this.credentials != null ? this.credentials.equals(that.credentials) : that.credentials == null;
        }

        @Override
        public final int hashCode() {
            int result = this.host.hashCode();
            result = 31 * result + (this.port.hashCode());
            result = 31 * result + (this.credentials != null ? this.credentials.hashCode() : 0);
            return result;
        }
    }
}
