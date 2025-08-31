package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.938Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetOutputReference")
public class DataexchangeRevisionAssetsAssetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataexchangeRevisionAssetsAssetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataexchangeRevisionAssetsAssetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataexchangeRevisionAssetsAssetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCreateS3DataAccessFromS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3Bucket>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3Bucket> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3Bucket>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3Bucket __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCreateS3DataAccessFromS3Bucket", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImportAssetsFromS3(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putImportAssetsFromS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImportAssetsFromSignedUrl(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrl>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrl> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrl>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrl __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putImportAssetsFromSignedUrl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCreateS3DataAccessFromS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetCreateS3DataAccessFromS3Bucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportAssetsFromS3() {
        software.amazon.jsii.Kernel.call(this, "resetImportAssetsFromS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportAssetsFromSignedUrl() {
        software.amazon.jsii.Kernel.call(this, "resetImportAssetsFromSignedUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketList getCreateS3DataAccessFromS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "createS3DataAccessFromS3Bucket", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3List getImportAssetsFromS3() {
        return software.amazon.jsii.Kernel.get(this, "importAssetsFromS3", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrlList getImportAssetsFromSignedUrl() {
        return software.amazon.jsii.Kernel.get(this, "importAssetsFromSignedUrl", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrlList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "updatedAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreateS3DataAccessFromS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "createS3DataAccessFromS3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImportAssetsFromS3Input() {
        return software.amazon.jsii.Kernel.get(this, "importAssetsFromS3Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImportAssetsFromSignedUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "importAssetsFromSignedUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAsset value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
