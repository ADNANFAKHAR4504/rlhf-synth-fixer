package imports.aws.flow_log;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.234Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.flowLog.FlowLogConfig")
@software.amazon.jsii.Jsii.Proxy(FlowLogConfig.Jsii$Proxy.class)
public interface FlowLogConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#deliver_cross_account_role FlowLog#deliver_cross_account_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliverCrossAccountRole() {
        return null;
    }

    /**
     * destination_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#destination_options FlowLog#destination_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.flow_log.FlowLogDestinationOptions getDestinationOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#eni_id FlowLog#eni_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEniId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#iam_role_arn FlowLog#iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#id FlowLog#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination FlowLog#log_destination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination_type FlowLog#log_destination_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_format FlowLog#log_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_group_name FlowLog#log_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#max_aggregation_interval FlowLog#max_aggregation_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAggregationInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#subnet_id FlowLog#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags FlowLog#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags_all FlowLog#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#traffic_type FlowLog#traffic_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrafficType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_attachment_id FlowLog#transit_gateway_attachment_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayAttachmentId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_id FlowLog#transit_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#vpc_id FlowLog#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FlowLogConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FlowLogConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FlowLogConfig> {
        java.lang.String deliverCrossAccountRole;
        imports.aws.flow_log.FlowLogDestinationOptions destinationOptions;
        java.lang.String eniId;
        java.lang.String iamRoleArn;
        java.lang.String id;
        java.lang.String logDestination;
        java.lang.String logDestinationType;
        java.lang.String logFormat;
        java.lang.String logGroupName;
        java.lang.Number maxAggregationInterval;
        java.lang.String subnetId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String trafficType;
        java.lang.String transitGatewayAttachmentId;
        java.lang.String transitGatewayId;
        java.lang.String vpcId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FlowLogConfig#getDeliverCrossAccountRole}
         * @param deliverCrossAccountRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#deliver_cross_account_role FlowLog#deliver_cross_account_role}.
         * @return {@code this}
         */
        public Builder deliverCrossAccountRole(java.lang.String deliverCrossAccountRole) {
            this.deliverCrossAccountRole = deliverCrossAccountRole;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getDestinationOptions}
         * @param destinationOptions destination_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#destination_options FlowLog#destination_options}
         * @return {@code this}
         */
        public Builder destinationOptions(imports.aws.flow_log.FlowLogDestinationOptions destinationOptions) {
            this.destinationOptions = destinationOptions;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getEniId}
         * @param eniId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#eni_id FlowLog#eni_id}.
         * @return {@code this}
         */
        public Builder eniId(java.lang.String eniId) {
            this.eniId = eniId;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#iam_role_arn FlowLog#iam_role_arn}.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#id FlowLog#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getLogDestination}
         * @param logDestination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination FlowLog#log_destination}.
         * @return {@code this}
         */
        public Builder logDestination(java.lang.String logDestination) {
            this.logDestination = logDestination;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getLogDestinationType}
         * @param logDestinationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_destination_type FlowLog#log_destination_type}.
         * @return {@code this}
         */
        public Builder logDestinationType(java.lang.String logDestinationType) {
            this.logDestinationType = logDestinationType;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getLogFormat}
         * @param logFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_format FlowLog#log_format}.
         * @return {@code this}
         */
        public Builder logFormat(java.lang.String logFormat) {
            this.logFormat = logFormat;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#log_group_name FlowLog#log_group_name}.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getMaxAggregationInterval}
         * @param maxAggregationInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#max_aggregation_interval FlowLog#max_aggregation_interval}.
         * @return {@code this}
         */
        public Builder maxAggregationInterval(java.lang.Number maxAggregationInterval) {
            this.maxAggregationInterval = maxAggregationInterval;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#subnet_id FlowLog#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags FlowLog#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#tags_all FlowLog#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getTrafficType}
         * @param trafficType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#traffic_type FlowLog#traffic_type}.
         * @return {@code this}
         */
        public Builder trafficType(java.lang.String trafficType) {
            this.trafficType = trafficType;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getTransitGatewayAttachmentId}
         * @param transitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_attachment_id FlowLog#transit_gateway_attachment_id}.
         * @return {@code this}
         */
        public Builder transitGatewayAttachmentId(java.lang.String transitGatewayAttachmentId) {
            this.transitGatewayAttachmentId = transitGatewayAttachmentId;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#transit_gateway_id FlowLog#transit_gateway_id}.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#vpc_id FlowLog#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FlowLogConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FlowLogConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FlowLogConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FlowLogConfig {
        private final java.lang.String deliverCrossAccountRole;
        private final imports.aws.flow_log.FlowLogDestinationOptions destinationOptions;
        private final java.lang.String eniId;
        private final java.lang.String iamRoleArn;
        private final java.lang.String id;
        private final java.lang.String logDestination;
        private final java.lang.String logDestinationType;
        private final java.lang.String logFormat;
        private final java.lang.String logGroupName;
        private final java.lang.Number maxAggregationInterval;
        private final java.lang.String subnetId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String trafficType;
        private final java.lang.String transitGatewayAttachmentId;
        private final java.lang.String transitGatewayId;
        private final java.lang.String vpcId;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deliverCrossAccountRole = software.amazon.jsii.Kernel.get(this, "deliverCrossAccountRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationOptions = software.amazon.jsii.Kernel.get(this, "destinationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.flow_log.FlowLogDestinationOptions.class));
            this.eniId = software.amazon.jsii.Kernel.get(this, "eniId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDestination = software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDestinationType = software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logFormat = software.amazon.jsii.Kernel.get(this, "logFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxAggregationInterval = software.amazon.jsii.Kernel.get(this, "maxAggregationInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trafficType = software.amazon.jsii.Kernel.get(this, "trafficType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayAttachmentId = software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deliverCrossAccountRole = builder.deliverCrossAccountRole;
            this.destinationOptions = builder.destinationOptions;
            this.eniId = builder.eniId;
            this.iamRoleArn = builder.iamRoleArn;
            this.id = builder.id;
            this.logDestination = builder.logDestination;
            this.logDestinationType = builder.logDestinationType;
            this.logFormat = builder.logFormat;
            this.logGroupName = builder.logGroupName;
            this.maxAggregationInterval = builder.maxAggregationInterval;
            this.subnetId = builder.subnetId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.trafficType = builder.trafficType;
            this.transitGatewayAttachmentId = builder.transitGatewayAttachmentId;
            this.transitGatewayId = builder.transitGatewayId;
            this.vpcId = builder.vpcId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDeliverCrossAccountRole() {
            return this.deliverCrossAccountRole;
        }

        @Override
        public final imports.aws.flow_log.FlowLogDestinationOptions getDestinationOptions() {
            return this.destinationOptions;
        }

        @Override
        public final java.lang.String getEniId() {
            return this.eniId;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLogDestination() {
            return this.logDestination;
        }

        @Override
        public final java.lang.String getLogDestinationType() {
            return this.logDestinationType;
        }

        @Override
        public final java.lang.String getLogFormat() {
            return this.logFormat;
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.Number getMaxAggregationInterval() {
            return this.maxAggregationInterval;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.String getTrafficType() {
            return this.trafficType;
        }

        @Override
        public final java.lang.String getTransitGatewayAttachmentId() {
            return this.transitGatewayAttachmentId;
        }

        @Override
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeliverCrossAccountRole() != null) {
                data.set("deliverCrossAccountRole", om.valueToTree(this.getDeliverCrossAccountRole()));
            }
            if (this.getDestinationOptions() != null) {
                data.set("destinationOptions", om.valueToTree(this.getDestinationOptions()));
            }
            if (this.getEniId() != null) {
                data.set("eniId", om.valueToTree(this.getEniId()));
            }
            if (this.getIamRoleArn() != null) {
                data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogDestination() != null) {
                data.set("logDestination", om.valueToTree(this.getLogDestination()));
            }
            if (this.getLogDestinationType() != null) {
                data.set("logDestinationType", om.valueToTree(this.getLogDestinationType()));
            }
            if (this.getLogFormat() != null) {
                data.set("logFormat", om.valueToTree(this.getLogFormat()));
            }
            if (this.getLogGroupName() != null) {
                data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            }
            if (this.getMaxAggregationInterval() != null) {
                data.set("maxAggregationInterval", om.valueToTree(this.getMaxAggregationInterval()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTrafficType() != null) {
                data.set("trafficType", om.valueToTree(this.getTrafficType()));
            }
            if (this.getTransitGatewayAttachmentId() != null) {
                data.set("transitGatewayAttachmentId", om.valueToTree(this.getTransitGatewayAttachmentId()));
            }
            if (this.getTransitGatewayId() != null) {
                data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.flowLog.FlowLogConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FlowLogConfig.Jsii$Proxy that = (FlowLogConfig.Jsii$Proxy) o;

            if (this.deliverCrossAccountRole != null ? !this.deliverCrossAccountRole.equals(that.deliverCrossAccountRole) : that.deliverCrossAccountRole != null) return false;
            if (this.destinationOptions != null ? !this.destinationOptions.equals(that.destinationOptions) : that.destinationOptions != null) return false;
            if (this.eniId != null ? !this.eniId.equals(that.eniId) : that.eniId != null) return false;
            if (this.iamRoleArn != null ? !this.iamRoleArn.equals(that.iamRoleArn) : that.iamRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logDestination != null ? !this.logDestination.equals(that.logDestination) : that.logDestination != null) return false;
            if (this.logDestinationType != null ? !this.logDestinationType.equals(that.logDestinationType) : that.logDestinationType != null) return false;
            if (this.logFormat != null ? !this.logFormat.equals(that.logFormat) : that.logFormat != null) return false;
            if (this.logGroupName != null ? !this.logGroupName.equals(that.logGroupName) : that.logGroupName != null) return false;
            if (this.maxAggregationInterval != null ? !this.maxAggregationInterval.equals(that.maxAggregationInterval) : that.maxAggregationInterval != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.trafficType != null ? !this.trafficType.equals(that.trafficType) : that.trafficType != null) return false;
            if (this.transitGatewayAttachmentId != null ? !this.transitGatewayAttachmentId.equals(that.transitGatewayAttachmentId) : that.transitGatewayAttachmentId != null) return false;
            if (this.transitGatewayId != null ? !this.transitGatewayId.equals(that.transitGatewayId) : that.transitGatewayId != null) return false;
            if (this.vpcId != null ? !this.vpcId.equals(that.vpcId) : that.vpcId != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deliverCrossAccountRole != null ? this.deliverCrossAccountRole.hashCode() : 0;
            result = 31 * result + (this.destinationOptions != null ? this.destinationOptions.hashCode() : 0);
            result = 31 * result + (this.eniId != null ? this.eniId.hashCode() : 0);
            result = 31 * result + (this.iamRoleArn != null ? this.iamRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logDestination != null ? this.logDestination.hashCode() : 0);
            result = 31 * result + (this.logDestinationType != null ? this.logDestinationType.hashCode() : 0);
            result = 31 * result + (this.logFormat != null ? this.logFormat.hashCode() : 0);
            result = 31 * result + (this.logGroupName != null ? this.logGroupName.hashCode() : 0);
            result = 31 * result + (this.maxAggregationInterval != null ? this.maxAggregationInterval.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.trafficType != null ? this.trafficType.hashCode() : 0);
            result = 31 * result + (this.transitGatewayAttachmentId != null ? this.transitGatewayAttachmentId.hashCode() : 0);
            result = 31 * result + (this.transitGatewayId != null ? this.transitGatewayId.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
