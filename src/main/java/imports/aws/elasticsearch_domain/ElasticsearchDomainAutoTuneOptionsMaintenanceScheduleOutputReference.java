package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleOutputReference")
public class ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDuration(final @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration value) {
        software.amazon.jsii.Kernel.call(this, "putDuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDurationOutputReference getDuration() {
        return software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCronExpressionForRecurrenceInput() {
        return software.amazon.jsii.Kernel.get(this, "cronExpressionForRecurrenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration getDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "durationInput", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartAtInput() {
        return software.amazon.jsii.Kernel.get(this, "startAtInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCronExpressionForRecurrence() {
        return software.amazon.jsii.Kernel.get(this, "cronExpressionForRecurrence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCronExpressionForRecurrence(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cronExpressionForRecurrence", java.util.Objects.requireNonNull(value, "cronExpressionForRecurrence is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartAt() {
        return software.amazon.jsii.Kernel.get(this, "startAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartAt(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startAt", java.util.Objects.requireNonNull(value, "startAt is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
