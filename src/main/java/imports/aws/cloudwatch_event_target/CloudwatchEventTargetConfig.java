package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetConfig.Jsii$Proxy.class)
public interface CloudwatchEventTargetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#arn CloudwatchEventTarget#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#rule CloudwatchEventTarget#rule}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRule();

    /**
     * appsync_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#appsync_target CloudwatchEventTarget#appsync_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget getAppsyncTarget() {
        return null;
    }

    /**
     * batch_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#batch_target CloudwatchEventTarget#batch_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget getBatchTarget() {
        return null;
    }

    /**
     * dead_letter_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#dead_letter_config CloudwatchEventTarget#dead_letter_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig getDeadLetterConfig() {
        return null;
    }

    /**
     * ecs_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#ecs_target CloudwatchEventTarget#ecs_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget getEcsTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#event_bus_name CloudwatchEventTarget#event_bus_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventBusName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#force_destroy CloudwatchEventTarget#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * http_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#http_target CloudwatchEventTarget#http_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget getHttpTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#id CloudwatchEventTarget#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input CloudwatchEventTarget#input}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_path CloudwatchEventTarget#input_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputPath() {
        return null;
    }

    /**
     * input_transformer block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_transformer CloudwatchEventTarget#input_transformer}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer getInputTransformer() {
        return null;
    }

    /**
     * kinesis_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#kinesis_target CloudwatchEventTarget#kinesis_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget getKinesisTarget() {
        return null;
    }

    /**
     * redshift_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#redshift_target CloudwatchEventTarget#redshift_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget getRedshiftTarget() {
        return null;
    }

    /**
     * retry_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#retry_policy CloudwatchEventTarget#retry_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy getRetryPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#role_arn CloudwatchEventTarget#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * run_command_targets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#run_command_targets CloudwatchEventTarget#run_command_targets}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRunCommandTargets() {
        return null;
    }

    /**
     * sagemaker_pipeline_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sagemaker_pipeline_target CloudwatchEventTarget#sagemaker_pipeline_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget getSagemakerPipelineTarget() {
        return null;
    }

    /**
     * sqs_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sqs_target CloudwatchEventTarget#sqs_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget getSqsTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#target_id CloudwatchEventTarget#target_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetConfig> {
        java.lang.String arn;
        java.lang.String rule;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget appsyncTarget;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget batchTarget;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig deadLetterConfig;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget ecsTarget;
        java.lang.String eventBusName;
        java.lang.Object forceDestroy;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget httpTarget;
        java.lang.String id;
        java.lang.String input;
        java.lang.String inputPath;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer inputTransformer;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget kinesisTarget;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget redshiftTarget;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy retryPolicy;
        java.lang.String roleArn;
        java.lang.Object runCommandTargets;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget sagemakerPipelineTarget;
        imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget sqsTarget;
        java.lang.String targetId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#arn CloudwatchEventTarget#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRule}
         * @param rule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#rule CloudwatchEventTarget#rule}. This parameter is required.
         * @return {@code this}
         */
        public Builder rule(java.lang.String rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getAppsyncTarget}
         * @param appsyncTarget appsync_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#appsync_target CloudwatchEventTarget#appsync_target}
         * @return {@code this}
         */
        public Builder appsyncTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget appsyncTarget) {
            this.appsyncTarget = appsyncTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getBatchTarget}
         * @param batchTarget batch_target block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#batch_target CloudwatchEventTarget#batch_target}
         * @return {@code this}
         */
        public Builder batchTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget batchTarget) {
            this.batchTarget = batchTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getDeadLetterConfig}
         * @param deadLetterConfig dead_letter_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#dead_letter_config CloudwatchEventTarget#dead_letter_config}
         * @return {@code this}
         */
        public Builder deadLetterConfig(imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig deadLetterConfig) {
            this.deadLetterConfig = deadLetterConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getEcsTarget}
         * @param ecsTarget ecs_target block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#ecs_target CloudwatchEventTarget#ecs_target}
         * @return {@code this}
         */
        public Builder ecsTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget ecsTarget) {
            this.ecsTarget = ecsTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getEventBusName}
         * @param eventBusName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#event_bus_name CloudwatchEventTarget#event_bus_name}.
         * @return {@code this}
         */
        public Builder eventBusName(java.lang.String eventBusName) {
            this.eventBusName = eventBusName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#force_destroy CloudwatchEventTarget#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#force_destroy CloudwatchEventTarget#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getHttpTarget}
         * @param httpTarget http_target block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#http_target CloudwatchEventTarget#http_target}
         * @return {@code this}
         */
        public Builder httpTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget httpTarget) {
            this.httpTarget = httpTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#id CloudwatchEventTarget#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getInput}
         * @param input Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input CloudwatchEventTarget#input}.
         * @return {@code this}
         */
        public Builder input(java.lang.String input) {
            this.input = input;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getInputPath}
         * @param inputPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_path CloudwatchEventTarget#input_path}.
         * @return {@code this}
         */
        public Builder inputPath(java.lang.String inputPath) {
            this.inputPath = inputPath;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getInputTransformer}
         * @param inputTransformer input_transformer block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_transformer CloudwatchEventTarget#input_transformer}
         * @return {@code this}
         */
        public Builder inputTransformer(imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer inputTransformer) {
            this.inputTransformer = inputTransformer;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getKinesisTarget}
         * @param kinesisTarget kinesis_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#kinesis_target CloudwatchEventTarget#kinesis_target}
         * @return {@code this}
         */
        public Builder kinesisTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget kinesisTarget) {
            this.kinesisTarget = kinesisTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRedshiftTarget}
         * @param redshiftTarget redshift_target block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#redshift_target CloudwatchEventTarget#redshift_target}
         * @return {@code this}
         */
        public Builder redshiftTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget redshiftTarget) {
            this.redshiftTarget = redshiftTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRetryPolicy}
         * @param retryPolicy retry_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#retry_policy CloudwatchEventTarget#retry_policy}
         * @return {@code this}
         */
        public Builder retryPolicy(imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy retryPolicy) {
            this.retryPolicy = retryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#role_arn CloudwatchEventTarget#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRunCommandTargets}
         * @param runCommandTargets run_command_targets block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#run_command_targets CloudwatchEventTarget#run_command_targets}
         * @return {@code this}
         */
        public Builder runCommandTargets(com.hashicorp.cdktf.IResolvable runCommandTargets) {
            this.runCommandTargets = runCommandTargets;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getRunCommandTargets}
         * @param runCommandTargets run_command_targets block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#run_command_targets CloudwatchEventTarget#run_command_targets}
         * @return {@code this}
         */
        public Builder runCommandTargets(java.util.List<? extends imports.aws.cloudwatch_event_target.CloudwatchEventTargetRunCommandTargets> runCommandTargets) {
            this.runCommandTargets = runCommandTargets;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getSagemakerPipelineTarget}
         * @param sagemakerPipelineTarget sagemaker_pipeline_target block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sagemaker_pipeline_target CloudwatchEventTarget#sagemaker_pipeline_target}
         * @return {@code this}
         */
        public Builder sagemakerPipelineTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget sagemakerPipelineTarget) {
            this.sagemakerPipelineTarget = sagemakerPipelineTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getSqsTarget}
         * @param sqsTarget sqs_target block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sqs_target CloudwatchEventTarget#sqs_target}
         * @return {@code this}
         */
        public Builder sqsTarget(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget sqsTarget) {
            this.sqsTarget = sqsTarget;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getTargetId}
         * @param targetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#target_id CloudwatchEventTarget#target_id}.
         * @return {@code this}
         */
        public Builder targetId(java.lang.String targetId) {
            this.targetId = targetId;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getDependsOn}
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
         * Sets the value of {@link CloudwatchEventTargetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetConfig#getProvisioners}
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
         * @return a new instance of {@link CloudwatchEventTargetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetConfig {
        private final java.lang.String arn;
        private final java.lang.String rule;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget appsyncTarget;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget batchTarget;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig deadLetterConfig;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget ecsTarget;
        private final java.lang.String eventBusName;
        private final java.lang.Object forceDestroy;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget httpTarget;
        private final java.lang.String id;
        private final java.lang.String input;
        private final java.lang.String inputPath;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer inputTransformer;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget kinesisTarget;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget redshiftTarget;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy retryPolicy;
        private final java.lang.String roleArn;
        private final java.lang.Object runCommandTargets;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget sagemakerPipelineTarget;
        private final imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget sqsTarget;
        private final java.lang.String targetId;
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
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.appsyncTarget = software.amazon.jsii.Kernel.get(this, "appsyncTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget.class));
            this.batchTarget = software.amazon.jsii.Kernel.get(this, "batchTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget.class));
            this.deadLetterConfig = software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig.class));
            this.ecsTarget = software.amazon.jsii.Kernel.get(this, "ecsTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget.class));
            this.eventBusName = software.amazon.jsii.Kernel.get(this, "eventBusName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.httpTarget = software.amazon.jsii.Kernel.get(this, "httpTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.input = software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputPath = software.amazon.jsii.Kernel.get(this, "inputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputTransformer = software.amazon.jsii.Kernel.get(this, "inputTransformer", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer.class));
            this.kinesisTarget = software.amazon.jsii.Kernel.get(this, "kinesisTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget.class));
            this.redshiftTarget = software.amazon.jsii.Kernel.get(this, "redshiftTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget.class));
            this.retryPolicy = software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runCommandTargets = software.amazon.jsii.Kernel.get(this, "runCommandTargets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sagemakerPipelineTarget = software.amazon.jsii.Kernel.get(this, "sagemakerPipelineTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget.class));
            this.sqsTarget = software.amazon.jsii.Kernel.get(this, "sqsTarget", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget.class));
            this.targetId = software.amazon.jsii.Kernel.get(this, "targetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.rule = java.util.Objects.requireNonNull(builder.rule, "rule is required");
            this.appsyncTarget = builder.appsyncTarget;
            this.batchTarget = builder.batchTarget;
            this.deadLetterConfig = builder.deadLetterConfig;
            this.ecsTarget = builder.ecsTarget;
            this.eventBusName = builder.eventBusName;
            this.forceDestroy = builder.forceDestroy;
            this.httpTarget = builder.httpTarget;
            this.id = builder.id;
            this.input = builder.input;
            this.inputPath = builder.inputPath;
            this.inputTransformer = builder.inputTransformer;
            this.kinesisTarget = builder.kinesisTarget;
            this.redshiftTarget = builder.redshiftTarget;
            this.retryPolicy = builder.retryPolicy;
            this.roleArn = builder.roleArn;
            this.runCommandTargets = builder.runCommandTargets;
            this.sagemakerPipelineTarget = builder.sagemakerPipelineTarget;
            this.sqsTarget = builder.sqsTarget;
            this.targetId = builder.targetId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.String getRule() {
            return this.rule;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetAppsyncTarget getAppsyncTarget() {
            return this.appsyncTarget;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetBatchTarget getBatchTarget() {
            return this.batchTarget;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetDeadLetterConfig getDeadLetterConfig() {
            return this.deadLetterConfig;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetEcsTarget getEcsTarget() {
            return this.ecsTarget;
        }

        @Override
        public final java.lang.String getEventBusName() {
            return this.eventBusName;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetHttpTarget getHttpTarget() {
            return this.httpTarget;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInput() {
            return this.input;
        }

        @Override
        public final java.lang.String getInputPath() {
            return this.inputPath;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetInputTransformer getInputTransformer() {
            return this.inputTransformer;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetKinesisTarget getKinesisTarget() {
            return this.kinesisTarget;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget getRedshiftTarget() {
            return this.redshiftTarget;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetRetryPolicy getRetryPolicy() {
            return this.retryPolicy;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getRunCommandTargets() {
            return this.runCommandTargets;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget getSagemakerPipelineTarget() {
            return this.sagemakerPipelineTarget;
        }

        @Override
        public final imports.aws.cloudwatch_event_target.CloudwatchEventTargetSqsTarget getSqsTarget() {
            return this.sqsTarget;
        }

        @Override
        public final java.lang.String getTargetId() {
            return this.targetId;
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

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("rule", om.valueToTree(this.getRule()));
            if (this.getAppsyncTarget() != null) {
                data.set("appsyncTarget", om.valueToTree(this.getAppsyncTarget()));
            }
            if (this.getBatchTarget() != null) {
                data.set("batchTarget", om.valueToTree(this.getBatchTarget()));
            }
            if (this.getDeadLetterConfig() != null) {
                data.set("deadLetterConfig", om.valueToTree(this.getDeadLetterConfig()));
            }
            if (this.getEcsTarget() != null) {
                data.set("ecsTarget", om.valueToTree(this.getEcsTarget()));
            }
            if (this.getEventBusName() != null) {
                data.set("eventBusName", om.valueToTree(this.getEventBusName()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getHttpTarget() != null) {
                data.set("httpTarget", om.valueToTree(this.getHttpTarget()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInput() != null) {
                data.set("input", om.valueToTree(this.getInput()));
            }
            if (this.getInputPath() != null) {
                data.set("inputPath", om.valueToTree(this.getInputPath()));
            }
            if (this.getInputTransformer() != null) {
                data.set("inputTransformer", om.valueToTree(this.getInputTransformer()));
            }
            if (this.getKinesisTarget() != null) {
                data.set("kinesisTarget", om.valueToTree(this.getKinesisTarget()));
            }
            if (this.getRedshiftTarget() != null) {
                data.set("redshiftTarget", om.valueToTree(this.getRedshiftTarget()));
            }
            if (this.getRetryPolicy() != null) {
                data.set("retryPolicy", om.valueToTree(this.getRetryPolicy()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getRunCommandTargets() != null) {
                data.set("runCommandTargets", om.valueToTree(this.getRunCommandTargets()));
            }
            if (this.getSagemakerPipelineTarget() != null) {
                data.set("sagemakerPipelineTarget", om.valueToTree(this.getSagemakerPipelineTarget()));
            }
            if (this.getSqsTarget() != null) {
                data.set("sqsTarget", om.valueToTree(this.getSqsTarget()));
            }
            if (this.getTargetId() != null) {
                data.set("targetId", om.valueToTree(this.getTargetId()));
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
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetConfig.Jsii$Proxy that = (CloudwatchEventTargetConfig.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            if (!rule.equals(that.rule)) return false;
            if (this.appsyncTarget != null ? !this.appsyncTarget.equals(that.appsyncTarget) : that.appsyncTarget != null) return false;
            if (this.batchTarget != null ? !this.batchTarget.equals(that.batchTarget) : that.batchTarget != null) return false;
            if (this.deadLetterConfig != null ? !this.deadLetterConfig.equals(that.deadLetterConfig) : that.deadLetterConfig != null) return false;
            if (this.ecsTarget != null ? !this.ecsTarget.equals(that.ecsTarget) : that.ecsTarget != null) return false;
            if (this.eventBusName != null ? !this.eventBusName.equals(that.eventBusName) : that.eventBusName != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.httpTarget != null ? !this.httpTarget.equals(that.httpTarget) : that.httpTarget != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.input != null ? !this.input.equals(that.input) : that.input != null) return false;
            if (this.inputPath != null ? !this.inputPath.equals(that.inputPath) : that.inputPath != null) return false;
            if (this.inputTransformer != null ? !this.inputTransformer.equals(that.inputTransformer) : that.inputTransformer != null) return false;
            if (this.kinesisTarget != null ? !this.kinesisTarget.equals(that.kinesisTarget) : that.kinesisTarget != null) return false;
            if (this.redshiftTarget != null ? !this.redshiftTarget.equals(that.redshiftTarget) : that.redshiftTarget != null) return false;
            if (this.retryPolicy != null ? !this.retryPolicy.equals(that.retryPolicy) : that.retryPolicy != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.runCommandTargets != null ? !this.runCommandTargets.equals(that.runCommandTargets) : that.runCommandTargets != null) return false;
            if (this.sagemakerPipelineTarget != null ? !this.sagemakerPipelineTarget.equals(that.sagemakerPipelineTarget) : that.sagemakerPipelineTarget != null) return false;
            if (this.sqsTarget != null ? !this.sqsTarget.equals(that.sqsTarget) : that.sqsTarget != null) return false;
            if (this.targetId != null ? !this.targetId.equals(that.targetId) : that.targetId != null) return false;
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
            int result = this.arn.hashCode();
            result = 31 * result + (this.rule.hashCode());
            result = 31 * result + (this.appsyncTarget != null ? this.appsyncTarget.hashCode() : 0);
            result = 31 * result + (this.batchTarget != null ? this.batchTarget.hashCode() : 0);
            result = 31 * result + (this.deadLetterConfig != null ? this.deadLetterConfig.hashCode() : 0);
            result = 31 * result + (this.ecsTarget != null ? this.ecsTarget.hashCode() : 0);
            result = 31 * result + (this.eventBusName != null ? this.eventBusName.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.httpTarget != null ? this.httpTarget.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.input != null ? this.input.hashCode() : 0);
            result = 31 * result + (this.inputPath != null ? this.inputPath.hashCode() : 0);
            result = 31 * result + (this.inputTransformer != null ? this.inputTransformer.hashCode() : 0);
            result = 31 * result + (this.kinesisTarget != null ? this.kinesisTarget.hashCode() : 0);
            result = 31 * result + (this.redshiftTarget != null ? this.redshiftTarget.hashCode() : 0);
            result = 31 * result + (this.retryPolicy != null ? this.retryPolicy.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.runCommandTargets != null ? this.runCommandTargets.hashCode() : 0);
            result = 31 * result + (this.sagemakerPipelineTarget != null ? this.sagemakerPipelineTarget.hashCode() : 0);
            result = 31 * result + (this.sqsTarget != null ? this.sqsTarget.hashCode() : 0);
            result = 31 * result + (this.targetId != null ? this.targetId.hashCode() : 0);
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
