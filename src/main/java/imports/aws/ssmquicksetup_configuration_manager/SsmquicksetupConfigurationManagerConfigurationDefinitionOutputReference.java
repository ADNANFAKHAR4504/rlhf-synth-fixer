package imports.aws.ssmquicksetup_configuration_manager;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmquicksetupConfigurationManager.SsmquicksetupConfigurationManagerConfigurationDefinitionOutputReference")
public class SsmquicksetupConfigurationManagerConfigurationDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmquicksetupConfigurationManagerConfigurationDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmquicksetupConfigurationManagerConfigurationDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsmquicksetupConfigurationManagerConfigurationDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetLocalDeploymentAdministrationRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetLocalDeploymentAdministrationRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalDeploymentExecutionRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetLocalDeploymentExecutionRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTypeVersion() {
        software.amazon.jsii.Kernel.call(this, "resetTypeVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalDeploymentAdministrationRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "localDeploymentAdministrationRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalDeploymentExecutionRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "localDeploymentExecutionRoleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "typeVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalDeploymentAdministrationRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "localDeploymentAdministrationRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalDeploymentAdministrationRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localDeploymentAdministrationRoleArn", java.util.Objects.requireNonNull(value, "localDeploymentAdministrationRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalDeploymentExecutionRoleName() {
        return software.amazon.jsii.Kernel.get(this, "localDeploymentExecutionRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalDeploymentExecutionRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localDeploymentExecutionRoleName", java.util.Objects.requireNonNull(value, "localDeploymentExecutionRoleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTypeVersion() {
        return software.amazon.jsii.Kernel.get(this, "typeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTypeVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "typeVersion", java.util.Objects.requireNonNull(value, "typeVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmquicksetup_configuration_manager.SsmquicksetupConfigurationManagerConfigurationDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
