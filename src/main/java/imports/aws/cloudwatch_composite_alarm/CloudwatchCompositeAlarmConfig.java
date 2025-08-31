package imports.aws.cloudwatch_composite_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarmConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchCompositeAlarmConfig.Jsii$Proxy.class)
public interface CloudwatchCompositeAlarmConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_name CloudwatchCompositeAlarm#alarm_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarmName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_rule CloudwatchCompositeAlarm#alarm_rule}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarmRule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActionsEnabled() {
        return null;
    }

    /**
     * actions_suppressor block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_suppressor CloudwatchCompositeAlarm#actions_suppressor}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor getActionsSuppressor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_actions CloudwatchCompositeAlarm#alarm_actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarmActions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_description CloudwatchCompositeAlarm#alarm_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlarmDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#id CloudwatchCompositeAlarm#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#insufficient_data_actions CloudwatchCompositeAlarm#insufficient_data_actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsufficientDataActions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#ok_actions CloudwatchCompositeAlarm#ok_actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOkActions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags CloudwatchCompositeAlarm#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags_all CloudwatchCompositeAlarm#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchCompositeAlarmConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchCompositeAlarmConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchCompositeAlarmConfig> {
        java.lang.String alarmName;
        java.lang.String alarmRule;
        java.lang.Object actionsEnabled;
        imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor actionsSuppressor;
        java.util.List<java.lang.String> alarmActions;
        java.lang.String alarmDescription;
        java.lang.String id;
        java.util.List<java.lang.String> insufficientDataActions;
        java.util.List<java.lang.String> okActions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getAlarmName}
         * @param alarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_name CloudwatchCompositeAlarm#alarm_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmName(java.lang.String alarmName) {
            this.alarmName = alarmName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getAlarmRule}
         * @param alarmRule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_rule CloudwatchCompositeAlarm#alarm_rule}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmRule(java.lang.String alarmRule) {
            this.alarmRule = alarmRule;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getActionsEnabled}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}.
         * @return {@code this}
         */
        public Builder actionsEnabled(java.lang.Boolean actionsEnabled) {
            this.actionsEnabled = actionsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getActionsEnabled}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}.
         * @return {@code this}
         */
        public Builder actionsEnabled(com.hashicorp.cdktf.IResolvable actionsEnabled) {
            this.actionsEnabled = actionsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getActionsSuppressor}
         * @param actionsSuppressor actions_suppressor block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_suppressor CloudwatchCompositeAlarm#actions_suppressor}
         * @return {@code this}
         */
        public Builder actionsSuppressor(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor actionsSuppressor) {
            this.actionsSuppressor = actionsSuppressor;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getAlarmActions}
         * @param alarmActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_actions CloudwatchCompositeAlarm#alarm_actions}.
         * @return {@code this}
         */
        public Builder alarmActions(java.util.List<java.lang.String> alarmActions) {
            this.alarmActions = alarmActions;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getAlarmDescription}
         * @param alarmDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_description CloudwatchCompositeAlarm#alarm_description}.
         * @return {@code this}
         */
        public Builder alarmDescription(java.lang.String alarmDescription) {
            this.alarmDescription = alarmDescription;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#id CloudwatchCompositeAlarm#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getInsufficientDataActions}
         * @param insufficientDataActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#insufficient_data_actions CloudwatchCompositeAlarm#insufficient_data_actions}.
         * @return {@code this}
         */
        public Builder insufficientDataActions(java.util.List<java.lang.String> insufficientDataActions) {
            this.insufficientDataActions = insufficientDataActions;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getOkActions}
         * @param okActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#ok_actions CloudwatchCompositeAlarm#ok_actions}.
         * @return {@code this}
         */
        public Builder okActions(java.util.List<java.lang.String> okActions) {
            this.okActions = okActions;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags CloudwatchCompositeAlarm#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags_all CloudwatchCompositeAlarm#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getDependsOn}
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
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmConfig#getProvisioners}
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
         * @return a new instance of {@link CloudwatchCompositeAlarmConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchCompositeAlarmConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchCompositeAlarmConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchCompositeAlarmConfig {
        private final java.lang.String alarmName;
        private final java.lang.String alarmRule;
        private final java.lang.Object actionsEnabled;
        private final imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor actionsSuppressor;
        private final java.util.List<java.lang.String> alarmActions;
        private final java.lang.String alarmDescription;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> insufficientDataActions;
        private final java.util.List<java.lang.String> okActions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.alarmName = software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alarmRule = software.amazon.jsii.Kernel.get(this, "alarmRule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.actionsEnabled = software.amazon.jsii.Kernel.get(this, "actionsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.actionsSuppressor = software.amazon.jsii.Kernel.get(this, "actionsSuppressor", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor.class));
            this.alarmActions = software.amazon.jsii.Kernel.get(this, "alarmActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.alarmDescription = software.amazon.jsii.Kernel.get(this, "alarmDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.insufficientDataActions = software.amazon.jsii.Kernel.get(this, "insufficientDataActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.okActions = software.amazon.jsii.Kernel.get(this, "okActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.alarmName = java.util.Objects.requireNonNull(builder.alarmName, "alarmName is required");
            this.alarmRule = java.util.Objects.requireNonNull(builder.alarmRule, "alarmRule is required");
            this.actionsEnabled = builder.actionsEnabled;
            this.actionsSuppressor = builder.actionsSuppressor;
            this.alarmActions = builder.alarmActions;
            this.alarmDescription = builder.alarmDescription;
            this.id = builder.id;
            this.insufficientDataActions = builder.insufficientDataActions;
            this.okActions = builder.okActions;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAlarmName() {
            return this.alarmName;
        }

        @Override
        public final java.lang.String getAlarmRule() {
            return this.alarmRule;
        }

        @Override
        public final java.lang.Object getActionsEnabled() {
            return this.actionsEnabled;
        }

        @Override
        public final imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor getActionsSuppressor() {
            return this.actionsSuppressor;
        }

        @Override
        public final java.util.List<java.lang.String> getAlarmActions() {
            return this.alarmActions;
        }

        @Override
        public final java.lang.String getAlarmDescription() {
            return this.alarmDescription;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getInsufficientDataActions() {
            return this.insufficientDataActions;
        }

        @Override
        public final java.util.List<java.lang.String> getOkActions() {
            return this.okActions;
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

            data.set("alarmName", om.valueToTree(this.getAlarmName()));
            data.set("alarmRule", om.valueToTree(this.getAlarmRule()));
            if (this.getActionsEnabled() != null) {
                data.set("actionsEnabled", om.valueToTree(this.getActionsEnabled()));
            }
            if (this.getActionsSuppressor() != null) {
                data.set("actionsSuppressor", om.valueToTree(this.getActionsSuppressor()));
            }
            if (this.getAlarmActions() != null) {
                data.set("alarmActions", om.valueToTree(this.getAlarmActions()));
            }
            if (this.getAlarmDescription() != null) {
                data.set("alarmDescription", om.valueToTree(this.getAlarmDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInsufficientDataActions() != null) {
                data.set("insufficientDataActions", om.valueToTree(this.getInsufficientDataActions()));
            }
            if (this.getOkActions() != null) {
                data.set("okActions", om.valueToTree(this.getOkActions()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarmConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchCompositeAlarmConfig.Jsii$Proxy that = (CloudwatchCompositeAlarmConfig.Jsii$Proxy) o;

            if (!alarmName.equals(that.alarmName)) return false;
            if (!alarmRule.equals(that.alarmRule)) return false;
            if (this.actionsEnabled != null ? !this.actionsEnabled.equals(that.actionsEnabled) : that.actionsEnabled != null) return false;
            if (this.actionsSuppressor != null ? !this.actionsSuppressor.equals(that.actionsSuppressor) : that.actionsSuppressor != null) return false;
            if (this.alarmActions != null ? !this.alarmActions.equals(that.alarmActions) : that.alarmActions != null) return false;
            if (this.alarmDescription != null ? !this.alarmDescription.equals(that.alarmDescription) : that.alarmDescription != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.insufficientDataActions != null ? !this.insufficientDataActions.equals(that.insufficientDataActions) : that.insufficientDataActions != null) return false;
            if (this.okActions != null ? !this.okActions.equals(that.okActions) : that.okActions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.alarmName.hashCode();
            result = 31 * result + (this.alarmRule.hashCode());
            result = 31 * result + (this.actionsEnabled != null ? this.actionsEnabled.hashCode() : 0);
            result = 31 * result + (this.actionsSuppressor != null ? this.actionsSuppressor.hashCode() : 0);
            result = 31 * result + (this.alarmActions != null ? this.alarmActions.hashCode() : 0);
            result = 31 * result + (this.alarmDescription != null ? this.alarmDescription.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.insufficientDataActions != null ? this.insufficientDataActions.hashCode() : 0);
            result = 31 * result + (this.okActions != null ? this.okActions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
