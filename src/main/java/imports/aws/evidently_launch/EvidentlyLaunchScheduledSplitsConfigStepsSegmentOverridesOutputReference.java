package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference")
public class EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEvaluationOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluationOrderInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Number> getWeightsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "weightsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEvaluationOrder() {
        return software.amazon.jsii.Kernel.get(this, "evaluationOrder", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEvaluationOrder(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "evaluationOrder", java.util.Objects.requireNonNull(value, "evaluationOrder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegment() {
        return software.amazon.jsii.Kernel.get(this, "segment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segment", java.util.Objects.requireNonNull(value, "segment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> getWeights() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "weights", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setWeights(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "weights", java.util.Objects.requireNonNull(value, "weights is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
