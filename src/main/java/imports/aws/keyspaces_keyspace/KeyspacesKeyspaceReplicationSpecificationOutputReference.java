package imports.aws.keyspaces_keyspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.440Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesKeyspace.KeyspacesKeyspaceReplicationSpecificationOutputReference")
public class KeyspacesKeyspaceReplicationSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KeyspacesKeyspaceReplicationSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KeyspacesKeyspaceReplicationSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KeyspacesKeyspaceReplicationSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRegionList() {
        software.amazon.jsii.Kernel.call(this, "resetRegionList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegionList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regionList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegionList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regionList", java.util.Objects.requireNonNull(value, "regionList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "replicationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationStrategy", java.util.Objects.requireNonNull(value, "replicationStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.keyspaces_keyspace.KeyspacesKeyspaceReplicationSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_keyspace.KeyspacesKeyspaceReplicationSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.keyspaces_keyspace.KeyspacesKeyspaceReplicationSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
