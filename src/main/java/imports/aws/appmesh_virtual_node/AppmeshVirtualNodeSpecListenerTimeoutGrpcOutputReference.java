package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutGrpcOutputReference")
public class AppmeshVirtualNodeSpecListenerTimeoutGrpcOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualNodeSpecListenerTimeoutGrpcOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualNodeSpecListenerTimeoutGrpcOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualNodeSpecListenerTimeoutGrpcOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIdle(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle value) {
        software.amazon.jsii.Kernel.call(this, "putIdle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPerRequest(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest value) {
        software.amazon.jsii.Kernel.call(this, "putPerRequest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIdle() {
        software.amazon.jsii.Kernel.call(this, "resetIdle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerRequest() {
        software.amazon.jsii.Kernel.call(this, "resetPerRequest", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdleOutputReference getIdle() {
        return software.amazon.jsii.Kernel.get(this, "idle", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequestOutputReference getPerRequest() {
        return software.amazon.jsii.Kernel.get(this, "perRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequestOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle getIdleInput() {
        return software.amazon.jsii.Kernel.get(this, "idleInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest getPerRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "perRequestInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
