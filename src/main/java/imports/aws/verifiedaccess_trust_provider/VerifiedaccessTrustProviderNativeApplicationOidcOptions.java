package imports.aws.verifiedaccess_trust_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.579Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderNativeApplicationOidcOptions")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessTrustProviderNativeApplicationOidcOptions.Jsii$Proxy.class)
public interface VerifiedaccessTrustProviderNativeApplicationOidcOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#client_secret VerifiedaccessTrustProvider#client_secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#authorization_endpoint VerifiedaccessTrustProvider#authorization_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#client_id VerifiedaccessTrustProvider#client_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#issuer VerifiedaccessTrustProvider#issuer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIssuer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#public_signing_key_endpoint VerifiedaccessTrustProvider#public_signing_key_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPublicSigningKeyEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#scope VerifiedaccessTrustProvider#scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#token_endpoint VerifiedaccessTrustProvider#token_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTokenEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_info_endpoint VerifiedaccessTrustProvider#user_info_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserInfoEndpoint() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessTrustProviderNativeApplicationOidcOptions> {
        java.lang.String clientSecret;
        java.lang.String authorizationEndpoint;
        java.lang.String clientId;
        java.lang.String issuer;
        java.lang.String publicSigningKeyEndpoint;
        java.lang.String scope;
        java.lang.String tokenEndpoint;
        java.lang.String userInfoEndpoint;

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getClientSecret}
         * @param clientSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#client_secret VerifiedaccessTrustProvider#client_secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientSecret(java.lang.String clientSecret) {
            this.clientSecret = clientSecret;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getAuthorizationEndpoint}
         * @param authorizationEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#authorization_endpoint VerifiedaccessTrustProvider#authorization_endpoint}.
         * @return {@code this}
         */
        public Builder authorizationEndpoint(java.lang.String authorizationEndpoint) {
            this.authorizationEndpoint = authorizationEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#client_id VerifiedaccessTrustProvider#client_id}.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#issuer VerifiedaccessTrustProvider#issuer}.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getPublicSigningKeyEndpoint}
         * @param publicSigningKeyEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#public_signing_key_endpoint VerifiedaccessTrustProvider#public_signing_key_endpoint}.
         * @return {@code this}
         */
        public Builder publicSigningKeyEndpoint(java.lang.String publicSigningKeyEndpoint) {
            this.publicSigningKeyEndpoint = publicSigningKeyEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#scope VerifiedaccessTrustProvider#scope}.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getTokenEndpoint}
         * @param tokenEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#token_endpoint VerifiedaccessTrustProvider#token_endpoint}.
         * @return {@code this}
         */
        public Builder tokenEndpoint(java.lang.String tokenEndpoint) {
            this.tokenEndpoint = tokenEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions#getUserInfoEndpoint}
         * @param userInfoEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_info_endpoint VerifiedaccessTrustProvider#user_info_endpoint}.
         * @return {@code this}
         */
        public Builder userInfoEndpoint(java.lang.String userInfoEndpoint) {
            this.userInfoEndpoint = userInfoEndpoint;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessTrustProviderNativeApplicationOidcOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessTrustProviderNativeApplicationOidcOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessTrustProviderNativeApplicationOidcOptions {
        private final java.lang.String clientSecret;
        private final java.lang.String authorizationEndpoint;
        private final java.lang.String clientId;
        private final java.lang.String issuer;
        private final java.lang.String publicSigningKeyEndpoint;
        private final java.lang.String scope;
        private final java.lang.String tokenEndpoint;
        private final java.lang.String userInfoEndpoint;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientSecret = software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizationEndpoint = software.amazon.jsii.Kernel.get(this, "authorizationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuer = software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicSigningKeyEndpoint = software.amazon.jsii.Kernel.get(this, "publicSigningKeyEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenEndpoint = software.amazon.jsii.Kernel.get(this, "tokenEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userInfoEndpoint = software.amazon.jsii.Kernel.get(this, "userInfoEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientSecret = java.util.Objects.requireNonNull(builder.clientSecret, "clientSecret is required");
            this.authorizationEndpoint = builder.authorizationEndpoint;
            this.clientId = builder.clientId;
            this.issuer = builder.issuer;
            this.publicSigningKeyEndpoint = builder.publicSigningKeyEndpoint;
            this.scope = builder.scope;
            this.tokenEndpoint = builder.tokenEndpoint;
            this.userInfoEndpoint = builder.userInfoEndpoint;
        }

        @Override
        public final java.lang.String getClientSecret() {
            return this.clientSecret;
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
        public final java.lang.String getIssuer() {
            return this.issuer;
        }

        @Override
        public final java.lang.String getPublicSigningKeyEndpoint() {
            return this.publicSigningKeyEndpoint;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientSecret", om.valueToTree(this.getClientSecret()));
            if (this.getAuthorizationEndpoint() != null) {
                data.set("authorizationEndpoint", om.valueToTree(this.getAuthorizationEndpoint()));
            }
            if (this.getClientId() != null) {
                data.set("clientId", om.valueToTree(this.getClientId()));
            }
            if (this.getIssuer() != null) {
                data.set("issuer", om.valueToTree(this.getIssuer()));
            }
            if (this.getPublicSigningKeyEndpoint() != null) {
                data.set("publicSigningKeyEndpoint", om.valueToTree(this.getPublicSigningKeyEndpoint()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }
            if (this.getTokenEndpoint() != null) {
                data.set("tokenEndpoint", om.valueToTree(this.getTokenEndpoint()));
            }
            if (this.getUserInfoEndpoint() != null) {
                data.set("userInfoEndpoint", om.valueToTree(this.getUserInfoEndpoint()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderNativeApplicationOidcOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessTrustProviderNativeApplicationOidcOptions.Jsii$Proxy that = (VerifiedaccessTrustProviderNativeApplicationOidcOptions.Jsii$Proxy) o;

            if (!clientSecret.equals(that.clientSecret)) return false;
            if (this.authorizationEndpoint != null ? !this.authorizationEndpoint.equals(that.authorizationEndpoint) : that.authorizationEndpoint != null) return false;
            if (this.clientId != null ? !this.clientId.equals(that.clientId) : that.clientId != null) return false;
            if (this.issuer != null ? !this.issuer.equals(that.issuer) : that.issuer != null) return false;
            if (this.publicSigningKeyEndpoint != null ? !this.publicSigningKeyEndpoint.equals(that.publicSigningKeyEndpoint) : that.publicSigningKeyEndpoint != null) return false;
            if (this.scope != null ? !this.scope.equals(that.scope) : that.scope != null) return false;
            if (this.tokenEndpoint != null ? !this.tokenEndpoint.equals(that.tokenEndpoint) : that.tokenEndpoint != null) return false;
            return this.userInfoEndpoint != null ? this.userInfoEndpoint.equals(that.userInfoEndpoint) : that.userInfoEndpoint == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientSecret.hashCode();
            result = 31 * result + (this.authorizationEndpoint != null ? this.authorizationEndpoint.hashCode() : 0);
            result = 31 * result + (this.clientId != null ? this.clientId.hashCode() : 0);
            result = 31 * result + (this.issuer != null ? this.issuer.hashCode() : 0);
            result = 31 * result + (this.publicSigningKeyEndpoint != null ? this.publicSigningKeyEndpoint.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            result = 31 * result + (this.tokenEndpoint != null ? this.tokenEndpoint.hashCode() : 0);
            result = 31 * result + (this.userInfoEndpoint != null ? this.userInfoEndpoint.hashCode() : 0);
            return result;
        }
    }
}
