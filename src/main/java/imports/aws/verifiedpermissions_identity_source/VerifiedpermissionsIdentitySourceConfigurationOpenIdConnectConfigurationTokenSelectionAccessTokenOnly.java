package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.581Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#audiences VerifiedpermissionsIdentitySource#audiences}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAudiences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrincipalIdClaim() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly> {
        java.util.List<java.lang.String> audiences;
        java.lang.String principalIdClaim;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly#getAudiences}
         * @param audiences Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#audiences VerifiedpermissionsIdentitySource#audiences}.
         * @return {@code this}
         */
        public Builder audiences(java.util.List<java.lang.String> audiences) {
            this.audiences = audiences;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly#getPrincipalIdClaim}
         * @param principalIdClaim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
         * @return {@code this}
         */
        public Builder principalIdClaim(java.lang.String principalIdClaim) {
            this.principalIdClaim = principalIdClaim;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly {
        private final java.util.List<java.lang.String> audiences;
        private final java.lang.String principalIdClaim;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audiences = software.amazon.jsii.Kernel.get(this, "audiences", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principalIdClaim = software.amazon.jsii.Kernel.get(this, "principalIdClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audiences = builder.audiences;
            this.principalIdClaim = builder.principalIdClaim;
        }

        @Override
        public final java.util.List<java.lang.String> getAudiences() {
            return this.audiences;
        }

        @Override
        public final java.lang.String getPrincipalIdClaim() {
            return this.principalIdClaim;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudiences() != null) {
                data.set("audiences", om.valueToTree(this.getAudiences()));
            }
            if (this.getPrincipalIdClaim() != null) {
                data.set("principalIdClaim", om.valueToTree(this.getPrincipalIdClaim()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly.Jsii$Proxy) o;

            if (this.audiences != null ? !this.audiences.equals(that.audiences) : that.audiences != null) return false;
            return this.principalIdClaim != null ? this.principalIdClaim.equals(that.principalIdClaim) : that.principalIdClaim == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audiences != null ? this.audiences.hashCode() : 0;
            result = 31 * result + (this.principalIdClaim != null ? this.principalIdClaim.hashCode() : 0);
            return result;
        }
    }
}
