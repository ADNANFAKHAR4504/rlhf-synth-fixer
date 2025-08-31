package imports.aws.ssoadmin_trusted_token_issuer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration")
@software.amazon.jsii.Jsii.Proxy(SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration.Jsii$Proxy.class)
public interface SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#claim_attribute_path SsoadminTrustedTokenIssuer#claim_attribute_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClaimAttributePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#identity_store_attribute_path SsoadminTrustedTokenIssuer#identity_store_attribute_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreAttributePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#issuer_url SsoadminTrustedTokenIssuer#issuer_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuerUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#jwks_retrieval_option SsoadminTrustedTokenIssuer#jwks_retrieval_option}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJwksRetrievalOption();

    /**
     * @return a {@link Builder} of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration> {
        java.lang.String claimAttributePath;
        java.lang.String identityStoreAttributePath;
        java.lang.String issuerUrl;
        java.lang.String jwksRetrievalOption;

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration#getClaimAttributePath}
         * @param claimAttributePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#claim_attribute_path SsoadminTrustedTokenIssuer#claim_attribute_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder claimAttributePath(java.lang.String claimAttributePath) {
            this.claimAttributePath = claimAttributePath;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration#getIdentityStoreAttributePath}
         * @param identityStoreAttributePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#identity_store_attribute_path SsoadminTrustedTokenIssuer#identity_store_attribute_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityStoreAttributePath(java.lang.String identityStoreAttributePath) {
            this.identityStoreAttributePath = identityStoreAttributePath;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration#getIssuerUrl}
         * @param issuerUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#issuer_url SsoadminTrustedTokenIssuer#issuer_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuerUrl(java.lang.String issuerUrl) {
            this.issuerUrl = issuerUrl;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration#getJwksRetrievalOption}
         * @param jwksRetrievalOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#jwks_retrieval_option SsoadminTrustedTokenIssuer#jwks_retrieval_option}. This parameter is required.
         * @return {@code this}
         */
        public Builder jwksRetrievalOption(java.lang.String jwksRetrievalOption) {
            this.jwksRetrievalOption = jwksRetrievalOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration {
        private final java.lang.String claimAttributePath;
        private final java.lang.String identityStoreAttributePath;
        private final java.lang.String issuerUrl;
        private final java.lang.String jwksRetrievalOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.claimAttributePath = software.amazon.jsii.Kernel.get(this, "claimAttributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityStoreAttributePath = software.amazon.jsii.Kernel.get(this, "identityStoreAttributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuerUrl = software.amazon.jsii.Kernel.get(this, "issuerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jwksRetrievalOption = software.amazon.jsii.Kernel.get(this, "jwksRetrievalOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.claimAttributePath = java.util.Objects.requireNonNull(builder.claimAttributePath, "claimAttributePath is required");
            this.identityStoreAttributePath = java.util.Objects.requireNonNull(builder.identityStoreAttributePath, "identityStoreAttributePath is required");
            this.issuerUrl = java.util.Objects.requireNonNull(builder.issuerUrl, "issuerUrl is required");
            this.jwksRetrievalOption = java.util.Objects.requireNonNull(builder.jwksRetrievalOption, "jwksRetrievalOption is required");
        }

        @Override
        public final java.lang.String getClaimAttributePath() {
            return this.claimAttributePath;
        }

        @Override
        public final java.lang.String getIdentityStoreAttributePath() {
            return this.identityStoreAttributePath;
        }

        @Override
        public final java.lang.String getIssuerUrl() {
            return this.issuerUrl;
        }

        @Override
        public final java.lang.String getJwksRetrievalOption() {
            return this.jwksRetrievalOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("claimAttributePath", om.valueToTree(this.getClaimAttributePath()));
            data.set("identityStoreAttributePath", om.valueToTree(this.getIdentityStoreAttributePath()));
            data.set("issuerUrl", om.valueToTree(this.getIssuerUrl()));
            data.set("jwksRetrievalOption", om.valueToTree(this.getJwksRetrievalOption()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration.Jsii$Proxy that = (SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration.Jsii$Proxy) o;

            if (!claimAttributePath.equals(that.claimAttributePath)) return false;
            if (!identityStoreAttributePath.equals(that.identityStoreAttributePath)) return false;
            if (!issuerUrl.equals(that.issuerUrl)) return false;
            return this.jwksRetrievalOption.equals(that.jwksRetrievalOption);
        }

        @Override
        public final int hashCode() {
            int result = this.claimAttributePath.hashCode();
            result = 31 * result + (this.identityStoreAttributePath.hashCode());
            result = 31 * result + (this.issuerUrl.hashCode());
            result = 31 * result + (this.jwksRetrievalOption.hashCode());
            return result;
        }
    }
}
