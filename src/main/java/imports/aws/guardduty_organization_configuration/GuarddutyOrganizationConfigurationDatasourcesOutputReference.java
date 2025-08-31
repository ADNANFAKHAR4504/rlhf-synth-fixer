package imports.aws.guardduty_organization_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyOrganizationConfiguration.GuarddutyOrganizationConfigurationDatasourcesOutputReference")
public class GuarddutyOrganizationConfigurationDatasourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GuarddutyOrganizationConfigurationDatasourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GuarddutyOrganizationConfigurationDatasourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GuarddutyOrganizationConfigurationDatasourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putKubernetes(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes value) {
        software.amazon.jsii.Kernel.call(this, "putKubernetes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwareProtection(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection value) {
        software.amazon.jsii.Kernel.call(this, "putMalwareProtection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Logs(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs value) {
        software.amazon.jsii.Kernel.call(this, "putS3Logs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKubernetes() {
        software.amazon.jsii.Kernel.call(this, "resetKubernetes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwareProtection() {
        software.amazon.jsii.Kernel.call(this, "resetMalwareProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Logs() {
        software.amazon.jsii.Kernel.call(this, "resetS3Logs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetesOutputReference getKubernetes() {
        return software.amazon.jsii.Kernel.get(this, "kubernetes", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtectionOutputReference getMalwareProtection() {
        return software.amazon.jsii.Kernel.get(this, "malwareProtection", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtectionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3LogsOutputReference getS3Logs() {
        return software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3LogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes getKubernetesInput() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection getMalwareProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "malwareProtectionInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs getS3LogsInput() {
        return software.amazon.jsii.Kernel.get(this, "s3LogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasources getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasources.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
