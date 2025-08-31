package imports.aws.cloudformation_stack_instances;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.219Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackInstances.CloudformationStackInstancesOperationPreferencesOutputReference")
public class CloudformationStackInstancesOperationPreferencesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudformationStackInstancesOperationPreferencesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackInstancesOperationPreferencesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudformationStackInstancesOperationPreferencesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConcurrencyMode() {
        software.amazon.jsii.Kernel.call(this, "resetConcurrencyMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureToleranceCount() {
        software.amazon.jsii.Kernel.call(this, "resetFailureToleranceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureTolerancePercentage() {
        software.amazon.jsii.Kernel.call(this, "resetFailureTolerancePercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrentCount() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrentCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrentPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrentPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionConcurrencyType() {
        software.amazon.jsii.Kernel.call(this, "resetRegionConcurrencyType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionOrder() {
        software.amazon.jsii.Kernel.call(this, "resetRegionOrder", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConcurrencyModeInput() {
        return software.amazon.jsii.Kernel.get(this, "concurrencyModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureToleranceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "failureToleranceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureTolerancePercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "failureTolerancePercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionConcurrencyTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "regionConcurrencyTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionOrderInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionOrderInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConcurrencyMode() {
        return software.amazon.jsii.Kernel.get(this, "concurrencyMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConcurrencyMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "concurrencyMode", java.util.Objects.requireNonNull(value, "concurrencyMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureToleranceCount() {
        return software.amazon.jsii.Kernel.get(this, "failureToleranceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureToleranceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureToleranceCount", java.util.Objects.requireNonNull(value, "failureToleranceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureTolerancePercentage() {
        return software.amazon.jsii.Kernel.get(this, "failureTolerancePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureTolerancePercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureTolerancePercentage", java.util.Objects.requireNonNull(value, "failureTolerancePercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrentCount() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrentCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrentCount", java.util.Objects.requireNonNull(value, "maxConcurrentCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrentPercentage() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrentPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrentPercentage", java.util.Objects.requireNonNull(value, "maxConcurrentPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegionConcurrencyType() {
        return software.amazon.jsii.Kernel.get(this, "regionConcurrencyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegionConcurrencyType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "regionConcurrencyType", java.util.Objects.requireNonNull(value, "regionConcurrencyType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegionOrder() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regionOrder", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegionOrder(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regionOrder", java.util.Objects.requireNonNull(value, "regionOrder is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesOperationPreferences value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
