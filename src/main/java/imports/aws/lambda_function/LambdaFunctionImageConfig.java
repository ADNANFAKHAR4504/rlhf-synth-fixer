package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionImageConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionImageConfig.Jsii$Proxy.class)
public interface LambdaFunctionImageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#command LambdaFunction#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#entry_point LambdaFunction#entry_point}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEntryPoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#working_directory LambdaFunction#working_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkingDirectory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionImageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionImageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionImageConfig> {
        java.util.List<java.lang.String> command;
        java.util.List<java.lang.String> entryPoint;
        java.lang.String workingDirectory;

        /**
         * Sets the value of {@link LambdaFunctionImageConfig#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#command LambdaFunction#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionImageConfig#getEntryPoint}
         * @param entryPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#entry_point LambdaFunction#entry_point}.
         * @return {@code this}
         */
        public Builder entryPoint(java.util.List<java.lang.String> entryPoint) {
            this.entryPoint = entryPoint;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionImageConfig#getWorkingDirectory}
         * @param workingDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#working_directory LambdaFunction#working_directory}.
         * @return {@code this}
         */
        public Builder workingDirectory(java.lang.String workingDirectory) {
            this.workingDirectory = workingDirectory;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionImageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionImageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionImageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionImageConfig {
        private final java.util.List<java.lang.String> command;
        private final java.util.List<java.lang.String> entryPoint;
        private final java.lang.String workingDirectory;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.entryPoint = software.amazon.jsii.Kernel.get(this, "entryPoint", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.workingDirectory = software.amazon.jsii.Kernel.get(this, "workingDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.command = builder.command;
            this.entryPoint = builder.entryPoint;
            this.workingDirectory = builder.workingDirectory;
        }

        @Override
        public final java.util.List<java.lang.String> getCommand() {
            return this.command;
        }

        @Override
        public final java.util.List<java.lang.String> getEntryPoint() {
            return this.entryPoint;
        }

        @Override
        public final java.lang.String getWorkingDirectory() {
            return this.workingDirectory;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCommand() != null) {
                data.set("command", om.valueToTree(this.getCommand()));
            }
            if (this.getEntryPoint() != null) {
                data.set("entryPoint", om.valueToTree(this.getEntryPoint()));
            }
            if (this.getWorkingDirectory() != null) {
                data.set("workingDirectory", om.valueToTree(this.getWorkingDirectory()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionImageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionImageConfig.Jsii$Proxy that = (LambdaFunctionImageConfig.Jsii$Proxy) o;

            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.entryPoint != null ? !this.entryPoint.equals(that.entryPoint) : that.entryPoint != null) return false;
            return this.workingDirectory != null ? this.workingDirectory.equals(that.workingDirectory) : that.workingDirectory == null;
        }

        @Override
        public final int hashCode() {
            int result = this.command != null ? this.command.hashCode() : 0;
            result = 31 * result + (this.entryPoint != null ? this.entryPoint.hashCode() : 0);
            result = 31 * result + (this.workingDirectory != null ? this.workingDirectory.hashCode() : 0);
            return result;
        }
    }
}
