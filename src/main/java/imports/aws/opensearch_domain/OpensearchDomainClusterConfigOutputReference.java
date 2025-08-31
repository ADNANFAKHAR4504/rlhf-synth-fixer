package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.989Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainClusterConfigOutputReference")
public class OpensearchDomainClusterConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchDomainClusterConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putColdStorageOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigColdStorageOptions value) {
        software.amazon.jsii.Kernel.call(this, "putColdStorageOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNodeOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptions> __cast_cd4240 = (java.util.List<imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNodeOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putZoneAwarenessConfig(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigZoneAwarenessConfig value) {
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

    public void resetMultiAzWithStandbyEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetMultiAzWithStandbyEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeOptions() {
        software.amazon.jsii.Kernel.call(this, "resetNodeOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigColdStorageOptionsOutputReference getColdStorageOptions() {
        return software.amazon.jsii.Kernel.get(this, "coldStorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigColdStorageOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsList getNodeOptions() {
        return software.amazon.jsii.Kernel.get(this, "nodeOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigZoneAwarenessConfigOutputReference getZoneAwarenessConfig() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigZoneAwarenessConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfigColdStorageOptions getColdStorageOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "coldStorageOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigColdStorageOptions.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiAzWithStandbyEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "multiAzWithStandbyEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNodeOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfigZoneAwarenessConfig getZoneAwarenessConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigZoneAwarenessConfig.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiAzWithStandbyEnabled() {
        return software.amazon.jsii.Kernel.get(this, "multiAzWithStandbyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiAzWithStandbyEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiAzWithStandbyEnabled", java.util.Objects.requireNonNull(value, "multiAzWithStandbyEnabled is required"));
    }

    public void setMultiAzWithStandbyEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiAzWithStandbyEnabled", java.util.Objects.requireNonNull(value, "multiAzWithStandbyEnabled is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
