package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolEmailMfaConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolEmailMfaConfiguration.Jsii$Proxy.class)
public interface CognitoUserPoolEmailMfaConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#message CognitoUserPool#message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#subject CognitoUserPool#subject}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubject() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolEmailMfaConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolEmailMfaConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolEmailMfaConfiguration> {
        java.lang.String message;
        java.lang.String subject;

        /**
         * Sets the value of {@link CognitoUserPoolEmailMfaConfiguration#getMessage}
         * @param message Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#message CognitoUserPool#message}.
         * @return {@code this}
         */
        public Builder message(java.lang.String message) {
            this.message = message;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolEmailMfaConfiguration#getSubject}
         * @param subject Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#subject CognitoUserPool#subject}.
         * @return {@code this}
         */
        public Builder subject(java.lang.String subject) {
            this.subject = subject;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolEmailMfaConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolEmailMfaConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolEmailMfaConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolEmailMfaConfiguration {
        private final java.lang.String message;
        private final java.lang.String subject;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.message = software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subject = software.amazon.jsii.Kernel.get(this, "subject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.message = builder.message;
            this.subject = builder.subject;
        }

        @Override
        public final java.lang.String getMessage() {
            return this.message;
        }

        @Override
        public final java.lang.String getSubject() {
            return this.subject;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMessage() != null) {
                data.set("message", om.valueToTree(this.getMessage()));
            }
            if (this.getSubject() != null) {
                data.set("subject", om.valueToTree(this.getSubject()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolEmailMfaConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolEmailMfaConfiguration.Jsii$Proxy that = (CognitoUserPoolEmailMfaConfiguration.Jsii$Proxy) o;

            if (this.message != null ? !this.message.equals(that.message) : that.message != null) return false;
            return this.subject != null ? this.subject.equals(that.subject) : that.subject == null;
        }

        @Override
        public final int hashCode() {
            int result = this.message != null ? this.message.hashCode() : 0;
            result = 31 * result + (this.subject != null ? this.subject.hashCode() : 0);
            return result;
        }
    }
}
