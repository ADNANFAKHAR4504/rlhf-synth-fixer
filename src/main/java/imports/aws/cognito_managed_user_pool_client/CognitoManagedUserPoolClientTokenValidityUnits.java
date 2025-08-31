package imports.aws.cognito_managed_user_pool_client;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.346Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientTokenValidityUnits")
@software.amazon.jsii.Jsii.Proxy(CognitoManagedUserPoolClientTokenValidityUnits.Jsii$Proxy.class)
public interface CognitoManagedUserPoolClientTokenValidityUnits extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token CognitoManagedUserPoolClient#access_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token CognitoManagedUserPoolClient#id_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token CognitoManagedUserPoolClient#refresh_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRefreshToken() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoManagedUserPoolClientTokenValidityUnits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoManagedUserPoolClientTokenValidityUnits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoManagedUserPoolClientTokenValidityUnits> {
        java.lang.String accessToken;
        java.lang.String idToken;
        java.lang.String refreshToken;

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientTokenValidityUnits#getAccessToken}
         * @param accessToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token CognitoManagedUserPoolClient#access_token}.
         * @return {@code this}
         */
        public Builder accessToken(java.lang.String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientTokenValidityUnits#getIdToken}
         * @param idToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token CognitoManagedUserPoolClient#id_token}.
         * @return {@code this}
         */
        public Builder idToken(java.lang.String idToken) {
            this.idToken = idToken;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientTokenValidityUnits#getRefreshToken}
         * @param refreshToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token CognitoManagedUserPoolClient#refresh_token}.
         * @return {@code this}
         */
        public Builder refreshToken(java.lang.String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoManagedUserPoolClientTokenValidityUnits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoManagedUserPoolClientTokenValidityUnits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoManagedUserPoolClientTokenValidityUnits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoManagedUserPoolClientTokenValidityUnits {
        private final java.lang.String accessToken;
        private final java.lang.String idToken;
        private final java.lang.String refreshToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessToken = software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idToken = software.amazon.jsii.Kernel.get(this, "idToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.refreshToken = software.amazon.jsii.Kernel.get(this, "refreshToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessToken = builder.accessToken;
            this.idToken = builder.idToken;
            this.refreshToken = builder.refreshToken;
        }

        @Override
        public final java.lang.String getAccessToken() {
            return this.accessToken;
        }

        @Override
        public final java.lang.String getIdToken() {
            return this.idToken;
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
            if (this.getIdToken() != null) {
                data.set("idToken", om.valueToTree(this.getIdToken()));
            }
            if (this.getRefreshToken() != null) {
                data.set("refreshToken", om.valueToTree(this.getRefreshToken()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientTokenValidityUnits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoManagedUserPoolClientTokenValidityUnits.Jsii$Proxy that = (CognitoManagedUserPoolClientTokenValidityUnits.Jsii$Proxy) o;

            if (this.accessToken != null ? !this.accessToken.equals(that.accessToken) : that.accessToken != null) return false;
            if (this.idToken != null ? !this.idToken.equals(that.idToken) : that.idToken != null) return false;
            return this.refreshToken != null ? this.refreshToken.equals(that.refreshToken) : that.refreshToken == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessToken != null ? this.accessToken.hashCode() : 0;
            result = 31 * result + (this.idToken != null ? this.idToken.hashCode() : 0);
            result = 31 * result + (this.refreshToken != null ? this.refreshToken.hashCode() : 0);
            return result;
        }
    }
}
