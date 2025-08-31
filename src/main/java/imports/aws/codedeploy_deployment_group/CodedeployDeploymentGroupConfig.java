package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupConfig")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupConfig.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#app_name CodedeployDeploymentGroup#app_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAppName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_group_name CodedeployDeploymentGroup#deployment_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeploymentGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_role_arn CodedeployDeploymentGroup#service_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn();

    /**
     * alarm_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#alarm_configuration CodedeployDeploymentGroup#alarm_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration getAlarmConfiguration() {
        return null;
    }

    /**
     * auto_rollback_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#auto_rollback_configuration CodedeployDeploymentGroup#auto_rollback_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration getAutoRollbackConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#autoscaling_groups CodedeployDeploymentGroup#autoscaling_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAutoscalingGroups() {
        return null;
    }

    /**
     * blue_green_deployment_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#blue_green_deployment_config CodedeployDeploymentGroup#blue_green_deployment_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig getBlueGreenDeploymentConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_config_name CodedeployDeploymentGroup#deployment_config_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentConfigName() {
        return null;
    }

    /**
     * deployment_style block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_style CodedeployDeploymentGroup#deployment_style}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle getDeploymentStyle() {
        return null;
    }

    /**
     * ec2_tag_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEc2TagFilter() {
        return null;
    }

    /**
     * ec2_tag_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_set CodedeployDeploymentGroup#ec2_tag_set}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEc2TagSet() {
        return null;
    }

    /**
     * ecs_service block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ecs_service CodedeployDeploymentGroup#ecs_service}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService getEcsService() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#id CodedeployDeploymentGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * load_balancer_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#load_balancer_info CodedeployDeploymentGroup#load_balancer_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo getLoadBalancerInfo() {
        return null;
    }

    /**
     * on_premises_instance_tag_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#on_premises_instance_tag_filter CodedeployDeploymentGroup#on_premises_instance_tag_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOnPremisesInstanceTagFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#outdated_instances_strategy CodedeployDeploymentGroup#outdated_instances_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutdatedInstancesStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags CodedeployDeploymentGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags_all CodedeployDeploymentGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTerminationHookEnabled() {
        return null;
    }

    /**
     * trigger_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_configuration CodedeployDeploymentGroup#trigger_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTriggerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupConfig> {
        java.lang.String appName;
        java.lang.String deploymentGroupName;
        java.lang.String serviceRoleArn;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration alarmConfiguration;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration autoRollbackConfiguration;
        java.util.List<java.lang.String> autoscalingGroups;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig blueGreenDeploymentConfig;
        java.lang.String deploymentConfigName;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle deploymentStyle;
        java.lang.Object ec2TagFilter;
        java.lang.Object ec2TagSet;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService ecsService;
        java.lang.String id;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo loadBalancerInfo;
        java.lang.Object onPremisesInstanceTagFilter;
        java.lang.String outdatedInstancesStrategy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object terminationHookEnabled;
        java.lang.Object triggerConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getAppName}
         * @param appName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#app_name CodedeployDeploymentGroup#app_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder appName(java.lang.String appName) {
            this.appName = appName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getDeploymentGroupName}
         * @param deploymentGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_group_name CodedeployDeploymentGroup#deployment_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentGroupName(java.lang.String deploymentGroupName) {
            this.deploymentGroupName = deploymentGroupName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getServiceRoleArn}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_role_arn CodedeployDeploymentGroup#service_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRoleArn(java.lang.String serviceRoleArn) {
            this.serviceRoleArn = serviceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getAlarmConfiguration}
         * @param alarmConfiguration alarm_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#alarm_configuration CodedeployDeploymentGroup#alarm_configuration}
         * @return {@code this}
         */
        public Builder alarmConfiguration(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration alarmConfiguration) {
            this.alarmConfiguration = alarmConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getAutoRollbackConfiguration}
         * @param autoRollbackConfiguration auto_rollback_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#auto_rollback_configuration CodedeployDeploymentGroup#auto_rollback_configuration}
         * @return {@code this}
         */
        public Builder autoRollbackConfiguration(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration autoRollbackConfiguration) {
            this.autoRollbackConfiguration = autoRollbackConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getAutoscalingGroups}
         * @param autoscalingGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#autoscaling_groups CodedeployDeploymentGroup#autoscaling_groups}.
         * @return {@code this}
         */
        public Builder autoscalingGroups(java.util.List<java.lang.String> autoscalingGroups) {
            this.autoscalingGroups = autoscalingGroups;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getBlueGreenDeploymentConfig}
         * @param blueGreenDeploymentConfig blue_green_deployment_config block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#blue_green_deployment_config CodedeployDeploymentGroup#blue_green_deployment_config}
         * @return {@code this}
         */
        public Builder blueGreenDeploymentConfig(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig blueGreenDeploymentConfig) {
            this.blueGreenDeploymentConfig = blueGreenDeploymentConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getDeploymentConfigName}
         * @param deploymentConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_config_name CodedeployDeploymentGroup#deployment_config_name}.
         * @return {@code this}
         */
        public Builder deploymentConfigName(java.lang.String deploymentConfigName) {
            this.deploymentConfigName = deploymentConfigName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getDeploymentStyle}
         * @param deploymentStyle deployment_style block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_style CodedeployDeploymentGroup#deployment_style}
         * @return {@code this}
         */
        public Builder deploymentStyle(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle deploymentStyle) {
            this.deploymentStyle = deploymentStyle;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getEc2TagFilter}
         * @param ec2TagFilter ec2_tag_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * @return {@code this}
         */
        public Builder ec2TagFilter(com.hashicorp.cdktf.IResolvable ec2TagFilter) {
            this.ec2TagFilter = ec2TagFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getEc2TagFilter}
         * @param ec2TagFilter ec2_tag_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * @return {@code this}
         */
        public Builder ec2TagFilter(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter> ec2TagFilter) {
            this.ec2TagFilter = ec2TagFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getEc2TagSet}
         * @param ec2TagSet ec2_tag_set block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_set CodedeployDeploymentGroup#ec2_tag_set}
         * @return {@code this}
         */
        public Builder ec2TagSet(com.hashicorp.cdktf.IResolvable ec2TagSet) {
            this.ec2TagSet = ec2TagSet;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getEc2TagSet}
         * @param ec2TagSet ec2_tag_set block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_set CodedeployDeploymentGroup#ec2_tag_set}
         * @return {@code this}
         */
        public Builder ec2TagSet(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet> ec2TagSet) {
            this.ec2TagSet = ec2TagSet;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getEcsService}
         * @param ecsService ecs_service block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ecs_service CodedeployDeploymentGroup#ecs_service}
         * @return {@code this}
         */
        public Builder ecsService(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService ecsService) {
            this.ecsService = ecsService;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#id CodedeployDeploymentGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getLoadBalancerInfo}
         * @param loadBalancerInfo load_balancer_info block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#load_balancer_info CodedeployDeploymentGroup#load_balancer_info}
         * @return {@code this}
         */
        public Builder loadBalancerInfo(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo loadBalancerInfo) {
            this.loadBalancerInfo = loadBalancerInfo;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getOnPremisesInstanceTagFilter}
         * @param onPremisesInstanceTagFilter on_premises_instance_tag_filter block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#on_premises_instance_tag_filter CodedeployDeploymentGroup#on_premises_instance_tag_filter}
         * @return {@code this}
         */
        public Builder onPremisesInstanceTagFilter(com.hashicorp.cdktf.IResolvable onPremisesInstanceTagFilter) {
            this.onPremisesInstanceTagFilter = onPremisesInstanceTagFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getOnPremisesInstanceTagFilter}
         * @param onPremisesInstanceTagFilter on_premises_instance_tag_filter block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#on_premises_instance_tag_filter CodedeployDeploymentGroup#on_premises_instance_tag_filter}
         * @return {@code this}
         */
        public Builder onPremisesInstanceTagFilter(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter> onPremisesInstanceTagFilter) {
            this.onPremisesInstanceTagFilter = onPremisesInstanceTagFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getOutdatedInstancesStrategy}
         * @param outdatedInstancesStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#outdated_instances_strategy CodedeployDeploymentGroup#outdated_instances_strategy}.
         * @return {@code this}
         */
        public Builder outdatedInstancesStrategy(java.lang.String outdatedInstancesStrategy) {
            this.outdatedInstancesStrategy = outdatedInstancesStrategy;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags CodedeployDeploymentGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags_all CodedeployDeploymentGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTerminationHookEnabled}
         * @param terminationHookEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}.
         * @return {@code this}
         */
        public Builder terminationHookEnabled(java.lang.Boolean terminationHookEnabled) {
            this.terminationHookEnabled = terminationHookEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTerminationHookEnabled}
         * @param terminationHookEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}.
         * @return {@code this}
         */
        public Builder terminationHookEnabled(com.hashicorp.cdktf.IResolvable terminationHookEnabled) {
            this.terminationHookEnabled = terminationHookEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTriggerConfiguration}
         * @param triggerConfiguration trigger_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_configuration CodedeployDeploymentGroup#trigger_configuration}
         * @return {@code this}
         */
        public Builder triggerConfiguration(com.hashicorp.cdktf.IResolvable triggerConfiguration) {
            this.triggerConfiguration = triggerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getTriggerConfiguration}
         * @param triggerConfiguration trigger_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_configuration CodedeployDeploymentGroup#trigger_configuration}
         * @return {@code this}
         */
        public Builder triggerConfiguration(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration> triggerConfiguration) {
            this.triggerConfiguration = triggerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getDependsOn}
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
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupConfig#getProvisioners}
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
         * @return a new instance of {@link CodedeployDeploymentGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupConfig {
        private final java.lang.String appName;
        private final java.lang.String deploymentGroupName;
        private final java.lang.String serviceRoleArn;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration alarmConfiguration;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration autoRollbackConfiguration;
        private final java.util.List<java.lang.String> autoscalingGroups;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig blueGreenDeploymentConfig;
        private final java.lang.String deploymentConfigName;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle deploymentStyle;
        private final java.lang.Object ec2TagFilter;
        private final java.lang.Object ec2TagSet;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService ecsService;
        private final java.lang.String id;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo loadBalancerInfo;
        private final java.lang.Object onPremisesInstanceTagFilter;
        private final java.lang.String outdatedInstancesStrategy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object terminationHookEnabled;
        private final java.lang.Object triggerConfiguration;
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
            this.appName = software.amazon.jsii.Kernel.get(this, "appName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentGroupName = software.amazon.jsii.Kernel.get(this, "deploymentGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRoleArn = software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alarmConfiguration = software.amazon.jsii.Kernel.get(this, "alarmConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration.class));
            this.autoRollbackConfiguration = software.amazon.jsii.Kernel.get(this, "autoRollbackConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration.class));
            this.autoscalingGroups = software.amazon.jsii.Kernel.get(this, "autoscalingGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.blueGreenDeploymentConfig = software.amazon.jsii.Kernel.get(this, "blueGreenDeploymentConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig.class));
            this.deploymentConfigName = software.amazon.jsii.Kernel.get(this, "deploymentConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentStyle = software.amazon.jsii.Kernel.get(this, "deploymentStyle", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle.class));
            this.ec2TagFilter = software.amazon.jsii.Kernel.get(this, "ec2TagFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ec2TagSet = software.amazon.jsii.Kernel.get(this, "ec2TagSet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ecsService = software.amazon.jsii.Kernel.get(this, "ecsService", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancerInfo = software.amazon.jsii.Kernel.get(this, "loadBalancerInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo.class));
            this.onPremisesInstanceTagFilter = software.amazon.jsii.Kernel.get(this, "onPremisesInstanceTagFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.outdatedInstancesStrategy = software.amazon.jsii.Kernel.get(this, "outdatedInstancesStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.terminationHookEnabled = software.amazon.jsii.Kernel.get(this, "terminationHookEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.triggerConfiguration = software.amazon.jsii.Kernel.get(this, "triggerConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.appName = java.util.Objects.requireNonNull(builder.appName, "appName is required");
            this.deploymentGroupName = java.util.Objects.requireNonNull(builder.deploymentGroupName, "deploymentGroupName is required");
            this.serviceRoleArn = java.util.Objects.requireNonNull(builder.serviceRoleArn, "serviceRoleArn is required");
            this.alarmConfiguration = builder.alarmConfiguration;
            this.autoRollbackConfiguration = builder.autoRollbackConfiguration;
            this.autoscalingGroups = builder.autoscalingGroups;
            this.blueGreenDeploymentConfig = builder.blueGreenDeploymentConfig;
            this.deploymentConfigName = builder.deploymentConfigName;
            this.deploymentStyle = builder.deploymentStyle;
            this.ec2TagFilter = builder.ec2TagFilter;
            this.ec2TagSet = builder.ec2TagSet;
            this.ecsService = builder.ecsService;
            this.id = builder.id;
            this.loadBalancerInfo = builder.loadBalancerInfo;
            this.onPremisesInstanceTagFilter = builder.onPremisesInstanceTagFilter;
            this.outdatedInstancesStrategy = builder.outdatedInstancesStrategy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.terminationHookEnabled = builder.terminationHookEnabled;
            this.triggerConfiguration = builder.triggerConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAppName() {
            return this.appName;
        }

        @Override
        public final java.lang.String getDeploymentGroupName() {
            return this.deploymentGroupName;
        }

        @Override
        public final java.lang.String getServiceRoleArn() {
            return this.serviceRoleArn;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration getAlarmConfiguration() {
            return this.alarmConfiguration;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration getAutoRollbackConfiguration() {
            return this.autoRollbackConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getAutoscalingGroups() {
            return this.autoscalingGroups;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig getBlueGreenDeploymentConfig() {
            return this.blueGreenDeploymentConfig;
        }

        @Override
        public final java.lang.String getDeploymentConfigName() {
            return this.deploymentConfigName;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle getDeploymentStyle() {
            return this.deploymentStyle;
        }

        @Override
        public final java.lang.Object getEc2TagFilter() {
            return this.ec2TagFilter;
        }

        @Override
        public final java.lang.Object getEc2TagSet() {
            return this.ec2TagSet;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService getEcsService() {
            return this.ecsService;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo getLoadBalancerInfo() {
            return this.loadBalancerInfo;
        }

        @Override
        public final java.lang.Object getOnPremisesInstanceTagFilter() {
            return this.onPremisesInstanceTagFilter;
        }

        @Override
        public final java.lang.String getOutdatedInstancesStrategy() {
            return this.outdatedInstancesStrategy;
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
        public final java.lang.Object getTerminationHookEnabled() {
            return this.terminationHookEnabled;
        }

        @Override
        public final java.lang.Object getTriggerConfiguration() {
            return this.triggerConfiguration;
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

            data.set("appName", om.valueToTree(this.getAppName()));
            data.set("deploymentGroupName", om.valueToTree(this.getDeploymentGroupName()));
            data.set("serviceRoleArn", om.valueToTree(this.getServiceRoleArn()));
            if (this.getAlarmConfiguration() != null) {
                data.set("alarmConfiguration", om.valueToTree(this.getAlarmConfiguration()));
            }
            if (this.getAutoRollbackConfiguration() != null) {
                data.set("autoRollbackConfiguration", om.valueToTree(this.getAutoRollbackConfiguration()));
            }
            if (this.getAutoscalingGroups() != null) {
                data.set("autoscalingGroups", om.valueToTree(this.getAutoscalingGroups()));
            }
            if (this.getBlueGreenDeploymentConfig() != null) {
                data.set("blueGreenDeploymentConfig", om.valueToTree(this.getBlueGreenDeploymentConfig()));
            }
            if (this.getDeploymentConfigName() != null) {
                data.set("deploymentConfigName", om.valueToTree(this.getDeploymentConfigName()));
            }
            if (this.getDeploymentStyle() != null) {
                data.set("deploymentStyle", om.valueToTree(this.getDeploymentStyle()));
            }
            if (this.getEc2TagFilter() != null) {
                data.set("ec2TagFilter", om.valueToTree(this.getEc2TagFilter()));
            }
            if (this.getEc2TagSet() != null) {
                data.set("ec2TagSet", om.valueToTree(this.getEc2TagSet()));
            }
            if (this.getEcsService() != null) {
                data.set("ecsService", om.valueToTree(this.getEcsService()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLoadBalancerInfo() != null) {
                data.set("loadBalancerInfo", om.valueToTree(this.getLoadBalancerInfo()));
            }
            if (this.getOnPremisesInstanceTagFilter() != null) {
                data.set("onPremisesInstanceTagFilter", om.valueToTree(this.getOnPremisesInstanceTagFilter()));
            }
            if (this.getOutdatedInstancesStrategy() != null) {
                data.set("outdatedInstancesStrategy", om.valueToTree(this.getOutdatedInstancesStrategy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTerminationHookEnabled() != null) {
                data.set("terminationHookEnabled", om.valueToTree(this.getTerminationHookEnabled()));
            }
            if (this.getTriggerConfiguration() != null) {
                data.set("triggerConfiguration", om.valueToTree(this.getTriggerConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupConfig.Jsii$Proxy that = (CodedeployDeploymentGroupConfig.Jsii$Proxy) o;

            if (!appName.equals(that.appName)) return false;
            if (!deploymentGroupName.equals(that.deploymentGroupName)) return false;
            if (!serviceRoleArn.equals(that.serviceRoleArn)) return false;
            if (this.alarmConfiguration != null ? !this.alarmConfiguration.equals(that.alarmConfiguration) : that.alarmConfiguration != null) return false;
            if (this.autoRollbackConfiguration != null ? !this.autoRollbackConfiguration.equals(that.autoRollbackConfiguration) : that.autoRollbackConfiguration != null) return false;
            if (this.autoscalingGroups != null ? !this.autoscalingGroups.equals(that.autoscalingGroups) : that.autoscalingGroups != null) return false;
            if (this.blueGreenDeploymentConfig != null ? !this.blueGreenDeploymentConfig.equals(that.blueGreenDeploymentConfig) : that.blueGreenDeploymentConfig != null) return false;
            if (this.deploymentConfigName != null ? !this.deploymentConfigName.equals(that.deploymentConfigName) : that.deploymentConfigName != null) return false;
            if (this.deploymentStyle != null ? !this.deploymentStyle.equals(that.deploymentStyle) : that.deploymentStyle != null) return false;
            if (this.ec2TagFilter != null ? !this.ec2TagFilter.equals(that.ec2TagFilter) : that.ec2TagFilter != null) return false;
            if (this.ec2TagSet != null ? !this.ec2TagSet.equals(that.ec2TagSet) : that.ec2TagSet != null) return false;
            if (this.ecsService != null ? !this.ecsService.equals(that.ecsService) : that.ecsService != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.loadBalancerInfo != null ? !this.loadBalancerInfo.equals(that.loadBalancerInfo) : that.loadBalancerInfo != null) return false;
            if (this.onPremisesInstanceTagFilter != null ? !this.onPremisesInstanceTagFilter.equals(that.onPremisesInstanceTagFilter) : that.onPremisesInstanceTagFilter != null) return false;
            if (this.outdatedInstancesStrategy != null ? !this.outdatedInstancesStrategy.equals(that.outdatedInstancesStrategy) : that.outdatedInstancesStrategy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.terminationHookEnabled != null ? !this.terminationHookEnabled.equals(that.terminationHookEnabled) : that.terminationHookEnabled != null) return false;
            if (this.triggerConfiguration != null ? !this.triggerConfiguration.equals(that.triggerConfiguration) : that.triggerConfiguration != null) return false;
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
            int result = this.appName.hashCode();
            result = 31 * result + (this.deploymentGroupName.hashCode());
            result = 31 * result + (this.serviceRoleArn.hashCode());
            result = 31 * result + (this.alarmConfiguration != null ? this.alarmConfiguration.hashCode() : 0);
            result = 31 * result + (this.autoRollbackConfiguration != null ? this.autoRollbackConfiguration.hashCode() : 0);
            result = 31 * result + (this.autoscalingGroups != null ? this.autoscalingGroups.hashCode() : 0);
            result = 31 * result + (this.blueGreenDeploymentConfig != null ? this.blueGreenDeploymentConfig.hashCode() : 0);
            result = 31 * result + (this.deploymentConfigName != null ? this.deploymentConfigName.hashCode() : 0);
            result = 31 * result + (this.deploymentStyle != null ? this.deploymentStyle.hashCode() : 0);
            result = 31 * result + (this.ec2TagFilter != null ? this.ec2TagFilter.hashCode() : 0);
            result = 31 * result + (this.ec2TagSet != null ? this.ec2TagSet.hashCode() : 0);
            result = 31 * result + (this.ecsService != null ? this.ecsService.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.loadBalancerInfo != null ? this.loadBalancerInfo.hashCode() : 0);
            result = 31 * result + (this.onPremisesInstanceTagFilter != null ? this.onPremisesInstanceTagFilter.hashCode() : 0);
            result = 31 * result + (this.outdatedInstancesStrategy != null ? this.outdatedInstancesStrategy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.terminationHookEnabled != null ? this.terminationHookEnabled.hashCode() : 0);
            result = 31 * result + (this.triggerConfiguration != null ? this.triggerConfiguration.hashCode() : 0);
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
