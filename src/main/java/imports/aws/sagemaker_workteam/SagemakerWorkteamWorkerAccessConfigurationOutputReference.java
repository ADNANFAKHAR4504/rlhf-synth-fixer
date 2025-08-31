package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationOutputReference")
public class SagemakerWorkteamWorkerAccessConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkteamWorkerAccessConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkteamWorkerAccessConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkteamWorkerAccessConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3Presign(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign value) {
        software.amazon.jsii.Kernel.call(this, "putS3Presign", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetS3Presign() {
        software.amazon.jsii.Kernel.call(this, "resetS3Presign", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference getS3Presign() {
        return software.amazon.jsii.Kernel.get(this, "s3Presign", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign getS3PresignInput() {
        return software.amazon.jsii.Kernel.get(this, "s3PresignInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
