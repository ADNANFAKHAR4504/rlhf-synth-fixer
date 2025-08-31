package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionDeadLetterConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionDeadLetterConfig.Jsii$Proxy.class)
public interface LambdaFunctionDeadLetterConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#target_arn LambdaFunction#target_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetArn();

    /**
     * @return a {@link Builder} of {@link LambdaFunctionDeadLetterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionDeadLetterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionDeadLetterConfig> {
        java.lang.String targetArn;

        /**
         * Sets the value of {@link LambdaFunctionDeadLetterConfig#getTargetArn}
         * @param targetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#target_arn LambdaFunction#target_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetArn(java.lang.String targetArn) {
            this.targetArn = targetArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionDeadLetterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionDeadLetterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionDeadLetterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionDeadLetterConfig {
        private final java.lang.String targetArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetArn = software.amazon.jsii.Kernel.get(this, "targetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetArn = java.util.Objects.requireNonNull(builder.targetArn, "targetArn is required");
        }

        @Override
        public final java.lang.String getTargetArn() {
            return this.targetArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetArn", om.valueToTree(this.getTargetArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionDeadLetterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionDeadLetterConfig.Jsii$Proxy that = (LambdaFunctionDeadLetterConfig.Jsii$Proxy) o;

            return this.targetArn.equals(that.targetArn);
        }

        @Override
        public final int hashCode() {
            int result = this.targetArn.hashCode();
            return result;
        }
    }
}
