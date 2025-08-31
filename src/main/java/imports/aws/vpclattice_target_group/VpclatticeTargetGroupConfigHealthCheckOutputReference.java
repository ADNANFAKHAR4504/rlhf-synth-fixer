package imports.aws.vpclattice_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.629Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigHealthCheckOutputReference")
public class VpclatticeTargetGroupConfigHealthCheckOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeTargetGroupConfigHealthCheckOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeTargetGroupConfigHealthCheckOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpclatticeTargetGroupConfigHealthCheckOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMatcher(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher value) {
        software.amazon.jsii.Kernel.call(this, "putMatcher", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckIntervalSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckIntervalSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthyThresholdCount() {
        software.amazon.jsii.Kernel.call(this, "resetHealthyThresholdCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMatcher() {
        software.amazon.jsii.Kernel.call(this, "resetMatcher", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPath() {
        software.amazon.jsii.Kernel.call(this, "resetPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocolVersion() {
        software.amazon.jsii.Kernel.call(this, "resetProtocolVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnhealthyThresholdCount() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyThresholdCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcherOutputReference getMatcher() {
        return software.amazon.jsii.Kernel.get(this, "matcher", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcherOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckIntervalSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckIntervalSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHealthyThresholdCountInput() {
        return software.amazon.jsii.Kernel.get(this, "healthyThresholdCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher getMatcherInput() {
        return software.amazon.jsii.Kernel.get(this, "matcherInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyThresholdCountInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyThresholdCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHealthCheckIntervalSeconds() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckIntervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHealthCheckIntervalSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckIntervalSeconds", java.util.Objects.requireNonNull(value, "healthCheckIntervalSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHealthCheckTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHealthCheckTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckTimeoutSeconds", java.util.Objects.requireNonNull(value, "healthCheckTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHealthyThresholdCount() {
        return software.amazon.jsii.Kernel.get(this, "healthyThresholdCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHealthyThresholdCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "healthyThresholdCount", java.util.Objects.requireNonNull(value, "healthyThresholdCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "path", java.util.Objects.requireNonNull(value, "path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocolVersion() {
        return software.amazon.jsii.Kernel.get(this, "protocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocolVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocolVersion", java.util.Objects.requireNonNull(value, "protocolVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnhealthyThresholdCount() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyThresholdCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnhealthyThresholdCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unhealthyThresholdCount", java.util.Objects.requireNonNull(value, "unhealthyThresholdCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
