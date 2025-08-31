package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptionsOutputReference")
public class ElasticsearchDomainAutoTuneOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainAutoTuneOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainAutoTuneOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainAutoTuneOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMaintenanceSchedule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule> __cast_cd4240 = (java.util.List<imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMaintenanceSchedule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMaintenanceSchedule() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceSchedule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRollbackOnDisable() {
        software.amazon.jsii.Kernel.call(this, "resetRollbackOnDisable", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleList getMaintenanceSchedule() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceSchedule", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDesiredStateInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMaintenanceScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceScheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRollbackOnDisableInput() {
        return software.amazon.jsii.Kernel.get(this, "rollbackOnDisableInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDesiredState() {
        return software.amazon.jsii.Kernel.get(this, "desiredState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDesiredState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "desiredState", java.util.Objects.requireNonNull(value, "desiredState is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRollbackOnDisable() {
        return software.amazon.jsii.Kernel.get(this, "rollbackOnDisable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRollbackOnDisable(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rollbackOnDisable", java.util.Objects.requireNonNull(value, "rollbackOnDisable is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
