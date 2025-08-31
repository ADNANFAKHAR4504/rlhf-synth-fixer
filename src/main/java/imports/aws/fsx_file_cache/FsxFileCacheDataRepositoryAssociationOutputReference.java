package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheDataRepositoryAssociationOutputReference")
public class FsxFileCacheDataRepositoryAssociationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxFileCacheDataRepositoryAssociationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxFileCacheDataRepositoryAssociationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public FsxFileCacheDataRepositoryAssociationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putNfs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfs> __cast_cd4240 = (java.util.List<imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNfs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataRepositorySubdirectories() {
        software.amazon.jsii.Kernel.call(this, "resetDataRepositorySubdirectories", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNfs() {
        software.amazon.jsii.Kernel.call(this, "resetNfs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "associationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileCacheId() {
        return software.amazon.jsii.Kernel.get(this, "fileCacheId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemPath() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImportedFileChunkSize() {
        return software.amazon.jsii.Kernel.get(this, "importedFileChunkSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfsList getNfs() {
        return software.amazon.jsii.Kernel.get(this, "nfs", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociationNfsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataRepositoryPathInput() {
        return software.amazon.jsii.Kernel.get(this, "dataRepositoryPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataRepositorySubdirectoriesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dataRepositorySubdirectoriesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileCachePathInput() {
        return software.amazon.jsii.Kernel.get(this, "fileCachePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNfsInput() {
        return software.amazon.jsii.Kernel.get(this, "nfsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataRepositoryPath() {
        return software.amazon.jsii.Kernel.get(this, "dataRepositoryPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataRepositoryPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataRepositoryPath", java.util.Objects.requireNonNull(value, "dataRepositoryPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDataRepositorySubdirectories() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dataRepositorySubdirectories", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDataRepositorySubdirectories(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dataRepositorySubdirectories", java.util.Objects.requireNonNull(value, "dataRepositorySubdirectories is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileCachePath() {
        return software.amazon.jsii.Kernel.get(this, "fileCachePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileCachePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileCachePath", java.util.Objects.requireNonNull(value, "fileCachePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
