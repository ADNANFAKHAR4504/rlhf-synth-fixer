package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_id AppflowConnectorProfile#client_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_secret AppflowConnectorProfile#client_secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_token AppflowConnectorProfile#access_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessToken() {
        return null;
    }

    /**
     * oauth_request block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_request AppflowConnectorProfile#oauth_request}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest getOauthRequest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#refresh_token AppflowConnectorProfile#refresh_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRefreshToken() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics> {
        java.lang.String clientId;
        java.lang.String clientSecret;
        java.lang.String accessToken;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest oauthRequest;
        java.lang.String refreshToken;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_id AppflowConnectorProfile#client_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics#getClientSecret}
         * @param clientSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_secret AppflowConnectorProfile#client_secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientSecret(java.lang.String clientSecret) {
            this.clientSecret = clientSecret;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics#getAccessToken}
         * @param accessToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_token AppflowConnectorProfile#access_token}.
         * @return {@code this}
         */
        public Builder accessToken(java.lang.String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics#getOauthRequest}
         * @param oauthRequest oauth_request block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_request AppflowConnectorProfile#oauth_request}
         * @return {@code this}
         */
        public Builder oauthRequest(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest oauthRequest) {
            this.oauthRequest = oauthRequest;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics#getRefreshToken}
         * @param refreshToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#refresh_token AppflowConnectorProfile#refresh_token}.
         * @return {@code this}
         */
        public Builder refreshToken(java.lang.String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics {
        private final java.lang.String clientId;
        private final java.lang.String clientSecret;
        private final java.lang.String accessToken;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest oauthRequest;
        private final java.lang.String refreshToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientSecret = software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessToken = software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthRequest = software.amazon.jsii.Kernel.get(this, "oauthRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest.class));
            this.refreshToken = software.amazon.jsii.Kernel.get(this, "refreshToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientId = java.util.Objects.requireNonNull(builder.clientId, "clientId is required");
            this.clientSecret = java.util.Objects.requireNonNull(builder.clientSecret, "clientSecret is required");
            this.accessToken = builder.accessToken;
            this.oauthRequest = builder.oauthRequest;
            this.refreshToken = builder.refreshToken;
        }

        @Override
        public final java.lang.String getClientId() {
            return this.clientId;
        }

        @Override
        public final java.lang.String getClientSecret() {
            return this.clientSecret;
        }

        @Override
        public final java.lang.String getAccessToken() {
            return this.accessToken;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalyticsOauthRequest getOauthRequest() {
            return this.oauthRequest;
        }

        @Override
        public final java.lang.String getRefreshToken() {
            return this.refreshToken;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientId", om.valueToTree(this.getClientId()));
            data.set("clientSecret", om.valueToTree(this.getClientSecret()));
            if (this.getAccessToken() != null) {
                data.set("accessToken", om.valueToTree(this.getAccessToken()));
            }
            if (this.getOauthRequest() != null) {
                data.set("oauthRequest", om.valueToTree(this.getOauthRequest()));
            }
            if (this.getRefreshToken() != null) {
                data.set("refreshToken", om.valueToTree(this.getRefreshToken()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsGoogleAnalytics.Jsii$Proxy) o;

            if (!clientId.equals(that.clientId)) return false;
            if (!clientSecret.equals(that.clientSecret)) return false;
            if (this.accessToken != null ? !this.accessToken.equals(that.accessToken) : that.accessToken != null) return false;
            if (this.oauthRequest != null ? !this.oauthRequest.equals(that.oauthRequest) : that.oauthRequest != null) return false;
            return this.refreshToken != null ? this.refreshToken.equals(that.refreshToken) : that.refreshToken == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientId.hashCode();
            result = 31 * result + (this.clientSecret.hashCode());
            result = 31 * result + (this.accessToken != null ? this.accessToken.hashCode() : 0);
            result = 31 * result + (this.oauthRequest != null ? this.oauthRequest.hashCode() : 0);
            result = 31 * result + (this.refreshToken != null ? this.refreshToken.hashCode() : 0);
            return result;
        }
    }
}
