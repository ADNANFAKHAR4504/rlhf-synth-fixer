package imports.aws.s3_control_multi_region_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlMultiRegionAccessPoint.S3ControlMultiRegionAccessPointDetailsPublicAccessBlockOutputReference")
public class S3ControlMultiRegionAccessPointDetailsPublicAccessBlockOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlMultiRegionAccessPointDetailsPublicAccessBlockOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlMultiRegionAccessPointDetailsPublicAccessBlockOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlMultiRegionAccessPointDetailsPublicAccessBlockOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBlockPublicAcls() {
        software.amazon.jsii.Kernel.call(this, "resetBlockPublicAcls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlockPublicPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetBlockPublicPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnorePublicAcls() {
        software.amazon.jsii.Kernel.call(this, "resetIgnorePublicAcls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestrictPublicBuckets() {
        software.amazon.jsii.Kernel.call(this, "resetRestrictPublicBuckets", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicAclsInput() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicAclsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnorePublicAclsInput() {
        return software.amazon.jsii.Kernel.get(this, "ignorePublicAclsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRestrictPublicBucketsInput() {
        return software.amazon.jsii.Kernel.get(this, "restrictPublicBucketsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBlockPublicAcls() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBlockPublicAcls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicAcls", java.util.Objects.requireNonNull(value, "blockPublicAcls is required"));
    }

    public void setBlockPublicAcls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicAcls", java.util.Objects.requireNonNull(value, "blockPublicAcls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBlockPublicPolicy() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBlockPublicPolicy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicPolicy", java.util.Objects.requireNonNull(value, "blockPublicPolicy is required"));
    }

    public void setBlockPublicPolicy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicPolicy", java.util.Objects.requireNonNull(value, "blockPublicPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnorePublicAcls() {
        return software.amazon.jsii.Kernel.get(this, "ignorePublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnorePublicAcls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignorePublicAcls", java.util.Objects.requireNonNull(value, "ignorePublicAcls is required"));
    }

    public void setIgnorePublicAcls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignorePublicAcls", java.util.Objects.requireNonNull(value, "ignorePublicAcls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRestrictPublicBuckets() {
        return software.amazon.jsii.Kernel.get(this, "restrictPublicBuckets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRestrictPublicBuckets(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "restrictPublicBuckets", java.util.Objects.requireNonNull(value, "restrictPublicBuckets is required"));
    }

    public void setRestrictPublicBuckets(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "restrictPublicBuckets", java.util.Objects.requireNonNull(value, "restrictPublicBuckets is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
