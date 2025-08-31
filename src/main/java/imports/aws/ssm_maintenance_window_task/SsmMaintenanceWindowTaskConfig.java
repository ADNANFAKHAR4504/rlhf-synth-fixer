package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.498Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskConfig")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskConfig.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_arn SsmMaintenanceWindowTask#task_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_type SsmMaintenanceWindowTask#task_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#window_id SsmMaintenanceWindowTask#window_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWindowId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cutoff_behavior SsmMaintenanceWindowTask#cutoff_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCutoffBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#description SsmMaintenanceWindowTask#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#id SsmMaintenanceWindowTask#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_concurrency SsmMaintenanceWindowTask#max_concurrency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxConcurrency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_errors SsmMaintenanceWindowTask#max_errors}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxErrors() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#name SsmMaintenanceWindowTask#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#priority SsmMaintenanceWindowTask#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArn() {
        return null;
    }

    /**
     * targets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#targets SsmMaintenanceWindowTask#targets}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargets() {
        return null;
    }

    /**
     * task_invocation_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_invocation_parameters SsmMaintenanceWindowTask#task_invocation_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters getTaskInvocationParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskConfig> {
        java.lang.String taskArn;
        java.lang.String taskType;
        java.lang.String windowId;
        java.lang.String cutoffBehavior;
        java.lang.String description;
        java.lang.String id;
        java.lang.String maxConcurrency;
        java.lang.String maxErrors;
        java.lang.String name;
        java.lang.Number priority;
        java.lang.String serviceRoleArn;
        java.lang.Object targets;
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters taskInvocationParameters;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getTaskArn}
         * @param taskArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_arn SsmMaintenanceWindowTask#task_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskArn(java.lang.String taskArn) {
            this.taskArn = taskArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getTaskType}
         * @param taskType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_type SsmMaintenanceWindowTask#task_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskType(java.lang.String taskType) {
            this.taskType = taskType;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getWindowId}
         * @param windowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#window_id SsmMaintenanceWindowTask#window_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder windowId(java.lang.String windowId) {
            this.windowId = windowId;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getCutoffBehavior}
         * @param cutoffBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cutoff_behavior SsmMaintenanceWindowTask#cutoff_behavior}.
         * @return {@code this}
         */
        public Builder cutoffBehavior(java.lang.String cutoffBehavior) {
            this.cutoffBehavior = cutoffBehavior;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#description SsmMaintenanceWindowTask#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#id SsmMaintenanceWindowTask#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getMaxConcurrency}
         * @param maxConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_concurrency SsmMaintenanceWindowTask#max_concurrency}.
         * @return {@code this}
         */
        public Builder maxConcurrency(java.lang.String maxConcurrency) {
            this.maxConcurrency = maxConcurrency;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getMaxErrors}
         * @param maxErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_errors SsmMaintenanceWindowTask#max_errors}.
         * @return {@code this}
         */
        public Builder maxErrors(java.lang.String maxErrors) {
            this.maxErrors = maxErrors;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#name SsmMaintenanceWindowTask#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#priority SsmMaintenanceWindowTask#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getServiceRoleArn}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}.
         * @return {@code this}
         */
        public Builder serviceRoleArn(java.lang.String serviceRoleArn) {
            this.serviceRoleArn = serviceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getTargets}
         * @param targets targets block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#targets SsmMaintenanceWindowTask#targets}
         * @return {@code this}
         */
        public Builder targets(com.hashicorp.cdktf.IResolvable targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getTargets}
         * @param targets targets block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#targets SsmMaintenanceWindowTask#targets}
         * @return {@code this}
         */
        public Builder targets(java.util.List<? extends imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets> targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getTaskInvocationParameters}
         * @param taskInvocationParameters task_invocation_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_invocation_parameters SsmMaintenanceWindowTask#task_invocation_parameters}
         * @return {@code this}
         */
        public Builder taskInvocationParameters(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters taskInvocationParameters) {
            this.taskInvocationParameters = taskInvocationParameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getDependsOn}
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
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskConfig#getProvisioners}
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
         * @return a new instance of {@link SsmMaintenanceWindowTaskConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskConfig {
        private final java.lang.String taskArn;
        private final java.lang.String taskType;
        private final java.lang.String windowId;
        private final java.lang.String cutoffBehavior;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String maxConcurrency;
        private final java.lang.String maxErrors;
        private final java.lang.String name;
        private final java.lang.Number priority;
        private final java.lang.String serviceRoleArn;
        private final java.lang.Object targets;
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters taskInvocationParameters;
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
            this.taskArn = software.amazon.jsii.Kernel.get(this, "taskArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskType = software.amazon.jsii.Kernel.get(this, "taskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.windowId = software.amazon.jsii.Kernel.get(this, "windowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cutoffBehavior = software.amazon.jsii.Kernel.get(this, "cutoffBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxConcurrency = software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxErrors = software.amazon.jsii.Kernel.get(this, "maxErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serviceRoleArn = software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targets = software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.taskInvocationParameters = software.amazon.jsii.Kernel.get(this, "taskInvocationParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters.class));
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
            this.taskArn = java.util.Objects.requireNonNull(builder.taskArn, "taskArn is required");
            this.taskType = java.util.Objects.requireNonNull(builder.taskType, "taskType is required");
            this.windowId = java.util.Objects.requireNonNull(builder.windowId, "windowId is required");
            this.cutoffBehavior = builder.cutoffBehavior;
            this.description = builder.description;
            this.id = builder.id;
            this.maxConcurrency = builder.maxConcurrency;
            this.maxErrors = builder.maxErrors;
            this.name = builder.name;
            this.priority = builder.priority;
            this.serviceRoleArn = builder.serviceRoleArn;
            this.targets = builder.targets;
            this.taskInvocationParameters = builder.taskInvocationParameters;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getTaskArn() {
            return this.taskArn;
        }

        @Override
        public final java.lang.String getTaskType() {
            return this.taskType;
        }

        @Override
        public final java.lang.String getWindowId() {
            return this.windowId;
        }

        @Override
        public final java.lang.String getCutoffBehavior() {
            return this.cutoffBehavior;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMaxConcurrency() {
            return this.maxConcurrency;
        }

        @Override
        public final java.lang.String getMaxErrors() {
            return this.maxErrors;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getServiceRoleArn() {
            return this.serviceRoleArn;
        }

        @Override
        public final java.lang.Object getTargets() {
            return this.targets;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters getTaskInvocationParameters() {
            return this.taskInvocationParameters;
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

            data.set("taskArn", om.valueToTree(this.getTaskArn()));
            data.set("taskType", om.valueToTree(this.getTaskType()));
            data.set("windowId", om.valueToTree(this.getWindowId()));
            if (this.getCutoffBehavior() != null) {
                data.set("cutoffBehavior", om.valueToTree(this.getCutoffBehavior()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxConcurrency() != null) {
                data.set("maxConcurrency", om.valueToTree(this.getMaxConcurrency()));
            }
            if (this.getMaxErrors() != null) {
                data.set("maxErrors", om.valueToTree(this.getMaxErrors()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }
            if (this.getServiceRoleArn() != null) {
                data.set("serviceRoleArn", om.valueToTree(this.getServiceRoleArn()));
            }
            if (this.getTargets() != null) {
                data.set("targets", om.valueToTree(this.getTargets()));
            }
            if (this.getTaskInvocationParameters() != null) {
                data.set("taskInvocationParameters", om.valueToTree(this.getTaskInvocationParameters()));
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
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskConfig.Jsii$Proxy that = (SsmMaintenanceWindowTaskConfig.Jsii$Proxy) o;

            if (!taskArn.equals(that.taskArn)) return false;
            if (!taskType.equals(that.taskType)) return false;
            if (!windowId.equals(that.windowId)) return false;
            if (this.cutoffBehavior != null ? !this.cutoffBehavior.equals(that.cutoffBehavior) : that.cutoffBehavior != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maxConcurrency != null ? !this.maxConcurrency.equals(that.maxConcurrency) : that.maxConcurrency != null) return false;
            if (this.maxErrors != null ? !this.maxErrors.equals(that.maxErrors) : that.maxErrors != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.priority != null ? !this.priority.equals(that.priority) : that.priority != null) return false;
            if (this.serviceRoleArn != null ? !this.serviceRoleArn.equals(that.serviceRoleArn) : that.serviceRoleArn != null) return false;
            if (this.targets != null ? !this.targets.equals(that.targets) : that.targets != null) return false;
            if (this.taskInvocationParameters != null ? !this.taskInvocationParameters.equals(that.taskInvocationParameters) : that.taskInvocationParameters != null) return false;
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
            int result = this.taskArn.hashCode();
            result = 31 * result + (this.taskType.hashCode());
            result = 31 * result + (this.windowId.hashCode());
            result = 31 * result + (this.cutoffBehavior != null ? this.cutoffBehavior.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxConcurrency != null ? this.maxConcurrency.hashCode() : 0);
            result = 31 * result + (this.maxErrors != null ? this.maxErrors.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            result = 31 * result + (this.serviceRoleArn != null ? this.serviceRoleArn.hashCode() : 0);
            result = 31 * result + (this.targets != null ? this.targets.hashCode() : 0);
            result = 31 * result + (this.taskInvocationParameters != null ? this.taskInvocationParameters.hashCode() : 0);
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
