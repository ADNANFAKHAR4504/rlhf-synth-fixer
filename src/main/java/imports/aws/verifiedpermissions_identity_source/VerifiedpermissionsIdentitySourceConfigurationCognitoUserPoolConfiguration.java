package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.580Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#user_pool_arn VerifiedpermissionsIdentitySource#user_pool_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClientIds() {
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
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration> {
        java.lang.String userPoolArn;
        java.util.List<java.lang.String> clientIds;
        java.lang.Object groupConfiguration;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration#getUserPoolArn}
         * @param userPoolArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#user_pool_arn VerifiedpermissionsIdentitySource#user_pool_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolArn(java.lang.String userPoolArn) {
            this.userPoolArn = userPoolArn;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration#getClientIds}
         * @param clientIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
         * @return {@code this}
         */
        public Builder clientIds(java.util.List<java.lang.String> clientIds) {
            this.clientIds = clientIds;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration#getGroupConfiguration}
         * @param groupConfiguration group_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
         * @return {@code this}
         */
        public Builder groupConfiguration(com.hashicorp.cdktf.IResolvable groupConfiguration) {
            this.groupConfiguration = groupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration#getGroupConfiguration}
         * @param groupConfiguration group_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
         * @return {@code this}
         */
        public Builder groupConfiguration(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration> groupConfiguration) {
            this.groupConfiguration = groupConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration {
        private final java.lang.String userPoolArn;
        private final java.util.List<java.lang.String> clientIds;
        private final java.lang.Object groupConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.userPoolArn = software.amazon.jsii.Kernel.get(this, "userPoolArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientIds = software.amazon.jsii.Kernel.get(this, "clientIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.groupConfiguration = software.amazon.jsii.Kernel.get(this, "groupConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.userPoolArn = java.util.Objects.requireNonNull(builder.userPoolArn, "userPoolArn is required");
            this.clientIds = builder.clientIds;
            this.groupConfiguration = builder.groupConfiguration;
        }

        @Override
        public final java.lang.String getUserPoolArn() {
            return this.userPoolArn;
        }

        @Override
        public final java.util.List<java.lang.String> getClientIds() {
            return this.clientIds;
        }

        @Override
        public final java.lang.Object getGroupConfiguration() {
            return this.groupConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("userPoolArn", om.valueToTree(this.getUserPoolArn()));
            if (this.getClientIds() != null) {
                data.set("clientIds", om.valueToTree(this.getClientIds()));
            }
            if (this.getGroupConfiguration() != null) {
                data.set("groupConfiguration", om.valueToTree(this.getGroupConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration.Jsii$Proxy) o;

            if (!userPoolArn.equals(that.userPoolArn)) return false;
            if (this.clientIds != null ? !this.clientIds.equals(that.clientIds) : that.clientIds != null) return false;
            return this.groupConfiguration != null ? this.groupConfiguration.equals(that.groupConfiguration) : that.groupConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.userPoolArn.hashCode();
            result = 31 * result + (this.clientIds != null ? this.clientIds.hashCode() : 0);
            result = 31 * result + (this.groupConfiguration != null ? this.groupConfiguration.hashCode() : 0);
            return result;
        }
    }
}
