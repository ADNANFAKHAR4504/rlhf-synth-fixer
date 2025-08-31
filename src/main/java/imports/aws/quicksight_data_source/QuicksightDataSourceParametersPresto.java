package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.115Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersPresto")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersPresto.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersPresto extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#catalog QuicksightDataSource#catalog}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCatalog();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#host QuicksightDataSource#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#port QuicksightDataSource#port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPort();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersPresto}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersPresto}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersPresto> {
        java.lang.String catalog;
        java.lang.String host;
        java.lang.Number port;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersPresto#getCatalog}
         * @param catalog Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#catalog QuicksightDataSource#catalog}. This parameter is required.
         * @return {@code this}
         */
        public Builder catalog(java.lang.String catalog) {
            this.catalog = catalog;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersPresto#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#host QuicksightDataSource#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersPresto#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#port QuicksightDataSource#port}. This parameter is required.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersPresto}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersPresto build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersPresto}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersPresto {
        private final java.lang.String catalog;
        private final java.lang.String host;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.catalog = software.amazon.jsii.Kernel.get(this, "catalog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.catalog = java.util.Objects.requireNonNull(builder.catalog, "catalog is required");
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.port = java.util.Objects.requireNonNull(builder.port, "port is required");
        }

        @Override
        public final java.lang.String getCatalog() {
            return this.catalog;
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

            data.set("catalog", om.valueToTree(this.getCatalog()));
            data.set("host", om.valueToTree(this.getHost()));
            data.set("port", om.valueToTree(this.getPort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersPresto"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersPresto.Jsii$Proxy that = (QuicksightDataSourceParametersPresto.Jsii$Proxy) o;

            if (!catalog.equals(that.catalog)) return false;
            if (!host.equals(that.host)) return false;
            return this.port.equals(that.port);
        }

        @Override
        public final int hashCode() {
            int result = this.catalog.hashCode();
            result = 31 * result + (this.host.hashCode());
            result = 31 * result + (this.port.hashCode());
            return result;
        }
    }
}
