package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference")
public class SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkteamWorkerAccessConfigurationS3PresignOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIamPolicyConstraints(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints value) {
        software.amazon.jsii.Kernel.call(this, "putIamPolicyConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIamPolicyConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetIamPolicyConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference getIamPolicyConstraints() {
        return software.amazon.jsii.Kernel.get(this, "iamPolicyConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints getIamPolicyConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "iamPolicyConstraintsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
