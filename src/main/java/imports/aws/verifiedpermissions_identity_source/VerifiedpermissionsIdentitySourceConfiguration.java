package imports.aws.verifiedpermissions_identity_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.580Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsIdentitySourceConfiguration.Jsii$Proxy.class)
public interface VerifiedpermissionsIdentitySourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * cognito_user_pool_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#cognito_user_pool_configuration VerifiedpermissionsIdentitySource#cognito_user_pool_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCognitoUserPoolConfiguration() {
        return null;
    }

    /**
     * open_id_connect_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#open_id_connect_configuration VerifiedpermissionsIdentitySource#open_id_connect_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOpenIdConnectConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsIdentitySourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsIdentitySourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsIdentitySourceConfiguration> {
        java.lang.Object cognitoUserPoolConfiguration;
        java.lang.Object openIdConnectConfiguration;

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfiguration#getCognitoUserPoolConfiguration}
         * @param cognitoUserPoolConfiguration cognito_user_pool_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#cognito_user_pool_configuration VerifiedpermissionsIdentitySource#cognito_user_pool_configuration}
         * @return {@code this}
         */
        public Builder cognitoUserPoolConfiguration(com.hashicorp.cdktf.IResolvable cognitoUserPoolConfiguration) {
            this.cognitoUserPoolConfiguration = cognitoUserPoolConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfiguration#getCognitoUserPoolConfiguration}
         * @param cognitoUserPoolConfiguration cognito_user_pool_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#cognito_user_pool_configuration VerifiedpermissionsIdentitySource#cognito_user_pool_configuration}
         * @return {@code this}
         */
        public Builder cognitoUserPoolConfiguration(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration> cognitoUserPoolConfiguration) {
            this.cognitoUserPoolConfiguration = cognitoUserPoolConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfiguration#getOpenIdConnectConfiguration}
         * @param openIdConnectConfiguration open_id_connect_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#open_id_connect_configuration VerifiedpermissionsIdentitySource#open_id_connect_configuration}
         * @return {@code this}
         */
        public Builder openIdConnectConfiguration(com.hashicorp.cdktf.IResolvable openIdConnectConfiguration) {
            this.openIdConnectConfiguration = openIdConnectConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsIdentitySourceConfiguration#getOpenIdConnectConfiguration}
         * @param openIdConnectConfiguration open_id_connect_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#open_id_connect_configuration VerifiedpermissionsIdentitySource#open_id_connect_configuration}
         * @return {@code this}
         */
        public Builder openIdConnectConfiguration(java.util.List<? extends imports.aws.verifiedpermissions_identity_source.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration> openIdConnectConfiguration) {
            this.openIdConnectConfiguration = openIdConnectConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsIdentitySourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsIdentitySourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsIdentitySourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsIdentitySourceConfiguration {
        private final java.lang.Object cognitoUserPoolConfiguration;
        private final java.lang.Object openIdConnectConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cognitoUserPoolConfiguration = software.amazon.jsii.Kernel.get(this, "cognitoUserPoolConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.openIdConnectConfiguration = software.amazon.jsii.Kernel.get(this, "openIdConnectConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cognitoUserPoolConfiguration = builder.cognitoUserPoolConfiguration;
            this.openIdConnectConfiguration = builder.openIdConnectConfiguration;
        }

        @Override
        public final java.lang.Object getCognitoUserPoolConfiguration() {
            return this.cognitoUserPoolConfiguration;
        }

        @Override
        public final java.lang.Object getOpenIdConnectConfiguration() {
            return this.openIdConnectConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCognitoUserPoolConfiguration() != null) {
                data.set("cognitoUserPoolConfiguration", om.valueToTree(this.getCognitoUserPoolConfiguration()));
            }
            if (this.getOpenIdConnectConfiguration() != null) {
                data.set("openIdConnectConfiguration", om.valueToTree(this.getOpenIdConnectConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsIdentitySourceConfiguration.Jsii$Proxy that = (VerifiedpermissionsIdentitySourceConfiguration.Jsii$Proxy) o;

            if (this.cognitoUserPoolConfiguration != null ? !this.cognitoUserPoolConfiguration.equals(that.cognitoUserPoolConfiguration) : that.cognitoUserPoolConfiguration != null) return false;
            return this.openIdConnectConfiguration != null ? this.openIdConnectConfiguration.equals(that.openIdConnectConfiguration) : that.openIdConnectConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cognitoUserPoolConfiguration != null ? this.cognitoUserPoolConfiguration.hashCode() : 0;
            result = 31 * result + (this.openIdConnectConfiguration != null ? this.openIdConnectConfiguration.hashCode() : 0);
            return result;
        }
    }
}
