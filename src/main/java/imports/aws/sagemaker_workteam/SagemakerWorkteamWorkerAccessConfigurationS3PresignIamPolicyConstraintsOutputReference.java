package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference")
public class SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraintsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSourceIp() {
        software.amazon.jsii.Kernel.call(this, "resetSourceIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcSourceIp() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSourceIp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceIpInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcSourceIpInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcSourceIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceIp() {
        return software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceIp", java.util.Objects.requireNonNull(value, "sourceIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcSourceIp() {
        return software.amazon.jsii.Kernel.get(this, "vpcSourceIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcSourceIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcSourceIp", java.util.Objects.requireNonNull(value, "vpcSourceIp is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3PresignIamPolicyConstraints value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
