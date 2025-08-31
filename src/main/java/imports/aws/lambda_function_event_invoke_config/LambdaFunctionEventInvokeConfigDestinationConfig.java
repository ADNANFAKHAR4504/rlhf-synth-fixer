package imports.aws.lambda_function_event_invoke_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunctionEventInvokeConfig.LambdaFunctionEventInvokeConfigDestinationConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionEventInvokeConfigDestinationConfig.Jsii$Proxy.class)
public interface LambdaFunctionEventInvokeConfigDestinationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * on_failure block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#on_failure LambdaFunctionEventInvokeConfig#on_failure}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure getOnFailure() {
        return null;
    }

    /**
     * on_success block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#on_success LambdaFunctionEventInvokeConfig#on_success}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess getOnSuccess() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionEventInvokeConfigDestinationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionEventInvokeConfigDestinationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionEventInvokeConfigDestinationConfig> {
        imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure onFailure;
        imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess onSuccess;

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigDestinationConfig#getOnFailure}
         * @param onFailure on_failure block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#on_failure LambdaFunctionEventInvokeConfig#on_failure}
         * @return {@code this}
         */
        public Builder onFailure(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure onFailure) {
            this.onFailure = onFailure;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigDestinationConfig#getOnSuccess}
         * @param onSuccess on_success block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#on_success LambdaFunctionEventInvokeConfig#on_success}
         * @return {@code this}
         */
        public Builder onSuccess(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess onSuccess) {
            this.onSuccess = onSuccess;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionEventInvokeConfigDestinationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionEventInvokeConfigDestinationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionEventInvokeConfigDestinationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionEventInvokeConfigDestinationConfig {
        private final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure onFailure;
        private final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess onSuccess;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.onFailure = software.amazon.jsii.Kernel.get(this, "onFailure", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure.class));
            this.onSuccess = software.amazon.jsii.Kernel.get(this, "onSuccess", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.onFailure = builder.onFailure;
            this.onSuccess = builder.onSuccess;
        }

        @Override
        public final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnFailure getOnFailure() {
            return this.onFailure;
        }

        @Override
        public final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess getOnSuccess() {
            return this.onSuccess;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOnFailure() != null) {
                data.set("onFailure", om.valueToTree(this.getOnFailure()));
            }
            if (this.getOnSuccess() != null) {
                data.set("onSuccess", om.valueToTree(this.getOnSuccess()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunctionEventInvokeConfig.LambdaFunctionEventInvokeConfigDestinationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionEventInvokeConfigDestinationConfig.Jsii$Proxy that = (LambdaFunctionEventInvokeConfigDestinationConfig.Jsii$Proxy) o;

            if (this.onFailure != null ? !this.onFailure.equals(that.onFailure) : that.onFailure != null) return false;
            return this.onSuccess != null ? this.onSuccess.equals(that.onSuccess) : that.onSuccess == null;
        }

        @Override
        public final int hashCode() {
            int result = this.onFailure != null ? this.onFailure.hashCode() : 0;
            result = 31 * result + (this.onSuccess != null ? this.onSuccess.hashCode() : 0);
            return result;
        }
    }
}
