package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionRuntimePlatformOutputReference")
public class EcsTaskDefinitionRuntimePlatformOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsTaskDefinitionRuntimePlatformOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskDefinitionRuntimePlatformOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsTaskDefinitionRuntimePlatformOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCpuArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetCpuArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperatingSystemFamily() {
        software.amazon.jsii.Kernel.call(this, "resetOperatingSystemFamily", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCpuArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuArchitectureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperatingSystemFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystemFamilyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCpuArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "cpuArchitecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCpuArchitecture(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cpuArchitecture", java.util.Objects.requireNonNull(value, "cpuArchitecture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperatingSystemFamily() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystemFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperatingSystemFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operatingSystemFamily", java.util.Objects.requireNonNull(value, "operatingSystemFamily is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
