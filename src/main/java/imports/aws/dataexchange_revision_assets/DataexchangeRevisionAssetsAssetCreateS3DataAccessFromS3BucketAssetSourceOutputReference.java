package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.938Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceOutputReference")
public class DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putKmsKeysToGrant(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKmsKeysToGrant", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKeyPrefixes() {
        software.amazon.jsii.Kernel.call(this, "resetKeyPrefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeys() {
        software.amazon.jsii.Kernel.call(this, "resetKeys", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeysToGrant() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeysToGrant", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrantList getKmsKeysToGrant() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeysToGrant", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrantList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeyPrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "keyPrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeysInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "keysInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKmsKeysToGrantInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeysToGrantInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getKeyPrefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "keyPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setKeyPrefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "keyPrefixes", java.util.Objects.requireNonNull(value, "keyPrefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setKeys(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "keys", java.util.Objects.requireNonNull(value, "keys is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
