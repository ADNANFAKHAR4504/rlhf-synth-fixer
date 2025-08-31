package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceHttpConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceHttpConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceHttpConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#endpoint AppsyncDatasource#endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpoint();

    /**
     * authorization_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#authorization_config AppsyncDatasource#authorization_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig getAuthorizationConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceHttpConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceHttpConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceHttpConfig> {
        java.lang.String endpoint;
        imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig authorizationConfig;

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfig#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#endpoint AppsyncDatasource#endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfig#getAuthorizationConfig}
         * @param authorizationConfig authorization_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#authorization_config AppsyncDatasource#authorization_config}
         * @return {@code this}
         */
        public Builder authorizationConfig(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig authorizationConfig) {
            this.authorizationConfig = authorizationConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceHttpConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceHttpConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceHttpConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceHttpConfig {
        private final java.lang.String endpoint;
        private final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig authorizationConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizationConfig = software.amazon.jsii.Kernel.get(this, "authorizationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpoint = java.util.Objects.requireNonNull(builder.endpoint, "endpoint is required");
            this.authorizationConfig = builder.authorizationConfig;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig getAuthorizationConfig() {
            return this.authorizationConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpoint", om.valueToTree(this.getEndpoint()));
            if (this.getAuthorizationConfig() != null) {
                data.set("authorizationConfig", om.valueToTree(this.getAuthorizationConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceHttpConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceHttpConfig.Jsii$Proxy that = (AppsyncDatasourceHttpConfig.Jsii$Proxy) o;

            if (!endpoint.equals(that.endpoint)) return false;
            return this.authorizationConfig != null ? this.authorizationConfig.equals(that.authorizationConfig) : that.authorizationConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpoint.hashCode();
            result = 31 * result + (this.authorizationConfig != null ? this.authorizationConfig.hashCode() : 0);
            return result;
        }
    }
}
