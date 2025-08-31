package imports.aws.route53_health_check;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check aws_route53_health_check}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.205Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53HealthCheck.Route53HealthCheck")
public class Route53HealthCheck extends com.hashicorp.cdktf.TerraformResource {

    protected Route53HealthCheck(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53HealthCheck(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.route53_health_check.Route53HealthCheck.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check aws_route53_health_check} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Route53HealthCheck(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.route53_health_check.Route53HealthCheckConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Route53HealthCheck resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53HealthCheck to import. This parameter is required.
     * @param importFromId The id of the existing Route53HealthCheck that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Route53HealthCheck to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_health_check.Route53HealthCheck.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Route53HealthCheck resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53HealthCheck to import. This parameter is required.
     * @param importFromId The id of the existing Route53HealthCheck that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_health_check.Route53HealthCheck.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetChildHealthchecks() {
        software.amazon.jsii.Kernel.call(this, "resetChildHealthchecks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChildHealthThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetChildHealthThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchAlarmName() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchAlarmName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchAlarmRegion() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchAlarmRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisabled() {
        software.amazon.jsii.Kernel.call(this, "resetDisabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableSni() {
        software.amazon.jsii.Kernel.call(this, "resetEnableSni", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetFailureThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFqdn() {
        software.amazon.jsii.Kernel.call(this, "resetFqdn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsufficientDataHealthStatus() {
        software.amazon.jsii.Kernel.call(this, "resetInsufficientDataHealthStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInvertHealthcheck() {
        software.amazon.jsii.Kernel.call(this, "resetInvertHealthcheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMeasureLatency() {
        software.amazon.jsii.Kernel.call(this, "resetMeasureLatency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReferenceName() {
        software.amazon.jsii.Kernel.call(this, "resetReferenceName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestInterval() {
        software.amazon.jsii.Kernel.call(this, "resetRequestInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourcePath() {
        software.amazon.jsii.Kernel.call(this, "resetResourcePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingControlArn() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingControlArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSearchString() {
        software.amazon.jsii.Kernel.call(this, "resetSearchString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTriggers() {
        software.amazon.jsii.Kernel.call(this, "resetTriggers", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getChildHealthchecksInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "childHealthchecksInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getChildHealthThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "childHealthThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchAlarmNameInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchAlarmRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisabledInput() {
        return software.amazon.jsii.Kernel.get(this, "disabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableSniInput() {
        return software.amazon.jsii.Kernel.get(this, "enableSniInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "failureThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFqdnInput() {
        return software.amazon.jsii.Kernel.get(this, "fqdnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInsufficientDataHealthStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "insufficientDataHealthStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInvertHealthcheckInput() {
        return software.amazon.jsii.Kernel.get(this, "invertHealthcheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMeasureLatencyInput() {
        return software.amazon.jsii.Kernel.get(this, "measureLatencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReferenceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "referenceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRequestIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "requestIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourcePathInput() {
        return software.amazon.jsii.Kernel.get(this, "resourcePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingControlArnInput() {
        return software.amazon.jsii.Kernel.get(this, "routingControlArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSearchStringInput() {
        return software.amazon.jsii.Kernel.get(this, "searchStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTriggersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "triggersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getChildHealthchecks() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "childHealthchecks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setChildHealthchecks(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "childHealthchecks", java.util.Objects.requireNonNull(value, "childHealthchecks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getChildHealthThreshold() {
        return software.amazon.jsii.Kernel.get(this, "childHealthThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setChildHealthThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "childHealthThreshold", java.util.Objects.requireNonNull(value, "childHealthThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchAlarmName() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchAlarmName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchAlarmName", java.util.Objects.requireNonNull(value, "cloudwatchAlarmName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchAlarmRegion() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchAlarmRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchAlarmRegion", java.util.Objects.requireNonNull(value, "cloudwatchAlarmRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisabled() {
        return software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disabled", java.util.Objects.requireNonNull(value, "disabled is required"));
    }

    public void setDisabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disabled", java.util.Objects.requireNonNull(value, "disabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableSni() {
        return software.amazon.jsii.Kernel.get(this, "enableSni", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableSni(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableSni", java.util.Objects.requireNonNull(value, "enableSni is required"));
    }

    public void setEnableSni(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableSni", java.util.Objects.requireNonNull(value, "enableSni is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureThreshold() {
        return software.amazon.jsii.Kernel.get(this, "failureThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureThreshold", java.util.Objects.requireNonNull(value, "failureThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFqdn() {
        return software.amazon.jsii.Kernel.get(this, "fqdn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFqdn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fqdn", java.util.Objects.requireNonNull(value, "fqdn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInsufficientDataHealthStatus() {
        return software.amazon.jsii.Kernel.get(this, "insufficientDataHealthStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInsufficientDataHealthStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "insufficientDataHealthStatus", java.util.Objects.requireNonNull(value, "insufficientDataHealthStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInvertHealthcheck() {
        return software.amazon.jsii.Kernel.get(this, "invertHealthcheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInvertHealthcheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "invertHealthcheck", java.util.Objects.requireNonNull(value, "invertHealthcheck is required"));
    }

    public void setInvertHealthcheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "invertHealthcheck", java.util.Objects.requireNonNull(value, "invertHealthcheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "ipAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddress", java.util.Objects.requireNonNull(value, "ipAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMeasureLatency() {
        return software.amazon.jsii.Kernel.get(this, "measureLatency", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMeasureLatency(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "measureLatency", java.util.Objects.requireNonNull(value, "measureLatency is required"));
    }

    public void setMeasureLatency(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "measureLatency", java.util.Objects.requireNonNull(value, "measureLatency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReferenceName() {
        return software.amazon.jsii.Kernel.get(this, "referenceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReferenceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "referenceName", java.util.Objects.requireNonNull(value, "referenceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRequestInterval() {
        return software.amazon.jsii.Kernel.get(this, "requestInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRequestInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "requestInterval", java.util.Objects.requireNonNull(value, "requestInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourcePath() {
        return software.amazon.jsii.Kernel.get(this, "resourcePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourcePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourcePath", java.util.Objects.requireNonNull(value, "resourcePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingControlArn() {
        return software.amazon.jsii.Kernel.get(this, "routingControlArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingControlArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingControlArn", java.util.Objects.requireNonNull(value, "routingControlArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSearchString() {
        return software.amazon.jsii.Kernel.get(this, "searchString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSearchString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "searchString", java.util.Objects.requireNonNull(value, "searchString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTriggers() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTriggers(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "triggers", java.util.Objects.requireNonNull(value, "triggers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.route53_health_check.Route53HealthCheck}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.route53_health_check.Route53HealthCheck> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.route53_health_check.Route53HealthCheckConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.route53_health_check.Route53HealthCheckConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#type Route53HealthCheck#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#type Route53HealthCheck#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_healthchecks Route53HealthCheck#child_healthchecks}.
         * <p>
         * @return {@code this}
         * @param childHealthchecks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_healthchecks Route53HealthCheck#child_healthchecks}. This parameter is required.
         */
        public Builder childHealthchecks(final java.util.List<java.lang.String> childHealthchecks) {
            this.config.childHealthchecks(childHealthchecks);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_health_threshold Route53HealthCheck#child_health_threshold}.
         * <p>
         * @return {@code this}
         * @param childHealthThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_health_threshold Route53HealthCheck#child_health_threshold}. This parameter is required.
         */
        public Builder childHealthThreshold(final java.lang.Number childHealthThreshold) {
            this.config.childHealthThreshold(childHealthThreshold);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_name Route53HealthCheck#cloudwatch_alarm_name}.
         * <p>
         * @return {@code this}
         * @param cloudwatchAlarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_name Route53HealthCheck#cloudwatch_alarm_name}. This parameter is required.
         */
        public Builder cloudwatchAlarmName(final java.lang.String cloudwatchAlarmName) {
            this.config.cloudwatchAlarmName(cloudwatchAlarmName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_region Route53HealthCheck#cloudwatch_alarm_region}.
         * <p>
         * @return {@code this}
         * @param cloudwatchAlarmRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_region Route53HealthCheck#cloudwatch_alarm_region}. This parameter is required.
         */
        public Builder cloudwatchAlarmRegion(final java.lang.String cloudwatchAlarmRegion) {
            this.config.cloudwatchAlarmRegion(cloudwatchAlarmRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}.
         * <p>
         * @return {@code this}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}. This parameter is required.
         */
        public Builder disabled(final java.lang.Boolean disabled) {
            this.config.disabled(disabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}.
         * <p>
         * @return {@code this}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}. This parameter is required.
         */
        public Builder disabled(final com.hashicorp.cdktf.IResolvable disabled) {
            this.config.disabled(disabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}.
         * <p>
         * @return {@code this}
         * @param enableSni Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}. This parameter is required.
         */
        public Builder enableSni(final java.lang.Boolean enableSni) {
            this.config.enableSni(enableSni);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}.
         * <p>
         * @return {@code this}
         * @param enableSni Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}. This parameter is required.
         */
        public Builder enableSni(final com.hashicorp.cdktf.IResolvable enableSni) {
            this.config.enableSni(enableSni);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#failure_threshold Route53HealthCheck#failure_threshold}.
         * <p>
         * @return {@code this}
         * @param failureThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#failure_threshold Route53HealthCheck#failure_threshold}. This parameter is required.
         */
        public Builder failureThreshold(final java.lang.Number failureThreshold) {
            this.config.failureThreshold(failureThreshold);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#fqdn Route53HealthCheck#fqdn}.
         * <p>
         * @return {@code this}
         * @param fqdn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#fqdn Route53HealthCheck#fqdn}. This parameter is required.
         */
        public Builder fqdn(final java.lang.String fqdn) {
            this.config.fqdn(fqdn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#id Route53HealthCheck#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#id Route53HealthCheck#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#insufficient_data_health_status Route53HealthCheck#insufficient_data_health_status}.
         * <p>
         * @return {@code this}
         * @param insufficientDataHealthStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#insufficient_data_health_status Route53HealthCheck#insufficient_data_health_status}. This parameter is required.
         */
        public Builder insufficientDataHealthStatus(final java.lang.String insufficientDataHealthStatus) {
            this.config.insufficientDataHealthStatus(insufficientDataHealthStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}.
         * <p>
         * @return {@code this}
         * @param invertHealthcheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}. This parameter is required.
         */
        public Builder invertHealthcheck(final java.lang.Boolean invertHealthcheck) {
            this.config.invertHealthcheck(invertHealthcheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}.
         * <p>
         * @return {@code this}
         * @param invertHealthcheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}. This parameter is required.
         */
        public Builder invertHealthcheck(final com.hashicorp.cdktf.IResolvable invertHealthcheck) {
            this.config.invertHealthcheck(invertHealthcheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#ip_address Route53HealthCheck#ip_address}.
         * <p>
         * @return {@code this}
         * @param ipAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#ip_address Route53HealthCheck#ip_address}. This parameter is required.
         */
        public Builder ipAddress(final java.lang.String ipAddress) {
            this.config.ipAddress(ipAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}.
         * <p>
         * @return {@code this}
         * @param measureLatency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}. This parameter is required.
         */
        public Builder measureLatency(final java.lang.Boolean measureLatency) {
            this.config.measureLatency(measureLatency);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}.
         * <p>
         * @return {@code this}
         * @param measureLatency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}. This parameter is required.
         */
        public Builder measureLatency(final com.hashicorp.cdktf.IResolvable measureLatency) {
            this.config.measureLatency(measureLatency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#port Route53HealthCheck#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#port Route53HealthCheck#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#reference_name Route53HealthCheck#reference_name}.
         * <p>
         * @return {@code this}
         * @param referenceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#reference_name Route53HealthCheck#reference_name}. This parameter is required.
         */
        public Builder referenceName(final java.lang.String referenceName) {
            this.config.referenceName(referenceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#regions Route53HealthCheck#regions}.
         * <p>
         * @return {@code this}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#regions Route53HealthCheck#regions}. This parameter is required.
         */
        public Builder regions(final java.util.List<java.lang.String> regions) {
            this.config.regions(regions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#request_interval Route53HealthCheck#request_interval}.
         * <p>
         * @return {@code this}
         * @param requestInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#request_interval Route53HealthCheck#request_interval}. This parameter is required.
         */
        public Builder requestInterval(final java.lang.Number requestInterval) {
            this.config.requestInterval(requestInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#resource_path Route53HealthCheck#resource_path}.
         * <p>
         * @return {@code this}
         * @param resourcePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#resource_path Route53HealthCheck#resource_path}. This parameter is required.
         */
        public Builder resourcePath(final java.lang.String resourcePath) {
            this.config.resourcePath(resourcePath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#routing_control_arn Route53HealthCheck#routing_control_arn}.
         * <p>
         * @return {@code this}
         * @param routingControlArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#routing_control_arn Route53HealthCheck#routing_control_arn}. This parameter is required.
         */
        public Builder routingControlArn(final java.lang.String routingControlArn) {
            this.config.routingControlArn(routingControlArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#search_string Route53HealthCheck#search_string}.
         * <p>
         * @return {@code this}
         * @param searchString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#search_string Route53HealthCheck#search_string}. This parameter is required.
         */
        public Builder searchString(final java.lang.String searchString) {
            this.config.searchString(searchString);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags Route53HealthCheck#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags Route53HealthCheck#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags_all Route53HealthCheck#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags_all Route53HealthCheck#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#triggers Route53HealthCheck#triggers}.
         * <p>
         * @return {@code this}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#triggers Route53HealthCheck#triggers}. This parameter is required.
         */
        public Builder triggers(final java.util.Map<java.lang.String, java.lang.String> triggers) {
            this.config.triggers(triggers);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.route53_health_check.Route53HealthCheck}.
         */
        @Override
        public imports.aws.route53_health_check.Route53HealthCheck build() {
            return new imports.aws.route53_health_check.Route53HealthCheck(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
