package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference")
public class EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuthorizationConfig(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAuthorizationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthorizationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootDirectory() {
        software.amazon.jsii.Kernel.call(this, "resetRootDirectory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetTransitEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitEncryptionPort() {
        software.amazon.jsii.Kernel.call(this, "resetTransitEncryptionPort", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfigOutputReference getAuthorizationConfig() {
        return software.amazon.jsii.Kernel.get(this, "authorizationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig getAuthorizationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemIdInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootDirectoryInput() {
        return software.amazon.jsii.Kernel.get(this, "rootDirectoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTransitEncryptionPortInput() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemId", java.util.Objects.requireNonNull(value, "fileSystemId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootDirectory() {
        return software.amazon.jsii.Kernel.get(this, "rootDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootDirectory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootDirectory", java.util.Objects.requireNonNull(value, "rootDirectory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitEncryption() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitEncryption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitEncryption", java.util.Objects.requireNonNull(value, "transitEncryption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTransitEncryptionPort() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTransitEncryptionPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "transitEncryptionPort", java.util.Objects.requireNonNull(value, "transitEncryptionPort is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
