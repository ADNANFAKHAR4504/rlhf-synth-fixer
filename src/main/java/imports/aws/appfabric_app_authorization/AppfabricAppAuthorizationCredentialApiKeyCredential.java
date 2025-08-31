package imports.aws.appfabric_app_authorization;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricAppAuthorization.AppfabricAppAuthorizationCredentialApiKeyCredential")
@software.amazon.jsii.Jsii.Proxy(AppfabricAppAuthorizationCredentialApiKeyCredential.Jsii$Proxy.class)
public interface AppfabricAppAuthorizationCredentialApiKeyCredential extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#api_key AppfabricAppAuthorization#api_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiKey();

    /**
     * @return a {@link Builder} of {@link AppfabricAppAuthorizationCredentialApiKeyCredential}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricAppAuthorizationCredentialApiKeyCredential}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricAppAuthorizationCredentialApiKeyCredential> {
        java.lang.String apiKey;

        /**
         * Sets the value of {@link AppfabricAppAuthorizationCredentialApiKeyCredential#getApiKey}
         * @param apiKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#api_key AppfabricAppAuthorization#api_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiKey(java.lang.String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricAppAuthorizationCredentialApiKeyCredential}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricAppAuthorizationCredentialApiKeyCredential build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricAppAuthorizationCredentialApiKeyCredential}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricAppAuthorizationCredentialApiKeyCredential {
        private final java.lang.String apiKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiKey = software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiKey = java.util.Objects.requireNonNull(builder.apiKey, "apiKey is required");
        }

        @Override
        public final java.lang.String getApiKey() {
            return this.apiKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("apiKey", om.valueToTree(this.getApiKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricAppAuthorization.AppfabricAppAuthorizationCredentialApiKeyCredential"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricAppAuthorizationCredentialApiKeyCredential.Jsii$Proxy that = (AppfabricAppAuthorizationCredentialApiKeyCredential.Jsii$Proxy) o;

            return this.apiKey.equals(that.apiKey);
        }

        @Override
        public final int hashCode() {
            int result = this.apiKey.hashCode();
            return result;
        }
    }
}
