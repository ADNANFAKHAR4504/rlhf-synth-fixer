package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.140Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeOutputReference")
public class EcsTaskDefinitionVolumeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsTaskDefinitionVolumeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskDefinitionVolumeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EcsTaskDefinitionVolumeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDockerVolumeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeDockerVolumeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putDockerVolumeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEfsVolumeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEfsVolumeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFsxWindowsFileServerVolumeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putFsxWindowsFileServerVolumeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfigureAtLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetConfigureAtLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDockerVolumeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDockerVolumeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEfsVolumeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEfsVolumeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFsxWindowsFileServerVolumeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetFsxWindowsFileServerVolumeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostPath() {
        software.amazon.jsii.Kernel.call(this, "resetHostPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeDockerVolumeConfigurationOutputReference getDockerVolumeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "dockerVolumeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeDockerVolumeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference getEfsVolumeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "efsVolumeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationOutputReference getFsxWindowsFileServerVolumeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "fsxWindowsFileServerVolumeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfigureAtLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "configureAtLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeDockerVolumeConfiguration getDockerVolumeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "dockerVolumeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeDockerVolumeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration getEfsVolumeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "efsVolumeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeEfsVolumeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration getFsxWindowsFileServerVolumeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "fsxWindowsFileServerVolumeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostPathInput() {
        return software.amazon.jsii.Kernel.get(this, "hostPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConfigureAtLaunch() {
        return software.amazon.jsii.Kernel.get(this, "configureAtLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConfigureAtLaunch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "configureAtLaunch", java.util.Objects.requireNonNull(value, "configureAtLaunch is required"));
    }

    public void setConfigureAtLaunch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "configureAtLaunch", java.util.Objects.requireNonNull(value, "configureAtLaunch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostPath() {
        return software.amazon.jsii.Kernel.get(this, "hostPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostPath", java.util.Objects.requireNonNull(value, "hostPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionVolume value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
