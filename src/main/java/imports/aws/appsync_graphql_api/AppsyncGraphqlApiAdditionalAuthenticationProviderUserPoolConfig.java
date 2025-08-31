package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig.Jsii$Proxy.class)
public interface AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#user_pool_id AppsyncGraphqlApi#user_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#app_id_client_regex AppsyncGraphqlApi#app_id_client_regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAppIdClientRegex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#aws_region AppsyncGraphqlApi#aws_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig> {
        java.lang.String userPoolId;
        java.lang.String appIdClientRegex;
        java.lang.String awsRegion;

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig#getUserPoolId}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#user_pool_id AppsyncGraphqlApi#user_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolId(java.lang.String userPoolId) {
            this.userPoolId = userPoolId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig#getAppIdClientRegex}
         * @param appIdClientRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#app_id_client_regex AppsyncGraphqlApi#app_id_client_regex}.
         * @return {@code this}
         */
        public Builder appIdClientRegex(java.lang.String appIdClientRegex) {
            this.appIdClientRegex = appIdClientRegex;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig#getAwsRegion}
         * @param awsRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#aws_region AppsyncGraphqlApi#aws_region}.
         * @return {@code this}
         */
        public Builder awsRegion(java.lang.String awsRegion) {
            this.awsRegion = awsRegion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig {
        private final java.lang.String userPoolId;
        private final java.lang.String appIdClientRegex;
        private final java.lang.String awsRegion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.userPoolId = software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.appIdClientRegex = software.amazon.jsii.Kernel.get(this, "appIdClientRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsRegion = software.amazon.jsii.Kernel.get(this, "awsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.userPoolId = java.util.Objects.requireNonNull(builder.userPoolId, "userPoolId is required");
            this.appIdClientRegex = builder.appIdClientRegex;
            this.awsRegion = builder.awsRegion;
        }

        @Override
        public final java.lang.String getUserPoolId() {
            return this.userPoolId;
        }

        @Override
        public final java.lang.String getAppIdClientRegex() {
            return this.appIdClientRegex;
        }

        @Override
        public final java.lang.String getAwsRegion() {
            return this.awsRegion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("userPoolId", om.valueToTree(this.getUserPoolId()));
            if (this.getAppIdClientRegex() != null) {
                data.set("appIdClientRegex", om.valueToTree(this.getAppIdClientRegex()));
            }
            if (this.getAwsRegion() != null) {
                data.set("awsRegion", om.valueToTree(this.getAwsRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig.Jsii$Proxy that = (AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig.Jsii$Proxy) o;

            if (!userPoolId.equals(that.userPoolId)) return false;
            if (this.appIdClientRegex != null ? !this.appIdClientRegex.equals(that.appIdClientRegex) : that.appIdClientRegex != null) return false;
            return this.awsRegion != null ? this.awsRegion.equals(that.awsRegion) : that.awsRegion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.userPoolId.hashCode();
            result = 31 * result + (this.appIdClientRegex != null ? this.appIdClientRegex.hashCode() : 0);
            result = 31 * result + (this.awsRegion != null ? this.awsRegion.hashCode() : 0);
            return result;
        }
    }
}
