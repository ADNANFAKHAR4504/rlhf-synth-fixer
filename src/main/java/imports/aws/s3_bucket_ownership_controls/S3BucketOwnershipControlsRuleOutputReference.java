package imports.aws.s3_bucket_ownership_controls;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketOwnershipControls.S3BucketOwnershipControlsRuleOutputReference")
public class S3BucketOwnershipControlsRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketOwnershipControlsRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketOwnershipControlsRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketOwnershipControlsRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectOwnershipInput() {
        return software.amazon.jsii.Kernel.get(this, "objectOwnershipInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectOwnership() {
        return software.amazon.jsii.Kernel.get(this, "objectOwnership", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectOwnership(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectOwnership", java.util.Objects.requireNonNull(value, "objectOwnership is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_ownership_controls.S3BucketOwnershipControlsRule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_ownership_controls.S3BucketOwnershipControlsRule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_ownership_controls.S3BucketOwnershipControlsRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
