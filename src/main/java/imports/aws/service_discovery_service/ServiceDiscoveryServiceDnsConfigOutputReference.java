package imports.aws.service_discovery_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.428Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.serviceDiscoveryService.ServiceDiscoveryServiceDnsConfigOutputReference")
public class ServiceDiscoveryServiceDnsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ServiceDiscoveryServiceDnsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServiceDiscoveryServiceDnsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ServiceDiscoveryServiceDnsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDnsRecords(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords> __cast_cd4240 = (java.util.List<imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDnsRecords", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRoutingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecordsList getDnsRecords() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecords", software.amazon.jsii.NativeType.forClass(imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecordsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDnsRecordsInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecordsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "routingPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespaceId() {
        return software.amazon.jsii.Kernel.get(this, "namespaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespaceId", java.util.Objects.requireNonNull(value, "namespaceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "routingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingPolicy", java.util.Objects.requireNonNull(value, "routingPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
