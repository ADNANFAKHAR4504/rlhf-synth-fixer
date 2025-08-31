package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleConfig")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleConfig.Jsii$Proxy.class)
public interface SchedulerScheduleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * flexible_time_window block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#flexible_time_window SchedulerSchedule#flexible_time_window}
     */
    @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow getFlexibleTimeWindow();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#schedule_expression SchedulerSchedule#schedule_expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression();

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#target SchedulerSchedule#target}
     */
    @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTarget getTarget();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#description SchedulerSchedule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#end_date SchedulerSchedule#end_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#group_name SchedulerSchedule#group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#id SchedulerSchedule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#kms_key_arn SchedulerSchedule#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#name SchedulerSchedule#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#name_prefix SchedulerSchedule#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#schedule_expression_timezone SchedulerSchedule#schedule_expression_timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#start_date SchedulerSchedule#start_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#state SchedulerSchedule#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleConfig> {
        imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow flexibleTimeWindow;
        java.lang.String scheduleExpression;
        imports.aws.scheduler_schedule.SchedulerScheduleTarget target;
        java.lang.String description;
        java.lang.String endDate;
        java.lang.String groupName;
        java.lang.String id;
        java.lang.String kmsKeyArn;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String scheduleExpressionTimezone;
        java.lang.String startDate;
        java.lang.String state;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getFlexibleTimeWindow}
         * @param flexibleTimeWindow flexible_time_window block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#flexible_time_window SchedulerSchedule#flexible_time_window}
         * @return {@code this}
         */
        public Builder flexibleTimeWindow(imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow flexibleTimeWindow) {
            this.flexibleTimeWindow = flexibleTimeWindow;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#schedule_expression SchedulerSchedule#schedule_expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getTarget}
         * @param target target block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#target SchedulerSchedule#target}
         * @return {@code this}
         */
        public Builder target(imports.aws.scheduler_schedule.SchedulerScheduleTarget target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#description SchedulerSchedule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getEndDate}
         * @param endDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#end_date SchedulerSchedule#end_date}.
         * @return {@code this}
         */
        public Builder endDate(java.lang.String endDate) {
            this.endDate = endDate;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getGroupName}
         * @param groupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#group_name SchedulerSchedule#group_name}.
         * @return {@code this}
         */
        public Builder groupName(java.lang.String groupName) {
            this.groupName = groupName;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#id SchedulerSchedule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#kms_key_arn SchedulerSchedule#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#name SchedulerSchedule#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#name_prefix SchedulerSchedule#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getScheduleExpressionTimezone}
         * @param scheduleExpressionTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#schedule_expression_timezone SchedulerSchedule#schedule_expression_timezone}.
         * @return {@code this}
         */
        public Builder scheduleExpressionTimezone(java.lang.String scheduleExpressionTimezone) {
            this.scheduleExpressionTimezone = scheduleExpressionTimezone;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getStartDate}
         * @param startDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#start_date SchedulerSchedule#start_date}.
         * @return {@code this}
         */
        public Builder startDate(java.lang.String startDate) {
            this.startDate = startDate;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#state SchedulerSchedule#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getDependsOn}
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
         * Sets the value of {@link SchedulerScheduleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleConfig#getProvisioners}
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
         * @return a new instance of {@link SchedulerScheduleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleConfig {
        private final imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow flexibleTimeWindow;
        private final java.lang.String scheduleExpression;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTarget target;
        private final java.lang.String description;
        private final java.lang.String endDate;
        private final java.lang.String groupName;
        private final java.lang.String id;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String scheduleExpressionTimezone;
        private final java.lang.String startDate;
        private final java.lang.String state;
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
            this.flexibleTimeWindow = software.amazon.jsii.Kernel.get(this, "flexibleTimeWindow", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow.class));
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTarget.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endDate = software.amazon.jsii.Kernel.get(this, "endDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupName = software.amazon.jsii.Kernel.get(this, "groupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleExpressionTimezone = software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startDate = software.amazon.jsii.Kernel.get(this, "startDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.flexibleTimeWindow = java.util.Objects.requireNonNull(builder.flexibleTimeWindow, "flexibleTimeWindow is required");
            this.scheduleExpression = java.util.Objects.requireNonNull(builder.scheduleExpression, "scheduleExpression is required");
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.description = builder.description;
            this.endDate = builder.endDate;
            this.groupName = builder.groupName;
            this.id = builder.id;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.scheduleExpressionTimezone = builder.scheduleExpressionTimezone;
            this.startDate = builder.startDate;
            this.state = builder.state;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleFlexibleTimeWindow getFlexibleTimeWindow() {
            return this.flexibleTimeWindow;
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTarget getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getEndDate() {
            return this.endDate;
        }

        @Override
        public final java.lang.String getGroupName() {
            return this.groupName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.String getScheduleExpressionTimezone() {
            return this.scheduleExpressionTimezone;
        }

        @Override
        public final java.lang.String getStartDate() {
            return this.startDate;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
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

            data.set("flexibleTimeWindow", om.valueToTree(this.getFlexibleTimeWindow()));
            data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));
            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEndDate() != null) {
                data.set("endDate", om.valueToTree(this.getEndDate()));
            }
            if (this.getGroupName() != null) {
                data.set("groupName", om.valueToTree(this.getGroupName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getScheduleExpressionTimezone() != null) {
                data.set("scheduleExpressionTimezone", om.valueToTree(this.getScheduleExpressionTimezone()));
            }
            if (this.getStartDate() != null) {
                data.set("startDate", om.valueToTree(this.getStartDate()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
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
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleConfig.Jsii$Proxy that = (SchedulerScheduleConfig.Jsii$Proxy) o;

            if (!flexibleTimeWindow.equals(that.flexibleTimeWindow)) return false;
            if (!scheduleExpression.equals(that.scheduleExpression)) return false;
            if (!target.equals(that.target)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.endDate != null ? !this.endDate.equals(that.endDate) : that.endDate != null) return false;
            if (this.groupName != null ? !this.groupName.equals(that.groupName) : that.groupName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.scheduleExpressionTimezone != null ? !this.scheduleExpressionTimezone.equals(that.scheduleExpressionTimezone) : that.scheduleExpressionTimezone != null) return false;
            if (this.startDate != null ? !this.startDate.equals(that.startDate) : that.startDate != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
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
            int result = this.flexibleTimeWindow.hashCode();
            result = 31 * result + (this.scheduleExpression.hashCode());
            result = 31 * result + (this.target.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.endDate != null ? this.endDate.hashCode() : 0);
            result = 31 * result + (this.groupName != null ? this.groupName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.scheduleExpressionTimezone != null ? this.scheduleExpressionTimezone.hashCode() : 0);
            result = 31 * result + (this.startDate != null ? this.startDate.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
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
