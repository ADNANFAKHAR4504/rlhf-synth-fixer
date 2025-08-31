package imports.aws.appfabric_app_authorization_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.993Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricAppAuthorizationConnection.AppfabricAppAuthorizationConnectionAuthRequest")
@software.amazon.jsii.Jsii.Proxy(AppfabricAppAuthorizationConnectionAuthRequest.Jsii$Proxy.class)
public interface AppfabricAppAuthorizationConnectionAuthRequest extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#code AppfabricAppAuthorizationConnection#code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#redirect_uri AppfabricAppAuthorizationConnection#redirect_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRedirectUri();

    /**
     * @return a {@link Builder} of {@link AppfabricAppAuthorizationConnectionAuthRequest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricAppAuthorizationConnectionAuthRequest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricAppAuthorizationConnectionAuthRequest> {
        java.lang.String code;
        java.lang.String redirectUri;

        /**
         * Sets the value of {@link AppfabricAppAuthorizationConnectionAuthRequest#getCode}
         * @param code Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#code AppfabricAppAuthorizationConnection#code}. This parameter is required.
         * @return {@code this}
         */
        public Builder code(java.lang.String code) {
            this.code = code;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricAppAuthorizationConnectionAuthRequest#getRedirectUri}
         * @param redirectUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#redirect_uri AppfabricAppAuthorizationConnection#redirect_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder redirectUri(java.lang.String redirectUri) {
            this.redirectUri = redirectUri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricAppAuthorizationConnectionAuthRequest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricAppAuthorizationConnectionAuthRequest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricAppAuthorizationConnectionAuthRequest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricAppAuthorizationConnectionAuthRequest {
        private final java.lang.String code;
        private final java.lang.String redirectUri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.code = software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.redirectUri = software.amazon.jsii.Kernel.get(this, "redirectUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.code = java.util.Objects.requireNonNull(builder.code, "code is required");
            this.redirectUri = java.util.Objects.requireNonNull(builder.redirectUri, "redirectUri is required");
        }

        @Override
        public final java.lang.String getCode() {
            return this.code;
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

            data.set("code", om.valueToTree(this.getCode()));
            data.set("redirectUri", om.valueToTree(this.getRedirectUri()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricAppAuthorizationConnection.AppfabricAppAuthorizationConnectionAuthRequest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricAppAuthorizationConnectionAuthRequest.Jsii$Proxy that = (AppfabricAppAuthorizationConnectionAuthRequest.Jsii$Proxy) o;

            if (!code.equals(that.code)) return false;
            return this.redirectUri.equals(that.redirectUri);
        }

        @Override
        public final int hashCode() {
            int result = this.code.hashCode();
            result = 31 * result + (this.redirectUri.hashCode());
            return result;
        }
    }
}
