package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolUserPoolAddOns")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolUserPoolAddOns.Jsii$Proxy.class)
public interface CognitoUserPoolUserPoolAddOns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#advanced_security_mode CognitoUserPool#advanced_security_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAdvancedSecurityMode();

    /**
     * advanced_security_additional_flows block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#advanced_security_additional_flows CognitoUserPool#advanced_security_additional_flows}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows getAdvancedSecurityAdditionalFlows() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolUserPoolAddOns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolUserPoolAddOns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolUserPoolAddOns> {
        java.lang.String advancedSecurityMode;
        imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows advancedSecurityAdditionalFlows;

        /**
         * Sets the value of {@link CognitoUserPoolUserPoolAddOns#getAdvancedSecurityMode}
         * @param advancedSecurityMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#advanced_security_mode CognitoUserPool#advanced_security_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder advancedSecurityMode(java.lang.String advancedSecurityMode) {
            this.advancedSecurityMode = advancedSecurityMode;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolUserPoolAddOns#getAdvancedSecurityAdditionalFlows}
         * @param advancedSecurityAdditionalFlows advanced_security_additional_flows block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#advanced_security_additional_flows CognitoUserPool#advanced_security_additional_flows}
         * @return {@code this}
         */
        public Builder advancedSecurityAdditionalFlows(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows advancedSecurityAdditionalFlows) {
            this.advancedSecurityAdditionalFlows = advancedSecurityAdditionalFlows;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolUserPoolAddOns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolUserPoolAddOns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolUserPoolAddOns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolUserPoolAddOns {
        private final java.lang.String advancedSecurityMode;
        private final imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows advancedSecurityAdditionalFlows;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.advancedSecurityMode = software.amazon.jsii.Kernel.get(this, "advancedSecurityMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.advancedSecurityAdditionalFlows = software.amazon.jsii.Kernel.get(this, "advancedSecurityAdditionalFlows", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.advancedSecurityMode = java.util.Objects.requireNonNull(builder.advancedSecurityMode, "advancedSecurityMode is required");
            this.advancedSecurityAdditionalFlows = builder.advancedSecurityAdditionalFlows;
        }

        @Override
        public final java.lang.String getAdvancedSecurityMode() {
            return this.advancedSecurityMode;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOnsAdvancedSecurityAdditionalFlows getAdvancedSecurityAdditionalFlows() {
            return this.advancedSecurityAdditionalFlows;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("advancedSecurityMode", om.valueToTree(this.getAdvancedSecurityMode()));
            if (this.getAdvancedSecurityAdditionalFlows() != null) {
                data.set("advancedSecurityAdditionalFlows", om.valueToTree(this.getAdvancedSecurityAdditionalFlows()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolUserPoolAddOns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolUserPoolAddOns.Jsii$Proxy that = (CognitoUserPoolUserPoolAddOns.Jsii$Proxy) o;

            if (!advancedSecurityMode.equals(that.advancedSecurityMode)) return false;
            return this.advancedSecurityAdditionalFlows != null ? this.advancedSecurityAdditionalFlows.equals(that.advancedSecurityAdditionalFlows) : that.advancedSecurityAdditionalFlows == null;
        }

        @Override
        public final int hashCode() {
            int result = this.advancedSecurityMode.hashCode();
            result = 31 * result + (this.advancedSecurityAdditionalFlows != null ? this.advancedSecurityAdditionalFlows.hashCode() : 0);
            return result;
        }
    }
}
