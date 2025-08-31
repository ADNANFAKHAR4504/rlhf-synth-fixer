package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersS3OutputReference")
public class QuicksightDataSourceParametersS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceParametersS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceParametersS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceParametersS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putManifestFileLocation(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation value) {
        software.amazon.jsii.Kernel.call(this, "putManifestFileLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocationOutputReference getManifestFileLocation() {
        return software.amazon.jsii.Kernel.get(this, "manifestFileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation getManifestFileLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "manifestFileLocationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3ManifestFileLocation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3 getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
