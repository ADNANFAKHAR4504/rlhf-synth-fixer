package imports.aws.datasync_location_s3;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.949Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationS3.DatasyncLocationS3S3ConfigOutputReference")
public class DatasyncLocationS3S3ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationS3S3ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationS3S3ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationS3S3ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "bucketAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketAccessRoleArn", java.util.Objects.requireNonNull(value, "bucketAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_s3.DatasyncLocationS3S3Config getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_s3.DatasyncLocationS3S3Config.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_s3.DatasyncLocationS3S3Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
