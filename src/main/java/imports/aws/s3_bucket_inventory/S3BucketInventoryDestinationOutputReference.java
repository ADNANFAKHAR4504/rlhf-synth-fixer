package imports.aws.s3_bucket_inventory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketInventory.S3BucketInventoryDestinationOutputReference")
public class S3BucketInventoryDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketInventoryDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketInventoryDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketInventoryDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBucket(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucket value) {
        software.amazon.jsii.Kernel.call(this, "putBucket", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketOutputReference getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucket getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucket.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
