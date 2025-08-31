package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.195Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterConfig")
@software.amazon.jsii.Jsii.Proxy(EmrClusterConfig.Jsii$Proxy.class)
public interface EmrClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#release_label EmrCluster#release_label}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#service_role EmrCluster#service_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#additional_info EmrCluster#additional_info}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdditionalInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#applications EmrCluster#applications}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getApplications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_role EmrCluster#autoscaling_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoscalingRole() {
        return null;
    }

    /**
     * auto_termination_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#auto_termination_policy EmrCluster#auto_termination_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy getAutoTerminationPolicy() {
        return null;
    }

    /**
     * bootstrap_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bootstrap_action EmrCluster#bootstrap_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations_json EmrCluster#configurations_json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationsJson() {
        return null;
    }

    /**
     * core_instance_fleet block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_fleet EmrCluster#core_instance_fleet}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleet getCoreInstanceFleet() {
        return null;
    }

    /**
     * core_instance_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_group EmrCluster#core_instance_group}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceGroup getCoreInstanceGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#custom_ami_id EmrCluster#custom_ami_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomAmiId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_root_volume_size EmrCluster#ebs_root_volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getEbsRootVolumeSize() {
        return null;
    }

    /**
     * ec2_attributes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ec2_attributes EmrCluster#ec2_attributes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterEc2Attributes getEc2Attributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#id EmrCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKeepJobFlowAliveWhenNoSteps() {
        return null;
    }

    /**
     * kerberos_attributes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#kerberos_attributes EmrCluster#kerberos_attributes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterKerberosAttributes getKerberosAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#list_steps_states EmrCluster#list_steps_states}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getListStepsStates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_encryption_kms_key_id EmrCluster#log_encryption_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogEncryptionKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_uri EmrCluster#log_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogUri() {
        return null;
    }

    /**
     * master_instance_fleet block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_fleet EmrCluster#master_instance_fleet}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleet getMasterInstanceFleet() {
        return null;
    }

    /**
     * master_instance_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_group EmrCluster#master_instance_group}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceGroup getMasterInstanceGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlacementGroupConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#scale_down_behavior EmrCluster#scale_down_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScaleDownBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#security_configuration EmrCluster#security_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStep() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step_concurrency_level EmrCluster#step_concurrency_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStepConcurrencyLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags EmrCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags_all EmrCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTerminationProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUnhealthyNodeReplacement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVisibleToAllUsers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterConfig> {
        java.lang.String name;
        java.lang.String releaseLabel;
        java.lang.String serviceRole;
        java.lang.String additionalInfo;
        java.util.List<java.lang.String> applications;
        java.lang.String autoscalingRole;
        imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy autoTerminationPolicy;
        java.lang.Object bootstrapAction;
        java.lang.String configurations;
        java.lang.String configurationsJson;
        imports.aws.emr_cluster.EmrClusterCoreInstanceFleet coreInstanceFleet;
        imports.aws.emr_cluster.EmrClusterCoreInstanceGroup coreInstanceGroup;
        java.lang.String customAmiId;
        java.lang.Number ebsRootVolumeSize;
        imports.aws.emr_cluster.EmrClusterEc2Attributes ec2Attributes;
        java.lang.String id;
        java.lang.Object keepJobFlowAliveWhenNoSteps;
        imports.aws.emr_cluster.EmrClusterKerberosAttributes kerberosAttributes;
        java.util.List<java.lang.String> listStepsStates;
        java.lang.String logEncryptionKmsKeyId;
        java.lang.String logUri;
        imports.aws.emr_cluster.EmrClusterMasterInstanceFleet masterInstanceFleet;
        imports.aws.emr_cluster.EmrClusterMasterInstanceGroup masterInstanceGroup;
        java.lang.Object placementGroupConfig;
        java.lang.String scaleDownBehavior;
        java.lang.String securityConfiguration;
        java.lang.Object step;
        java.lang.Number stepConcurrencyLevel;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object terminationProtection;
        java.lang.Object unhealthyNodeReplacement;
        java.lang.Object visibleToAllUsers;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EmrClusterConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getReleaseLabel}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#release_label EmrCluster#release_label}. This parameter is required.
         * @return {@code this}
         */
        public Builder releaseLabel(java.lang.String releaseLabel) {
            this.releaseLabel = releaseLabel;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#service_role EmrCluster#service_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getAdditionalInfo}
         * @param additionalInfo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#additional_info EmrCluster#additional_info}.
         * @return {@code this}
         */
        public Builder additionalInfo(java.lang.String additionalInfo) {
            this.additionalInfo = additionalInfo;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getApplications}
         * @param applications Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#applications EmrCluster#applications}.
         * @return {@code this}
         */
        public Builder applications(java.util.List<java.lang.String> applications) {
            this.applications = applications;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getAutoscalingRole}
         * @param autoscalingRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_role EmrCluster#autoscaling_role}.
         * @return {@code this}
         */
        public Builder autoscalingRole(java.lang.String autoscalingRole) {
            this.autoscalingRole = autoscalingRole;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getAutoTerminationPolicy}
         * @param autoTerminationPolicy auto_termination_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#auto_termination_policy EmrCluster#auto_termination_policy}
         * @return {@code this}
         */
        public Builder autoTerminationPolicy(imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy autoTerminationPolicy) {
            this.autoTerminationPolicy = autoTerminationPolicy;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getBootstrapAction}
         * @param bootstrapAction bootstrap_action block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bootstrap_action EmrCluster#bootstrap_action}
         * @return {@code this}
         */
        public Builder bootstrapAction(com.hashicorp.cdktf.IResolvable bootstrapAction) {
            this.bootstrapAction = bootstrapAction;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getBootstrapAction}
         * @param bootstrapAction bootstrap_action block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bootstrap_action EmrCluster#bootstrap_action}
         * @return {@code this}
         */
        public Builder bootstrapAction(java.util.List<? extends imports.aws.emr_cluster.EmrClusterBootstrapAction> bootstrapAction) {
            this.bootstrapAction = bootstrapAction;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getConfigurations}
         * @param configurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}.
         * @return {@code this}
         */
        public Builder configurations(java.lang.String configurations) {
            this.configurations = configurations;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getConfigurationsJson}
         * @param configurationsJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations_json EmrCluster#configurations_json}.
         * @return {@code this}
         */
        public Builder configurationsJson(java.lang.String configurationsJson) {
            this.configurationsJson = configurationsJson;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getCoreInstanceFleet}
         * @param coreInstanceFleet core_instance_fleet block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_fleet EmrCluster#core_instance_fleet}
         * @return {@code this}
         */
        public Builder coreInstanceFleet(imports.aws.emr_cluster.EmrClusterCoreInstanceFleet coreInstanceFleet) {
            this.coreInstanceFleet = coreInstanceFleet;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getCoreInstanceGroup}
         * @param coreInstanceGroup core_instance_group block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_group EmrCluster#core_instance_group}
         * @return {@code this}
         */
        public Builder coreInstanceGroup(imports.aws.emr_cluster.EmrClusterCoreInstanceGroup coreInstanceGroup) {
            this.coreInstanceGroup = coreInstanceGroup;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getCustomAmiId}
         * @param customAmiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#custom_ami_id EmrCluster#custom_ami_id}.
         * @return {@code this}
         */
        public Builder customAmiId(java.lang.String customAmiId) {
            this.customAmiId = customAmiId;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getEbsRootVolumeSize}
         * @param ebsRootVolumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_root_volume_size EmrCluster#ebs_root_volume_size}.
         * @return {@code this}
         */
        public Builder ebsRootVolumeSize(java.lang.Number ebsRootVolumeSize) {
            this.ebsRootVolumeSize = ebsRootVolumeSize;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getEc2Attributes}
         * @param ec2Attributes ec2_attributes block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ec2_attributes EmrCluster#ec2_attributes}
         * @return {@code this}
         */
        public Builder ec2Attributes(imports.aws.emr_cluster.EmrClusterEc2Attributes ec2Attributes) {
            this.ec2Attributes = ec2Attributes;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#id EmrCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getKeepJobFlowAliveWhenNoSteps}
         * @param keepJobFlowAliveWhenNoSteps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}.
         * @return {@code this}
         */
        public Builder keepJobFlowAliveWhenNoSteps(java.lang.Boolean keepJobFlowAliveWhenNoSteps) {
            this.keepJobFlowAliveWhenNoSteps = keepJobFlowAliveWhenNoSteps;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getKeepJobFlowAliveWhenNoSteps}
         * @param keepJobFlowAliveWhenNoSteps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}.
         * @return {@code this}
         */
        public Builder keepJobFlowAliveWhenNoSteps(com.hashicorp.cdktf.IResolvable keepJobFlowAliveWhenNoSteps) {
            this.keepJobFlowAliveWhenNoSteps = keepJobFlowAliveWhenNoSteps;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getKerberosAttributes}
         * @param kerberosAttributes kerberos_attributes block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#kerberos_attributes EmrCluster#kerberos_attributes}
         * @return {@code this}
         */
        public Builder kerberosAttributes(imports.aws.emr_cluster.EmrClusterKerberosAttributes kerberosAttributes) {
            this.kerberosAttributes = kerberosAttributes;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getListStepsStates}
         * @param listStepsStates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#list_steps_states EmrCluster#list_steps_states}.
         * @return {@code this}
         */
        public Builder listStepsStates(java.util.List<java.lang.String> listStepsStates) {
            this.listStepsStates = listStepsStates;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getLogEncryptionKmsKeyId}
         * @param logEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_encryption_kms_key_id EmrCluster#log_encryption_kms_key_id}.
         * @return {@code this}
         */
        public Builder logEncryptionKmsKeyId(java.lang.String logEncryptionKmsKeyId) {
            this.logEncryptionKmsKeyId = logEncryptionKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getLogUri}
         * @param logUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_uri EmrCluster#log_uri}.
         * @return {@code this}
         */
        public Builder logUri(java.lang.String logUri) {
            this.logUri = logUri;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getMasterInstanceFleet}
         * @param masterInstanceFleet master_instance_fleet block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_fleet EmrCluster#master_instance_fleet}
         * @return {@code this}
         */
        public Builder masterInstanceFleet(imports.aws.emr_cluster.EmrClusterMasterInstanceFleet masterInstanceFleet) {
            this.masterInstanceFleet = masterInstanceFleet;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getMasterInstanceGroup}
         * @param masterInstanceGroup master_instance_group block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_group EmrCluster#master_instance_group}
         * @return {@code this}
         */
        public Builder masterInstanceGroup(imports.aws.emr_cluster.EmrClusterMasterInstanceGroup masterInstanceGroup) {
            this.masterInstanceGroup = masterInstanceGroup;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getPlacementGroupConfig}
         * @param placementGroupConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}.
         * @return {@code this}
         */
        public Builder placementGroupConfig(com.hashicorp.cdktf.IResolvable placementGroupConfig) {
            this.placementGroupConfig = placementGroupConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getPlacementGroupConfig}
         * @param placementGroupConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}.
         * @return {@code this}
         */
        public Builder placementGroupConfig(java.util.List<? extends imports.aws.emr_cluster.EmrClusterPlacementGroupConfig> placementGroupConfig) {
            this.placementGroupConfig = placementGroupConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getScaleDownBehavior}
         * @param scaleDownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#scale_down_behavior EmrCluster#scale_down_behavior}.
         * @return {@code this}
         */
        public Builder scaleDownBehavior(java.lang.String scaleDownBehavior) {
            this.scaleDownBehavior = scaleDownBehavior;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getSecurityConfiguration}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#security_configuration EmrCluster#security_configuration}.
         * @return {@code this}
         */
        public Builder securityConfiguration(java.lang.String securityConfiguration) {
            this.securityConfiguration = securityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getStep}
         * @param step Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}.
         * @return {@code this}
         */
        public Builder step(com.hashicorp.cdktf.IResolvable step) {
            this.step = step;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getStep}
         * @param step Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}.
         * @return {@code this}
         */
        public Builder step(java.util.List<? extends imports.aws.emr_cluster.EmrClusterStep> step) {
            this.step = step;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getStepConcurrencyLevel}
         * @param stepConcurrencyLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step_concurrency_level EmrCluster#step_concurrency_level}.
         * @return {@code this}
         */
        public Builder stepConcurrencyLevel(java.lang.Number stepConcurrencyLevel) {
            this.stepConcurrencyLevel = stepConcurrencyLevel;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags EmrCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags_all EmrCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getTerminationProtection}
         * @param terminationProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}.
         * @return {@code this}
         */
        public Builder terminationProtection(java.lang.Boolean terminationProtection) {
            this.terminationProtection = terminationProtection;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getTerminationProtection}
         * @param terminationProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}.
         * @return {@code this}
         */
        public Builder terminationProtection(com.hashicorp.cdktf.IResolvable terminationProtection) {
            this.terminationProtection = terminationProtection;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getUnhealthyNodeReplacement}
         * @param unhealthyNodeReplacement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}.
         * @return {@code this}
         */
        public Builder unhealthyNodeReplacement(java.lang.Boolean unhealthyNodeReplacement) {
            this.unhealthyNodeReplacement = unhealthyNodeReplacement;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getUnhealthyNodeReplacement}
         * @param unhealthyNodeReplacement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}.
         * @return {@code this}
         */
        public Builder unhealthyNodeReplacement(com.hashicorp.cdktf.IResolvable unhealthyNodeReplacement) {
            this.unhealthyNodeReplacement = unhealthyNodeReplacement;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getVisibleToAllUsers}
         * @param visibleToAllUsers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}.
         * @return {@code this}
         */
        public Builder visibleToAllUsers(java.lang.Boolean visibleToAllUsers) {
            this.visibleToAllUsers = visibleToAllUsers;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getVisibleToAllUsers}
         * @param visibleToAllUsers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}.
         * @return {@code this}
         */
        public Builder visibleToAllUsers(com.hashicorp.cdktf.IResolvable visibleToAllUsers) {
            this.visibleToAllUsers = visibleToAllUsers;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getDependsOn}
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
         * Sets the value of {@link EmrClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterConfig#getProvisioners}
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
         * @return a new instance of {@link EmrClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterConfig {
        private final java.lang.String name;
        private final java.lang.String releaseLabel;
        private final java.lang.String serviceRole;
        private final java.lang.String additionalInfo;
        private final java.util.List<java.lang.String> applications;
        private final java.lang.String autoscalingRole;
        private final imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy autoTerminationPolicy;
        private final java.lang.Object bootstrapAction;
        private final java.lang.String configurations;
        private final java.lang.String configurationsJson;
        private final imports.aws.emr_cluster.EmrClusterCoreInstanceFleet coreInstanceFleet;
        private final imports.aws.emr_cluster.EmrClusterCoreInstanceGroup coreInstanceGroup;
        private final java.lang.String customAmiId;
        private final java.lang.Number ebsRootVolumeSize;
        private final imports.aws.emr_cluster.EmrClusterEc2Attributes ec2Attributes;
        private final java.lang.String id;
        private final java.lang.Object keepJobFlowAliveWhenNoSteps;
        private final imports.aws.emr_cluster.EmrClusterKerberosAttributes kerberosAttributes;
        private final java.util.List<java.lang.String> listStepsStates;
        private final java.lang.String logEncryptionKmsKeyId;
        private final java.lang.String logUri;
        private final imports.aws.emr_cluster.EmrClusterMasterInstanceFleet masterInstanceFleet;
        private final imports.aws.emr_cluster.EmrClusterMasterInstanceGroup masterInstanceGroup;
        private final java.lang.Object placementGroupConfig;
        private final java.lang.String scaleDownBehavior;
        private final java.lang.String securityConfiguration;
        private final java.lang.Object step;
        private final java.lang.Number stepConcurrencyLevel;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object terminationProtection;
        private final java.lang.Object unhealthyNodeReplacement;
        private final java.lang.Object visibleToAllUsers;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.releaseLabel = software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalInfo = software.amazon.jsii.Kernel.get(this, "additionalInfo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applications = software.amazon.jsii.Kernel.get(this, "applications", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.autoscalingRole = software.amazon.jsii.Kernel.get(this, "autoscalingRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoTerminationPolicy = software.amazon.jsii.Kernel.get(this, "autoTerminationPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy.class));
            this.bootstrapAction = software.amazon.jsii.Kernel.get(this, "bootstrapAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.configurations = software.amazon.jsii.Kernel.get(this, "configurations", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationsJson = software.amazon.jsii.Kernel.get(this, "configurationsJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.coreInstanceFleet = software.amazon.jsii.Kernel.get(this, "coreInstanceFleet", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleet.class));
            this.coreInstanceGroup = software.amazon.jsii.Kernel.get(this, "coreInstanceGroup", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceGroup.class));
            this.customAmiId = software.amazon.jsii.Kernel.get(this, "customAmiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebsRootVolumeSize = software.amazon.jsii.Kernel.get(this, "ebsRootVolumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ec2Attributes = software.amazon.jsii.Kernel.get(this, "ec2Attributes", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterEc2Attributes.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keepJobFlowAliveWhenNoSteps = software.amazon.jsii.Kernel.get(this, "keepJobFlowAliveWhenNoSteps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kerberosAttributes = software.amazon.jsii.Kernel.get(this, "kerberosAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterKerberosAttributes.class));
            this.listStepsStates = software.amazon.jsii.Kernel.get(this, "listStepsStates", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.logEncryptionKmsKeyId = software.amazon.jsii.Kernel.get(this, "logEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logUri = software.amazon.jsii.Kernel.get(this, "logUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterInstanceFleet = software.amazon.jsii.Kernel.get(this, "masterInstanceFleet", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleet.class));
            this.masterInstanceGroup = software.amazon.jsii.Kernel.get(this, "masterInstanceGroup", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceGroup.class));
            this.placementGroupConfig = software.amazon.jsii.Kernel.get(this, "placementGroupConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scaleDownBehavior = software.amazon.jsii.Kernel.get(this, "scaleDownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityConfiguration = software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.step = software.amazon.jsii.Kernel.get(this, "step", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stepConcurrencyLevel = software.amazon.jsii.Kernel.get(this, "stepConcurrencyLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.terminationProtection = software.amazon.jsii.Kernel.get(this, "terminationProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.unhealthyNodeReplacement = software.amazon.jsii.Kernel.get(this, "unhealthyNodeReplacement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.visibleToAllUsers = software.amazon.jsii.Kernel.get(this, "visibleToAllUsers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.releaseLabel = java.util.Objects.requireNonNull(builder.releaseLabel, "releaseLabel is required");
            this.serviceRole = java.util.Objects.requireNonNull(builder.serviceRole, "serviceRole is required");
            this.additionalInfo = builder.additionalInfo;
            this.applications = builder.applications;
            this.autoscalingRole = builder.autoscalingRole;
            this.autoTerminationPolicy = builder.autoTerminationPolicy;
            this.bootstrapAction = builder.bootstrapAction;
            this.configurations = builder.configurations;
            this.configurationsJson = builder.configurationsJson;
            this.coreInstanceFleet = builder.coreInstanceFleet;
            this.coreInstanceGroup = builder.coreInstanceGroup;
            this.customAmiId = builder.customAmiId;
            this.ebsRootVolumeSize = builder.ebsRootVolumeSize;
            this.ec2Attributes = builder.ec2Attributes;
            this.id = builder.id;
            this.keepJobFlowAliveWhenNoSteps = builder.keepJobFlowAliveWhenNoSteps;
            this.kerberosAttributes = builder.kerberosAttributes;
            this.listStepsStates = builder.listStepsStates;
            this.logEncryptionKmsKeyId = builder.logEncryptionKmsKeyId;
            this.logUri = builder.logUri;
            this.masterInstanceFleet = builder.masterInstanceFleet;
            this.masterInstanceGroup = builder.masterInstanceGroup;
            this.placementGroupConfig = builder.placementGroupConfig;
            this.scaleDownBehavior = builder.scaleDownBehavior;
            this.securityConfiguration = builder.securityConfiguration;
            this.step = builder.step;
            this.stepConcurrencyLevel = builder.stepConcurrencyLevel;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.terminationProtection = builder.terminationProtection;
            this.unhealthyNodeReplacement = builder.unhealthyNodeReplacement;
            this.visibleToAllUsers = builder.visibleToAllUsers;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getReleaseLabel() {
            return this.releaseLabel;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final java.lang.String getAdditionalInfo() {
            return this.additionalInfo;
        }

        @Override
        public final java.util.List<java.lang.String> getApplications() {
            return this.applications;
        }

        @Override
        public final java.lang.String getAutoscalingRole() {
            return this.autoscalingRole;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy getAutoTerminationPolicy() {
            return this.autoTerminationPolicy;
        }

        @Override
        public final java.lang.Object getBootstrapAction() {
            return this.bootstrapAction;
        }

        @Override
        public final java.lang.String getConfigurations() {
            return this.configurations;
        }

        @Override
        public final java.lang.String getConfigurationsJson() {
            return this.configurationsJson;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterCoreInstanceFleet getCoreInstanceFleet() {
            return this.coreInstanceFleet;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterCoreInstanceGroup getCoreInstanceGroup() {
            return this.coreInstanceGroup;
        }

        @Override
        public final java.lang.String getCustomAmiId() {
            return this.customAmiId;
        }

        @Override
        public final java.lang.Number getEbsRootVolumeSize() {
            return this.ebsRootVolumeSize;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterEc2Attributes getEc2Attributes() {
            return this.ec2Attributes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getKeepJobFlowAliveWhenNoSteps() {
            return this.keepJobFlowAliveWhenNoSteps;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterKerberosAttributes getKerberosAttributes() {
            return this.kerberosAttributes;
        }

        @Override
        public final java.util.List<java.lang.String> getListStepsStates() {
            return this.listStepsStates;
        }

        @Override
        public final java.lang.String getLogEncryptionKmsKeyId() {
            return this.logEncryptionKmsKeyId;
        }

        @Override
        public final java.lang.String getLogUri() {
            return this.logUri;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterMasterInstanceFleet getMasterInstanceFleet() {
            return this.masterInstanceFleet;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterMasterInstanceGroup getMasterInstanceGroup() {
            return this.masterInstanceGroup;
        }

        @Override
        public final java.lang.Object getPlacementGroupConfig() {
            return this.placementGroupConfig;
        }

        @Override
        public final java.lang.String getScaleDownBehavior() {
            return this.scaleDownBehavior;
        }

        @Override
        public final java.lang.String getSecurityConfiguration() {
            return this.securityConfiguration;
        }

        @Override
        public final java.lang.Object getStep() {
            return this.step;
        }

        @Override
        public final java.lang.Number getStepConcurrencyLevel() {
            return this.stepConcurrencyLevel;
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
        public final java.lang.Object getTerminationProtection() {
            return this.terminationProtection;
        }

        @Override
        public final java.lang.Object getUnhealthyNodeReplacement() {
            return this.unhealthyNodeReplacement;
        }

        @Override
        public final java.lang.Object getVisibleToAllUsers() {
            return this.visibleToAllUsers;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("releaseLabel", om.valueToTree(this.getReleaseLabel()));
            data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            if (this.getAdditionalInfo() != null) {
                data.set("additionalInfo", om.valueToTree(this.getAdditionalInfo()));
            }
            if (this.getApplications() != null) {
                data.set("applications", om.valueToTree(this.getApplications()));
            }
            if (this.getAutoscalingRole() != null) {
                data.set("autoscalingRole", om.valueToTree(this.getAutoscalingRole()));
            }
            if (this.getAutoTerminationPolicy() != null) {
                data.set("autoTerminationPolicy", om.valueToTree(this.getAutoTerminationPolicy()));
            }
            if (this.getBootstrapAction() != null) {
                data.set("bootstrapAction", om.valueToTree(this.getBootstrapAction()));
            }
            if (this.getConfigurations() != null) {
                data.set("configurations", om.valueToTree(this.getConfigurations()));
            }
            if (this.getConfigurationsJson() != null) {
                data.set("configurationsJson", om.valueToTree(this.getConfigurationsJson()));
            }
            if (this.getCoreInstanceFleet() != null) {
                data.set("coreInstanceFleet", om.valueToTree(this.getCoreInstanceFleet()));
            }
            if (this.getCoreInstanceGroup() != null) {
                data.set("coreInstanceGroup", om.valueToTree(this.getCoreInstanceGroup()));
            }
            if (this.getCustomAmiId() != null) {
                data.set("customAmiId", om.valueToTree(this.getCustomAmiId()));
            }
            if (this.getEbsRootVolumeSize() != null) {
                data.set("ebsRootVolumeSize", om.valueToTree(this.getEbsRootVolumeSize()));
            }
            if (this.getEc2Attributes() != null) {
                data.set("ec2Attributes", om.valueToTree(this.getEc2Attributes()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeepJobFlowAliveWhenNoSteps() != null) {
                data.set("keepJobFlowAliveWhenNoSteps", om.valueToTree(this.getKeepJobFlowAliveWhenNoSteps()));
            }
            if (this.getKerberosAttributes() != null) {
                data.set("kerberosAttributes", om.valueToTree(this.getKerberosAttributes()));
            }
            if (this.getListStepsStates() != null) {
                data.set("listStepsStates", om.valueToTree(this.getListStepsStates()));
            }
            if (this.getLogEncryptionKmsKeyId() != null) {
                data.set("logEncryptionKmsKeyId", om.valueToTree(this.getLogEncryptionKmsKeyId()));
            }
            if (this.getLogUri() != null) {
                data.set("logUri", om.valueToTree(this.getLogUri()));
            }
            if (this.getMasterInstanceFleet() != null) {
                data.set("masterInstanceFleet", om.valueToTree(this.getMasterInstanceFleet()));
            }
            if (this.getMasterInstanceGroup() != null) {
                data.set("masterInstanceGroup", om.valueToTree(this.getMasterInstanceGroup()));
            }
            if (this.getPlacementGroupConfig() != null) {
                data.set("placementGroupConfig", om.valueToTree(this.getPlacementGroupConfig()));
            }
            if (this.getScaleDownBehavior() != null) {
                data.set("scaleDownBehavior", om.valueToTree(this.getScaleDownBehavior()));
            }
            if (this.getSecurityConfiguration() != null) {
                data.set("securityConfiguration", om.valueToTree(this.getSecurityConfiguration()));
            }
            if (this.getStep() != null) {
                data.set("step", om.valueToTree(this.getStep()));
            }
            if (this.getStepConcurrencyLevel() != null) {
                data.set("stepConcurrencyLevel", om.valueToTree(this.getStepConcurrencyLevel()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTerminationProtection() != null) {
                data.set("terminationProtection", om.valueToTree(this.getTerminationProtection()));
            }
            if (this.getUnhealthyNodeReplacement() != null) {
                data.set("unhealthyNodeReplacement", om.valueToTree(this.getUnhealthyNodeReplacement()));
            }
            if (this.getVisibleToAllUsers() != null) {
                data.set("visibleToAllUsers", om.valueToTree(this.getVisibleToAllUsers()));
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
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterConfig.Jsii$Proxy that = (EmrClusterConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!releaseLabel.equals(that.releaseLabel)) return false;
            if (!serviceRole.equals(that.serviceRole)) return false;
            if (this.additionalInfo != null ? !this.additionalInfo.equals(that.additionalInfo) : that.additionalInfo != null) return false;
            if (this.applications != null ? !this.applications.equals(that.applications) : that.applications != null) return false;
            if (this.autoscalingRole != null ? !this.autoscalingRole.equals(that.autoscalingRole) : that.autoscalingRole != null) return false;
            if (this.autoTerminationPolicy != null ? !this.autoTerminationPolicy.equals(that.autoTerminationPolicy) : that.autoTerminationPolicy != null) return false;
            if (this.bootstrapAction != null ? !this.bootstrapAction.equals(that.bootstrapAction) : that.bootstrapAction != null) return false;
            if (this.configurations != null ? !this.configurations.equals(that.configurations) : that.configurations != null) return false;
            if (this.configurationsJson != null ? !this.configurationsJson.equals(that.configurationsJson) : that.configurationsJson != null) return false;
            if (this.coreInstanceFleet != null ? !this.coreInstanceFleet.equals(that.coreInstanceFleet) : that.coreInstanceFleet != null) return false;
            if (this.coreInstanceGroup != null ? !this.coreInstanceGroup.equals(that.coreInstanceGroup) : that.coreInstanceGroup != null) return false;
            if (this.customAmiId != null ? !this.customAmiId.equals(that.customAmiId) : that.customAmiId != null) return false;
            if (this.ebsRootVolumeSize != null ? !this.ebsRootVolumeSize.equals(that.ebsRootVolumeSize) : that.ebsRootVolumeSize != null) return false;
            if (this.ec2Attributes != null ? !this.ec2Attributes.equals(that.ec2Attributes) : that.ec2Attributes != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keepJobFlowAliveWhenNoSteps != null ? !this.keepJobFlowAliveWhenNoSteps.equals(that.keepJobFlowAliveWhenNoSteps) : that.keepJobFlowAliveWhenNoSteps != null) return false;
            if (this.kerberosAttributes != null ? !this.kerberosAttributes.equals(that.kerberosAttributes) : that.kerberosAttributes != null) return false;
            if (this.listStepsStates != null ? !this.listStepsStates.equals(that.listStepsStates) : that.listStepsStates != null) return false;
            if (this.logEncryptionKmsKeyId != null ? !this.logEncryptionKmsKeyId.equals(that.logEncryptionKmsKeyId) : that.logEncryptionKmsKeyId != null) return false;
            if (this.logUri != null ? !this.logUri.equals(that.logUri) : that.logUri != null) return false;
            if (this.masterInstanceFleet != null ? !this.masterInstanceFleet.equals(that.masterInstanceFleet) : that.masterInstanceFleet != null) return false;
            if (this.masterInstanceGroup != null ? !this.masterInstanceGroup.equals(that.masterInstanceGroup) : that.masterInstanceGroup != null) return false;
            if (this.placementGroupConfig != null ? !this.placementGroupConfig.equals(that.placementGroupConfig) : that.placementGroupConfig != null) return false;
            if (this.scaleDownBehavior != null ? !this.scaleDownBehavior.equals(that.scaleDownBehavior) : that.scaleDownBehavior != null) return false;
            if (this.securityConfiguration != null ? !this.securityConfiguration.equals(that.securityConfiguration) : that.securityConfiguration != null) return false;
            if (this.step != null ? !this.step.equals(that.step) : that.step != null) return false;
            if (this.stepConcurrencyLevel != null ? !this.stepConcurrencyLevel.equals(that.stepConcurrencyLevel) : that.stepConcurrencyLevel != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.terminationProtection != null ? !this.terminationProtection.equals(that.terminationProtection) : that.terminationProtection != null) return false;
            if (this.unhealthyNodeReplacement != null ? !this.unhealthyNodeReplacement.equals(that.unhealthyNodeReplacement) : that.unhealthyNodeReplacement != null) return false;
            if (this.visibleToAllUsers != null ? !this.visibleToAllUsers.equals(that.visibleToAllUsers) : that.visibleToAllUsers != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.releaseLabel.hashCode());
            result = 31 * result + (this.serviceRole.hashCode());
            result = 31 * result + (this.additionalInfo != null ? this.additionalInfo.hashCode() : 0);
            result = 31 * result + (this.applications != null ? this.applications.hashCode() : 0);
            result = 31 * result + (this.autoscalingRole != null ? this.autoscalingRole.hashCode() : 0);
            result = 31 * result + (this.autoTerminationPolicy != null ? this.autoTerminationPolicy.hashCode() : 0);
            result = 31 * result + (this.bootstrapAction != null ? this.bootstrapAction.hashCode() : 0);
            result = 31 * result + (this.configurations != null ? this.configurations.hashCode() : 0);
            result = 31 * result + (this.configurationsJson != null ? this.configurationsJson.hashCode() : 0);
            result = 31 * result + (this.coreInstanceFleet != null ? this.coreInstanceFleet.hashCode() : 0);
            result = 31 * result + (this.coreInstanceGroup != null ? this.coreInstanceGroup.hashCode() : 0);
            result = 31 * result + (this.customAmiId != null ? this.customAmiId.hashCode() : 0);
            result = 31 * result + (this.ebsRootVolumeSize != null ? this.ebsRootVolumeSize.hashCode() : 0);
            result = 31 * result + (this.ec2Attributes != null ? this.ec2Attributes.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keepJobFlowAliveWhenNoSteps != null ? this.keepJobFlowAliveWhenNoSteps.hashCode() : 0);
            result = 31 * result + (this.kerberosAttributes != null ? this.kerberosAttributes.hashCode() : 0);
            result = 31 * result + (this.listStepsStates != null ? this.listStepsStates.hashCode() : 0);
            result = 31 * result + (this.logEncryptionKmsKeyId != null ? this.logEncryptionKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.logUri != null ? this.logUri.hashCode() : 0);
            result = 31 * result + (this.masterInstanceFleet != null ? this.masterInstanceFleet.hashCode() : 0);
            result = 31 * result + (this.masterInstanceGroup != null ? this.masterInstanceGroup.hashCode() : 0);
            result = 31 * result + (this.placementGroupConfig != null ? this.placementGroupConfig.hashCode() : 0);
            result = 31 * result + (this.scaleDownBehavior != null ? this.scaleDownBehavior.hashCode() : 0);
            result = 31 * result + (this.securityConfiguration != null ? this.securityConfiguration.hashCode() : 0);
            result = 31 * result + (this.step != null ? this.step.hashCode() : 0);
            result = 31 * result + (this.stepConcurrencyLevel != null ? this.stepConcurrencyLevel.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.terminationProtection != null ? this.terminationProtection.hashCode() : 0);
            result = 31 * result + (this.unhealthyNodeReplacement != null ? this.unhealthyNodeReplacement.hashCode() : 0);
            result = 31 * result + (this.visibleToAllUsers != null ? this.visibleToAllUsers.hashCode() : 0);
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
