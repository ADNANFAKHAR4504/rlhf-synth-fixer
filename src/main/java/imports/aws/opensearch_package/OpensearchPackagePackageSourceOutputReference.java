package imports.aws.opensearch_package;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.993Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchPackage.OpensearchPackagePackageSourceOutputReference")
public class OpensearchPackagePackageSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchPackagePackageSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchPackagePackageSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchPackagePackageSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketName", java.util.Objects.requireNonNull(value, "s3BucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Key() {
        return software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Key", java.util.Objects.requireNonNull(value, "s3Key is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_package.OpensearchPackagePackageSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_package.OpensearchPackagePackageSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_package.OpensearchPackagePackageSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
