package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemDataReadCacheConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxLustreFileSystemDataReadCacheConfiguration.Jsii$Proxy.class)
public interface FsxLustreFileSystemDataReadCacheConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#sizing_mode FsxLustreFileSystem#sizing_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSizingMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#size FsxLustreFileSystem#size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxLustreFileSystemDataReadCacheConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxLustreFileSystemDataReadCacheConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxLustreFileSystemDataReadCacheConfiguration> {
        java.lang.String sizingMode;
        java.lang.Number size;

        /**
         * Sets the value of {@link FsxLustreFileSystemDataReadCacheConfiguration#getSizingMode}
         * @param sizingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#sizing_mode FsxLustreFileSystem#sizing_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder sizingMode(java.lang.String sizingMode) {
            this.sizingMode = sizingMode;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemDataReadCacheConfiguration#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#size FsxLustreFileSystem#size}.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxLustreFileSystemDataReadCacheConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxLustreFileSystemDataReadCacheConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxLustreFileSystemDataReadCacheConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxLustreFileSystemDataReadCacheConfiguration {
        private final java.lang.String sizingMode;
        private final java.lang.Number size;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sizingMode = software.amazon.jsii.Kernel.get(this, "sizingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sizingMode = java.util.Objects.requireNonNull(builder.sizingMode, "sizingMode is required");
            this.size = builder.size;
        }

        @Override
        public final java.lang.String getSizingMode() {
            return this.sizingMode;
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sizingMode", om.valueToTree(this.getSizingMode()));
            if (this.getSize() != null) {
                data.set("size", om.valueToTree(this.getSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxLustreFileSystem.FsxLustreFileSystemDataReadCacheConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxLustreFileSystemDataReadCacheConfiguration.Jsii$Proxy that = (FsxLustreFileSystemDataReadCacheConfiguration.Jsii$Proxy) o;

            if (!sizingMode.equals(that.sizingMode)) return false;
            return this.size != null ? this.size.equals(that.size) : that.size == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sizingMode.hashCode();
            result = 31 * result + (this.size != null ? this.size.hashCode() : 0);
            return result;
        }
    }
}
