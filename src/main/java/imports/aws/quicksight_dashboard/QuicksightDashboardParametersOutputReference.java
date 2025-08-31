package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.104Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardParametersOutputReference")
public class QuicksightDashboardParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDashboardParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDashboardParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDashboardParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDateTimeParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParameters> __cast_cd4240 = (java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDateTimeParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDecimalParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParameters> __cast_cd4240 = (java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDecimalParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIntegerParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParameters> __cast_cd4240 = (java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIntegerParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParameters> __cast_cd4240 = (java.util.List<imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStringParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDateTimeParameters() {
        software.amazon.jsii.Kernel.call(this, "resetDateTimeParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDecimalParameters() {
        software.amazon.jsii.Kernel.call(this, "resetDecimalParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntegerParameters() {
        software.amazon.jsii.Kernel.call(this, "resetIntegerParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringParameters() {
        software.amazon.jsii.Kernel.call(this, "resetStringParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParametersList getDateTimeParameters() {
        return software.amazon.jsii.Kernel.get(this, "dateTimeParameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParametersDateTimeParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParametersList getDecimalParameters() {
        return software.amazon.jsii.Kernel.get(this, "decimalParameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParametersDecimalParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParametersList getIntegerParameters() {
        return software.amazon.jsii.Kernel.get(this, "integerParameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParametersIntegerParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParametersList getStringParameters() {
        return software.amazon.jsii.Kernel.get(this, "stringParameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParametersStringParametersList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDateTimeParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "dateTimeParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDecimalParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "decimalParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIntegerParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "integerParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStringParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "stringParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
