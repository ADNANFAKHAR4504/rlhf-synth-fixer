package imports.aws.datapipeline_pipeline_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.940Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionPipelineObjectFieldOutputReference")
public class DatapipelinePipelineDefinitionPipelineObjectFieldOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatapipelinePipelineDefinitionPipelineObjectFieldOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatapipelinePipelineDefinitionPipelineObjectFieldOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DatapipelinePipelineDefinitionPipelineObjectFieldOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetRefValue() {
        software.amazon.jsii.Kernel.call(this, "resetRefValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringValue() {
        software.amazon.jsii.Kernel.call(this, "resetStringValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "keyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRefValueInput() {
        return software.amazon.jsii.Kernel.get(this, "refValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStringValueInput() {
        return software.amazon.jsii.Kernel.get(this, "stringValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKey() {
        return software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "key", java.util.Objects.requireNonNull(value, "key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRefValue() {
        return software.amazon.jsii.Kernel.get(this, "refValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRefValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "refValue", java.util.Objects.requireNonNull(value, "refValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStringValue() {
        return software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStringValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stringValue", java.util.Objects.requireNonNull(value, "stringValue is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObjectField value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
