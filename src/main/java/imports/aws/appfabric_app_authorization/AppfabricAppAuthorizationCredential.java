package imports.aws.appfabric_app_authorization;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.991Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricAppAuthorization.AppfabricAppAuthorizationCredential")
@software.amazon.jsii.Jsii.Proxy(AppfabricAppAuthorizationCredential.Jsii$Proxy.class)
public interface AppfabricAppAuthorizationCredential extends software.amazon.jsii.JsiiSerializable {

    /**
     * api_key_credential block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#api_key_credential AppfabricAppAuthorization#api_key_credential}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApiKeyCredential() {
        return null;
    }

    /**
     * oauth2_credential block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#oauth2_credential AppfabricAppAuthorization#oauth2_credential}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOauth2Credential() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppfabricAppAuthorizationCredential}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricAppAuthorizationCredential}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricAppAuthorizationCredential> {
        java.lang.Object apiKeyCredential;
        java.lang.Object oauth2Credential;

        /**
         * Sets the value of {@link AppfabricAppAuthorizationCredential#getApiKeyCredential}
         * @param apiKeyCredential api_key_credential block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#api_key_credential AppfabricAppAuthorization#api_key_credential}
         * @return {@code this}
         */
        public Builder apiKeyCredential(com.hashicorp.cdktf.IResolvable apiKeyCredential) {
            this.apiKeyCredential = apiKeyCredential;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricAppAuthorizationCredential#getApiKeyCredential}
         * @param apiKeyCredential api_key_credential block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#api_key_credential AppfabricAppAuthorization#api_key_credential}
         * @return {@code this}
         */
        public Builder apiKeyCredential(java.util.List<? extends imports.aws.appfabric_app_authorization.AppfabricAppAuthorizationCredentialApiKeyCredential> apiKeyCredential) {
            this.apiKeyCredential = apiKeyCredential;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricAppAuthorizationCredential#getOauth2Credential}
         * @param oauth2Credential oauth2_credential block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#oauth2_credential AppfabricAppAuthorization#oauth2_credential}
         * @return {@code this}
         */
        public Builder oauth2Credential(com.hashicorp.cdktf.IResolvable oauth2Credential) {
            this.oauth2Credential = oauth2Credential;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricAppAuthorizationCredential#getOauth2Credential}
         * @param oauth2Credential oauth2_credential block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#oauth2_credential AppfabricAppAuthorization#oauth2_credential}
         * @return {@code this}
         */
        public Builder oauth2Credential(java.util.List<? extends imports.aws.appfabric_app_authorization.AppfabricAppAuthorizationCredentialOauth2Credential> oauth2Credential) {
            this.oauth2Credential = oauth2Credential;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricAppAuthorizationCredential}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricAppAuthorizationCredential build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricAppAuthorizationCredential}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricAppAuthorizationCredential {
        private final java.lang.Object apiKeyCredential;
        private final java.lang.Object oauth2Credential;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiKeyCredential = software.amazon.jsii.Kernel.get(this, "apiKeyCredential", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.oauth2Credential = software.amazon.jsii.Kernel.get(this, "oauth2Credential", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiKeyCredential = builder.apiKeyCredential;
            this.oauth2Credential = builder.oauth2Credential;
        }

        @Override
        public final java.lang.Object getApiKeyCredential() {
            return this.apiKeyCredential;
        }

        @Override
        public final java.lang.Object getOauth2Credential() {
            return this.oauth2Credential;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApiKeyCredential() != null) {
                data.set("apiKeyCredential", om.valueToTree(this.getApiKeyCredential()));
            }
            if (this.getOauth2Credential() != null) {
                data.set("oauth2Credential", om.valueToTree(this.getOauth2Credential()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricAppAuthorization.AppfabricAppAuthorizationCredential"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricAppAuthorizationCredential.Jsii$Proxy that = (AppfabricAppAuthorizationCredential.Jsii$Proxy) o;

            if (this.apiKeyCredential != null ? !this.apiKeyCredential.equals(that.apiKeyCredential) : that.apiKeyCredential != null) return false;
            return this.oauth2Credential != null ? this.oauth2Credential.equals(that.oauth2Credential) : that.oauth2Credential == null;
        }

        @Override
        public final int hashCode() {
            int result = this.apiKeyCredential != null ? this.apiKeyCredential.hashCode() : 0;
            result = 31 * result + (this.oauth2Credential != null ? this.oauth2Credential.hashCode() : 0);
            return result;
        }
    }
}
