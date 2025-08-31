package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceOpensearchserviceConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceOpensearchserviceConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceOpensearchserviceConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#endpoint AppsyncDatasource#endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceOpensearchserviceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceOpensearchserviceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceOpensearchserviceConfig> {
        java.lang.String endpoint;
        java.lang.String region;

        /**
         * Sets the value of {@link AppsyncDatasourceOpensearchserviceConfig#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#endpoint AppsyncDatasource#endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceOpensearchserviceConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceOpensearchserviceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceOpensearchserviceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceOpensearchserviceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceOpensearchserviceConfig {
        private final java.lang.String endpoint;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpoint = java.util.Objects.requireNonNull(builder.endpoint, "endpoint is required");
            this.region = builder.region;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpoint", om.valueToTree(this.getEndpoint()));
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceOpensearchserviceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceOpensearchserviceConfig.Jsii$Proxy that = (AppsyncDatasourceOpensearchserviceConfig.Jsii$Proxy) o;

            if (!endpoint.equals(that.endpoint)) return false;
            return this.region != null ? this.region.equals(that.region) : that.region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpoint.hashCode();
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            return result;
        }
    }
}
