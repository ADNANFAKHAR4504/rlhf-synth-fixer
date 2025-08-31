package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_grant_type AppflowConnectorProfile#oauth2_grant_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOauth2GrantType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url AppflowConnectorProfile#token_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTokenUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url_custom_properties AppflowConnectorProfile#token_url_custom_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTokenUrlCustomProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties> {
        java.lang.String oauth2GrantType;
        java.lang.String tokenUrl;
        java.util.Map<java.lang.String, java.lang.String> tokenUrlCustomProperties;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties#getOauth2GrantType}
         * @param oauth2GrantType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_grant_type AppflowConnectorProfile#oauth2_grant_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder oauth2GrantType(java.lang.String oauth2GrantType) {
            this.oauth2GrantType = oauth2GrantType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties#getTokenUrl}
         * @param tokenUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url AppflowConnectorProfile#token_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder tokenUrl(java.lang.String tokenUrl) {
            this.tokenUrl = tokenUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties#getTokenUrlCustomProperties}
         * @param tokenUrlCustomProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url_custom_properties AppflowConnectorProfile#token_url_custom_properties}.
         * @return {@code this}
         */
        public Builder tokenUrlCustomProperties(java.util.Map<java.lang.String, java.lang.String> tokenUrlCustomProperties) {
            this.tokenUrlCustomProperties = tokenUrlCustomProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties {
        private final java.lang.String oauth2GrantType;
        private final java.lang.String tokenUrl;
        private final java.util.Map<java.lang.String, java.lang.String> tokenUrlCustomProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.oauth2GrantType = software.amazon.jsii.Kernel.get(this, "oauth2GrantType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenUrl = software.amazon.jsii.Kernel.get(this, "tokenUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenUrlCustomProperties = software.amazon.jsii.Kernel.get(this, "tokenUrlCustomProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.oauth2GrantType = java.util.Objects.requireNonNull(builder.oauth2GrantType, "oauth2GrantType is required");
            this.tokenUrl = java.util.Objects.requireNonNull(builder.tokenUrl, "tokenUrl is required");
            this.tokenUrlCustomProperties = builder.tokenUrlCustomProperties;
        }

        @Override
        public final java.lang.String getOauth2GrantType() {
            return this.oauth2GrantType;
        }

        @Override
        public final java.lang.String getTokenUrl() {
            return this.tokenUrl;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTokenUrlCustomProperties() {
            return this.tokenUrlCustomProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("oauth2GrantType", om.valueToTree(this.getOauth2GrantType()));
            data.set("tokenUrl", om.valueToTree(this.getTokenUrl()));
            if (this.getTokenUrlCustomProperties() != null) {
                data.set("tokenUrlCustomProperties", om.valueToTree(this.getTokenUrlCustomProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties.Jsii$Proxy) o;

            if (!oauth2GrantType.equals(that.oauth2GrantType)) return false;
            if (!tokenUrl.equals(that.tokenUrl)) return false;
            return this.tokenUrlCustomProperties != null ? this.tokenUrlCustomProperties.equals(that.tokenUrlCustomProperties) : that.tokenUrlCustomProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.oauth2GrantType.hashCode();
            result = 31 * result + (this.tokenUrl.hashCode());
            result = 31 * result + (this.tokenUrlCustomProperties != null ? this.tokenUrlCustomProperties.hashCode() : 0);
            return result;
        }
    }
}
