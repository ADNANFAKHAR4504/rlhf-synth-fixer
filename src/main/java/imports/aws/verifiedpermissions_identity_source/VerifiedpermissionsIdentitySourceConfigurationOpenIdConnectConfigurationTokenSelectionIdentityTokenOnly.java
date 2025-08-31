package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.581Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClientIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrincipalIdClaim() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly> {
        java.util.List<java.lang.String> clientIds;
        java.lang.String principalIdClaim;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly#getClientIds}
         * @param clientIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
         * @return {@code this}
         */
        public Builder clientIds(java.util.List<java.lang.String> clientIds) {
            this.clientIds = clientIds;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly#getPrincipalIdClaim}
         * @param principalIdClaim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
         * @return {@code this}
         */
        public Builder principalIdClaim(java.lang.String principalIdClaim) {
            this.principalIdClaim = principalIdClaim;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly {
        private final java.util.List<java.lang.String> clientIds;
        private final java.lang.String principalIdClaim;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientIds = software.amazon.jsii.Kernel.get(this, "clientIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principalIdClaim = software.amazon.jsii.Kernel.get(this, "principalIdClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientIds = builder.clientIds;
            this.principalIdClaim = builder.principalIdClaim;
        }

        @Override
        public final java.util.List<java.lang.String> getClientIds() {
            return this.clientIds;
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

            if (this.getClientIds() != null) {
                data.set("clientIds", om.valueToTree(this.getClientIds()));
            }
            if (this.getPrincipalIdClaim() != null) {
                data.set("principalIdClaim", om.valueToTree(this.getPrincipalIdClaim()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly.Jsii$Proxy) o;

            if (this.clientIds != null ? !this.clientIds.equals(that.clientIds) : that.clientIds != null) return false;
            return this.principalIdClaim != null ? this.principalIdClaim.equals(that.principalIdClaim) : that.principalIdClaim == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientIds != null ? this.clientIds.hashCode() : 0;
            result = 31 * result + (this.principalIdClaim != null ? this.principalIdClaim.hashCode() : 0);
            return result;
        }
    }
}
