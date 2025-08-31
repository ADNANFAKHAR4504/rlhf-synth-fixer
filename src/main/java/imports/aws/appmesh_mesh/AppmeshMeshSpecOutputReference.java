package imports.aws.appmesh_mesh;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.026Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshMesh.AppmeshMeshSpecOutputReference")
public class AppmeshMeshSpecOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshMeshSpecOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshMeshSpecOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshMeshSpecOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEgressFilter(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_mesh.AppmeshMeshSpecEgressFilter value) {
        software.amazon.jsii.Kernel.call(this, "putEgressFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServiceDiscovery(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_mesh.AppmeshMeshSpecServiceDiscovery value) {
        software.amazon.jsii.Kernel.call(this, "putServiceDiscovery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEgressFilter() {
        software.amazon.jsii.Kernel.call(this, "resetEgressFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceDiscovery() {
        software.amazon.jsii.Kernel.call(this, "resetServiceDiscovery", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_mesh.AppmeshMeshSpecEgressFilterOutputReference getEgressFilter() {
        return software.amazon.jsii.Kernel.get(this, "egressFilter", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_mesh.AppmeshMeshSpecEgressFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_mesh.AppmeshMeshSpecServiceDiscoveryOutputReference getServiceDiscovery() {
        return software.amazon.jsii.Kernel.get(this, "serviceDiscovery", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_mesh.AppmeshMeshSpecServiceDiscoveryOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_mesh.AppmeshMeshSpecEgressFilter getEgressFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "egressFilterInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_mesh.AppmeshMeshSpecEgressFilter.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_mesh.AppmeshMeshSpecServiceDiscovery getServiceDiscoveryInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceDiscoveryInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_mesh.AppmeshMeshSpecServiceDiscovery.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_mesh.AppmeshMeshSpec getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_mesh.AppmeshMeshSpec.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_mesh.AppmeshMeshSpec value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
