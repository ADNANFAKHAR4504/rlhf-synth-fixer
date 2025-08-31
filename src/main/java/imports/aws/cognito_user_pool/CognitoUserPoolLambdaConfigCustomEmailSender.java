package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolLambdaConfigCustomEmailSender")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolLambdaConfigCustomEmailSender.Jsii$Proxy.class)
public interface CognitoUserPoolLambdaConfigCustomEmailSender extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_arn CognitoUserPool#lambda_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLambdaArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_version CognitoUserPool#lambda_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLambdaVersion();

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolLambdaConfigCustomEmailSender}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolLambdaConfigCustomEmailSender}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolLambdaConfigCustomEmailSender> {
        java.lang.String lambdaArn;
        java.lang.String lambdaVersion;

        /**
         * Sets the value of {@link CognitoUserPoolLambdaConfigCustomEmailSender#getLambdaArn}
         * @param lambdaArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_arn CognitoUserPool#lambda_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder lambdaArn(java.lang.String lambdaArn) {
            this.lambdaArn = lambdaArn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolLambdaConfigCustomEmailSender#getLambdaVersion}
         * @param lambdaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_version CognitoUserPool#lambda_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder lambdaVersion(java.lang.String lambdaVersion) {
            this.lambdaVersion = lambdaVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolLambdaConfigCustomEmailSender}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolLambdaConfigCustomEmailSender build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolLambdaConfigCustomEmailSender}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolLambdaConfigCustomEmailSender {
        private final java.lang.String lambdaArn;
        private final java.lang.String lambdaVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lambdaArn = software.amazon.jsii.Kernel.get(this, "lambdaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaVersion = software.amazon.jsii.Kernel.get(this, "lambdaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lambdaArn = java.util.Objects.requireNonNull(builder.lambdaArn, "lambdaArn is required");
            this.lambdaVersion = java.util.Objects.requireNonNull(builder.lambdaVersion, "lambdaVersion is required");
        }

        @Override
        public final java.lang.String getLambdaArn() {
            return this.lambdaArn;
        }

        @Override
        public final java.lang.String getLambdaVersion() {
            return this.lambdaVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("lambdaArn", om.valueToTree(this.getLambdaArn()));
            data.set("lambdaVersion", om.valueToTree(this.getLambdaVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolLambdaConfigCustomEmailSender"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolLambdaConfigCustomEmailSender.Jsii$Proxy that = (CognitoUserPoolLambdaConfigCustomEmailSender.Jsii$Proxy) o;

            if (!lambdaArn.equals(that.lambdaArn)) return false;
            return this.lambdaVersion.equals(that.lambdaVersion);
        }

        @Override
        public final int hashCode() {
            int result = this.lambdaArn.hashCode();
            result = 31 * result + (this.lambdaVersion.hashCode());
            return result;
        }
    }
}
