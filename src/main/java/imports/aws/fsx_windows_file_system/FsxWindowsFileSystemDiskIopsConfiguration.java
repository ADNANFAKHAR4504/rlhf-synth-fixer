package imports.aws.fsx_windows_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxWindowsFileSystem.FsxWindowsFileSystemDiskIopsConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxWindowsFileSystemDiskIopsConfiguration.Jsii$Proxy.class)
public interface FsxWindowsFileSystemDiskIopsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#iops FsxWindowsFileSystem#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#mode FsxWindowsFileSystem#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxWindowsFileSystemDiskIopsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxWindowsFileSystemDiskIopsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxWindowsFileSystemDiskIopsConfiguration> {
        java.lang.Number iops;
        java.lang.String mode;

        /**
         * Sets the value of {@link FsxWindowsFileSystemDiskIopsConfiguration#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#iops FsxWindowsFileSystem#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemDiskIopsConfiguration#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#mode FsxWindowsFileSystem#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxWindowsFileSystemDiskIopsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxWindowsFileSystemDiskIopsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxWindowsFileSystemDiskIopsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxWindowsFileSystemDiskIopsConfiguration {
        private final java.lang.Number iops;
        private final java.lang.String mode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.iops = builder.iops;
            this.mode = builder.mode;
        }

        @Override
        public final java.lang.Number getIops() {
            return this.iops;
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

            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxWindowsFileSystem.FsxWindowsFileSystemDiskIopsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxWindowsFileSystemDiskIopsConfiguration.Jsii$Proxy that = (FsxWindowsFileSystemDiskIopsConfiguration.Jsii$Proxy) o;

            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            return this.mode != null ? this.mode.equals(that.mode) : that.mode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.iops != null ? this.iops.hashCode() : 0;
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            return result;
        }
    }
}
