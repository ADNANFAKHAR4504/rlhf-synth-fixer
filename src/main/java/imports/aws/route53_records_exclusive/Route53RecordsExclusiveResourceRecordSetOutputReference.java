package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetOutputReference")
public class Route53RecordsExclusiveResourceRecordSetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecordsExclusiveResourceRecordSetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecordsExclusiveResourceRecordSetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Route53RecordsExclusiveResourceRecordSetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAliasTarget(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAliasTarget", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCidrRoutingConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCidrRoutingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGeolocation(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGeolocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGeoproximityLocation(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGeoproximityLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceRecords(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceRecords", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAliasTarget() {
        software.amazon.jsii.Kernel.call(this, "resetAliasTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCidrRoutingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCidrRoutingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailover() {
        software.amazon.jsii.Kernel.call(this, "resetFailover", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeolocation() {
        software.amazon.jsii.Kernel.call(this, "resetGeolocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeoproximityLocation() {
        software.amazon.jsii.Kernel.call(this, "resetGeoproximityLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHealthCheckId() {
        software.amazon.jsii.Kernel.call(this, "resetHealthCheckId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiValueAnswer() {
        software.amazon.jsii.Kernel.call(this, "resetMultiValueAnswer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegion() {
        software.amazon.jsii.Kernel.call(this, "resetRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceRecords() {
        software.amazon.jsii.Kernel.call(this, "resetResourceRecords", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSetIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSetIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrafficPolicyInstanceId() {
        software.amazon.jsii.Kernel.call(this, "resetTrafficPolicyInstanceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTtl() {
        software.amazon.jsii.Kernel.call(this, "resetTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeight() {
        software.amazon.jsii.Kernel.call(this, "resetWeight", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTargetList getAliasTarget() {
        return software.amazon.jsii.Kernel.get(this, "aliasTarget", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTargetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList getCidrRoutingConfig() {
        return software.amazon.jsii.Kernel.get(this, "cidrRoutingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocationList getGeolocation() {
        return software.amazon.jsii.Kernel.get(this, "geolocation", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList getGeoproximityLocation() {
        return software.amazon.jsii.Kernel.get(this, "geoproximityLocation", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecordsList getResourceRecords() {
        return software.amazon.jsii.Kernel.get(this, "resourceRecords", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecordsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAliasTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "aliasTargetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCidrRoutingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cidrRoutingConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFailoverInput() {
        return software.amazon.jsii.Kernel.get(this, "failoverInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGeolocationInput() {
        return software.amazon.jsii.Kernel.get(this, "geolocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGeoproximityLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "geoproximityLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckIdInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiValueAnswerInput() {
        return software.amazon.jsii.Kernel.get(this, "multiValueAnswerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceRecordsInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceRecordsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSetIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "setIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrafficPolicyInstanceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficPolicyInstanceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "ttlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWeightInput() {
        return software.amazon.jsii.Kernel.get(this, "weightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFailover() {
        return software.amazon.jsii.Kernel.get(this, "failover", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFailover(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "failover", java.util.Objects.requireNonNull(value, "failover is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHealthCheckId() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHealthCheckId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "healthCheckId", java.util.Objects.requireNonNull(value, "healthCheckId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiValueAnswer() {
        return software.amazon.jsii.Kernel.get(this, "multiValueAnswer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiValueAnswer(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiValueAnswer", java.util.Objects.requireNonNull(value, "multiValueAnswer is required"));
    }

    public void setMultiValueAnswer(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiValueAnswer", java.util.Objects.requireNonNull(value, "multiValueAnswer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSetIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "setIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSetIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "setIdentifier", java.util.Objects.requireNonNull(value, "setIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrafficPolicyInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "trafficPolicyInstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrafficPolicyInstanceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trafficPolicyInstanceId", java.util.Objects.requireNonNull(value, "trafficPolicyInstanceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTtl() {
        return software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ttl", java.util.Objects.requireNonNull(value, "ttl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWeight() {
        return software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWeight(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "weight", java.util.Objects.requireNonNull(value, "weight is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSet value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
