package imports.aws.ssoadmin_trusted_token_issuer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration")
@software.amazon.jsii.Jsii.Proxy(SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration.Jsii$Proxy.class)
public interface SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * oidc_jwt_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#oidc_jwt_configuration SsoadminTrustedTokenIssuer#oidc_jwt_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOidcJwtConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration> {
        java.lang.Object oidcJwtConfiguration;

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration#getOidcJwtConfiguration}
         * @param oidcJwtConfiguration oidc_jwt_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#oidc_jwt_configuration SsoadminTrustedTokenIssuer#oidc_jwt_configuration}
         * @return {@code this}
         */
        public Builder oidcJwtConfiguration(com.hashicorp.cdktf.IResolvable oidcJwtConfiguration) {
            this.oidcJwtConfiguration = oidcJwtConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration#getOidcJwtConfiguration}
         * @param oidcJwtConfiguration oidc_jwt_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#oidc_jwt_configuration SsoadminTrustedTokenIssuer#oidc_jwt_configuration}
         * @return {@code this}
         */
        public Builder oidcJwtConfiguration(java.util.List<? extends imports.aws.ssoadmin_trusted_token_issuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfigurationOidcJwtConfiguration> oidcJwtConfiguration) {
            this.oidcJwtConfiguration = oidcJwtConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration {
        private final java.lang.Object oidcJwtConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.oidcJwtConfiguration = software.amazon.jsii.Kernel.get(this, "oidcJwtConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.oidcJwtConfiguration = builder.oidcJwtConfiguration;
        }

        @Override
        public final java.lang.Object getOidcJwtConfiguration() {
            return this.oidcJwtConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOidcJwtConfiguration() != null) {
                data.set("oidcJwtConfiguration", om.valueToTree(this.getOidcJwtConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration.Jsii$Proxy that = (SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration.Jsii$Proxy) o;

            return this.oidcJwtConfiguration != null ? this.oidcJwtConfiguration.equals(that.oidcJwtConfiguration) : that.oidcJwtConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.oidcJwtConfiguration != null ? this.oidcJwtConfiguration.hashCode() : 0;
            return result;
        }
    }
}
