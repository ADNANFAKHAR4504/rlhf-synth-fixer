package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.003Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_token AppflowConnectorProfile#access_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_credentials_arn AppflowConnectorProfile#client_credentials_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientCredentialsArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#jwt_token AppflowConnectorProfile#jwt_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJwtToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_grant_type AppflowConnectorProfile#oauth2_grant_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOauth2GrantType() {
        return null;
    }

    /**
     * oauth_request block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_request AppflowConnectorProfile#oauth_request}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest getOauthRequest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#refresh_token AppflowConnectorProfile#refresh_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRefreshToken() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce> {
        java.lang.String accessToken;
        java.lang.String clientCredentialsArn;
        java.lang.String jwtToken;
        java.lang.String oauth2GrantType;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest oauthRequest;
        java.lang.String refreshToken;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getAccessToken}
         * @param accessToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_token AppflowConnectorProfile#access_token}.
         * @return {@code this}
         */
        public Builder accessToken(java.lang.String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getClientCredentialsArn}
         * @param clientCredentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_credentials_arn AppflowConnectorProfile#client_credentials_arn}.
         * @return {@code this}
         */
        public Builder clientCredentialsArn(java.lang.String clientCredentialsArn) {
            this.clientCredentialsArn = clientCredentialsArn;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getJwtToken}
         * @param jwtToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#jwt_token AppflowConnectorProfile#jwt_token}.
         * @return {@code this}
         */
        public Builder jwtToken(java.lang.String jwtToken) {
            this.jwtToken = jwtToken;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getOauth2GrantType}
         * @param oauth2GrantType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_grant_type AppflowConnectorProfile#oauth2_grant_type}.
         * @return {@code this}
         */
        public Builder oauth2GrantType(java.lang.String oauth2GrantType) {
            this.oauth2GrantType = oauth2GrantType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getOauthRequest}
         * @param oauthRequest oauth_request block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_request AppflowConnectorProfile#oauth_request}
         * @return {@code this}
         */
        public Builder oauthRequest(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest oauthRequest) {
            this.oauthRequest = oauthRequest;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce#getRefreshToken}
         * @param refreshToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#refresh_token AppflowConnectorProfile#refresh_token}.
         * @return {@code this}
         */
        public Builder refreshToken(java.lang.String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce {
        private final java.lang.String accessToken;
        private final java.lang.String clientCredentialsArn;
        private final java.lang.String jwtToken;
        private final java.lang.String oauth2GrantType;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest oauthRequest;
        private final java.lang.String refreshToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessToken = software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientCredentialsArn = software.amazon.jsii.Kernel.get(this, "clientCredentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jwtToken = software.amazon.jsii.Kernel.get(this, "jwtToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauth2GrantType = software.amazon.jsii.Kernel.get(this, "oauth2GrantType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthRequest = software.amazon.jsii.Kernel.get(this, "oauthRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest.class));
            this.refreshToken = software.amazon.jsii.Kernel.get(this, "refreshToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessToken = builder.accessToken;
            this.clientCredentialsArn = builder.clientCredentialsArn;
            this.jwtToken = builder.jwtToken;
            this.oauth2GrantType = builder.oauth2GrantType;
            this.oauthRequest = builder.oauthRequest;
            this.refreshToken = builder.refreshToken;
        }

        @Override
        public final java.lang.String getAccessToken() {
            return this.accessToken;
        }

        @Override
        public final java.lang.String getClientCredentialsArn() {
            return this.clientCredentialsArn;
        }

        @Override
        public final java.lang.String getJwtToken() {
            return this.jwtToken;
        }

        @Override
        public final java.lang.String getOauth2GrantType() {
            return this.oauth2GrantType;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforceOauthRequest getOauthRequest() {
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

            if (this.getAccessToken() != null) {
                data.set("accessToken", om.valueToTree(this.getAccessToken()));
            }
            if (this.getClientCredentialsArn() != null) {
                data.set("clientCredentialsArn", om.valueToTree(this.getClientCredentialsArn()));
            }
            if (this.getJwtToken() != null) {
                data.set("jwtToken", om.valueToTree(this.getJwtToken()));
            }
            if (this.getOauth2GrantType() != null) {
                data.set("oauth2GrantType", om.valueToTree(this.getOauth2GrantType()));
            }
            if (this.getOauthRequest() != null) {
                data.set("oauthRequest", om.valueToTree(this.getOauthRequest()));
            }
            if (this.getRefreshToken() != null) {
                data.set("refreshToken", om.valueToTree(this.getRefreshToken()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSalesforce.Jsii$Proxy) o;

            if (this.accessToken != null ? !this.accessToken.equals(that.accessToken) : that.accessToken != null) return false;
            if (this.clientCredentialsArn != null ? !this.clientCredentialsArn.equals(that.clientCredentialsArn) : that.clientCredentialsArn != null) return false;
            if (this.jwtToken != null ? !this.jwtToken.equals(that.jwtToken) : that.jwtToken != null) return false;
            if (this.oauth2GrantType != null ? !this.oauth2GrantType.equals(that.oauth2GrantType) : that.oauth2GrantType != null) return false;
            if (this.oauthRequest != null ? !this.oauthRequest.equals(that.oauthRequest) : that.oauthRequest != null) return false;
            return this.refreshToken != null ? this.refreshToken.equals(that.refreshToken) : that.refreshToken == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessToken != null ? this.accessToken.hashCode() : 0;
            result = 31 * result + (this.clientCredentialsArn != null ? this.clientCredentialsArn.hashCode() : 0);
            result = 31 * result + (this.jwtToken != null ? this.jwtToken.hashCode() : 0);
            result = 31 * result + (this.oauth2GrantType != null ? this.oauth2GrantType.hashCode() : 0);
            result = 31 * result + (this.oauthRequest != null ? this.oauthRequest.hashCode() : 0);
            result = 31 * result + (this.refreshToken != null ? this.refreshToken.hashCode() : 0);
            return result;
        }
    }
}
