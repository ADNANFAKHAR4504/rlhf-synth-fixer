package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiLambdaAuthorizerConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncGraphqlApiLambdaAuthorizerConfig.Jsii$Proxy.class)
public interface AppsyncGraphqlApiLambdaAuthorizerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authorizer_uri AppsyncGraphqlApi#authorizer_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorizerUri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authorizer_result_ttl_in_seconds AppsyncGraphqlApi#authorizer_result_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAuthorizerResultTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#identity_validation_expression AppsyncGraphqlApi#identity_validation_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentityValidationExpression() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncGraphqlApiLambdaAuthorizerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncGraphqlApiLambdaAuthorizerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncGraphqlApiLambdaAuthorizerConfig> {
        java.lang.String authorizerUri;
        java.lang.Number authorizerResultTtlInSeconds;
        java.lang.String identityValidationExpression;

        /**
         * Sets the value of {@link AppsyncGraphqlApiLambdaAuthorizerConfig#getAuthorizerUri}
         * @param authorizerUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authorizer_uri AppsyncGraphqlApi#authorizer_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorizerUri(java.lang.String authorizerUri) {
            this.authorizerUri = authorizerUri;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiLambdaAuthorizerConfig#getAuthorizerResultTtlInSeconds}
         * @param authorizerResultTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authorizer_result_ttl_in_seconds AppsyncGraphqlApi#authorizer_result_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder authorizerResultTtlInSeconds(java.lang.Number authorizerResultTtlInSeconds) {
            this.authorizerResultTtlInSeconds = authorizerResultTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiLambdaAuthorizerConfig#getIdentityValidationExpression}
         * @param identityValidationExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#identity_validation_expression AppsyncGraphqlApi#identity_validation_expression}.
         * @return {@code this}
         */
        public Builder identityValidationExpression(java.lang.String identityValidationExpression) {
            this.identityValidationExpression = identityValidationExpression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncGraphqlApiLambdaAuthorizerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncGraphqlApiLambdaAuthorizerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncGraphqlApiLambdaAuthorizerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncGraphqlApiLambdaAuthorizerConfig {
        private final java.lang.String authorizerUri;
        private final java.lang.Number authorizerResultTtlInSeconds;
        private final java.lang.String identityValidationExpression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authorizerUri = software.amazon.jsii.Kernel.get(this, "authorizerUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerResultTtlInSeconds = software.amazon.jsii.Kernel.get(this, "authorizerResultTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.identityValidationExpression = software.amazon.jsii.Kernel.get(this, "identityValidationExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authorizerUri = java.util.Objects.requireNonNull(builder.authorizerUri, "authorizerUri is required");
            this.authorizerResultTtlInSeconds = builder.authorizerResultTtlInSeconds;
            this.identityValidationExpression = builder.identityValidationExpression;
        }

        @Override
        public final java.lang.String getAuthorizerUri() {
            return this.authorizerUri;
        }

        @Override
        public final java.lang.Number getAuthorizerResultTtlInSeconds() {
            return this.authorizerResultTtlInSeconds;
        }

        @Override
        public final java.lang.String getIdentityValidationExpression() {
            return this.identityValidationExpression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authorizerUri", om.valueToTree(this.getAuthorizerUri()));
            if (this.getAuthorizerResultTtlInSeconds() != null) {
                data.set("authorizerResultTtlInSeconds", om.valueToTree(this.getAuthorizerResultTtlInSeconds()));
            }
            if (this.getIdentityValidationExpression() != null) {
                data.set("identityValidationExpression", om.valueToTree(this.getIdentityValidationExpression()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncGraphqlApi.AppsyncGraphqlApiLambdaAuthorizerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncGraphqlApiLambdaAuthorizerConfig.Jsii$Proxy that = (AppsyncGraphqlApiLambdaAuthorizerConfig.Jsii$Proxy) o;

            if (!authorizerUri.equals(that.authorizerUri)) return false;
            if (this.authorizerResultTtlInSeconds != null ? !this.authorizerResultTtlInSeconds.equals(that.authorizerResultTtlInSeconds) : that.authorizerResultTtlInSeconds != null) return false;
            return this.identityValidationExpression != null ? this.identityValidationExpression.equals(that.identityValidationExpression) : that.identityValidationExpression == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authorizerUri.hashCode();
            result = 31 * result + (this.authorizerResultTtlInSeconds != null ? this.authorizerResultTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.identityValidationExpression != null ? this.identityValidationExpression.hashCode() : 0);
            return result;
        }
    }
}
