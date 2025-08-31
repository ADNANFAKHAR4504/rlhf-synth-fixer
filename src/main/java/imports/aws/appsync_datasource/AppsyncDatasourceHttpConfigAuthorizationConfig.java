package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceHttpConfigAuthorizationConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceHttpConfigAuthorizationConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceHttpConfigAuthorizationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#authorization_type AppsyncDatasource#authorization_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationType() {
        return null;
    }

    /**
     * aws_iam_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#aws_iam_config AppsyncDatasource#aws_iam_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig getAwsIamConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceHttpConfigAuthorizationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceHttpConfigAuthorizationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceHttpConfigAuthorizationConfig> {
        java.lang.String authorizationType;
        imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig awsIamConfig;

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfigAuthorizationConfig#getAuthorizationType}
         * @param authorizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#authorization_type AppsyncDatasource#authorization_type}.
         * @return {@code this}
         */
        public Builder authorizationType(java.lang.String authorizationType) {
            this.authorizationType = authorizationType;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceHttpConfigAuthorizationConfig#getAwsIamConfig}
         * @param awsIamConfig aws_iam_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#aws_iam_config AppsyncDatasource#aws_iam_config}
         * @return {@code this}
         */
        public Builder awsIamConfig(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig awsIamConfig) {
            this.awsIamConfig = awsIamConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceHttpConfigAuthorizationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceHttpConfigAuthorizationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceHttpConfigAuthorizationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceHttpConfigAuthorizationConfig {
        private final java.lang.String authorizationType;
        private final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig awsIamConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authorizationType = software.amazon.jsii.Kernel.get(this, "authorizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsIamConfig = software.amazon.jsii.Kernel.get(this, "awsIamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authorizationType = builder.authorizationType;
            this.awsIamConfig = builder.awsIamConfig;
        }

        @Override
        public final java.lang.String getAuthorizationType() {
            return this.authorizationType;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigAwsIamConfig getAwsIamConfig() {
            return this.awsIamConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthorizationType() != null) {
                data.set("authorizationType", om.valueToTree(this.getAuthorizationType()));
            }
            if (this.getAwsIamConfig() != null) {
                data.set("awsIamConfig", om.valueToTree(this.getAwsIamConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceHttpConfigAuthorizationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceHttpConfigAuthorizationConfig.Jsii$Proxy that = (AppsyncDatasourceHttpConfigAuthorizationConfig.Jsii$Proxy) o;

            if (this.authorizationType != null ? !this.authorizationType.equals(that.authorizationType) : that.authorizationType != null) return false;
            return this.awsIamConfig != null ? this.awsIamConfig.equals(that.awsIamConfig) : that.awsIamConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authorizationType != null ? this.authorizationType.hashCode() : 0;
            result = 31 * result + (this.awsIamConfig != null ? this.awsIamConfig.hashCode() : 0);
            return result;
        }
    }
}
