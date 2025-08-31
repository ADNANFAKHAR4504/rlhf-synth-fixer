package imports.aws.timestreaminfluxdb_db_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance aws_timestreaminfluxdb_db_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.544Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstance")
public class TimestreaminfluxdbDbInstance extends com.hashicorp.cdktf.TerraformResource {

    protected TimestreaminfluxdbDbInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreaminfluxdbDbInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance aws_timestreaminfluxdb_db_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public TimestreaminfluxdbDbInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a TimestreaminfluxdbDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TimestreaminfluxdbDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing TimestreaminfluxdbDbInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the TimestreaminfluxdbDbInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a TimestreaminfluxdbDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TimestreaminfluxdbDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing TimestreaminfluxdbDbInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLogDeliveryConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration> __cast_cd4240 = (java.util.List<imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogDeliveryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDbParameterGroupIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetDbParameterGroupIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbStorageType() {
        software.amazon.jsii.Kernel.call(this, "resetDbStorageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentType() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDeliveryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLogDeliveryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkType() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPubliclyAccessible() {
        software.amazon.jsii.Kernel.call(this, "resetPubliclyAccessible", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInfluxAuthParametersSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "influxAuthParametersSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfigurationList getLogDeliveryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "secondaryAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAllocatedStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "allocatedStorageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dbInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbParameterGroupIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "dbParameterGroupIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dbStorageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogDeliveryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "networkTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessibleInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessibleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "usernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSubnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAllocatedStorage() {
        return software.amazon.jsii.Kernel.get(this, "allocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAllocatedStorage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "allocatedStorage", java.util.Objects.requireNonNull(value, "allocatedStorage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "dbInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbInstanceType", java.util.Objects.requireNonNull(value, "dbInstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbParameterGroupIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "dbParameterGroupIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbParameterGroupIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbParameterGroupIdentifier", java.util.Objects.requireNonNull(value, "dbParameterGroupIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbStorageType() {
        return software.amazon.jsii.Kernel.get(this, "dbStorageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbStorageType", java.util.Objects.requireNonNull(value, "dbStorageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType() {
        return software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentType", java.util.Objects.requireNonNull(value, "deploymentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkType() {
        return software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkType", java.util.Objects.requireNonNull(value, "networkType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganization() {
        return software.amazon.jsii.Kernel.get(this, "organization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganization(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organization", java.util.Objects.requireNonNull(value, "organization is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassword() {
        return software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "password", java.util.Objects.requireNonNull(value, "password is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPubliclyAccessible() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsername() {
        return software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "username", java.util.Objects.requireNonNull(value, "username is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSecurityGroupIds", java.util.Objects.requireNonNull(value, "vpcSecurityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSubnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSubnetIds", java.util.Objects.requireNonNull(value, "vpcSubnetIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance> {
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
        private final imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceConfig.Builder();
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
         * The amount of storage to allocate for your DB storage type in GiB (gibibytes).
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#allocated_storage TimestreaminfluxdbDbInstance#allocated_storage}
         * <p>
         * @return {@code this}
         * @param allocatedStorage The amount of storage to allocate for your DB storage type in GiB (gibibytes). This parameter is required.
         */
        public Builder allocatedStorage(final java.lang.Number allocatedStorage) {
            this.config.allocatedStorage(allocatedStorage);
            return this;
        }

        /**
         * The name of the initial InfluxDB bucket.
         * <p>
         * All InfluxDB data is stored in a bucket.
         * A bucket combines the concept of a database and a retention period (the duration of time
         * that each data point persists). A bucket belongs to an organization.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#bucket TimestreaminfluxdbDbInstance#bucket}
         * <p>
         * @return {@code this}
         * @param bucket The name of the initial InfluxDB bucket. This parameter is required.
         */
        public Builder bucket(final java.lang.String bucket) {
            this.config.bucket(bucket);
            return this;
        }

        /**
         * The Timestream for InfluxDB DB instance type to run InfluxDB on.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_instance_type TimestreaminfluxdbDbInstance#db_instance_type}
         * <p>
         * @return {@code this}
         * @param dbInstanceType The Timestream for InfluxDB DB instance type to run InfluxDB on. This parameter is required.
         */
        public Builder dbInstanceType(final java.lang.String dbInstanceType) {
            this.config.dbInstanceType(dbInstanceType);
            return this;
        }

        /**
         * The name that uniquely identifies the DB instance when interacting with the  					Amazon Timestream for InfluxDB API and CLI commands.
         * <p>
         * This name will also be a
         * prefix included in the endpoint. DB instance names must be unique per customer
         * and per region.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#name TimestreaminfluxdbDbInstance#name}
         * <p>
         * @return {@code this}
         * @param name The name that uniquely identifies the DB instance when interacting with the  					Amazon Timestream for InfluxDB API and CLI commands. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * The name of the initial organization for the initial admin user in InfluxDB.
         * <p>
         * An
         * InfluxDB organization is a workspace for a group of users.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#organization TimestreaminfluxdbDbInstance#organization}
         * <p>
         * @return {@code this}
         * @param organization The name of the initial organization for the initial admin user in InfluxDB. This parameter is required.
         */
        public Builder organization(final java.lang.String organization) {
            this.config.organization(organization);
            return this;
        }

        /**
         * The password of the initial admin user created in InfluxDB.
         * <p>
         * This password will
         * allow you to access the InfluxDB UI to perform various administrative tasks and
         * also use the InfluxDB CLI to create an operator token. These attributes will be
         * stored in a Secret created in AWS SecretManager in your account.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#password TimestreaminfluxdbDbInstance#password}
         * <p>
         * @return {@code this}
         * @param password The password of the initial admin user created in InfluxDB. This parameter is required.
         */
        public Builder password(final java.lang.String password) {
            this.config.password(password);
            return this;
        }

        /**
         * The username of the initial admin user created in InfluxDB.
         * <p>
         * Must start with a letter and can't end with a hyphen or contain two
         * consecutive hyphens. For example, my-user1. This username will allow
         * you to access the InfluxDB UI to perform various administrative tasks
         * and also use the InfluxDB CLI to create an operator token. These
         * attributes will be stored in a Secret created in Amazon Secrets
         * Manager in your account
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#username TimestreaminfluxdbDbInstance#username}
         * <p>
         * @return {@code this}
         * @param username The username of the initial admin user created in InfluxDB. This parameter is required.
         */
        public Builder username(final java.lang.String username) {
            this.config.username(username);
            return this;
        }

        /**
         * A list of VPC security group IDs to associate with the DB instance.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_security_group_ids TimestreaminfluxdbDbInstance#vpc_security_group_ids}
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds A list of VPC security group IDs to associate with the DB instance. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config.vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * A list of VPC subnet IDs to associate with the DB instance.
         * <p>
         * Provide at least
         * two VPC subnet IDs in different availability zones when deploying with a Multi-AZ standby.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_subnet_ids TimestreaminfluxdbDbInstance#vpc_subnet_ids}
         * <p>
         * @return {@code this}
         * @param vpcSubnetIds A list of VPC subnet IDs to associate with the DB instance. This parameter is required.
         */
        public Builder vpcSubnetIds(final java.util.List<java.lang.String> vpcSubnetIds) {
            this.config.vpcSubnetIds(vpcSubnetIds);
            return this;
        }

        /**
         * The id of the DB parameter group assigned to your DB instance.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_parameter_group_identifier TimestreaminfluxdbDbInstance#db_parameter_group_identifier}
         * <p>
         * @return {@code this}
         * @param dbParameterGroupIdentifier The id of the DB parameter group assigned to your DB instance. This parameter is required.
         */
        public Builder dbParameterGroupIdentifier(final java.lang.String dbParameterGroupIdentifier) {
            this.config.dbParameterGroupIdentifier(dbParameterGroupIdentifier);
            return this;
        }

        /**
         * The Timestream for InfluxDB DB storage type to read and write InfluxDB data.
         * <p>
         * You can choose between 3 different types of provisioned Influx IOPS included storage according
         * to your workloads requirements: Influx IO Included 3000 IOPS, Influx IO Included 12000 IOPS,
         * Influx IO Included 16000 IOPS.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_storage_type TimestreaminfluxdbDbInstance#db_storage_type}
         * <p>
         * @return {@code this}
         * @param dbStorageType The Timestream for InfluxDB DB storage type to read and write InfluxDB data. This parameter is required.
         */
        public Builder dbStorageType(final java.lang.String dbStorageType) {
            this.config.dbStorageType(dbStorageType);
            return this;
        }

        /**
         * Specifies whether the DB instance will be deployed as a standalone instance or  					with a Multi-AZ standby for high availability.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#deployment_type TimestreaminfluxdbDbInstance#deployment_type}
         * <p>
         * @return {@code this}
         * @param deploymentType Specifies whether the DB instance will be deployed as a standalone instance or  					with a Multi-AZ standby for high availability. This parameter is required.
         */
        public Builder deploymentType(final java.lang.String deploymentType) {
            this.config.deploymentType(deploymentType);
            return this;
        }

        /**
         * log_delivery_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#log_delivery_configuration TimestreaminfluxdbDbInstance#log_delivery_configuration}
         * <p>
         * @return {@code this}
         * @param logDeliveryConfiguration log_delivery_configuration block. This parameter is required.
         */
        public Builder logDeliveryConfiguration(final com.hashicorp.cdktf.IResolvable logDeliveryConfiguration) {
            this.config.logDeliveryConfiguration(logDeliveryConfiguration);
            return this;
        }
        /**
         * log_delivery_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#log_delivery_configuration TimestreaminfluxdbDbInstance#log_delivery_configuration}
         * <p>
         * @return {@code this}
         * @param logDeliveryConfiguration log_delivery_configuration block. This parameter is required.
         */
        public Builder logDeliveryConfiguration(final java.util.List<? extends imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration> logDeliveryConfiguration) {
            this.config.logDeliveryConfiguration(logDeliveryConfiguration);
            return this;
        }

        /**
         * Specifies whether the networkType of the Timestream for InfluxDB instance is  					IPV4, which can communicate over IPv4 protocol only, or DUAL, which can communicate  					over both IPv4 and IPv6 protocols.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#network_type TimestreaminfluxdbDbInstance#network_type}
         * <p>
         * @return {@code this}
         * @param networkType Specifies whether the networkType of the Timestream for InfluxDB instance is  					IPV4, which can communicate over IPv4 protocol only, or DUAL, which can communicate  					over both IPv4 and IPv6 protocols. This parameter is required.
         */
        public Builder networkType(final java.lang.String networkType) {
            this.config.networkType(networkType);
            return this;
        }

        /**
         * The port number on which InfluxDB accepts connections.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#port TimestreaminfluxdbDbInstance#port}
         * <p>
         * @return {@code this}
         * @param port The port number on which InfluxDB accepts connections. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Configures the DB instance with a public IP to facilitate access.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#publicly_accessible TimestreaminfluxdbDbInstance#publicly_accessible}
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Configures the DB instance with a public IP to facilitate access. This parameter is required.
         */
        public Builder publiclyAccessible(final java.lang.Boolean publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }
        /**
         * Configures the DB instance with a public IP to facilitate access.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#publicly_accessible TimestreaminfluxdbDbInstance#publicly_accessible}
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Configures the DB instance with a public IP to facilitate access. This parameter is required.
         */
        public Builder publiclyAccessible(final com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#tags TimestreaminfluxdbDbInstance#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#tags TimestreaminfluxdbDbInstance#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#timeouts TimestreaminfluxdbDbInstance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance}.
         */
        @Override
        public imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance build() {
            return new imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
