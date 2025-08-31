package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceRelationalDatabaseConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceRelationalDatabaseConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceRelationalDatabaseConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * http_endpoint_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#http_endpoint_config AppsyncDatasource#http_endpoint_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig getHttpEndpointConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#source_type AppsyncDatasource#source_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceRelationalDatabaseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceRelationalDatabaseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceRelationalDatabaseConfig> {
        imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig httpEndpointConfig;
        java.lang.String sourceType;

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfig#getHttpEndpointConfig}
         * @param httpEndpointConfig http_endpoint_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#http_endpoint_config AppsyncDatasource#http_endpoint_config}
         * @return {@code this}
         */
        public Builder httpEndpointConfig(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig httpEndpointConfig) {
            this.httpEndpointConfig = httpEndpointConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfig#getSourceType}
         * @param sourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#source_type AppsyncDatasource#source_type}.
         * @return {@code this}
         */
        public Builder sourceType(java.lang.String sourceType) {
            this.sourceType = sourceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceRelationalDatabaseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceRelationalDatabaseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceRelationalDatabaseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceRelationalDatabaseConfig {
        private final imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig httpEndpointConfig;
        private final java.lang.String sourceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpEndpointConfig = software.amazon.jsii.Kernel.get(this, "httpEndpointConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig.class));
            this.sourceType = software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpEndpointConfig = builder.httpEndpointConfig;
            this.sourceType = builder.sourceType;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig getHttpEndpointConfig() {
            return this.httpEndpointConfig;
        }

        @Override
        public final java.lang.String getSourceType() {
            return this.sourceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHttpEndpointConfig() != null) {
                data.set("httpEndpointConfig", om.valueToTree(this.getHttpEndpointConfig()));
            }
            if (this.getSourceType() != null) {
                data.set("sourceType", om.valueToTree(this.getSourceType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceRelationalDatabaseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceRelationalDatabaseConfig.Jsii$Proxy that = (AppsyncDatasourceRelationalDatabaseConfig.Jsii$Proxy) o;

            if (this.httpEndpointConfig != null ? !this.httpEndpointConfig.equals(that.httpEndpointConfig) : that.httpEndpointConfig != null) return false;
            return this.sourceType != null ? this.sourceType.equals(that.sourceType) : that.sourceType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpEndpointConfig != null ? this.httpEndpointConfig.hashCode() : 0;
            result = 31 * result + (this.sourceType != null ? this.sourceType.hashCode() : 0);
            return result;
        }
    }
}
