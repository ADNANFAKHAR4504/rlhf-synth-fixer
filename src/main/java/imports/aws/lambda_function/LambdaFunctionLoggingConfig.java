package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionLoggingConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionLoggingConfig.Jsii$Proxy.class)
public interface LambdaFunctionLoggingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#log_format LambdaFunction#log_format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#application_log_level LambdaFunction#application_log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationLogLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#log_group LambdaFunction#log_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#system_log_level LambdaFunction#system_log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSystemLogLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionLoggingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionLoggingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionLoggingConfig> {
        java.lang.String logFormat;
        java.lang.String applicationLogLevel;
        java.lang.String logGroup;
        java.lang.String systemLogLevel;

        /**
         * Sets the value of {@link LambdaFunctionLoggingConfig#getLogFormat}
         * @param logFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#log_format LambdaFunction#log_format}. This parameter is required.
         * @return {@code this}
         */
        public Builder logFormat(java.lang.String logFormat) {
            this.logFormat = logFormat;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionLoggingConfig#getApplicationLogLevel}
         * @param applicationLogLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#application_log_level LambdaFunction#application_log_level}.
         * @return {@code this}
         */
        public Builder applicationLogLevel(java.lang.String applicationLogLevel) {
            this.applicationLogLevel = applicationLogLevel;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionLoggingConfig#getLogGroup}
         * @param logGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#log_group LambdaFunction#log_group}.
         * @return {@code this}
         */
        public Builder logGroup(java.lang.String logGroup) {
            this.logGroup = logGroup;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionLoggingConfig#getSystemLogLevel}
         * @param systemLogLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#system_log_level LambdaFunction#system_log_level}.
         * @return {@code this}
         */
        public Builder systemLogLevel(java.lang.String systemLogLevel) {
            this.systemLogLevel = systemLogLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionLoggingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionLoggingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionLoggingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionLoggingConfig {
        private final java.lang.String logFormat;
        private final java.lang.String applicationLogLevel;
        private final java.lang.String logGroup;
        private final java.lang.String systemLogLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logFormat = software.amazon.jsii.Kernel.get(this, "logFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationLogLevel = software.amazon.jsii.Kernel.get(this, "applicationLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logGroup = software.amazon.jsii.Kernel.get(this, "logGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.systemLogLevel = software.amazon.jsii.Kernel.get(this, "systemLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logFormat = java.util.Objects.requireNonNull(builder.logFormat, "logFormat is required");
            this.applicationLogLevel = builder.applicationLogLevel;
            this.logGroup = builder.logGroup;
            this.systemLogLevel = builder.systemLogLevel;
        }

        @Override
        public final java.lang.String getLogFormat() {
            return this.logFormat;
        }

        @Override
        public final java.lang.String getApplicationLogLevel() {
            return this.applicationLogLevel;
        }

        @Override
        public final java.lang.String getLogGroup() {
            return this.logGroup;
        }

        @Override
        public final java.lang.String getSystemLogLevel() {
            return this.systemLogLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logFormat", om.valueToTree(this.getLogFormat()));
            if (this.getApplicationLogLevel() != null) {
                data.set("applicationLogLevel", om.valueToTree(this.getApplicationLogLevel()));
            }
            if (this.getLogGroup() != null) {
                data.set("logGroup", om.valueToTree(this.getLogGroup()));
            }
            if (this.getSystemLogLevel() != null) {
                data.set("systemLogLevel", om.valueToTree(this.getSystemLogLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionLoggingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionLoggingConfig.Jsii$Proxy that = (LambdaFunctionLoggingConfig.Jsii$Proxy) o;

            if (!logFormat.equals(that.logFormat)) return false;
            if (this.applicationLogLevel != null ? !this.applicationLogLevel.equals(that.applicationLogLevel) : that.applicationLogLevel != null) return false;
            if (this.logGroup != null ? !this.logGroup.equals(that.logGroup) : that.logGroup != null) return false;
            return this.systemLogLevel != null ? this.systemLogLevel.equals(that.systemLogLevel) : that.systemLogLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logFormat.hashCode();
            result = 31 * result + (this.applicationLogLevel != null ? this.applicationLogLevel.hashCode() : 0);
            result = 31 * result + (this.logGroup != null ? this.logGroup.hashCode() : 0);
            result = 31 * result + (this.systemLogLevel != null ? this.systemLogLevel.hashCode() : 0);
            return result;
        }
    }
}
