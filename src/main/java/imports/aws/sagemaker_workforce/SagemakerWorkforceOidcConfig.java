package imports.aws.sagemaker_workforce;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.353Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkforce.SagemakerWorkforceOidcConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkforceOidcConfig.Jsii$Proxy.class)
public interface SagemakerWorkforceOidcConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#authorization_endpoint SagemakerWorkforce#authorization_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_id SagemakerWorkforce#client_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_secret SagemakerWorkforce#client_secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#issuer SagemakerWorkforce#issuer}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuer();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#jwks_uri SagemakerWorkforce#jwks_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJwksUri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#logout_endpoint SagemakerWorkforce#logout_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogoutEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#token_endpoint SagemakerWorkforce#token_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTokenEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#user_info_endpoint SagemakerWorkforce#user_info_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserInfoEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#authentication_request_extra_params SagemakerWorkforce#authentication_request_extra_params}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParams() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#scope SagemakerWorkforce#scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScope() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerWorkforceOidcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkforceOidcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkforceOidcConfig> {
        java.lang.String authorizationEndpoint;
        java.lang.String clientId;
        java.lang.String clientSecret;
        java.lang.String issuer;
        java.lang.String jwksUri;
        java.lang.String logoutEndpoint;
        java.lang.String tokenEndpoint;
        java.lang.String userInfoEndpoint;
        java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams;
        java.lang.String scope;

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getAuthorizationEndpoint}
         * @param authorizationEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#authorization_endpoint SagemakerWorkforce#authorization_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorizationEndpoint(java.lang.String authorizationEndpoint) {
            this.authorizationEndpoint = authorizationEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_id SagemakerWorkforce#client_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getClientSecret}
         * @param clientSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_secret SagemakerWorkforce#client_secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientSecret(java.lang.String clientSecret) {
            this.clientSecret = clientSecret;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#issuer SagemakerWorkforce#issuer}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getJwksUri}
         * @param jwksUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#jwks_uri SagemakerWorkforce#jwks_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder jwksUri(java.lang.String jwksUri) {
            this.jwksUri = jwksUri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getLogoutEndpoint}
         * @param logoutEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#logout_endpoint SagemakerWorkforce#logout_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder logoutEndpoint(java.lang.String logoutEndpoint) {
            this.logoutEndpoint = logoutEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getTokenEndpoint}
         * @param tokenEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#token_endpoint SagemakerWorkforce#token_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder tokenEndpoint(java.lang.String tokenEndpoint) {
            this.tokenEndpoint = tokenEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getUserInfoEndpoint}
         * @param userInfoEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#user_info_endpoint SagemakerWorkforce#user_info_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder userInfoEndpoint(java.lang.String userInfoEndpoint) {
            this.userInfoEndpoint = userInfoEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getAuthenticationRequestExtraParams}
         * @param authenticationRequestExtraParams Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#authentication_request_extra_params SagemakerWorkforce#authentication_request_extra_params}.
         * @return {@code this}
         */
        public Builder authenticationRequestExtraParams(java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams) {
            this.authenticationRequestExtraParams = authenticationRequestExtraParams;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceOidcConfig#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#scope SagemakerWorkforce#scope}.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkforceOidcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkforceOidcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkforceOidcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkforceOidcConfig {
        private final java.lang.String authorizationEndpoint;
        private final java.lang.String clientId;
        private final java.lang.String clientSecret;
        private final java.lang.String issuer;
        private final java.lang.String jwksUri;
        private final java.lang.String logoutEndpoint;
        private final java.lang.String tokenEndpoint;
        private final java.lang.String userInfoEndpoint;
        private final java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams;
        private final java.lang.String scope;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authorizationEndpoint = software.amazon.jsii.Kernel.get(this, "authorizationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientSecret = software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuer = software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jwksUri = software.amazon.jsii.Kernel.get(this, "jwksUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logoutEndpoint = software.amazon.jsii.Kernel.get(this, "logoutEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenEndpoint = software.amazon.jsii.Kernel.get(this, "tokenEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userInfoEndpoint = software.amazon.jsii.Kernel.get(this, "userInfoEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationRequestExtraParams = software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParams", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authorizationEndpoint = java.util.Objects.requireNonNull(builder.authorizationEndpoint, "authorizationEndpoint is required");
            this.clientId = java.util.Objects.requireNonNull(builder.clientId, "clientId is required");
            this.clientSecret = java.util.Objects.requireNonNull(builder.clientSecret, "clientSecret is required");
            this.issuer = java.util.Objects.requireNonNull(builder.issuer, "issuer is required");
            this.jwksUri = java.util.Objects.requireNonNull(builder.jwksUri, "jwksUri is required");
            this.logoutEndpoint = java.util.Objects.requireNonNull(builder.logoutEndpoint, "logoutEndpoint is required");
            this.tokenEndpoint = java.util.Objects.requireNonNull(builder.tokenEndpoint, "tokenEndpoint is required");
            this.userInfoEndpoint = java.util.Objects.requireNonNull(builder.userInfoEndpoint, "userInfoEndpoint is required");
            this.authenticationRequestExtraParams = builder.authenticationRequestExtraParams;
            this.scope = builder.scope;
        }

        @Override
        public final java.lang.String getAuthorizationEndpoint() {
            return this.authorizationEndpoint;
        }

        @Override
        public final java.lang.String getClientId() {
            return this.clientId;
        }

        @Override
        public final java.lang.String getClientSecret() {
            return this.clientSecret;
        }

        @Override
        public final java.lang.String getIssuer() {
            return this.issuer;
        }

        @Override
        public final java.lang.String getJwksUri() {
            return this.jwksUri;
        }

        @Override
        public final java.lang.String getLogoutEndpoint() {
            return this.logoutEndpoint;
        }

        @Override
        public final java.lang.String getTokenEndpoint() {
            return this.tokenEndpoint;
        }

        @Override
        public final java.lang.String getUserInfoEndpoint() {
            return this.userInfoEndpoint;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParams() {
            return this.authenticationRequestExtraParams;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authorizationEndpoint", om.valueToTree(this.getAuthorizationEndpoint()));
            data.set("clientId", om.valueToTree(this.getClientId()));
            data.set("clientSecret", om.valueToTree(this.getClientSecret()));
            data.set("issuer", om.valueToTree(this.getIssuer()));
            data.set("jwksUri", om.valueToTree(this.getJwksUri()));
            data.set("logoutEndpoint", om.valueToTree(this.getLogoutEndpoint()));
            data.set("tokenEndpoint", om.valueToTree(this.getTokenEndpoint()));
            data.set("userInfoEndpoint", om.valueToTree(this.getUserInfoEndpoint()));
            if (this.getAuthenticationRequestExtraParams() != null) {
                data.set("authenticationRequestExtraParams", om.valueToTree(this.getAuthenticationRequestExtraParams()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkforce.SagemakerWorkforceOidcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkforceOidcConfig.Jsii$Proxy that = (SagemakerWorkforceOidcConfig.Jsii$Proxy) o;

            if (!authorizationEndpoint.equals(that.authorizationEndpoint)) return false;
            if (!clientId.equals(that.clientId)) return false;
            if (!clientSecret.equals(that.clientSecret)) return false;
            if (!issuer.equals(that.issuer)) return false;
            if (!jwksUri.equals(that.jwksUri)) return false;
            if (!logoutEndpoint.equals(that.logoutEndpoint)) return false;
            if (!tokenEndpoint.equals(that.tokenEndpoint)) return false;
            if (!userInfoEndpoint.equals(that.userInfoEndpoint)) return false;
            if (this.authenticationRequestExtraParams != null ? !this.authenticationRequestExtraParams.equals(that.authenticationRequestExtraParams) : that.authenticationRequestExtraParams != null) return false;
            return this.scope != null ? this.scope.equals(that.scope) : that.scope == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authorizationEndpoint.hashCode();
            result = 31 * result + (this.clientId.hashCode());
            result = 31 * result + (this.clientSecret.hashCode());
            result = 31 * result + (this.issuer.hashCode());
            result = 31 * result + (this.jwksUri.hashCode());
            result = 31 * result + (this.logoutEndpoint.hashCode());
            result = 31 * result + (this.tokenEndpoint.hashCode());
            result = 31 * result + (this.userInfoEndpoint.hashCode());
            result = 31 * result + (this.authenticationRequestExtraParams != null ? this.authenticationRequestExtraParams.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            return result;
        }
    }
}
