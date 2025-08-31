package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfigurationOutputReference")
public class EcsClusterConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsClusterConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsClusterConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsClusterConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExecuteCommandConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putExecuteCommandConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putManagedStorageConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putManagedStorageConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExecuteCommandConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetExecuteCommandConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedStorageConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetManagedStorageConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationOutputReference getExecuteCommandConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "executeCommandConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfigurationOutputReference getManagedStorageConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "managedStorageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration getExecuteCommandConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "executeCommandConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration getManagedStorageConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "managedStorageConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
