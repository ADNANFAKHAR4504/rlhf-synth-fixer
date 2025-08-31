package imports.aws.codedeploy_deployment_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfigOutputReference")
public class CodedeployDeploymentConfigZonalConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentConfigZonalConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentConfigZonalConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentConfigZonalConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMinimumHealthyHostsPerZone(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone value) {
        software.amazon.jsii.Kernel.call(this, "putMinimumHealthyHostsPerZone", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFirstZoneMonitorDurationInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetFirstZoneMonitorDurationInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumHealthyHostsPerZone() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumHealthyHostsPerZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitorDurationInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMonitorDurationInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference getMinimumHealthyHostsPerZone() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyHostsPerZone", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFirstZoneMonitorDurationInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "firstZoneMonitorDurationInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone getMinimumHealthyHostsPerZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyHostsPerZoneInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMonitorDurationInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "monitorDurationInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFirstZoneMonitorDurationInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "firstZoneMonitorDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFirstZoneMonitorDurationInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "firstZoneMonitorDurationInSeconds", java.util.Objects.requireNonNull(value, "firstZoneMonitorDurationInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMonitorDurationInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "monitorDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMonitorDurationInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "monitorDurationInSeconds", java.util.Objects.requireNonNull(value, "monitorDurationInSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
