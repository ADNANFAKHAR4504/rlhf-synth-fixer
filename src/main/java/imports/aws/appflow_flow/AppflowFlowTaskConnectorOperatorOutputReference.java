package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTaskConnectorOperatorOutputReference")
public class AppflowFlowTaskConnectorOperatorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowTaskConnectorOperatorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowTaskConnectorOperatorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AppflowFlowTaskConnectorOperatorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAmplitude() {
        software.amazon.jsii.Kernel.call(this, "resetAmplitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomConnector() {
        software.amazon.jsii.Kernel.call(this, "resetCustomConnector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatadog() {
        software.amazon.jsii.Kernel.call(this, "resetDatadog", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynatrace() {
        software.amazon.jsii.Kernel.call(this, "resetDynatrace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGoogleAnalytics() {
        software.amazon.jsii.Kernel.call(this, "resetGoogleAnalytics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInforNexus() {
        software.amazon.jsii.Kernel.call(this, "resetInforNexus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMarketo() {
        software.amazon.jsii.Kernel.call(this, "resetMarketo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSalesforce() {
        software.amazon.jsii.Kernel.call(this, "resetSalesforce", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSapoData() {
        software.amazon.jsii.Kernel.call(this, "resetSapoData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceNow() {
        software.amazon.jsii.Kernel.call(this, "resetServiceNow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSingular() {
        software.amazon.jsii.Kernel.call(this, "resetSingular", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlack() {
        software.amazon.jsii.Kernel.call(this, "resetSlack", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrendmicro() {
        software.amazon.jsii.Kernel.call(this, "resetTrendmicro", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVeeva() {
        software.amazon.jsii.Kernel.call(this, "resetVeeva", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZendesk() {
        software.amazon.jsii.Kernel.call(this, "resetZendesk", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmplitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "amplitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomConnectorInput() {
        return software.amazon.jsii.Kernel.get(this, "customConnectorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatadogInput() {
        return software.amazon.jsii.Kernel.get(this, "datadogInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDynatraceInput() {
        return software.amazon.jsii.Kernel.get(this, "dynatraceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGoogleAnalyticsInput() {
        return software.amazon.jsii.Kernel.get(this, "googleAnalyticsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInforNexusInput() {
        return software.amazon.jsii.Kernel.get(this, "inforNexusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMarketoInput() {
        return software.amazon.jsii.Kernel.get(this, "marketoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSalesforceInput() {
        return software.amazon.jsii.Kernel.get(this, "salesforceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSapoDataInput() {
        return software.amazon.jsii.Kernel.get(this, "sapoDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceNowInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceNowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSingularInput() {
        return software.amazon.jsii.Kernel.get(this, "singularInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlackInput() {
        return software.amazon.jsii.Kernel.get(this, "slackInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrendmicroInput() {
        return software.amazon.jsii.Kernel.get(this, "trendmicroInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVeevaInput() {
        return software.amazon.jsii.Kernel.get(this, "veevaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getZendeskInput() {
        return software.amazon.jsii.Kernel.get(this, "zendeskInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmplitude() {
        return software.amazon.jsii.Kernel.get(this, "amplitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmplitude(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amplitude", java.util.Objects.requireNonNull(value, "amplitude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomConnector() {
        return software.amazon.jsii.Kernel.get(this, "customConnector", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomConnector(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customConnector", java.util.Objects.requireNonNull(value, "customConnector is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatadog() {
        return software.amazon.jsii.Kernel.get(this, "datadog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatadog(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datadog", java.util.Objects.requireNonNull(value, "datadog is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDynatrace() {
        return software.amazon.jsii.Kernel.get(this, "dynatrace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDynatrace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dynatrace", java.util.Objects.requireNonNull(value, "dynatrace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGoogleAnalytics() {
        return software.amazon.jsii.Kernel.get(this, "googleAnalytics", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGoogleAnalytics(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "googleAnalytics", java.util.Objects.requireNonNull(value, "googleAnalytics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInforNexus() {
        return software.amazon.jsii.Kernel.get(this, "inforNexus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInforNexus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inforNexus", java.util.Objects.requireNonNull(value, "inforNexus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMarketo() {
        return software.amazon.jsii.Kernel.get(this, "marketo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMarketo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "marketo", java.util.Objects.requireNonNull(value, "marketo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3", java.util.Objects.requireNonNull(value, "s3 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSalesforce() {
        return software.amazon.jsii.Kernel.get(this, "salesforce", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSalesforce(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "salesforce", java.util.Objects.requireNonNull(value, "salesforce is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSapoData() {
        return software.amazon.jsii.Kernel.get(this, "sapoData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSapoData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sapoData", java.util.Objects.requireNonNull(value, "sapoData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceNow() {
        return software.amazon.jsii.Kernel.get(this, "serviceNow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceNow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceNow", java.util.Objects.requireNonNull(value, "serviceNow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSingular() {
        return software.amazon.jsii.Kernel.get(this, "singular", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSingular(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "singular", java.util.Objects.requireNonNull(value, "singular is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlack() {
        return software.amazon.jsii.Kernel.get(this, "slack", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlack(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slack", java.util.Objects.requireNonNull(value, "slack is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrendmicro() {
        return software.amazon.jsii.Kernel.get(this, "trendmicro", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrendmicro(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trendmicro", java.util.Objects.requireNonNull(value, "trendmicro is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVeeva() {
        return software.amazon.jsii.Kernel.get(this, "veeva", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVeeva(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "veeva", java.util.Objects.requireNonNull(value, "veeva is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getZendesk() {
        return software.amazon.jsii.Kernel.get(this, "zendesk", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setZendesk(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "zendesk", java.util.Objects.requireNonNull(value, "zendesk is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
