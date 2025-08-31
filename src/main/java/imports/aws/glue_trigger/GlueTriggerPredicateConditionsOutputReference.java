package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerPredicateConditionsOutputReference")
public class GlueTriggerPredicateConditionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueTriggerPredicateConditionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueTriggerPredicateConditionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueTriggerPredicateConditionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetCrawlerName() {
        software.amazon.jsii.Kernel.call(this, "resetCrawlerName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrawlState() {
        software.amazon.jsii.Kernel.call(this, "resetCrawlState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobName() {
        software.amazon.jsii.Kernel.call(this, "resetJobName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogicalOperator() {
        software.amazon.jsii.Kernel.call(this, "resetLogicalOperator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetState() {
        software.amazon.jsii.Kernel.call(this, "resetState", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCrawlerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "crawlerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCrawlStateInput() {
        return software.amazon.jsii.Kernel.get(this, "crawlStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobNameInput() {
        return software.amazon.jsii.Kernel.get(this, "jobNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogicalOperatorInput() {
        return software.amazon.jsii.Kernel.get(this, "logicalOperatorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateInput() {
        return software.amazon.jsii.Kernel.get(this, "stateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCrawlerName() {
        return software.amazon.jsii.Kernel.get(this, "crawlerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCrawlerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "crawlerName", java.util.Objects.requireNonNull(value, "crawlerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCrawlState() {
        return software.amazon.jsii.Kernel.get(this, "crawlState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCrawlState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "crawlState", java.util.Objects.requireNonNull(value, "crawlState is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobName() {
        return software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobName", java.util.Objects.requireNonNull(value, "jobName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogicalOperator() {
        return software.amazon.jsii.Kernel.get(this, "logicalOperator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogicalOperator(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logicalOperator", java.util.Objects.requireNonNull(value, "logicalOperator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "state", java.util.Objects.requireNonNull(value, "state is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerPredicateConditions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
