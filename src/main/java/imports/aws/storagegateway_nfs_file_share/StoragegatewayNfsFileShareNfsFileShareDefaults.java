package imports.aws.storagegateway_nfs_file_share;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.534Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayNfsFileShare.StoragegatewayNfsFileShareNfsFileShareDefaults")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayNfsFileShareNfsFileShareDefaults.Jsii$Proxy.class)
public interface StoragegatewayNfsFileShareNfsFileShareDefaults extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#directory_mode StoragegatewayNfsFileShare#directory_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_mode StoragegatewayNfsFileShare#file_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#group_id StoragegatewayNfsFileShare#group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#owner_id StoragegatewayNfsFileShare#owner_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnerId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayNfsFileShareNfsFileShareDefaults}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayNfsFileShareNfsFileShareDefaults}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayNfsFileShareNfsFileShareDefaults> {
        java.lang.String directoryMode;
        java.lang.String fileMode;
        java.lang.String groupId;
        java.lang.String ownerId;

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareNfsFileShareDefaults#getDirectoryMode}
         * @param directoryMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#directory_mode StoragegatewayNfsFileShare#directory_mode}.
         * @return {@code this}
         */
        public Builder directoryMode(java.lang.String directoryMode) {
            this.directoryMode = directoryMode;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareNfsFileShareDefaults#getFileMode}
         * @param fileMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_mode StoragegatewayNfsFileShare#file_mode}.
         * @return {@code this}
         */
        public Builder fileMode(java.lang.String fileMode) {
            this.fileMode = fileMode;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareNfsFileShareDefaults#getGroupId}
         * @param groupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#group_id StoragegatewayNfsFileShare#group_id}.
         * @return {@code this}
         */
        public Builder groupId(java.lang.String groupId) {
            this.groupId = groupId;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareNfsFileShareDefaults#getOwnerId}
         * @param ownerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#owner_id StoragegatewayNfsFileShare#owner_id}.
         * @return {@code this}
         */
        public Builder ownerId(java.lang.String ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link StoragegatewayNfsFileShareNfsFileShareDefaults}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayNfsFileShareNfsFileShareDefaults build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayNfsFileShareNfsFileShareDefaults}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayNfsFileShareNfsFileShareDefaults {
        private final java.lang.String directoryMode;
        private final java.lang.String fileMode;
        private final java.lang.String groupId;
        private final java.lang.String ownerId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.directoryMode = software.amazon.jsii.Kernel.get(this, "directoryMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileMode = software.amazon.jsii.Kernel.get(this, "fileMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupId = software.amazon.jsii.Kernel.get(this, "groupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownerId = software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.directoryMode = builder.directoryMode;
            this.fileMode = builder.fileMode;
            this.groupId = builder.groupId;
            this.ownerId = builder.ownerId;
        }

        @Override
        public final java.lang.String getDirectoryMode() {
            return this.directoryMode;
        }

        @Override
        public final java.lang.String getFileMode() {
            return this.fileMode;
        }

        @Override
        public final java.lang.String getGroupId() {
            return this.groupId;
        }

        @Override
        public final java.lang.String getOwnerId() {
            return this.ownerId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDirectoryMode() != null) {
                data.set("directoryMode", om.valueToTree(this.getDirectoryMode()));
            }
            if (this.getFileMode() != null) {
                data.set("fileMode", om.valueToTree(this.getFileMode()));
            }
            if (this.getGroupId() != null) {
                data.set("groupId", om.valueToTree(this.getGroupId()));
            }
            if (this.getOwnerId() != null) {
                data.set("ownerId", om.valueToTree(this.getOwnerId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.storagegatewayNfsFileShare.StoragegatewayNfsFileShareNfsFileShareDefaults"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayNfsFileShareNfsFileShareDefaults.Jsii$Proxy that = (StoragegatewayNfsFileShareNfsFileShareDefaults.Jsii$Proxy) o;

            if (this.directoryMode != null ? !this.directoryMode.equals(that.directoryMode) : that.directoryMode != null) return false;
            if (this.fileMode != null ? !this.fileMode.equals(that.fileMode) : that.fileMode != null) return false;
            if (this.groupId != null ? !this.groupId.equals(that.groupId) : that.groupId != null) return false;
            return this.ownerId != null ? this.ownerId.equals(that.ownerId) : that.ownerId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.directoryMode != null ? this.directoryMode.hashCode() : 0;
            result = 31 * result + (this.fileMode != null ? this.fileMode.hashCode() : 0);
            result = 31 * result + (this.groupId != null ? this.groupId.hashCode() : 0);
            result = 31 * result + (this.ownerId != null ? this.ownerId.hashCode() : 0);
            return result;
        }
    }
}
