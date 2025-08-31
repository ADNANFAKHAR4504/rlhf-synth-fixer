package imports.aws.evidently_feature;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.213Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyFeature.EvidentlyFeatureVariationsValueOutputReference")
public class EvidentlyFeatureVariationsValueOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyFeatureVariationsValueOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyFeatureVariationsValueOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EvidentlyFeatureVariationsValueOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBoolValue() {
        software.amazon.jsii.Kernel.call(this, "resetBoolValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDoubleValue() {
        software.amazon.jsii.Kernel.call(this, "resetDoubleValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLongValue() {
        software.amazon.jsii.Kernel.call(this, "resetLongValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringValue() {
        software.amazon.jsii.Kernel.call(this, "resetStringValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBoolValueInput() {
        return software.amazon.jsii.Kernel.get(this, "boolValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDoubleValueInput() {
        return software.amazon.jsii.Kernel.get(this, "doubleValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLongValueInput() {
        return software.amazon.jsii.Kernel.get(this, "longValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStringValueInput() {
        return software.amazon.jsii.Kernel.get(this, "stringValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBoolValue() {
        return software.amazon.jsii.Kernel.get(this, "boolValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBoolValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "boolValue", java.util.Objects.requireNonNull(value, "boolValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDoubleValue() {
        return software.amazon.jsii.Kernel.get(this, "doubleValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDoubleValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "doubleValue", java.util.Objects.requireNonNull(value, "doubleValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLongValue() {
        return software.amazon.jsii.Kernel.get(this, "longValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLongValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "longValue", java.util.Objects.requireNonNull(value, "longValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStringValue() {
        return software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStringValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stringValue", java.util.Objects.requireNonNull(value, "stringValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.evidently_feature.EvidentlyFeatureVariationsValue getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_feature.EvidentlyFeatureVariationsValue.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_feature.EvidentlyFeatureVariationsValue value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
