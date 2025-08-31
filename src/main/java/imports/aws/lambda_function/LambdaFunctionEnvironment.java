package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionEnvironment")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionEnvironment.Jsii$Proxy.class)
public interface LambdaFunctionEnvironment extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#variables LambdaFunction#variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVariables() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionEnvironment}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionEnvironment}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionEnvironment> {
        java.util.Map<java.lang.String, java.lang.String> variables;

        /**
         * Sets the value of {@link LambdaFunctionEnvironment#getVariables}
         * @param variables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#variables LambdaFunction#variables}.
         * @return {@code this}
         */
        public Builder variables(java.util.Map<java.lang.String, java.lang.String> variables) {
            this.variables = variables;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionEnvironment}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionEnvironment build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionEnvironment}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionEnvironment {
        private final java.util.Map<java.lang.String, java.lang.String> variables;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.variables = software.amazon.jsii.Kernel.get(this, "variables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.variables = builder.variables;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getVariables() {
            return this.variables;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getVariables() != null) {
                data.set("variables", om.valueToTree(this.getVariables()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionEnvironment"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionEnvironment.Jsii$Proxy that = (LambdaFunctionEnvironment.Jsii$Proxy) o;

            return this.variables != null ? this.variables.equals(that.variables) : that.variables == null;
        }

        @Override
        public final int hashCode() {
            int result = this.variables != null ? this.variables.hashCode() : 0;
            return result;
        }
    }
}
