package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#credentials KendraDataSource#credentials}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentials();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#host KendraDataSource#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#port KendraDataSource#port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPort();

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication> {
        java.lang.String credentials;
        java.lang.String host;
        java.lang.Number port;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication#getCredentials}
         * @param credentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#credentials KendraDataSource#credentials}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentials(java.lang.String credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#host KendraDataSource#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#port KendraDataSource#port}. This parameter is required.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication {
        private final java.lang.String credentials;
        private final java.lang.String host;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.credentials = java.util.Objects.requireNonNull(builder.credentials, "credentials is required");
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.port = java.util.Objects.requireNonNull(builder.port, "port is required");
        }

        @Override
        public final java.lang.String getCredentials() {
            return this.credentials;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("credentials", om.valueToTree(this.getCredentials()));
            data.set("host", om.valueToTree(this.getHost()));
            data.set("port", om.valueToTree(this.getPort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication.Jsii$Proxy) o;

            if (!credentials.equals(that.credentials)) return false;
            if (!host.equals(that.host)) return false;
            return this.port.equals(that.port);
        }

        @Override
        public final int hashCode() {
            int result = this.credentials.hashCode();
            result = 31 * result + (this.host.hashCode());
            result = 31 * result + (this.port.hashCode());
            return result;
        }
    }
}
