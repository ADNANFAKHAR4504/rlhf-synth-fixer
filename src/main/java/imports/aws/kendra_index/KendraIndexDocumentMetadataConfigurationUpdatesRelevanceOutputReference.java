package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference")
public class KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDuration() {
        software.amazon.jsii.Kernel.call(this, "resetDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFreshness() {
        software.amazon.jsii.Kernel.call(this, "resetFreshness", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportance() {
        software.amazon.jsii.Kernel.call(this, "resetImportance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRankOrder() {
        software.amazon.jsii.Kernel.call(this, "resetRankOrder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValuesImportanceMap() {
        software.amazon.jsii.Kernel.call(this, "resetValuesImportanceMap", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "durationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFreshnessInput() {
        return software.amazon.jsii.Kernel.get(this, "freshnessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImportanceInput() {
        return software.amazon.jsii.Kernel.get(this, "importanceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRankOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "rankOrderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Number> getValuesImportanceMapInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "valuesImportanceMapInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDuration() {
        return software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDuration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "duration", java.util.Objects.requireNonNull(value, "duration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFreshness() {
        return software.amazon.jsii.Kernel.get(this, "freshness", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFreshness(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "freshness", java.util.Objects.requireNonNull(value, "freshness is required"));
    }

    public void setFreshness(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "freshness", java.util.Objects.requireNonNull(value, "freshness is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImportance() {
        return software.amazon.jsii.Kernel.get(this, "importance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImportance(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "importance", java.util.Objects.requireNonNull(value, "importance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRankOrder() {
        return software.amazon.jsii.Kernel.get(this, "rankOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRankOrder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rankOrder", java.util.Objects.requireNonNull(value, "rankOrder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> getValuesImportanceMap() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "valuesImportanceMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setValuesImportanceMap(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "valuesImportanceMap", java.util.Objects.requireNonNull(value, "valuesImportanceMap is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
