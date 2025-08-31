package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariantsOutputReference")
public class SagemakerEndpointConfigurationProductionVariantsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationProductionVariantsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationProductionVariantsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SagemakerEndpointConfigurationProductionVariantsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCoreDumpConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCoreDumpConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putManagedInstanceScaling(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling value) {
        software.amazon.jsii.Kernel.call(this, "putManagedInstanceScaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRoutingConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfig> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRoutingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServerlessConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig value) {
        software.amazon.jsii.Kernel.call(this, "putServerlessConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcceleratorType() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContainerStartupHealthCheckTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetContainerStartupHealthCheckTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreDumpConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCoreDumpConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableSsmAccess() {
        software.amazon.jsii.Kernel.call(this, "resetEnableSsmAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceAmiVersion() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceAmiVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialInstanceCount() {
        software.amazon.jsii.Kernel.call(this, "resetInitialInstanceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialVariantWeight() {
        software.amazon.jsii.Kernel.call(this, "resetInitialVariantWeight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedInstanceScaling() {
        software.amazon.jsii.Kernel.call(this, "resetManagedInstanceScaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelDataDownloadTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetModelDataDownloadTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerlessConfig() {
        software.amazon.jsii.Kernel.call(this, "resetServerlessConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVariantName() {
        software.amazon.jsii.Kernel.call(this, "resetVariantName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeSizeInGb() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeSizeInGb", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfigOutputReference getCoreDumpConfig() {
        return software.amazon.jsii.Kernel.get(this, "coreDumpConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScalingOutputReference getManagedInstanceScaling() {
        return software.amazon.jsii.Kernel.get(this, "managedInstanceScaling", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScalingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfigList getRoutingConfig() {
        return software.amazon.jsii.Kernel.get(this, "routingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference getServerlessConfig() {
        return software.amazon.jsii.Kernel.get(this, "serverlessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAcceleratorTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getContainerStartupHealthCheckTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "containerStartupHealthCheckTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig getCoreDumpConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "coreDumpConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableSsmAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "enableSsmAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInferenceAmiVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAmiVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInitialInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "initialInstanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInitialVariantWeightInput() {
        return software.amazon.jsii.Kernel.get(this, "initialVariantWeightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling getManagedInstanceScalingInput() {
        return software.amazon.jsii.Kernel.get(this, "managedInstanceScalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getModelDataDownloadTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "modelDataDownloadTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModelNameInput() {
        return software.amazon.jsii.Kernel.get(this, "modelNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRoutingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "routingConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig getServerlessConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "serverlessConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVariantNameInput() {
        return software.amazon.jsii.Kernel.get(this, "variantNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcceleratorType() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcceleratorType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acceleratorType", java.util.Objects.requireNonNull(value, "acceleratorType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getContainerStartupHealthCheckTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "containerStartupHealthCheckTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setContainerStartupHealthCheckTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "containerStartupHealthCheckTimeoutInSeconds", java.util.Objects.requireNonNull(value, "containerStartupHealthCheckTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableSsmAccess() {
        return software.amazon.jsii.Kernel.get(this, "enableSsmAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableSsmAccess(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableSsmAccess", java.util.Objects.requireNonNull(value, "enableSsmAccess is required"));
    }

    public void setEnableSsmAccess(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableSsmAccess", java.util.Objects.requireNonNull(value, "enableSsmAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInferenceAmiVersion() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAmiVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInferenceAmiVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inferenceAmiVersion", java.util.Objects.requireNonNull(value, "inferenceAmiVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInitialInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "initialInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInitialInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "initialInstanceCount", java.util.Objects.requireNonNull(value, "initialInstanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInitialVariantWeight() {
        return software.amazon.jsii.Kernel.get(this, "initialVariantWeight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInitialVariantWeight(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "initialVariantWeight", java.util.Objects.requireNonNull(value, "initialVariantWeight is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getModelDataDownloadTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "modelDataDownloadTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setModelDataDownloadTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "modelDataDownloadTimeoutInSeconds", java.util.Objects.requireNonNull(value, "modelDataDownloadTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getModelName() {
        return software.amazon.jsii.Kernel.get(this, "modelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setModelName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "modelName", java.util.Objects.requireNonNull(value, "modelName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVariantName() {
        return software.amazon.jsii.Kernel.get(this, "variantName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVariantName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "variantName", java.util.Objects.requireNonNull(value, "variantName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVolumeSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "volumeSizeInGb", java.util.Objects.requireNonNull(value, "volumeSizeInGb is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariants value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
