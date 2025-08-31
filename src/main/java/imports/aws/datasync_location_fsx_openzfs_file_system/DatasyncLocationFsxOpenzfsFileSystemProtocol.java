package imports.aws.datasync_location_fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOpenzfsFileSystem.DatasyncLocationFsxOpenzfsFileSystemProtocol")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationFsxOpenzfsFileSystemProtocol.Jsii$Proxy.class)
public interface DatasyncLocationFsxOpenzfsFileSystemProtocol extends software.amazon.jsii.JsiiSerializable {

    /**
     * nfs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_openzfs_file_system#nfs DatasyncLocationFsxOpenzfsFileSystem#nfs}
     */
    @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs getNfs();

    /**
     * @return a {@link Builder} of {@link DatasyncLocationFsxOpenzfsFileSystemProtocol}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationFsxOpenzfsFileSystemProtocol}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationFsxOpenzfsFileSystemProtocol> {
        imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs nfs;

        /**
         * Sets the value of {@link DatasyncLocationFsxOpenzfsFileSystemProtocol#getNfs}
         * @param nfs nfs block. This parameter is required.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_openzfs_file_system#nfs DatasyncLocationFsxOpenzfsFileSystem#nfs}
         * @return {@code this}
         */
        public Builder nfs(imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs nfs) {
            this.nfs = nfs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationFsxOpenzfsFileSystemProtocol}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationFsxOpenzfsFileSystemProtocol build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationFsxOpenzfsFileSystemProtocol}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationFsxOpenzfsFileSystemProtocol {
        private final imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs nfs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nfs = software.amazon.jsii.Kernel.get(this, "nfs", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nfs = java.util.Objects.requireNonNull(builder.nfs, "nfs is required");
        }

        @Override
        public final imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs getNfs() {
            return this.nfs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("nfs", om.valueToTree(this.getNfs()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationFsxOpenzfsFileSystem.DatasyncLocationFsxOpenzfsFileSystemProtocol"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationFsxOpenzfsFileSystemProtocol.Jsii$Proxy that = (DatasyncLocationFsxOpenzfsFileSystemProtocol.Jsii$Proxy) o;

            return this.nfs.equals(that.nfs);
        }

        @Override
        public final int hashCode() {
            int result = this.nfs.hashCode();
            return result;
        }
    }
}
