package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.004Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#auth_code AppflowConnectorProfile#auth_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#redirect_uri AppflowConnectorProfile#redirect_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedirectUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest> {
        java.lang.String authCode;
        java.lang.String redirectUri;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest#getAuthCode}
         * @param authCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#auth_code AppflowConnectorProfile#auth_code}.
         * @return {@code this}
         */
        public Builder authCode(java.lang.String authCode) {
            this.authCode = authCode;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest#getRedirectUri}
         * @param redirectUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#redirect_uri AppflowConnectorProfile#redirect_uri}.
         * @return {@code this}
         */
        public Builder redirectUri(java.lang.String redirectUri) {
            this.redirectUri = redirectUri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest {
        private final java.lang.String authCode;
        private final java.lang.String redirectUri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authCode = software.amazon.jsii.Kernel.get(this, "authCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.redirectUri = software.amazon.jsii.Kernel.get(this, "redirectUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authCode = builder.authCode;
            this.redirectUri = builder.redirectUri;
        }

        @Override
        public final java.lang.String getAuthCode() {
            return this.authCode;
        }

        @Override
        public final java.lang.String getRedirectUri() {
            return this.redirectUri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthCode() != null) {
                data.set("authCode", om.valueToTree(this.getAuthCode()));
            }
            if (this.getRedirectUri() != null) {
                data.set("redirectUri", om.valueToTree(this.getRedirectUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsZendeskOauthRequest.Jsii$Proxy) o;

            if (this.authCode != null ? !this.authCode.equals(that.authCode) : that.authCode != null) return false;
            return this.redirectUri != null ? this.redirectUri.equals(that.redirectUri) : that.redirectUri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authCode != null ? this.authCode.hashCode() : 0;
            result = 31 * result + (this.redirectUri != null ? this.redirectUri.hashCode() : 0);
            return result;
        }
    }
}
