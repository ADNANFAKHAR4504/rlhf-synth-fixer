package imports.aws.s3_control_directory_bucket_access_point_scope;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlDirectoryBucketAccessPointScope.S3ControlDirectoryBucketAccessPointScopeScope")
@software.amazon.jsii.Jsii.Proxy(S3ControlDirectoryBucketAccessPointScopeScope.Jsii$Proxy.class)
public interface S3ControlDirectoryBucketAccessPointScopeScope extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_directory_bucket_access_point_scope#permissions S3ControlDirectoryBucketAccessPointScope#permissions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_directory_bucket_access_point_scope#prefixes S3ControlDirectoryBucketAccessPointScope#prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrefixes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlDirectoryBucketAccessPointScopeScope}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlDirectoryBucketAccessPointScopeScope}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlDirectoryBucketAccessPointScopeScope> {
        java.util.List<java.lang.String> permissions;
        java.util.List<java.lang.String> prefixes;

        /**
         * Sets the value of {@link S3ControlDirectoryBucketAccessPointScopeScope#getPermissions}
         * @param permissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_directory_bucket_access_point_scope#permissions S3ControlDirectoryBucketAccessPointScope#permissions}.
         * @return {@code this}
         */
        public Builder permissions(java.util.List<java.lang.String> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlDirectoryBucketAccessPointScopeScope#getPrefixes}
         * @param prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_directory_bucket_access_point_scope#prefixes S3ControlDirectoryBucketAccessPointScope#prefixes}.
         * @return {@code this}
         */
        public Builder prefixes(java.util.List<java.lang.String> prefixes) {
            this.prefixes = prefixes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlDirectoryBucketAccessPointScopeScope}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlDirectoryBucketAccessPointScopeScope build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlDirectoryBucketAccessPointScopeScope}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlDirectoryBucketAccessPointScopeScope {
        private final java.util.List<java.lang.String> permissions;
        private final java.util.List<java.lang.String> prefixes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.prefixes = software.amazon.jsii.Kernel.get(this, "prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.permissions = builder.permissions;
            this.prefixes = builder.prefixes;
        }

        @Override
        public final java.util.List<java.lang.String> getPermissions() {
            return this.permissions;
        }

        @Override
        public final java.util.List<java.lang.String> getPrefixes() {
            return this.prefixes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPermissions() != null) {
                data.set("permissions", om.valueToTree(this.getPermissions()));
            }
            if (this.getPrefixes() != null) {
                data.set("prefixes", om.valueToTree(this.getPrefixes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlDirectoryBucketAccessPointScope.S3ControlDirectoryBucketAccessPointScopeScope"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlDirectoryBucketAccessPointScopeScope.Jsii$Proxy that = (S3ControlDirectoryBucketAccessPointScopeScope.Jsii$Proxy) o;

            if (this.permissions != null ? !this.permissions.equals(that.permissions) : that.permissions != null) return false;
            return this.prefixes != null ? this.prefixes.equals(that.prefixes) : that.prefixes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.permissions != null ? this.permissions.hashCode() : 0;
            result = 31 * result + (this.prefixes != null ? this.prefixes.hashCode() : 0);
            return result;
        }
    }
}
