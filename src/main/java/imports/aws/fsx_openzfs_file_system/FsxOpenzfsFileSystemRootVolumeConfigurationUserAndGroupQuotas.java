package imports.aws.fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas.Jsii$Proxy.class)
public interface FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#id FsxOpenzfsFileSystem#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#storage_capacity_quota_gib FsxOpenzfsFileSystem#storage_capacity_quota_gib}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacityQuotaGib();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#type FsxOpenzfsFileSystem#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas> {
        java.lang.Number id;
        java.lang.Number storageCapacityQuotaGib;
        java.lang.String type;

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#id FsxOpenzfsFileSystem#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.Number id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas#getStorageCapacityQuotaGib}
         * @param storageCapacityQuotaGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#storage_capacity_quota_gib FsxOpenzfsFileSystem#storage_capacity_quota_gib}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageCapacityQuotaGib(java.lang.Number storageCapacityQuotaGib) {
            this.storageCapacityQuotaGib = storageCapacityQuotaGib;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_file_system#type FsxOpenzfsFileSystem#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas {
        private final java.lang.Number id;
        private final java.lang.Number storageCapacityQuotaGib;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageCapacityQuotaGib = software.amazon.jsii.Kernel.get(this, "storageCapacityQuotaGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.storageCapacityQuotaGib = java.util.Objects.requireNonNull(builder.storageCapacityQuotaGib, "storageCapacityQuotaGib is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.Number getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getStorageCapacityQuotaGib() {
            return this.storageCapacityQuotaGib;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            data.set("storageCapacityQuotaGib", om.valueToTree(this.getStorageCapacityQuotaGib()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas.Jsii$Proxy that = (FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (!storageCapacityQuotaGib.equals(that.storageCapacityQuotaGib)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.storageCapacityQuotaGib.hashCode());
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
