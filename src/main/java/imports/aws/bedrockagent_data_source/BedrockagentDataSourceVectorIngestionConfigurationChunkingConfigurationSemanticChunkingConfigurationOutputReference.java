package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationOutputReference")
public class BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBreakpointPercentileThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "breakpointPercentileThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "maxTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBreakpointPercentileThreshold() {
        return software.amazon.jsii.Kernel.get(this, "breakpointPercentileThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBreakpointPercentileThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "breakpointPercentileThreshold", java.util.Objects.requireNonNull(value, "breakpointPercentileThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufferSize() {
        return software.amazon.jsii.Kernel.get(this, "bufferSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufferSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufferSize", java.util.Objects.requireNonNull(value, "bufferSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxToken() {
        return software.amazon.jsii.Kernel.get(this, "maxToken", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxToken(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxToken", java.util.Objects.requireNonNull(value, "maxToken is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
