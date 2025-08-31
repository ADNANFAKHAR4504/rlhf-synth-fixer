package imports.aws.datasync_location_fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.945Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolNfs")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationFsxOntapFileSystemProtocolNfs.Jsii$Proxy.class)
public interface DatasyncLocationFsxOntapFileSystemProtocolNfs extends software.amazon.jsii.JsiiSerializable {

    /**
     * mount_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#mount_options DatasyncLocationFsxOntapFileSystem#mount_options}
     */
    @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions getMountOptions();

    /**
     * @return a {@link Builder} of {@link DatasyncLocationFsxOntapFileSystemProtocolNfs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationFsxOntapFileSystemProtocolNfs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationFsxOntapFileSystemProtocolNfs> {
        imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions mountOptions;

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocolNfs#getMountOptions}
         * @param mountOptions mount_options block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#mount_options DatasyncLocationFsxOntapFileSystem#mount_options}
         * @return {@code this}
         */
        public Builder mountOptions(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions mountOptions) {
            this.mountOptions = mountOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationFsxOntapFileSystemProtocolNfs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationFsxOntapFileSystemProtocolNfs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationFsxOntapFileSystemProtocolNfs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationFsxOntapFileSystemProtocolNfs {
        private final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions mountOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mountOptions = software.amazon.jsii.Kernel.get(this, "mountOptions", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mountOptions = java.util.Objects.requireNonNull(builder.mountOptions, "mountOptions is required");
        }

        @Override
        public final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions getMountOptions() {
            return this.mountOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mountOptions", om.valueToTree(this.getMountOptions()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolNfs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationFsxOntapFileSystemProtocolNfs.Jsii$Proxy that = (DatasyncLocationFsxOntapFileSystemProtocolNfs.Jsii$Proxy) o;

            return this.mountOptions.equals(that.mountOptions);
        }

        @Override
        public final int hashCode() {
            int result = this.mountOptions.hashCode();
            return result;
        }
    }
}
