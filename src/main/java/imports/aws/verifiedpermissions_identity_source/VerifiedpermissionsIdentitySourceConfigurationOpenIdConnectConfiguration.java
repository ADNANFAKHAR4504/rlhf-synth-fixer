package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.580Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#issuer VerifiedpermissionsIdentitySource#issuer}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuer();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#entity_id_prefix VerifiedpermissionsIdentitySource#entity_id_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEntityIdPrefix() {
        return null;
    }

    /**
     * group_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGroupConfiguration() {
        return null;
    }

    /**
     * token_selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#token_selection VerifiedpermissionsIdentitySource#token_selection}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTokenSelection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration> {
        java.lang.String issuer;
        java.lang.String entityIdPrefix;
        java.lang.Object groupConfiguration;
        java.lang.Object tokenSelection;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#issuer VerifiedpermissionsIdentitySource#issuer}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getEntityIdPrefix}
         * @param entityIdPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#entity_id_prefix VerifiedpermissionsIdentitySource#entity_id_prefix}.
         * @return {@code this}
         */
        public Builder entityIdPrefix(java.lang.String entityIdPrefix) {
            this.entityIdPrefix = entityIdPrefix;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getGroupConfiguration}
         * @param groupConfiguration group_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
         * @return {@code this}
         */
        public Builder groupConfiguration(com.hashicorp.cdktf.IResolvable groupConfiguration) {
            this.groupConfiguration = groupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getGroupConfiguration}
         * @param groupConfiguration group_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
         * @return {@code this}
         */
        public Builder groupConfiguration(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration> groupConfiguration) {
            this.groupConfiguration = groupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getTokenSelection}
         * @param tokenSelection token_selection block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#token_selection VerifiedpermissionsIdentitySource#token_selection}
         * @return {@code this}
         */
        public Builder tokenSelection(com.hashicorp.cdktf.IResolvable tokenSelection) {
            this.tokenSelection = tokenSelection;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration#getTokenSelection}
         * @param tokenSelection token_selection block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#token_selection VerifiedpermissionsIdentitySource#token_selection}
         * @return {@code this}
         */
        public Builder tokenSelection(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection> tokenSelection) {
            this.tokenSelection = tokenSelection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration {
        private final java.lang.String issuer;
        private final java.lang.String entityIdPrefix;
        private final java.lang.Object groupConfiguration;
        private final java.lang.Object tokenSelection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.issuer = software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.entityIdPrefix = software.amazon.jsii.Kernel.get(this, "entityIdPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupConfiguration = software.amazon.jsii.Kernel.get(this, "groupConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tokenSelection = software.amazon.jsii.Kernel.get(this, "tokenSelection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.issuer = java.util.Objects.requireNonNull(builder.issuer, "issuer is required");
            this.entityIdPrefix = builder.entityIdPrefix;
            this.groupConfiguration = builder.groupConfiguration;
            this.tokenSelection = builder.tokenSelection;
        }

        @Override
        public final java.lang.String getIssuer() {
            return this.issuer;
        }

        @Override
        public final java.lang.String getEntityIdPrefix() {
            return this.entityIdPrefix;
        }

        @Override
        public final java.lang.Object getGroupConfiguration() {
            return this.groupConfiguration;
        }

        @Override
        public final java.lang.Object getTokenSelection() {
            return this.tokenSelection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("issuer", om.valueToTree(this.getIssuer()));
            if (this.getEntityIdPrefix() != null) {
                data.set("entityIdPrefix", om.valueToTree(this.getEntityIdPrefix()));
            }
            if (this.getGroupConfiguration() != null) {
                data.set("groupConfiguration", om.valueToTree(this.getGroupConfiguration()));
            }
            if (this.getTokenSelection() != null) {
                data.set("tokenSelection", om.valueToTree(this.getTokenSelection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration.Jsii$Proxy) o;

            if (!issuer.equals(that.issuer)) return false;
            if (this.entityIdPrefix != null ? !this.entityIdPrefix.equals(that.entityIdPrefix) : that.entityIdPrefix != null) return false;
            if (this.groupConfiguration != null ? !this.groupConfiguration.equals(that.groupConfiguration) : that.groupConfiguration != null) return false;
            return this.tokenSelection != null ? this.tokenSelection.equals(that.tokenSelection) : that.tokenSelection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.issuer.hashCode();
            result = 31 * result + (this.entityIdPrefix != null ? this.entityIdPrefix.hashCode() : 0);
            result = 31 * result + (this.groupConfiguration != null ? this.groupConfiguration.hashCode() : 0);
            result = 31 * result + (this.tokenSelection != null ? this.tokenSelection.hashCode() : 0);
            return result;
        }
    }
}
