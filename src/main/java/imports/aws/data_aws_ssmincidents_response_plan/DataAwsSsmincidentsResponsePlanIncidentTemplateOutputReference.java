package imports.aws.data_aws_ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.891Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsmincidentsResponsePlan.DataAwsSsmincidentsResponsePlanIncidentTemplateOutputReference")
public class DataAwsSsmincidentsResponsePlanIncidentTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsSsmincidentsResponsePlanIncidentTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSsmincidentsResponsePlanIncidentTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsSsmincidentsResponsePlanIncidentTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDedupeString() {
        return software.amazon.jsii.Kernel.get(this, "dedupeString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImpact() {
        return software.amazon.jsii.Kernel.get(this, "impact", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getIncidentTags() {
        return software.amazon.jsii.Kernel.get(this, "incidentTags", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssmincidents_response_plan.DataAwsSsmincidentsResponsePlanIncidentTemplateNotificationTargetList getNotificationTarget() {
        return software.amazon.jsii.Kernel.get(this, "notificationTarget", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmincidents_response_plan.DataAwsSsmincidentsResponsePlanIncidentTemplateNotificationTargetList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSummary() {
        return software.amazon.jsii.Kernel.get(this, "summary", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ssmincidents_response_plan.DataAwsSsmincidentsResponsePlanIncidentTemplate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmincidents_response_plan.DataAwsSsmincidentsResponsePlanIncidentTemplate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ssmincidents_response_plan.DataAwsSsmincidentsResponsePlanIncidentTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
