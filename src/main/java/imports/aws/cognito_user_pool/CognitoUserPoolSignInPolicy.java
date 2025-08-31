package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSignInPolicy")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolSignInPolicy.Jsii$Proxy.class)
public interface CognitoUserPoolSignInPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#allowed_first_auth_factors CognitoUserPool#allowed_first_auth_factors}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedFirstAuthFactors() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolSignInPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolSignInPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolSignInPolicy> {
        java.util.List<java.lang.String> allowedFirstAuthFactors;

        /**
         * Sets the value of {@link CognitoUserPoolSignInPolicy#getAllowedFirstAuthFactors}
         * @param allowedFirstAuthFactors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#allowed_first_auth_factors CognitoUserPool#allowed_first_auth_factors}.
         * @return {@code this}
         */
        public Builder allowedFirstAuthFactors(java.util.List<java.lang.String> allowedFirstAuthFactors) {
            this.allowedFirstAuthFactors = allowedFirstAuthFactors;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolSignInPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolSignInPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolSignInPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolSignInPolicy {
        private final java.util.List<java.lang.String> allowedFirstAuthFactors;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowedFirstAuthFactors = software.amazon.jsii.Kernel.get(this, "allowedFirstAuthFactors", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowedFirstAuthFactors = builder.allowedFirstAuthFactors;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedFirstAuthFactors() {
            return this.allowedFirstAuthFactors;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowedFirstAuthFactors() != null) {
                data.set("allowedFirstAuthFactors", om.valueToTree(this.getAllowedFirstAuthFactors()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolSignInPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolSignInPolicy.Jsii$Proxy that = (CognitoUserPoolSignInPolicy.Jsii$Proxy) o;

            return this.allowedFirstAuthFactors != null ? this.allowedFirstAuthFactors.equals(that.allowedFirstAuthFactors) : that.allowedFirstAuthFactors == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowedFirstAuthFactors != null ? this.allowedFirstAuthFactors.hashCode() : 0;
            return result;
        }
    }
}
