package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerPredicateOutputReference")
public class GlueTriggerPredicateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueTriggerPredicateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueTriggerPredicateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueTriggerPredicateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConditions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.glue_trigger.GlueTriggerPredicateConditions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.glue_trigger.GlueTriggerPredicateConditions> __cast_cd4240 = (java.util.List<imports.aws.glue_trigger.GlueTriggerPredicateConditions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.glue_trigger.GlueTriggerPredicateConditions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConditions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLogical() {
        software.amazon.jsii.Kernel.call(this, "resetLogical", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_trigger.GlueTriggerPredicateConditionsList getConditions() {
        return software.amazon.jsii.Kernel.get(this, "conditions", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerPredicateConditionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConditionsInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogicalInput() {
        return software.amazon.jsii.Kernel.get(this, "logicalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogical() {
        return software.amazon.jsii.Kernel.get(this, "logical", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogical(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logical", java.util.Objects.requireNonNull(value, "logical is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerPredicate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerPredicate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerPredicate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
