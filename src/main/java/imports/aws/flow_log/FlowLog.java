package imports.aws.flow_log;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log aws_flow_log}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.233Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.flowLog.FlowLog")
public class FlowLog extends com.hashicorp.cdktf.TerraformResource {

    protected FlowLog(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FlowLog(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.flow_log.FlowLog.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log aws_flow_log} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public FlowLog(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.flow_log.FlowLogConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log aws_flow_log} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public FlowLog(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a FlowLog resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FlowLog to import. This parameter is required.
     * @param importFromId The id of the existing FlowLog that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FlowLog to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.flow_log.FlowLog.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FlowLog resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FlowLog to import. This parameter is required.
     * @param importFromId The id of the existing FlowLog that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.flow_log.FlowLog.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDestinationOptions(final @org.jetbrains.annotations.NotNull imports.aws.flow_log.FlowLogDestinationOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeliverCrossAccountRole() {
        software.amazon.jsii.Kernel.call(this, "resetDeliverCrossAccountRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEniId() {
        software.amazon.jsii.Kernel.call(this, "resetEniId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetIamRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDestinationType() {
        software.amazon.jsii.Kernel.call(this, "resetLogDestinationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogFormat() {
        software.amazon.jsii.Kernel.call(this, "resetLogFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxAggregationInterval() {
        software.amazon.jsii.Kernel.call(this, "resetMaxAggregationInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrafficType() {
        software.amazon.jsii.Kernel.call(this, "resetTrafficType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayAttachmentId() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayAttachmentId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.flow_log.FlowLogDestinationOptionsOutputReference getDestinationOptions() {
        return software.amazon.jsii.Kernel.get(this, "destinationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.flow_log.FlowLogDestinationOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliverCrossAccountRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "deliverCrossAccountRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.flow_log.FlowLogDestinationOptions getDestinationOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.flow_log.FlowLogDestinationOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEniIdInput() {
        return software.amazon.jsii.Kernel.get(this, "eniIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "logFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxAggregationIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "maxAggregationIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrafficTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayAttachmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliverCrossAccountRole() {
        return software.amazon.jsii.Kernel.get(this, "deliverCrossAccountRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliverCrossAccountRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliverCrossAccountRole", java.util.Objects.requireNonNull(value, "deliverCrossAccountRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEniId() {
        return software.amazon.jsii.Kernel.get(this, "eniId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEniId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eniId", java.util.Objects.requireNonNull(value, "eniId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamRoleArn", java.util.Objects.requireNonNull(value, "iamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestination", java.util.Objects.requireNonNull(value, "logDestination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestinationType() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestinationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestinationType", java.util.Objects.requireNonNull(value, "logDestinationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogFormat() {
        return software.amazon.jsii.Kernel.get(this, "logFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logFormat", java.util.Objects.requireNonNull(value, "logFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName() {
        return software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroupName", java.util.Objects.requireNonNull(value, "logGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxAggregationInterval() {
        return software.amazon.jsii.Kernel.get(this, "maxAggregationInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxAggregationInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxAggregationInterval", java.util.Objects.requireNonNull(value, "maxAggregationInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTrafficType() {
        return software.amazon.jsii.Kernel.get(this, "trafficType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrafficType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trafficType", java.util.Objects.requireNonNull(value, "trafficType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayAttachmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayAttachmentId", java.util.Objects.requireNonNull(value, "transitGatewayAttachmentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.flow_log.FlowLog}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.flow_log.FlowLog> {
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
        private imports.aws.flow_log.FlowLogConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#deliver_cross_account_role FlowLog#deliver_cross_account_role}.
         * <p>
         * @return {@code this}
         * @param deliverCrossAccountRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#deliver_cross_account_role FlowLog#deliver_cross_account_role}. This parameter is required.
         */
        public Builder deliverCrossAccountRole(final java.lang.String deliverCrossAccountRole) {
            this.config().deliverCrossAccountRole(deliverCrossAccountRole);
            return this;
        }

        /**
         * destination_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#destination_options FlowLog#destination_options}
         * <p>
         * @return {@code this}
         * @param destinationOptions destination_options block. This parameter is required.
         */
        public Builder destinationOptions(final imports.aws.flow_log.FlowLogDestinationOptions destinationOptions) {
            this.config().destinationOptions(destinationOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#eni_id FlowLog#eni_id}.
         * <p>
         * @return {@code this}
         * @param eniId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#eni_id FlowLog#eni_id}. This parameter is required.
         */
        public Builder eniId(final java.lang.String eniId) {
            this.config().eniId(eniId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#iam_role_arn FlowLog#iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#iam_role_arn FlowLog#iam_role_arn}. This parameter is required.
         */
        public Builder iamRoleArn(final java.lang.String iamRoleArn) {
            this.config().iamRoleArn(iamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#id FlowLog#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#id FlowLog#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination FlowLog#log_destination}.
         * <p>
         * @return {@code this}
         * @param logDestination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination FlowLog#log_destination}. This parameter is required.
         */
        public Builder logDestination(final java.lang.String logDestination) {
            this.config().logDestination(logDestination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination_type FlowLog#log_destination_type}.
         * <p>
         * @return {@code this}
         * @param logDestinationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination_type FlowLog#log_destination_type}. This parameter is required.
         */
        public Builder logDestinationType(final java.lang.String logDestinationType) {
            this.config().logDestinationType(logDestinationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_format FlowLog#log_format}.
         * <p>
         * @return {@code this}
         * @param logFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_format FlowLog#log_format}. This parameter is required.
         */
        public Builder logFormat(final java.lang.String logFormat) {
            this.config().logFormat(logFormat);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_group_name FlowLog#log_group_name}.
         * <p>
         * @return {@code this}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_group_name FlowLog#log_group_name}. This parameter is required.
         */
        public Builder logGroupName(final java.lang.String logGroupName) {
            this.config().logGroupName(logGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#max_aggregation_interval FlowLog#max_aggregation_interval}.
         * <p>
         * @return {@code this}
         * @param maxAggregationInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#max_aggregation_interval FlowLog#max_aggregation_interval}. This parameter is required.
         */
        public Builder maxAggregationInterval(final java.lang.Number maxAggregationInterval) {
            this.config().maxAggregationInterval(maxAggregationInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#subnet_id FlowLog#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#subnet_id FlowLog#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config().subnetId(subnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags FlowLog#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags FlowLog#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags_all FlowLog#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags_all FlowLog#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#traffic_type FlowLog#traffic_type}.
         * <p>
         * @return {@code this}
         * @param trafficType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#traffic_type FlowLog#traffic_type}. This parameter is required.
         */
        public Builder trafficType(final java.lang.String trafficType) {
            this.config().trafficType(trafficType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_attachment_id FlowLog#transit_gateway_attachment_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_attachment_id FlowLog#transit_gateway_attachment_id}. This parameter is required.
         */
        public Builder transitGatewayAttachmentId(final java.lang.String transitGatewayAttachmentId) {
            this.config().transitGatewayAttachmentId(transitGatewayAttachmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_id FlowLog#transit_gateway_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_id FlowLog#transit_gateway_id}. This parameter is required.
         */
        public Builder transitGatewayId(final java.lang.String transitGatewayId) {
            this.config().transitGatewayId(transitGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#vpc_id FlowLog#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#vpc_id FlowLog#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config().vpcId(vpcId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.flow_log.FlowLog}.
         */
        @Override
        public imports.aws.flow_log.FlowLog build() {
            return new imports.aws.flow_log.FlowLog(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.flow_log.FlowLogConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.flow_log.FlowLogConfig.Builder();
            }
            return this.config;
        }
    }
}
