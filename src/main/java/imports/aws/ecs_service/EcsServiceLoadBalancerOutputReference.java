package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceLoadBalancerOutputReference")
public class EcsServiceLoadBalancerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceLoadBalancerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceLoadBalancerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EcsServiceLoadBalancerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetElbName() {
        software.amazon.jsii.Kernel.call(this, "resetElbName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "containerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getContainerPortInput() {
        return software.amazon.jsii.Kernel.get(this, "containerPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getElbNameInput() {
        return software.amazon.jsii.Kernel.get(this, "elbNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerName() {
        return software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerName", java.util.Objects.requireNonNull(value, "containerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getContainerPort() {
        return software.amazon.jsii.Kernel.get(this, "containerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setContainerPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "containerPort", java.util.Objects.requireNonNull(value, "containerPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getElbName() {
        return software.amazon.jsii.Kernel.get(this, "elbName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setElbName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "elbName", java.util.Objects.requireNonNull(value, "elbName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetGroupArn", java.util.Objects.requireNonNull(value, "targetGroupArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceLoadBalancer value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
