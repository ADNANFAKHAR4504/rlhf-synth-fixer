package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.840Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocationOutputReference")
public class DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetBias() {
        software.amazon.jsii.Kernel.call(this, "resetBias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointReference() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvaluateTargetHealth() {
        software.amazon.jsii.Kernel.call(this, "resetEvaluateTargetHealth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheck() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLatitude() {
        software.amazon.jsii.Kernel.call(this, "resetLatitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLongitude() {
        software.amazon.jsii.Kernel.call(this, "resetLongitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegion() {
        software.amazon.jsii.Kernel.call(this, "resetRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuleReference() {
        software.amazon.jsii.Kernel.call(this, "resetRuleReference", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBiasInput() {
        return software.amazon.jsii.Kernel.get(this, "biasInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEvaluateTargetHealthInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluateTargetHealthInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLatitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "latitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLongitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "longitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBias() {
        return software.amazon.jsii.Kernel.get(this, "bias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBias(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bias", java.util.Objects.requireNonNull(value, "bias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointReference() {
        return software.amazon.jsii.Kernel.get(this, "endpointReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointReference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointReference", java.util.Objects.requireNonNull(value, "endpointReference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEvaluateTargetHealth() {
        return software.amazon.jsii.Kernel.get(this, "evaluateTargetHealth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEvaluateTargetHealth(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "evaluateTargetHealth", java.util.Objects.requireNonNull(value, "evaluateTargetHealth is required"));
    }

    public void setEvaluateTargetHealth(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "evaluateTargetHealth", java.util.Objects.requireNonNull(value, "evaluateTargetHealth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHealthCheck() {
        return software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHealthCheck(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "healthCheck", java.util.Objects.requireNonNull(value, "healthCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLatitude() {
        return software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLatitude(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "latitude", java.util.Objects.requireNonNull(value, "latitude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLongitude() {
        return software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLongitude(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "longitude", java.util.Objects.requireNonNull(value, "longitude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleReference() {
        return software.amazon.jsii.Kernel.get(this, "ruleReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleReference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleReference", java.util.Objects.requireNonNull(value, "ruleReference is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
