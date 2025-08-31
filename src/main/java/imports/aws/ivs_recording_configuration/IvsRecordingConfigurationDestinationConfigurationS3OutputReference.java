package imports.aws.ivs_recording_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivsRecordingConfiguration.IvsRecordingConfigurationDestinationConfigurationS3OutputReference")
public class IvsRecordingConfigurationDestinationConfigurationS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IvsRecordingConfigurationDestinationConfigurationS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IvsRecordingConfigurationDestinationConfigurationS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IvsRecordingConfigurationDestinationConfigurationS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfigurationS3 getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfigurationS3.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfigurationS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
