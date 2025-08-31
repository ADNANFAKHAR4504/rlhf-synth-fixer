package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariantInferenceConfigurationTextOutputReference")
public class BedrockagentPromptVariantInferenceConfigurationTextOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentPromptVariantInferenceConfigurationTextOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentPromptVariantInferenceConfigurationTextOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentPromptVariantInferenceConfigurationTextOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMaxTokens() {
        software.amazon.jsii.Kernel.call(this, "resetMaxTokens", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStopSequences() {
        software.amazon.jsii.Kernel.call(this, "resetStopSequences", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemperature() {
        software.amazon.jsii.Kernel.call(this, "resetTemperature", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopP() {
        software.amazon.jsii.Kernel.call(this, "resetTopP", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxTokensInput() {
        return software.amazon.jsii.Kernel.get(this, "maxTokensInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStopSequencesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "stopSequencesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTemperatureInput() {
        return software.amazon.jsii.Kernel.get(this, "temperatureInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTopPInput() {
        return software.amazon.jsii.Kernel.get(this, "topPInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxTokens() {
        return software.amazon.jsii.Kernel.get(this, "maxTokens", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxTokens(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxTokens", java.util.Objects.requireNonNull(value, "maxTokens is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStopSequences() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "stopSequences", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStopSequences(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "stopSequences", java.util.Objects.requireNonNull(value, "stopSequences is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTemperature() {
        return software.amazon.jsii.Kernel.get(this, "temperature", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTemperature(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "temperature", java.util.Objects.requireNonNull(value, "temperature is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTopP() {
        return software.amazon.jsii.Kernel.get(this, "topP", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTopP(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "topP", java.util.Objects.requireNonNull(value, "topP is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfigurationText value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
