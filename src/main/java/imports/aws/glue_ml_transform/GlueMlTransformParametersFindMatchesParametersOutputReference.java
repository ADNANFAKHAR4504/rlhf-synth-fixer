package imports.aws.glue_ml_transform;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueMlTransform.GlueMlTransformParametersFindMatchesParametersOutputReference")
public class GlueMlTransformParametersFindMatchesParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueMlTransformParametersFindMatchesParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueMlTransformParametersFindMatchesParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueMlTransformParametersFindMatchesParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccuracyCostTradeOff() {
        software.amazon.jsii.Kernel.call(this, "resetAccuracyCostTradeOff", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnforceProvidedLabels() {
        software.amazon.jsii.Kernel.call(this, "resetEnforceProvidedLabels", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrecisionRecallTradeOff() {
        software.amazon.jsii.Kernel.call(this, "resetPrecisionRecallTradeOff", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrimaryKeyColumnName() {
        software.amazon.jsii.Kernel.call(this, "resetPrimaryKeyColumnName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAccuracyCostTradeOffInput() {
        return software.amazon.jsii.Kernel.get(this, "accuracyCostTradeOffInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnforceProvidedLabelsInput() {
        return software.amazon.jsii.Kernel.get(this, "enforceProvidedLabelsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPrecisionRecallTradeOffInput() {
        return software.amazon.jsii.Kernel.get(this, "precisionRecallTradeOffInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrimaryKeyColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryKeyColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAccuracyCostTradeOff() {
        return software.amazon.jsii.Kernel.get(this, "accuracyCostTradeOff", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAccuracyCostTradeOff(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "accuracyCostTradeOff", java.util.Objects.requireNonNull(value, "accuracyCostTradeOff is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnforceProvidedLabels() {
        return software.amazon.jsii.Kernel.get(this, "enforceProvidedLabels", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnforceProvidedLabels(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enforceProvidedLabels", java.util.Objects.requireNonNull(value, "enforceProvidedLabels is required"));
    }

    public void setEnforceProvidedLabels(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enforceProvidedLabels", java.util.Objects.requireNonNull(value, "enforceProvidedLabels is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPrecisionRecallTradeOff() {
        return software.amazon.jsii.Kernel.get(this, "precisionRecallTradeOff", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPrecisionRecallTradeOff(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "precisionRecallTradeOff", java.util.Objects.requireNonNull(value, "precisionRecallTradeOff is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryKeyColumnName() {
        return software.amazon.jsii.Kernel.get(this, "primaryKeyColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrimaryKeyColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "primaryKeyColumnName", java.util.Objects.requireNonNull(value, "primaryKeyColumnName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
