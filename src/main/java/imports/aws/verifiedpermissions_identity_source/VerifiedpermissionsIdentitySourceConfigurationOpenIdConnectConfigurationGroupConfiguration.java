package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.581Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_claim VerifiedpermissionsIdentitySource#group_claim}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGroupClaim();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGroupEntityType();

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration> {
        java.lang.String groupClaim;
        java.lang.String groupEntityType;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration#getGroupClaim}
         * @param groupClaim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_claim VerifiedpermissionsIdentitySource#group_claim}. This parameter is required.
         * @return {@code this}
         */
        public Builder groupClaim(java.lang.String groupClaim) {
            this.groupClaim = groupClaim;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration#getGroupEntityType}
         * @param groupEntityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder groupEntityType(java.lang.String groupEntityType) {
            this.groupEntityType = groupEntityType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration {
        private final java.lang.String groupClaim;
        private final java.lang.String groupEntityType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.groupClaim = software.amazon.jsii.Kernel.get(this, "groupClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupEntityType = software.amazon.jsii.Kernel.get(this, "groupEntityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.groupClaim = java.util.Objects.requireNonNull(builder.groupClaim, "groupClaim is required");
            this.groupEntityType = java.util.Objects.requireNonNull(builder.groupEntityType, "groupEntityType is required");
        }

        @Override
        public final java.lang.String getGroupClaim() {
            return this.groupClaim;
        }

        @Override
        public final java.lang.String getGroupEntityType() {
            return this.groupEntityType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("groupClaim", om.valueToTree(this.getGroupClaim()));
            data.set("groupEntityType", om.valueToTree(this.getGroupEntityType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration.Jsii$Proxy) o;

            if (!groupClaim.equals(that.groupClaim)) return false;
            return this.groupEntityType.equals(that.groupEntityType);
        }

        @Override
        public final int hashCode() {
            int result = this.groupClaim.hashCode();
            result = 31 * result + (this.groupEntityType.hashCode());
            return result;
        }
    }
}
