package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverRuntime")
@software.amazon.jsii.Jsii.Proxy(AppsyncResolverRuntime.Jsii$Proxy.class)
public interface AppsyncResolverRuntime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#name AppsyncResolver#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#runtime_version AppsyncResolver#runtime_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersion();

    /**
     * @return a {@link Builder} of {@link AppsyncResolverRuntime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncResolverRuntime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncResolverRuntime> {
        java.lang.String name;
        java.lang.String runtimeVersion;

        /**
         * Sets the value of {@link AppsyncResolverRuntime#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#name AppsyncResolver#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverRuntime#getRuntimeVersion}
         * @param runtimeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#runtime_version AppsyncResolver#runtime_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder runtimeVersion(java.lang.String runtimeVersion) {
            this.runtimeVersion = runtimeVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncResolverRuntime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncResolverRuntime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncResolverRuntime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncResolverRuntime {
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
            struct.set("fqn", om.valueToTree("aws.appsyncResolver.AppsyncResolverRuntime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncResolverRuntime.Jsii$Proxy that = (AppsyncResolverRuntime.Jsii$Proxy) o;

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
