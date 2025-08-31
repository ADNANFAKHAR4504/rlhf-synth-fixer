package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProvider")
@software.amazon.jsii.Jsii.Proxy(AppsyncGraphqlApiAdditionalAuthenticationProvider.Jsii$Proxy.class)
public interface AppsyncGraphqlApiAdditionalAuthenticationProvider extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authentication_type AppsyncGraphqlApi#authentication_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationType();

    /**
     * lambda_authorizer_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#lambda_authorizer_config AppsyncGraphqlApi#lambda_authorizer_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig getLambdaAuthorizerConfig() {
        return null;
    }

    /**
     * openid_connect_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#openid_connect_config AppsyncGraphqlApi#openid_connect_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig getOpenidConnectConfig() {
        return null;
    }

    /**
     * user_pool_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#user_pool_config AppsyncGraphqlApi#user_pool_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig getUserPoolConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncGraphqlApiAdditionalAuthenticationProvider}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncGraphqlApiAdditionalAuthenticationProvider> {
        java.lang.String authenticationType;
        imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig lambdaAuthorizerConfig;
        imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig openidConnectConfig;
        imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig userPoolConfig;

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authentication_type AppsyncGraphqlApi#authentication_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider#getLambdaAuthorizerConfig}
         * @param lambdaAuthorizerConfig lambda_authorizer_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#lambda_authorizer_config AppsyncGraphqlApi#lambda_authorizer_config}
         * @return {@code this}
         */
        public Builder lambdaAuthorizerConfig(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig lambdaAuthorizerConfig) {
            this.lambdaAuthorizerConfig = lambdaAuthorizerConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider#getOpenidConnectConfig}
         * @param openidConnectConfig openid_connect_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#openid_connect_config AppsyncGraphqlApi#openid_connect_config}
         * @return {@code this}
         */
        public Builder openidConnectConfig(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig openidConnectConfig) {
            this.openidConnectConfig = openidConnectConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider#getUserPoolConfig}
         * @param userPoolConfig user_pool_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#user_pool_config AppsyncGraphqlApi#user_pool_config}
         * @return {@code this}
         */
        public Builder userPoolConfig(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig userPoolConfig) {
            this.userPoolConfig = userPoolConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncGraphqlApiAdditionalAuthenticationProvider}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncGraphqlApiAdditionalAuthenticationProvider build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncGraphqlApiAdditionalAuthenticationProvider}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncGraphqlApiAdditionalAuthenticationProvider {
        private final java.lang.String authenticationType;
        private final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig lambdaAuthorizerConfig;
        private final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig openidConnectConfig;
        private final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig userPoolConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaAuthorizerConfig = software.amazon.jsii.Kernel.get(this, "lambdaAuthorizerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig.class));
            this.openidConnectConfig = software.amazon.jsii.Kernel.get(this, "openidConnectConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig.class));
            this.userPoolConfig = software.amazon.jsii.Kernel.get(this, "userPoolConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationType = java.util.Objects.requireNonNull(builder.authenticationType, "authenticationType is required");
            this.lambdaAuthorizerConfig = builder.lambdaAuthorizerConfig;
            this.openidConnectConfig = builder.openidConnectConfig;
            this.userPoolConfig = builder.userPoolConfig;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        public final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig getLambdaAuthorizerConfig() {
            return this.lambdaAuthorizerConfig;
        }

        @Override
        public final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderOpenidConnectConfig getOpenidConnectConfig() {
            return this.openidConnectConfig;
        }

        @Override
        public final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig getUserPoolConfig() {
            return this.userPoolConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            if (this.getLambdaAuthorizerConfig() != null) {
                data.set("lambdaAuthorizerConfig", om.valueToTree(this.getLambdaAuthorizerConfig()));
            }
            if (this.getOpenidConnectConfig() != null) {
                data.set("openidConnectConfig", om.valueToTree(this.getOpenidConnectConfig()));
            }
            if (this.getUserPoolConfig() != null) {
                data.set("userPoolConfig", om.valueToTree(this.getUserPoolConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProvider"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncGraphqlApiAdditionalAuthenticationProvider.Jsii$Proxy that = (AppsyncGraphqlApiAdditionalAuthenticationProvider.Jsii$Proxy) o;

            if (!authenticationType.equals(that.authenticationType)) return false;
            if (this.lambdaAuthorizerConfig != null ? !this.lambdaAuthorizerConfig.equals(that.lambdaAuthorizerConfig) : that.lambdaAuthorizerConfig != null) return false;
            if (this.openidConnectConfig != null ? !this.openidConnectConfig.equals(that.openidConnectConfig) : that.openidConnectConfig != null) return false;
            return this.userPoolConfig != null ? this.userPoolConfig.equals(that.userPoolConfig) : that.userPoolConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationType.hashCode();
            result = 31 * result + (this.lambdaAuthorizerConfig != null ? this.lambdaAuthorizerConfig.hashCode() : 0);
            result = 31 * result + (this.openidConnectConfig != null ? this.openidConnectConfig.hashCode() : 0);
            result = 31 * result + (this.userPoolConfig != null ? this.userPoolConfig.hashCode() : 0);
            return result;
        }
    }
}
