package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.531Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleActionAuthenticateOidc")
@software.amazon.jsii.Jsii.Proxy(LbListenerRuleActionAuthenticateOidc.Jsii$Proxy.class)
public interface LbListenerRuleActionAuthenticateOidc extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authorization_endpoint LbListenerRule#authorization_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#client_id LbListenerRule#client_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#client_secret LbListenerRule#client_secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#issuer LbListenerRule#issuer}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuer();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#token_endpoint LbListenerRule#token_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTokenEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#user_info_endpoint LbListenerRule#user_info_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserInfoEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authentication_request_extra_params LbListenerRule#authentication_request_extra_params}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAuthenticationRequestExtraParams() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#on_unauthenticated_request LbListenerRule#on_unauthenticated_request}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnUnauthenticatedRequest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#scope LbListenerRule#scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#session_cookie_name LbListenerRule#session_cookie_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSessionCookieName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#session_timeout LbListenerRule#session_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerRuleActionAuthenticateOidc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerRuleActionAuthenticateOidc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerRuleActionAuthenticateOidc> {
        java.lang.String authorizationEndpoint;
        java.lang.String clientId;
        java.lang.String clientSecret;
        java.lang.String issuer;
        java.lang.String tokenEndpoint;
        java.lang.String userInfoEndpoint;
        java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams;
        java.lang.String onUnauthenticatedRequest;
        java.lang.String scope;
        java.lang.String sessionCookieName;
        java.lang.Number sessionTimeout;

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getAuthorizationEndpoint}
         * @param authorizationEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authorization_endpoint LbListenerRule#authorization_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorizationEndpoint(java.lang.String authorizationEndpoint) {
            this.authorizationEndpoint = authorizationEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#client_id LbListenerRule#client_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getClientSecret}
         * @param clientSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#client_secret LbListenerRule#client_secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientSecret(java.lang.String clientSecret) {
            this.clientSecret = clientSecret;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#issuer LbListenerRule#issuer}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getTokenEndpoint}
         * @param tokenEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#token_endpoint LbListenerRule#token_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder tokenEndpoint(java.lang.String tokenEndpoint) {
            this.tokenEndpoint = tokenEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getUserInfoEndpoint}
         * @param userInfoEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#user_info_endpoint LbListenerRule#user_info_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder userInfoEndpoint(java.lang.String userInfoEndpoint) {
            this.userInfoEndpoint = userInfoEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getAuthenticationRequestExtraParams}
         * @param authenticationRequestExtraParams Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authentication_request_extra_params LbListenerRule#authentication_request_extra_params}.
         * @return {@code this}
         */
        public Builder authenticationRequestExtraParams(java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams) {
            this.authenticationRequestExtraParams = authenticationRequestExtraParams;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getOnUnauthenticatedRequest}
         * @param onUnauthenticatedRequest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#on_unauthenticated_request LbListenerRule#on_unauthenticated_request}.
         * @return {@code this}
         */
        public Builder onUnauthenticatedRequest(java.lang.String onUnauthenticatedRequest) {
            this.onUnauthenticatedRequest = onUnauthenticatedRequest;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#scope LbListenerRule#scope}.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getSessionCookieName}
         * @param sessionCookieName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#session_cookie_name LbListenerRule#session_cookie_name}.
         * @return {@code this}
         */
        public Builder sessionCookieName(java.lang.String sessionCookieName) {
            this.sessionCookieName = sessionCookieName;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionAuthenticateOidc#getSessionTimeout}
         * @param sessionTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#session_timeout LbListenerRule#session_timeout}.
         * @return {@code this}
         */
        public Builder sessionTimeout(java.lang.Number sessionTimeout) {
            this.sessionTimeout = sessionTimeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerRuleActionAuthenticateOidc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerRuleActionAuthenticateOidc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerRuleActionAuthenticateOidc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerRuleActionAuthenticateOidc {
        private final java.lang.String authorizationEndpoint;
        private final java.lang.String clientId;
        private final java.lang.String clientSecret;
        private final java.lang.String issuer;
        private final java.lang.String tokenEndpoint;
        private final java.lang.String userInfoEndpoint;
        private final java.util.Map<java.lang.String, java.lang.String> authenticationRequestExtraParams;
        private final java.lang.String onUnauthenticatedRequest;
        private final java.lang.String scope;
        private final java.lang.String sessionCookieName;
        private final java.lang.Number sessionTimeout;

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
            this.tokenEndpoint = software.amazon.jsii.Kernel.get(this, "tokenEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userInfoEndpoint = software.amazon.jsii.Kernel.get(this, "userInfoEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationRequestExtraParams = software.amazon.jsii.Kernel.get(this, "authenticationRequestExtraParams", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.onUnauthenticatedRequest = software.amazon.jsii.Kernel.get(this, "onUnauthenticatedRequest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionCookieName = software.amazon.jsii.Kernel.get(this, "sessionCookieName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionTimeout = software.amazon.jsii.Kernel.get(this, "sessionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.tokenEndpoint = java.util.Objects.requireNonNull(builder.tokenEndpoint, "tokenEndpoint is required");
            this.userInfoEndpoint = java.util.Objects.requireNonNull(builder.userInfoEndpoint, "userInfoEndpoint is required");
            this.authenticationRequestExtraParams = builder.authenticationRequestExtraParams;
            this.onUnauthenticatedRequest = builder.onUnauthenticatedRequest;
            this.scope = builder.scope;
            this.sessionCookieName = builder.sessionCookieName;
            this.sessionTimeout = builder.sessionTimeout;
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
        public final java.lang.String getOnUnauthenticatedRequest() {
            return this.onUnauthenticatedRequest;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
        }

        @Override
        public final java.lang.String getSessionCookieName() {
            return this.sessionCookieName;
        }

        @Override
        public final java.lang.Number getSessionTimeout() {
            return this.sessionTimeout;
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
            data.set("tokenEndpoint", om.valueToTree(this.getTokenEndpoint()));
            data.set("userInfoEndpoint", om.valueToTree(this.getUserInfoEndpoint()));
            if (this.getAuthenticationRequestExtraParams() != null) {
                data.set("authenticationRequestExtraParams", om.valueToTree(this.getAuthenticationRequestExtraParams()));
            }
            if (this.getOnUnauthenticatedRequest() != null) {
                data.set("onUnauthenticatedRequest", om.valueToTree(this.getOnUnauthenticatedRequest()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }
            if (this.getSessionCookieName() != null) {
                data.set("sessionCookieName", om.valueToTree(this.getSessionCookieName()));
            }
            if (this.getSessionTimeout() != null) {
                data.set("sessionTimeout", om.valueToTree(this.getSessionTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListenerRule.LbListenerRuleActionAuthenticateOidc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerRuleActionAuthenticateOidc.Jsii$Proxy that = (LbListenerRuleActionAuthenticateOidc.Jsii$Proxy) o;

            if (!authorizationEndpoint.equals(that.authorizationEndpoint)) return false;
            if (!clientId.equals(that.clientId)) return false;
            if (!clientSecret.equals(that.clientSecret)) return false;
            if (!issuer.equals(that.issuer)) return false;
            if (!tokenEndpoint.equals(that.tokenEndpoint)) return false;
            if (!userInfoEndpoint.equals(that.userInfoEndpoint)) return false;
            if (this.authenticationRequestExtraParams != null ? !this.authenticationRequestExtraParams.equals(that.authenticationRequestExtraParams) : that.authenticationRequestExtraParams != null) return false;
            if (this.onUnauthenticatedRequest != null ? !this.onUnauthenticatedRequest.equals(that.onUnauthenticatedRequest) : that.onUnauthenticatedRequest != null) return false;
            if (this.scope != null ? !this.scope.equals(that.scope) : that.scope != null) return false;
            if (this.sessionCookieName != null ? !this.sessionCookieName.equals(that.sessionCookieName) : that.sessionCookieName != null) return false;
            return this.sessionTimeout != null ? this.sessionTimeout.equals(that.sessionTimeout) : that.sessionTimeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authorizationEndpoint.hashCode();
            result = 31 * result + (this.clientId.hashCode());
            result = 31 * result + (this.clientSecret.hashCode());
            result = 31 * result + (this.issuer.hashCode());
            result = 31 * result + (this.tokenEndpoint.hashCode());
            result = 31 * result + (this.userInfoEndpoint.hashCode());
            result = 31 * result + (this.authenticationRequestExtraParams != null ? this.authenticationRequestExtraParams.hashCode() : 0);
            result = 31 * result + (this.onUnauthenticatedRequest != null ? this.onUnauthenticatedRequest.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            result = 31 * result + (this.sessionCookieName != null ? this.sessionCookieName.hashCode() : 0);
            result = 31 * result + (this.sessionTimeout != null ? this.sessionTimeout.hashCode() : 0);
            return result;
        }
    }
}
