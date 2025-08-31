package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSchemaNumberAttributeConstraints")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolSchemaNumberAttributeConstraints.Jsii$Proxy.class)
public interface CognitoUserPoolSchemaNumberAttributeConstraints extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#max_value CognitoUserPool#max_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#min_value CognitoUserPool#min_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMinValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolSchemaNumberAttributeConstraints}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolSchemaNumberAttributeConstraints}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolSchemaNumberAttributeConstraints> {
        java.lang.String maxValue;
        java.lang.String minValue;

        /**
         * Sets the value of {@link CognitoUserPoolSchemaNumberAttributeConstraints#getMaxValue}
         * @param maxValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#max_value CognitoUserPool#max_value}.
         * @return {@code this}
         */
        public Builder maxValue(java.lang.String maxValue) {
            this.maxValue = maxValue;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchemaNumberAttributeConstraints#getMinValue}
         * @param minValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#min_value CognitoUserPool#min_value}.
         * @return {@code this}
         */
        public Builder minValue(java.lang.String minValue) {
            this.minValue = minValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolSchemaNumberAttributeConstraints}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolSchemaNumberAttributeConstraints build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolSchemaNumberAttributeConstraints}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolSchemaNumberAttributeConstraints {
        private final java.lang.String maxValue;
        private final java.lang.String minValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxValue = software.amazon.jsii.Kernel.get(this, "maxValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minValue = software.amazon.jsii.Kernel.get(this, "minValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxValue = builder.maxValue;
            this.minValue = builder.minValue;
        }

        @Override
        public final java.lang.String getMaxValue() {
            return this.maxValue;
        }

        @Override
        public final java.lang.String getMinValue() {
            return this.minValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxValue() != null) {
                data.set("maxValue", om.valueToTree(this.getMaxValue()));
            }
            if (this.getMinValue() != null) {
                data.set("minValue", om.valueToTree(this.getMinValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolSchemaNumberAttributeConstraints"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolSchemaNumberAttributeConstraints.Jsii$Proxy that = (CognitoUserPoolSchemaNumberAttributeConstraints.Jsii$Proxy) o;

            if (this.maxValue != null ? !this.maxValue.equals(that.maxValue) : that.maxValue != null) return false;
            return this.minValue != null ? this.minValue.equals(that.minValue) : that.minValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxValue != null ? this.maxValue.hashCode() : 0;
            result = 31 * result + (this.minValue != null ? this.minValue.hashCode() : 0);
            return result;
        }
    }
}
