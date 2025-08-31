package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.581Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * access_token_only block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#access_token_only VerifiedpermissionsIdentitySource#access_token_only}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAccessTokenOnly() {
        return null;
    }

    /**
     * identity_token_only block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#identity_token_only VerifiedpermissionsIdentitySource#identity_token_only}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIdentityTokenOnly() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection> {
        java.lang.Object accessTokenOnly;
        java.lang.Object identityTokenOnly;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection#getAccessTokenOnly}
         * @param accessTokenOnly access_token_only block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#access_token_only VerifiedpermissionsIdentitySource#access_token_only}
         * @return {@code this}
         */
        public Builder accessTokenOnly(com.hashicorp.cdktf.IResolvable accessTokenOnly) {
            this.accessTokenOnly = accessTokenOnly;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection#getAccessTokenOnly}
         * @param accessTokenOnly access_token_only block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#access_token_only VerifiedpermissionsIdentitySource#access_token_only}
         * @return {@code this}
         */
        public Builder accessTokenOnly(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly> accessTokenOnly) {
            this.accessTokenOnly = accessTokenOnly;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection#getIdentityTokenOnly}
         * @param identityTokenOnly identity_token_only block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#identity_token_only VerifiedpermissionsIdentitySource#identity_token_only}
         * @return {@code this}
         */
        public Builder identityTokenOnly(com.hashicorp.cdktf.IResolvable identityTokenOnly) {
            this.identityTokenOnly = identityTokenOnly;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection#getIdentityTokenOnly}
         * @param identityTokenOnly identity_token_only block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#identity_token_only VerifiedpermissionsIdentitySource#identity_token_only}
         * @return {@code this}
         */
        public Builder identityTokenOnly(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly> identityTokenOnly) {
            this.identityTokenOnly = identityTokenOnly;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection {
        private final java.lang.Object accessTokenOnly;
        private final java.lang.Object identityTokenOnly;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessTokenOnly = software.amazon.jsii.Kernel.get(this, "accessTokenOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.identityTokenOnly = software.amazon.jsii.Kernel.get(this, "identityTokenOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessTokenOnly = builder.accessTokenOnly;
            this.identityTokenOnly = builder.identityTokenOnly;
        }

        @Override
        public final java.lang.Object getAccessTokenOnly() {
            return this.accessTokenOnly;
        }

        @Override
        public final java.lang.Object getIdentityTokenOnly() {
            return this.identityTokenOnly;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccessTokenOnly() != null) {
                data.set("accessTokenOnly", om.valueToTree(this.getAccessTokenOnly()));
            }
            if (this.getIdentityTokenOnly() != null) {
                data.set("identityTokenOnly", om.valueToTree(this.getIdentityTokenOnly()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection.Jsii$Proxy) o;

            if (this.accessTokenOnly != null ? !this.accessTokenOnly.equals(that.accessTokenOnly) : that.accessTokenOnly != null) return false;
            return this.identityTokenOnly != null ? this.identityTokenOnly.equals(that.identityTokenOnly) : that.identityTokenOnly == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessTokenOnly != null ? this.accessTokenOnly.hashCode() : 0;
            result = 31 * result + (this.identityTokenOnly != null ? this.identityTokenOnly.hashCode() : 0);
            return result;
        }
    }
}
