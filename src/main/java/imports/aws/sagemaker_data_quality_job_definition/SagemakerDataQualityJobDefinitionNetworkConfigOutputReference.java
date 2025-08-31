package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfigOutputReference")
public class SagemakerDataQualityJobDefinitionNetworkConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDataQualityJobDefinitionNetworkConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDataQualityJobDefinitionNetworkConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDataQualityJobDefinitionNetworkConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnableInterContainerTrafficEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetEnableInterContainerTrafficEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableNetworkIsolation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableNetworkIsolation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableInterContainerTrafficEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "enableInterContainerTrafficEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableNetworkIsolationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableNetworkIsolationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableInterContainerTrafficEncryption() {
        return software.amazon.jsii.Kernel.get(this, "enableInterContainerTrafficEncryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableInterContainerTrafficEncryption(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableInterContainerTrafficEncryption", java.util.Objects.requireNonNull(value, "enableInterContainerTrafficEncryption is required"));
    }

    public void setEnableInterContainerTrafficEncryption(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableInterContainerTrafficEncryption", java.util.Objects.requireNonNull(value, "enableInterContainerTrafficEncryption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableNetworkIsolation() {
        return software.amazon.jsii.Kernel.get(this, "enableNetworkIsolation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableNetworkIsolation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableNetworkIsolation", java.util.Objects.requireNonNull(value, "enableNetworkIsolation is required"));
    }

    public void setEnableNetworkIsolation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableNetworkIsolation", java.util.Objects.requireNonNull(value, "enableNetworkIsolation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
