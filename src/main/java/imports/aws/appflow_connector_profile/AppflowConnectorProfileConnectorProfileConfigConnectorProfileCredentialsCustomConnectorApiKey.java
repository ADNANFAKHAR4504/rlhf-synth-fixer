package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_key AppflowConnectorProfile#api_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_secret_key AppflowConnectorProfile#api_secret_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApiSecretKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey> {
        java.lang.String apiKey;
        java.lang.String apiSecretKey;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey#getApiKey}
         * @param apiKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_key AppflowConnectorProfile#api_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiKey(java.lang.String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey#getApiSecretKey}
         * @param apiSecretKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#api_secret_key AppflowConnectorProfile#api_secret_key}.
         * @return {@code this}
         */
        public Builder apiSecretKey(java.lang.String apiSecretKey) {
            this.apiSecretKey = apiSecretKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey {
        private final java.lang.String apiKey;
        private final java.lang.String apiSecretKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiKey = software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiSecretKey = software.amazon.jsii.Kernel.get(this, "apiSecretKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiKey = java.util.Objects.requireNonNull(builder.apiKey, "apiKey is required");
            this.apiSecretKey = builder.apiSecretKey;
        }

        @Override
        public final java.lang.String getApiKey() {
            return this.apiKey;
        }

        @Override
        public final java.lang.String getApiSecretKey() {
            return this.apiSecretKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("apiKey", om.valueToTree(this.getApiKey()));
            if (this.getApiSecretKey() != null) {
                data.set("apiSecretKey", om.valueToTree(this.getApiSecretKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorApiKey.Jsii$Proxy) o;

            if (!apiKey.equals(that.apiKey)) return false;
            return this.apiSecretKey != null ? this.apiSecretKey.equals(that.apiSecretKey) : that.apiSecretKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.apiKey.hashCode();
            result = 31 * result + (this.apiSecretKey != null ? this.apiSecretKey.hashCode() : 0);
            return result;
        }
    }
}
