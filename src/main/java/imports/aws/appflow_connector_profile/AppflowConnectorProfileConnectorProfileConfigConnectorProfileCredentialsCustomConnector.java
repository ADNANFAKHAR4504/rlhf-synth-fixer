package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.997Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#authentication_type AppflowConnectorProfile#authentication_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationType();

    /**
     * api_key block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_key AppflowConnectorProfile#api_key}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey getApiKey() {
        return null;
    }

    /**
     * basic block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#basic AppflowConnectorProfile#basic}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic getBasic() {
        return null;
    }

    /**
     * custom block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#custom AppflowConnectorProfile#custom}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom getCustom() {
        return null;
    }

    /**
     * oauth2 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2 AppflowConnectorProfile#oauth2}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2 getOauth2() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector> {
        java.lang.String authenticationType;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey apiKey;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic basic;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom custom;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2 oauth2;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#authentication_type AppflowConnectorProfile#authentication_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector#getApiKey}
         * @param apiKey api_key block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_key AppflowConnectorProfile#api_key}
         * @return {@code this}
         */
        public Builder apiKey(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector#getBasic}
         * @param basic basic block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#basic AppflowConnectorProfile#basic}
         * @return {@code this}
         */
        public Builder basic(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic basic) {
            this.basic = basic;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector#getCustom}
         * @param custom custom block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#custom AppflowConnectorProfile#custom}
         * @return {@code this}
         */
        public Builder custom(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom custom) {
            this.custom = custom;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector#getOauth2}
         * @param oauth2 oauth2 block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2 AppflowConnectorProfile#oauth2}
         * @return {@code this}
         */
        public Builder oauth2(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2 oauth2) {
            this.oauth2 = oauth2;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector {
        private final java.lang.String authenticationType;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey apiKey;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic basic;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom custom;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2 oauth2;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiKey = software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey.class));
            this.basic = software.amazon.jsii.Kernel.get(this, "basic", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic.class));
            this.custom = software.amazon.jsii.Kernel.get(this, "custom", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom.class));
            this.oauth2 = software.amazon.jsii.Kernel.get(this, "oauth2", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationType = java.util.Objects.requireNonNull(builder.authenticationType, "authenticationType is required");
            this.apiKey = builder.apiKey;
            this.basic = builder.basic;
            this.custom = builder.custom;
            this.oauth2 = builder.oauth2;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey getApiKey() {
            return this.apiKey;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorBasic getBasic() {
            return this.basic;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom getCustom() {
            return this.custom;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorOauth2 getOauth2() {
            return this.oauth2;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            if (this.getApiKey() != null) {
                data.set("apiKey", om.valueToTree(this.getApiKey()));
            }
            if (this.getBasic() != null) {
                data.set("basic", om.valueToTree(this.getBasic()));
            }
            if (this.getCustom() != null) {
                data.set("custom", om.valueToTree(this.getCustom()));
            }
            if (this.getOauth2() != null) {
                data.set("oauth2", om.valueToTree(this.getOauth2()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnector.Jsii$Proxy) o;

            if (!authenticationType.equals(that.authenticationType)) return false;
            if (this.apiKey != null ? !this.apiKey.equals(that.apiKey) : that.apiKey != null) return false;
            if (this.basic != null ? !this.basic.equals(that.basic) : that.basic != null) return false;
            if (this.custom != null ? !this.custom.equals(that.custom) : that.custom != null) return false;
            return this.oauth2 != null ? this.oauth2.equals(that.oauth2) : that.oauth2 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationType.hashCode();
            result = 31 * result + (this.apiKey != null ? this.apiKey.hashCode() : 0);
            result = 31 * result + (this.basic != null ? this.basic.hashCode() : 0);
            result = 31 * result + (this.custom != null ? this.custom.hashCode() : 0);
            result = 31 * result + (this.oauth2 != null ? this.oauth2.hashCode() : 0);
            return result;
        }
    }
}
