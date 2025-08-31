package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolWebAuthnConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolWebAuthnConfiguration.Jsii$Proxy.class)
public interface CognitoUserPoolWebAuthnConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#relying_party_id CognitoUserPool#relying_party_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRelyingPartyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_verification CognitoUserPool#user_verification}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserVerification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolWebAuthnConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolWebAuthnConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolWebAuthnConfiguration> {
        java.lang.String relyingPartyId;
        java.lang.String userVerification;

        /**
         * Sets the value of {@link CognitoUserPoolWebAuthnConfiguration#getRelyingPartyId}
         * @param relyingPartyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#relying_party_id CognitoUserPool#relying_party_id}.
         * @return {@code this}
         */
        public Builder relyingPartyId(java.lang.String relyingPartyId) {
            this.relyingPartyId = relyingPartyId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolWebAuthnConfiguration#getUserVerification}
         * @param userVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_verification CognitoUserPool#user_verification}.
         * @return {@code this}
         */
        public Builder userVerification(java.lang.String userVerification) {
            this.userVerification = userVerification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolWebAuthnConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolWebAuthnConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolWebAuthnConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolWebAuthnConfiguration {
        private final java.lang.String relyingPartyId;
        private final java.lang.String userVerification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.relyingPartyId = software.amazon.jsii.Kernel.get(this, "relyingPartyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userVerification = software.amazon.jsii.Kernel.get(this, "userVerification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.relyingPartyId = builder.relyingPartyId;
            this.userVerification = builder.userVerification;
        }

        @Override
        public final java.lang.String getRelyingPartyId() {
            return this.relyingPartyId;
        }

        @Override
        public final java.lang.String getUserVerification() {
            return this.userVerification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRelyingPartyId() != null) {
                data.set("relyingPartyId", om.valueToTree(this.getRelyingPartyId()));
            }
            if (this.getUserVerification() != null) {
                data.set("userVerification", om.valueToTree(this.getUserVerification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolWebAuthnConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolWebAuthnConfiguration.Jsii$Proxy that = (CognitoUserPoolWebAuthnConfiguration.Jsii$Proxy) o;

            if (this.relyingPartyId != null ? !this.relyingPartyId.equals(that.relyingPartyId) : that.relyingPartyId != null) return false;
            return this.userVerification != null ? this.userVerification.equals(that.userVerification) : that.userVerification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.relyingPartyId != null ? this.relyingPartyId.hashCode() : 0;
            result = 31 * result + (this.userVerification != null ? this.userVerification.hashCode() : 0);
            return result;
        }
    }
}
