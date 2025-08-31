package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionTracingConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionTracingConfig.Jsii$Proxy.class)
public interface LambdaFunctionTracingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#mode LambdaFunction#mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMode();

    /**
     * @return a {@link Builder} of {@link LambdaFunctionTracingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionTracingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionTracingConfig> {
        java.lang.String mode;

        /**
         * Sets the value of {@link LambdaFunctionTracingConfig#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#mode LambdaFunction#mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionTracingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionTracingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionTracingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionTracingConfig {
        private final java.lang.String mode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mode = java.util.Objects.requireNonNull(builder.mode, "mode is required");
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mode", om.valueToTree(this.getMode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionTracingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionTracingConfig.Jsii$Proxy that = (LambdaFunctionTracingConfig.Jsii$Proxy) o;

            return this.mode.equals(that.mode);
        }

        @Override
        public final int hashCode() {
            int result = this.mode.hashCode();
            return result;
        }
    }
}
