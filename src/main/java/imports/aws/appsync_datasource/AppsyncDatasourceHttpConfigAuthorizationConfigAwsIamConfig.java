package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#signing_region AppsyncDatasource#signing_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSigningRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#signing_service_name AppsyncDatasource#signing_service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSigningServiceName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig> {
        java.lang.String signingRegion;
        java.lang.String signingServiceName;

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig#getSigningRegion}
         * @param signingRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#signing_region AppsyncDatasource#signing_region}.
         * @return {@code this}
         */
        public Builder signingRegion(java.lang.String signingRegion) {
            this.signingRegion = signingRegion;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig#getSigningServiceName}
         * @param signingServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#signing_service_name AppsyncDatasource#signing_service_name}.
         * @return {@code this}
         */
        public Builder signingServiceName(java.lang.String signingServiceName) {
            this.signingServiceName = signingServiceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig {
        private final java.lang.String signingRegion;
        private final java.lang.String signingServiceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.signingRegion = software.amazon.jsii.Kernel.get(this, "signingRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.signingServiceName = software.amazon.jsii.Kernel.get(this, "signingServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.signingRegion = builder.signingRegion;
            this.signingServiceName = builder.signingServiceName;
        }

        @Override
        public final java.lang.String getSigningRegion() {
            return this.signingRegion;
        }

        @Override
        public final java.lang.String getSigningServiceName() {
            return this.signingServiceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSigningRegion() != null) {
                data.set("signingRegion", om.valueToTree(this.getSigningRegion()));
            }
            if (this.getSigningServiceName() != null) {
                data.set("signingServiceName", om.valueToTree(this.getSigningServiceName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig.Jsii$Proxy that = (AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig.Jsii$Proxy) o;

            if (this.signingRegion != null ? !this.signingRegion.equals(that.signingRegion) : that.signingRegion != null) return false;
            return this.signingServiceName != null ? this.signingServiceName.equals(that.signingServiceName) : that.signingServiceName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.signingRegion != null ? this.signingRegion.hashCode() : 0;
            result = 31 * result + (this.signingServiceName != null ? this.signingServiceName.hashCode() : 0);
            return result;
        }
    }
}
