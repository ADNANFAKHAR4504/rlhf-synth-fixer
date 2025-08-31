package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference")
public class EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EvidentlyLaunchMetricMonitorsMetricDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEventPattern() {
        software.amazon.jsii.Kernel.call(this, "resetEventPattern", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnitLabel() {
        software.amazon.jsii.Kernel.call(this, "resetUnitLabel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntityIdKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "entityIdKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "eventPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnitLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "unitLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValueKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "valueKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntityIdKey() {
        return software.amazon.jsii.Kernel.get(this, "entityIdKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntityIdKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entityIdKey", java.util.Objects.requireNonNull(value, "entityIdKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventPattern() {
        return software.amazon.jsii.Kernel.get(this, "eventPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventPattern(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventPattern", java.util.Objects.requireNonNull(value, "eventPattern is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnitLabel() {
        return software.amazon.jsii.Kernel.get(this, "unitLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnitLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unitLabel", java.util.Objects.requireNonNull(value, "unitLabel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValueKey() {
        return software.amazon.jsii.Kernel.get(this, "valueKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValueKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "valueKey", java.util.Objects.requireNonNull(value, "valueKey is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
