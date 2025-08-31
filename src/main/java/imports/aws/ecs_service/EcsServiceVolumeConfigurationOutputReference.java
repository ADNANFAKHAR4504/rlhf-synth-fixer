package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceVolumeConfigurationOutputReference")
public class EcsServiceVolumeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceVolumeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putManagedEbsVolume(final @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume value) {
        software.amazon.jsii.Kernel.call(this, "putManagedEbsVolume", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference getManagedEbsVolume() {
        return software.amazon.jsii.Kernel.get(this, "managedEbsVolume", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume getManagedEbsVolumeInput() {
        return software.amazon.jsii.Kernel.get(this, "managedEbsVolumeInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
