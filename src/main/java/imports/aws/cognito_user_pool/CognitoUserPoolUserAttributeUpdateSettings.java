package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserAttributeUpdateSettings")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolUserAttributeUpdateSettings.Jsii$Proxy.class)
public interface CognitoUserPoolUserAttributeUpdateSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#attributes_require_verification_before_update CognitoUserPool#attributes_require_verification_before_update}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAttributesRequireVerificationBeforeUpdate();

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolUserAttributeUpdateSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolUserAttributeUpdateSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolUserAttributeUpdateSettings> {
        java.util.List<java.lang.String> attributesRequireVerificationBeforeUpdate;

        /**
         * Sets the value of {@link CognitoUserPoolUserAttributeUpdateSettings#getAttributesRequireVerificationBeforeUpdate}
         * @param attributesRequireVerificationBeforeUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#attributes_require_verification_before_update CognitoUserPool#attributes_require_verification_before_update}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributesRequireVerificationBeforeUpdate(java.util.List<java.lang.String> attributesRequireVerificationBeforeUpdate) {
            this.attributesRequireVerificationBeforeUpdate = attributesRequireVerificationBeforeUpdate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolUserAttributeUpdateSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolUserAttributeUpdateSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolUserAttributeUpdateSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolUserAttributeUpdateSettings {
        private final java.util.List<java.lang.String> attributesRequireVerificationBeforeUpdate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributesRequireVerificationBeforeUpdate = software.amazon.jsii.Kernel.get(this, "attributesRequireVerificationBeforeUpdate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributesRequireVerificationBeforeUpdate = java.util.Objects.requireNonNull(builder.attributesRequireVerificationBeforeUpdate, "attributesRequireVerificationBeforeUpdate is required");
        }

        @Override
        public final java.util.List<java.lang.String> getAttributesRequireVerificationBeforeUpdate() {
            return this.attributesRequireVerificationBeforeUpdate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attributesRequireVerificationBeforeUpdate", om.valueToTree(this.getAttributesRequireVerificationBeforeUpdate()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolUserAttributeUpdateSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolUserAttributeUpdateSettings.Jsii$Proxy that = (CognitoUserPoolUserAttributeUpdateSettings.Jsii$Proxy) o;

            return this.attributesRequireVerificationBeforeUpdate.equals(that.attributesRequireVerificationBeforeUpdate);
        }

        @Override
        public final int hashCode() {
            int result = this.attributesRequireVerificationBeforeUpdate.hashCode();
            return result;
        }
    }
}
