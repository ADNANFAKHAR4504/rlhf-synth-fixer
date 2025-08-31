package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfigOutputReference")
public class EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialsParameterInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsParameterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "domainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentialsParameter() {
        return software.amazon.jsii.Kernel.get(this, "credentialsParameter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentialsParameter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentialsParameter", java.util.Objects.requireNonNull(value, "credentialsParameter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domain", java.util.Objects.requireNonNull(value, "domain is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
