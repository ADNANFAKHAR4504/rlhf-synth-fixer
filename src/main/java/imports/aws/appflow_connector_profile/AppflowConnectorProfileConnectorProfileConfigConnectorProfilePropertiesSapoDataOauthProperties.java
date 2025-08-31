package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#auth_code_url AppflowConnectorProfile#auth_code_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthCodeUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_scopes AppflowConnectorProfile#oauth_scopes}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOauthScopes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url AppflowConnectorProfile#token_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTokenUrl();

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties> {
        java.lang.String authCodeUrl;
        java.util.List<java.lang.String> oauthScopes;
        java.lang.String tokenUrl;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties#getAuthCodeUrl}
         * @param authCodeUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#auth_code_url AppflowConnectorProfile#auth_code_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder authCodeUrl(java.lang.String authCodeUrl) {
            this.authCodeUrl = authCodeUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties#getOauthScopes}
         * @param oauthScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_scopes AppflowConnectorProfile#oauth_scopes}. This parameter is required.
         * @return {@code this}
         */
        public Builder oauthScopes(java.util.List<java.lang.String> oauthScopes) {
            this.oauthScopes = oauthScopes;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties#getTokenUrl}
         * @param tokenUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#token_url AppflowConnectorProfile#token_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder tokenUrl(java.lang.String tokenUrl) {
            this.tokenUrl = tokenUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties {
        private final java.lang.String authCodeUrl;
        private final java.util.List<java.lang.String> oauthScopes;
        private final java.lang.String tokenUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authCodeUrl = software.amazon.jsii.Kernel.get(this, "authCodeUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthScopes = software.amazon.jsii.Kernel.get(this, "oauthScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tokenUrl = software.amazon.jsii.Kernel.get(this, "tokenUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authCodeUrl = java.util.Objects.requireNonNull(builder.authCodeUrl, "authCodeUrl is required");
            this.oauthScopes = java.util.Objects.requireNonNull(builder.oauthScopes, "oauthScopes is required");
            this.tokenUrl = java.util.Objects.requireNonNull(builder.tokenUrl, "tokenUrl is required");
        }

        @Override
        public final java.lang.String getAuthCodeUrl() {
            return this.authCodeUrl;
        }

        @Override
        public final java.util.List<java.lang.String> getOauthScopes() {
            return this.oauthScopes;
        }

        @Override
        public final java.lang.String getTokenUrl() {
            return this.tokenUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authCodeUrl", om.valueToTree(this.getAuthCodeUrl()));
            data.set("oauthScopes", om.valueToTree(this.getOauthScopes()));
            data.set("tokenUrl", om.valueToTree(this.getTokenUrl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties.Jsii$Proxy) o;

            if (!authCodeUrl.equals(that.authCodeUrl)) return false;
            if (!oauthScopes.equals(that.oauthScopes)) return false;
            return this.tokenUrl.equals(that.tokenUrl);
        }

        @Override
        public final int hashCode() {
            int result = this.authCodeUrl.hashCode();
            result = 31 * result + (this.oauthScopes.hashCode());
            result = 31 * result + (this.tokenUrl.hashCode());
            return result;
        }
    }
}
