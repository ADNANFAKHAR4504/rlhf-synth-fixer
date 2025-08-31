package imports.aws.appsync_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncFunction.AppsyncFunctionRuntime")
@software.amazon.jsii.Jsii.Proxy(AppsyncFunctionRuntime.Jsii$Proxy.class)
public interface AppsyncFunctionRuntime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#runtime_version AppsyncFunction#runtime_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersion();

    /**
     * @return a {@link Builder} of {@link AppsyncFunctionRuntime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncFunctionRuntime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncFunctionRuntime> {
        java.lang.String name;
        java.lang.String runtimeVersion;

        /**
         * Sets the value of {@link AppsyncFunctionRuntime#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#name AppsyncFunction#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncFunctionRuntime#getRuntimeVersion}
         * @param runtimeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#runtime_version AppsyncFunction#runtime_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder runtimeVersion(java.lang.String runtimeVersion) {
            this.runtimeVersion = runtimeVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncFunctionRuntime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncFunctionRuntime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncFunctionRuntime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncFunctionRuntime {
        private final java.lang.String name;
        private final java.lang.String runtimeVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runtimeVersion = software.amazon.jsii.Kernel.get(this, "runtimeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.runtimeVersion = java.util.Objects.requireNonNull(builder.runtimeVersion, "runtimeVersion is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRuntimeVersion() {
            return this.runtimeVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("runtimeVersion", om.valueToTree(this.getRuntimeVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncFunction.AppsyncFunctionRuntime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncFunctionRuntime.Jsii$Proxy that = (AppsyncFunctionRuntime.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.runtimeVersion.equals(that.runtimeVersion);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.runtimeVersion.hashCode());
            return result;
        }
    }
}
