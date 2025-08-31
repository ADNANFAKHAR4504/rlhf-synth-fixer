package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.Jsii$Proxy.class)
public interface CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#custom_auth_mode CognitoUserPool#custom_auth_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomAuthMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows> {
        java.lang.String customAuthMode;

        /**
         * Sets the value of {@link CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows#getCustomAuthMode}
         * @param customAuthMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#custom_auth_mode CognitoUserPool#custom_auth_mode}.
         * @return {@code this}
         */
        public Builder customAuthMode(java.lang.String customAuthMode) {
            this.customAuthMode = customAuthMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows {
        private final java.lang.String customAuthMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customAuthMode = software.amazon.jsii.Kernel.get(this, "customAuthMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customAuthMode = builder.customAuthMode;
        }

        @Override
        public final java.lang.String getCustomAuthMode() {
            return this.customAuthMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomAuthMode() != null) {
                data.set("customAuthMode", om.valueToTree(this.getCustomAuthMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.Jsii$Proxy that = (CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.Jsii$Proxy) o;

            return this.customAuthMode != null ? this.customAuthMode.equals(that.customAuthMode) : that.customAuthMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customAuthMode != null ? this.customAuthMode.hashCode() : 0;
            return result;
        }
    }
}
