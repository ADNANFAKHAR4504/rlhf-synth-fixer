package imports.aws.appautoscaling_scheduled_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.981Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appautoscalingScheduledAction.AppautoscalingScheduledActionConfig")
@software.amazon.jsii.Jsii.Proxy(AppautoscalingScheduledActionConfig.Jsii$Proxy.class)
public interface AppautoscalingScheduledActionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#name AppautoscalingScheduledAction#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#resource_id AppautoscalingScheduledAction#resource_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#scalable_dimension AppautoscalingScheduledAction#scalable_dimension}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScalableDimension();

    /**
     * scalable_target_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#scalable_target_action AppautoscalingScheduledAction#scalable_target_action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction getScalableTargetAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#schedule AppautoscalingScheduledAction#schedule}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSchedule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#service_namespace AppautoscalingScheduledAction#service_namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#end_time AppautoscalingScheduledAction#end_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#id AppautoscalingScheduledAction#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#start_time AppautoscalingScheduledAction#start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#timezone AppautoscalingScheduledAction#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppautoscalingScheduledActionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppautoscalingScheduledActionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppautoscalingScheduledActionConfig> {
        java.lang.String name;
        java.lang.String resourceId;
        java.lang.String scalableDimension;
        imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction scalableTargetAction;
        java.lang.String schedule;
        java.lang.String serviceNamespace;
        java.lang.String endTime;
        java.lang.String id;
        java.lang.String startTime;
        java.lang.String timezone;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#name AppautoscalingScheduledAction#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getResourceId}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#resource_id AppautoscalingScheduledAction#resource_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceId(java.lang.String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getScalableDimension}
         * @param scalableDimension Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#scalable_dimension AppautoscalingScheduledAction#scalable_dimension}. This parameter is required.
         * @return {@code this}
         */
        public Builder scalableDimension(java.lang.String scalableDimension) {
            this.scalableDimension = scalableDimension;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getScalableTargetAction}
         * @param scalableTargetAction scalable_target_action block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#scalable_target_action AppautoscalingScheduledAction#scalable_target_action}
         * @return {@code this}
         */
        public Builder scalableTargetAction(imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction scalableTargetAction) {
            this.scalableTargetAction = scalableTargetAction;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getSchedule}
         * @param schedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#schedule AppautoscalingScheduledAction#schedule}. This parameter is required.
         * @return {@code this}
         */
        public Builder schedule(java.lang.String schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getServiceNamespace}
         * @param serviceNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#service_namespace AppautoscalingScheduledAction#service_namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceNamespace(java.lang.String serviceNamespace) {
            this.serviceNamespace = serviceNamespace;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getEndTime}
         * @param endTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#end_time AppautoscalingScheduledAction#end_time}.
         * @return {@code this}
         */
        public Builder endTime(java.lang.String endTime) {
            this.endTime = endTime;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#id AppautoscalingScheduledAction#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getStartTime}
         * @param startTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#start_time AppautoscalingScheduledAction#start_time}.
         * @return {@code this}
         */
        public Builder startTime(java.lang.String startTime) {
            this.startTime = startTime;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appautoscaling_scheduled_action#timezone AppautoscalingScheduledAction#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getDependsOn}
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
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppautoscalingScheduledActionConfig#getProvisioners}
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
         * @return a new instance of {@link AppautoscalingScheduledActionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppautoscalingScheduledActionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppautoscalingScheduledActionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppautoscalingScheduledActionConfig {
        private final java.lang.String name;
        private final java.lang.String resourceId;
        private final java.lang.String scalableDimension;
        private final imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction scalableTargetAction;
        private final java.lang.String schedule;
        private final java.lang.String serviceNamespace;
        private final java.lang.String endTime;
        private final java.lang.String id;
        private final java.lang.String startTime;
        private final java.lang.String timezone;
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
            this.resourceId = software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalableDimension = software.amazon.jsii.Kernel.get(this, "scalableDimension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalableTargetAction = software.amazon.jsii.Kernel.get(this, "scalableTargetAction", software.amazon.jsii.NativeType.forClass(imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceNamespace = software.amazon.jsii.Kernel.get(this, "serviceNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endTime = software.amazon.jsii.Kernel.get(this, "endTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startTime = software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.resourceId = java.util.Objects.requireNonNull(builder.resourceId, "resourceId is required");
            this.scalableDimension = java.util.Objects.requireNonNull(builder.scalableDimension, "scalableDimension is required");
            this.scalableTargetAction = java.util.Objects.requireNonNull(builder.scalableTargetAction, "scalableTargetAction is required");
            this.schedule = java.util.Objects.requireNonNull(builder.schedule, "schedule is required");
            this.serviceNamespace = java.util.Objects.requireNonNull(builder.serviceNamespace, "serviceNamespace is required");
            this.endTime = builder.endTime;
            this.id = builder.id;
            this.startTime = builder.startTime;
            this.timezone = builder.timezone;
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
        public final java.lang.String getResourceId() {
            return this.resourceId;
        }

        @Override
        public final java.lang.String getScalableDimension() {
            return this.scalableDimension;
        }

        @Override
        public final imports.aws.appautoscaling_scheduled_action.AppautoscalingScheduledActionScalableTargetAction getScalableTargetAction() {
            return this.scalableTargetAction;
        }

        @Override
        public final java.lang.String getSchedule() {
            return this.schedule;
        }

        @Override
        public final java.lang.String getServiceNamespace() {
            return this.serviceNamespace;
        }

        @Override
        public final java.lang.String getEndTime() {
            return this.endTime;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getStartTime() {
            return this.startTime;
        }

        @Override
        public final java.lang.String getTimezone() {
            return this.timezone;
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
            data.set("resourceId", om.valueToTree(this.getResourceId()));
            data.set("scalableDimension", om.valueToTree(this.getScalableDimension()));
            data.set("scalableTargetAction", om.valueToTree(this.getScalableTargetAction()));
            data.set("schedule", om.valueToTree(this.getSchedule()));
            data.set("serviceNamespace", om.valueToTree(this.getServiceNamespace()));
            if (this.getEndTime() != null) {
                data.set("endTime", om.valueToTree(this.getEndTime()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getStartTime() != null) {
                data.set("startTime", om.valueToTree(this.getStartTime()));
            }
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
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
            struct.set("fqn", om.valueToTree("aws.appautoscalingScheduledAction.AppautoscalingScheduledActionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppautoscalingScheduledActionConfig.Jsii$Proxy that = (AppautoscalingScheduledActionConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!resourceId.equals(that.resourceId)) return false;
            if (!scalableDimension.equals(that.scalableDimension)) return false;
            if (!scalableTargetAction.equals(that.scalableTargetAction)) return false;
            if (!schedule.equals(that.schedule)) return false;
            if (!serviceNamespace.equals(that.serviceNamespace)) return false;
            if (this.endTime != null ? !this.endTime.equals(that.endTime) : that.endTime != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.startTime != null ? !this.startTime.equals(that.startTime) : that.startTime != null) return false;
            if (this.timezone != null ? !this.timezone.equals(that.timezone) : that.timezone != null) return false;
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
            result = 31 * result + (this.resourceId.hashCode());
            result = 31 * result + (this.scalableDimension.hashCode());
            result = 31 * result + (this.scalableTargetAction.hashCode());
            result = 31 * result + (this.schedule.hashCode());
            result = 31 * result + (this.serviceNamespace.hashCode());
            result = 31 * result + (this.endTime != null ? this.endTime.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.startTime != null ? this.startTime.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
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
