package imports.aws.fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsFileSystemRootVolumeConfiguration.Jsii$Proxy.class)
public interface FsxOpenzfsFileSystemRootVolumeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#copy_tags_to_snapshots FsxOpenzfsFileSystem#copy_tags_to_snapshots}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshots() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#data_compression_type FsxOpenzfsFileSystem#data_compression_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionType() {
        return null;
    }

    /**
     * nfs_exports block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#nfs_exports FsxOpenzfsFileSystem#nfs_exports}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports getNfsExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#read_only FsxOpenzfsFileSystem#read_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#record_size_kib FsxOpenzfsFileSystem#record_size_kib}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRecordSizeKib() {
        return null;
    }

    /**
     * user_and_group_quotas block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#user_and_group_quotas FsxOpenzfsFileSystem#user_and_group_quotas}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserAndGroupQuotas() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsFileSystemRootVolumeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsFileSystemRootVolumeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsFileSystemRootVolumeConfiguration> {
        java.lang.Object copyTagsToSnapshots;
        java.lang.String dataCompressionType;
        imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports nfsExports;
        java.lang.Object readOnly;
        java.lang.Number recordSizeKib;
        java.lang.Object userAndGroupQuotas;

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getCopyTagsToSnapshots}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#copy_tags_to_snapshots FsxOpenzfsFileSystem#copy_tags_to_snapshots}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshots(java.lang.Boolean copyTagsToSnapshots) {
            this.copyTagsToSnapshots = copyTagsToSnapshots;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getCopyTagsToSnapshots}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#copy_tags_to_snapshots FsxOpenzfsFileSystem#copy_tags_to_snapshots}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshots(com.hashicorp.cdktf.IResolvable copyTagsToSnapshots) {
            this.copyTagsToSnapshots = copyTagsToSnapshots;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getDataCompressionType}
         * @param dataCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#data_compression_type FsxOpenzfsFileSystem#data_compression_type}.
         * @return {@code this}
         */
        public Builder dataCompressionType(java.lang.String dataCompressionType) {
            this.dataCompressionType = dataCompressionType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getNfsExports}
         * @param nfsExports nfs_exports block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#nfs_exports FsxOpenzfsFileSystem#nfs_exports}
         * @return {@code this}
         */
        public Builder nfsExports(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports nfsExports) {
            this.nfsExports = nfsExports;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#read_only FsxOpenzfsFileSystem#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(java.lang.Boolean readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#read_only FsxOpenzfsFileSystem#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(com.hashicorp.cdktf.IResolvable readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getRecordSizeKib}
         * @param recordSizeKib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#record_size_kib FsxOpenzfsFileSystem#record_size_kib}.
         * @return {@code this}
         */
        public Builder recordSizeKib(java.lang.Number recordSizeKib) {
            this.recordSizeKib = recordSizeKib;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getUserAndGroupQuotas}
         * @param userAndGroupQuotas user_and_group_quotas block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#user_and_group_quotas FsxOpenzfsFileSystem#user_and_group_quotas}
         * @return {@code this}
         */
        public Builder userAndGroupQuotas(com.hashicorp.cdktf.IResolvable userAndGroupQuotas) {
            this.userAndGroupQuotas = userAndGroupQuotas;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfiguration#getUserAndGroupQuotas}
         * @param userAndGroupQuotas user_and_group_quotas block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#user_and_group_quotas FsxOpenzfsFileSystem#user_and_group_quotas}
         * @return {@code this}
         */
        public Builder userAndGroupQuotas(java.util.List<? extends imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas> userAndGroupQuotas) {
            this.userAndGroupQuotas = userAndGroupQuotas;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOpenzfsFileSystemRootVolumeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsFileSystemRootVolumeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsFileSystemRootVolumeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsFileSystemRootVolumeConfiguration {
        private final java.lang.Object copyTagsToSnapshots;
        private final java.lang.String dataCompressionType;
        private final imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports nfsExports;
        private final java.lang.Object readOnly;
        private final java.lang.Number recordSizeKib;
        private final java.lang.Object userAndGroupQuotas;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.copyTagsToSnapshots = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataCompressionType = software.amazon.jsii.Kernel.get(this, "dataCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nfsExports = software.amazon.jsii.Kernel.get(this, "nfsExports", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports.class));
            this.readOnly = software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recordSizeKib = software.amazon.jsii.Kernel.get(this, "recordSizeKib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.userAndGroupQuotas = software.amazon.jsii.Kernel.get(this, "userAndGroupQuotas", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.copyTagsToSnapshots = builder.copyTagsToSnapshots;
            this.dataCompressionType = builder.dataCompressionType;
            this.nfsExports = builder.nfsExports;
            this.readOnly = builder.readOnly;
            this.recordSizeKib = builder.recordSizeKib;
            this.userAndGroupQuotas = builder.userAndGroupQuotas;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshots() {
            return this.copyTagsToSnapshots;
        }

        @Override
        public final java.lang.String getDataCompressionType() {
            return this.dataCompressionType;
        }

        @Override
        public final imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports getNfsExports() {
            return this.nfsExports;
        }

        @Override
        public final java.lang.Object getReadOnly() {
            return this.readOnly;
        }

        @Override
        public final java.lang.Number getRecordSizeKib() {
            return this.recordSizeKib;
        }

        @Override
        public final java.lang.Object getUserAndGroupQuotas() {
            return this.userAndGroupQuotas;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCopyTagsToSnapshots() != null) {
                data.set("copyTagsToSnapshots", om.valueToTree(this.getCopyTagsToSnapshots()));
            }
            if (this.getDataCompressionType() != null) {
                data.set("dataCompressionType", om.valueToTree(this.getDataCompressionType()));
            }
            if (this.getNfsExports() != null) {
                data.set("nfsExports", om.valueToTree(this.getNfsExports()));
            }
            if (this.getReadOnly() != null) {
                data.set("readOnly", om.valueToTree(this.getReadOnly()));
            }
            if (this.getRecordSizeKib() != null) {
                data.set("recordSizeKib", om.valueToTree(this.getRecordSizeKib()));
            }
            if (this.getUserAndGroupQuotas() != null) {
                data.set("userAndGroupQuotas", om.valueToTree(this.getUserAndGroupQuotas()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsFileSystemRootVolumeConfiguration.Jsii$Proxy that = (FsxOpenzfsFileSystemRootVolumeConfiguration.Jsii$Proxy) o;

            if (this.copyTagsToSnapshots != null ? !this.copyTagsToSnapshots.equals(that.copyTagsToSnapshots) : that.copyTagsToSnapshots != null) return false;
            if (this.dataCompressionType != null ? !this.dataCompressionType.equals(that.dataCompressionType) : that.dataCompressionType != null) return false;
            if (this.nfsExports != null ? !this.nfsExports.equals(that.nfsExports) : that.nfsExports != null) return false;
            if (this.readOnly != null ? !this.readOnly.equals(that.readOnly) : that.readOnly != null) return false;
            if (this.recordSizeKib != null ? !this.recordSizeKib.equals(that.recordSizeKib) : that.recordSizeKib != null) return false;
            return this.userAndGroupQuotas != null ? this.userAndGroupQuotas.equals(that.userAndGroupQuotas) : that.userAndGroupQuotas == null;
        }

        @Override
        public final int hashCode() {
            int result = this.copyTagsToSnapshots != null ? this.copyTagsToSnapshots.hashCode() : 0;
            result = 31 * result + (this.dataCompressionType != null ? this.dataCompressionType.hashCode() : 0);
            result = 31 * result + (this.nfsExports != null ? this.nfsExports.hashCode() : 0);
            result = 31 * result + (this.readOnly != null ? this.readOnly.hashCode() : 0);
            result = 31 * result + (this.recordSizeKib != null ? this.recordSizeKib.hashCode() : 0);
            result = 31 * result + (this.userAndGroupQuotas != null ? this.userAndGroupQuotas.hashCode() : 0);
            return result;
        }
    }
}
