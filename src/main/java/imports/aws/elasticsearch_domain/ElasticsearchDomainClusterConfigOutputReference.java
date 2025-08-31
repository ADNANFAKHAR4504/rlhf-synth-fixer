package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainClusterConfigOutputReference")
public class ElasticsearchDomainClusterConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainClusterConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putColdStorageOptions(final @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions value) {
        software.amazon.jsii.Kernel.call(this, "putColdStorageOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putZoneAwarenessConfig(final @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig value) {
        software.amazon.jsii.Kernel.call(this, "putZoneAwarenessConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetColdStorageOptions() {
        software.amazon.jsii.Kernel.call(this, "resetColdStorageOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDedicatedMasterCount() {
        software.amazon.jsii.Kernel.call(this, "resetDedicatedMasterCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDedicatedMasterEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDedicatedMasterEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDedicatedMasterType() {
        software.amazon.jsii.Kernel.call(this, "resetDedicatedMasterType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceCount() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarmCount() {
        software.amazon.jsii.Kernel.call(this, "resetWarmCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarmEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetWarmEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWarmType() {
        software.amazon.jsii.Kernel.call(this, "resetWarmType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZoneAwarenessConfig() {
        software.amazon.jsii.Kernel.call(this, "resetZoneAwarenessConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZoneAwarenessEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetZoneAwarenessEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptionsOutputReference getColdStorageOptions() {
        return software.amazon.jsii.Kernel.get(this, "coldStorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfigOutputReference getZoneAwarenessConfig() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions getColdStorageOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "coldStorageOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDedicatedMasterCountInput() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDedicatedMasterEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDedicatedMasterTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWarmCountInput() {
        return software.amazon.jsii.Kernel.get(this, "warmCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWarmEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "warmEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWarmTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "warmTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig getZoneAwarenessConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getZoneAwarenessEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDedicatedMasterCount() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDedicatedMasterCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dedicatedMasterCount", java.util.Objects.requireNonNull(value, "dedicatedMasterCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDedicatedMasterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDedicatedMasterEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dedicatedMasterEnabled", java.util.Objects.requireNonNull(value, "dedicatedMasterEnabled is required"));
    }

    public void setDedicatedMasterEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dedicatedMasterEnabled", java.util.Objects.requireNonNull(value, "dedicatedMasterEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDedicatedMasterType() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDedicatedMasterType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dedicatedMasterType", java.util.Objects.requireNonNull(value, "dedicatedMasterType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instanceCount", java.util.Objects.requireNonNull(value, "instanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWarmCount() {
        return software.amazon.jsii.Kernel.get(this, "warmCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWarmCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "warmCount", java.util.Objects.requireNonNull(value, "warmCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWarmEnabled() {
        return software.amazon.jsii.Kernel.get(this, "warmEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWarmEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "warmEnabled", java.util.Objects.requireNonNull(value, "warmEnabled is required"));
    }

    public void setWarmEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "warmEnabled", java.util.Objects.requireNonNull(value, "warmEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarmType() {
        return software.amazon.jsii.Kernel.get(this, "warmType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWarmType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "warmType", java.util.Objects.requireNonNull(value, "warmType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getZoneAwarenessEnabled() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setZoneAwarenessEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "zoneAwarenessEnabled", java.util.Objects.requireNonNull(value, "zoneAwarenessEnabled is required"));
    }

    public void setZoneAwarenessEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "zoneAwarenessEnabled", java.util.Objects.requireNonNull(value, "zoneAwarenessEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
