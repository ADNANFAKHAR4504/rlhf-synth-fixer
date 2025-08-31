package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheDataRepositoryAssociation")
@software.amazon.jsii.Jsii.Proxy(FsxFileCacheDataRepositoryAssociation.Jsii$Proxy.class)
public interface FsxFileCacheDataRepositoryAssociation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_path FsxFileCache#data_repository_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataRepositoryPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_path FsxFileCache#file_cache_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileCachePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_subdirectories FsxFileCache#data_repository_subdirectories}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataRepositorySubdirectories() {
        return null;
    }

    /**
     * nfs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#nfs FsxFileCache#nfs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNfs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags FsxFileCache#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxFileCacheDataRepositoryAssociation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxFileCacheDataRepositoryAssociation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxFileCacheDataRepositoryAssociation> {
        java.lang.String dataRepositoryPath;
        java.lang.String fileCachePath;
        java.util.List<java.lang.String> dataRepositorySubdirectories;
        java.lang.Object nfs;
        java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getDataRepositoryPath}
         * @param dataRepositoryPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_path FsxFileCache#data_repository_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataRepositoryPath(java.lang.String dataRepositoryPath) {
            this.dataRepositoryPath = dataRepositoryPath;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getFileCachePath}
         * @param fileCachePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_path FsxFileCache#file_cache_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileCachePath(java.lang.String fileCachePath) {
            this.fileCachePath = fileCachePath;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getDataRepositorySubdirectories}
         * @param dataRepositorySubdirectories Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_subdirectories FsxFileCache#data_repository_subdirectories}.
         * @return {@code this}
         */
        public Builder dataRepositorySubdirectories(java.util.List<java.lang.String> dataRepositorySubdirectories) {
            this.dataRepositorySubdirectories = dataRepositorySubdirectories;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getNfs}
         * @param nfs nfs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#nfs FsxFileCache#nfs}
         * @return {@code this}
         */
        public Builder nfs(com.hashicorp.cdktf.IResolvable nfs) {
            this.nfs = nfs;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getNfs}
         * @param nfs nfs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#nfs FsxFileCache#nfs}
         * @return {@code this}
         */
        public Builder nfs(java.util.List<? extends imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfs> nfs) {
            this.nfs = nfs;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociation#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags FsxFileCache#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxFileCacheDataRepositoryAssociation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxFileCacheDataRepositoryAssociation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxFileCacheDataRepositoryAssociation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxFileCacheDataRepositoryAssociation {
        private final java.lang.String dataRepositoryPath;
        private final java.lang.String fileCachePath;
        private final java.util.List<java.lang.String> dataRepositorySubdirectories;
        private final java.lang.Object nfs;
        private final java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataRepositoryPath = software.amazon.jsii.Kernel.get(this, "dataRepositoryPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileCachePath = software.amazon.jsii.Kernel.get(this, "fileCachePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataRepositorySubdirectories = software.amazon.jsii.Kernel.get(this, "dataRepositorySubdirectories", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.nfs = software.amazon.jsii.Kernel.get(this, "nfs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataRepositoryPath = java.util.Objects.requireNonNull(builder.dataRepositoryPath, "dataRepositoryPath is required");
            this.fileCachePath = java.util.Objects.requireNonNull(builder.fileCachePath, "fileCachePath is required");
            this.dataRepositorySubdirectories = builder.dataRepositorySubdirectories;
            this.nfs = builder.nfs;
            this.tags = builder.tags;
        }

        @Override
        public final java.lang.String getDataRepositoryPath() {
            return this.dataRepositoryPath;
        }

        @Override
        public final java.lang.String getFileCachePath() {
            return this.fileCachePath;
        }

        @Override
        public final java.util.List<java.lang.String> getDataRepositorySubdirectories() {
            return this.dataRepositorySubdirectories;
        }

        @Override
        public final java.lang.Object getNfs() {
            return this.nfs;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataRepositoryPath", om.valueToTree(this.getDataRepositoryPath()));
            data.set("fileCachePath", om.valueToTree(this.getFileCachePath()));
            if (this.getDataRepositorySubdirectories() != null) {
                data.set("dataRepositorySubdirectories", om.valueToTree(this.getDataRepositorySubdirectories()));
            }
            if (this.getNfs() != null) {
                data.set("nfs", om.valueToTree(this.getNfs()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxFileCache.FsxFileCacheDataRepositoryAssociation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxFileCacheDataRepositoryAssociation.Jsii$Proxy that = (FsxFileCacheDataRepositoryAssociation.Jsii$Proxy) o;

            if (!dataRepositoryPath.equals(that.dataRepositoryPath)) return false;
            if (!fileCachePath.equals(that.fileCachePath)) return false;
            if (this.dataRepositorySubdirectories != null ? !this.dataRepositorySubdirectories.equals(that.dataRepositorySubdirectories) : that.dataRepositorySubdirectories != null) return false;
            if (this.nfs != null ? !this.nfs.equals(that.nfs) : that.nfs != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataRepositoryPath.hashCode();
            result = 31 * result + (this.fileCachePath.hashCode());
            result = 31 * result + (this.dataRepositorySubdirectories != null ? this.dataRepositorySubdirectories.hashCode() : 0);
            result = 31 * result + (this.nfs != null ? this.nfs.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
