package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableS3BucketSourceOutputReference")
public class DynamodbTableImportTableS3BucketSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableImportTableS3BucketSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableImportTableS3BucketSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DynamodbTableImportTableS3BucketSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetBucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetKeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "keyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "bucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketOwner", java.util.Objects.requireNonNull(value, "bucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyPrefix", java.util.Objects.requireNonNull(value, "keyPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
