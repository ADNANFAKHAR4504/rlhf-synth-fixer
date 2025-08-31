package imports.aws.neptunegraph_graph;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.939Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptunegraphGraph.NeptunegraphGraphVectorSearchConfigurationOutputReference")
public class NeptunegraphGraphVectorSearchConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NeptunegraphGraphVectorSearchConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NeptunegraphGraphVectorSearchConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public NeptunegraphGraphVectorSearchConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetVectorSearchDimension() {
        software.amazon.jsii.Kernel.call(this, "resetVectorSearchDimension", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVectorSearchDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "vectorSearchDimensionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVectorSearchDimension() {
        return software.amazon.jsii.Kernel.get(this, "vectorSearchDimension", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVectorSearchDimension(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "vectorSearchDimension", java.util.Objects.requireNonNull(value, "vectorSearchDimension is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
