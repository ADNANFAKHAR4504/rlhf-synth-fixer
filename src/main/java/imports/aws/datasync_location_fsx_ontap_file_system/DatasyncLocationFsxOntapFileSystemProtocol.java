package imports.aws.datasync_location_fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.945Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocol")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationFsxOntapFileSystemProtocol.Jsii$Proxy.class)
public interface DatasyncLocationFsxOntapFileSystemProtocol extends software.amazon.jsii.JsiiSerializable {

    /**
     * nfs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#nfs DatasyncLocationFsxOntapFileSystem#nfs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs getNfs() {
        return null;
    }

    /**
     * smb block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#smb DatasyncLocationFsxOntapFileSystem#smb}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb getSmb() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationFsxOntapFileSystemProtocol}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationFsxOntapFileSystemProtocol}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationFsxOntapFileSystemProtocol> {
        imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs nfs;
        imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb smb;

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocol#getNfs}
         * @param nfs nfs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#nfs DatasyncLocationFsxOntapFileSystem#nfs}
         * @return {@code this}
         */
        public Builder nfs(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs nfs) {
            this.nfs = nfs;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocol#getSmb}
         * @param smb smb block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#smb DatasyncLocationFsxOntapFileSystem#smb}
         * @return {@code this}
         */
        public Builder smb(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb smb) {
            this.smb = smb;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationFsxOntapFileSystemProtocol}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationFsxOntapFileSystemProtocol build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationFsxOntapFileSystemProtocol}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationFsxOntapFileSystemProtocol {
        private final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs nfs;
        private final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb smb;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nfs = software.amazon.jsii.Kernel.get(this, "nfs", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs.class));
            this.smb = software.amazon.jsii.Kernel.get(this, "smb", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nfs = builder.nfs;
            this.smb = builder.smb;
        }

        @Override
        public final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs getNfs() {
            return this.nfs;
        }

        @Override
        public final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb getSmb() {
            return this.smb;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNfs() != null) {
                data.set("nfs", om.valueToTree(this.getNfs()));
            }
            if (this.getSmb() != null) {
                data.set("smb", om.valueToTree(this.getSmb()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocol"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationFsxOntapFileSystemProtocol.Jsii$Proxy that = (DatasyncLocationFsxOntapFileSystemProtocol.Jsii$Proxy) o;

            if (this.nfs != null ? !this.nfs.equals(that.nfs) : that.nfs != null) return false;
            return this.smb != null ? this.smb.equals(that.smb) : that.smb == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nfs != null ? this.nfs.hashCode() : 0;
            result = 31 * result + (this.smb != null ? this.smb.hashCode() : 0);
            return result;
        }
    }
}
