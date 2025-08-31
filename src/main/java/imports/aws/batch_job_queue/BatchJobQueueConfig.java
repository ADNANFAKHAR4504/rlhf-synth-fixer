package imports.aws.batch_job_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.135Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobQueue.BatchJobQueueConfig")
@software.amazon.jsii.Jsii.Proxy(BatchJobQueueConfig.Jsii$Proxy.class)
public interface BatchJobQueueConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#name BatchJobQueue#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#priority BatchJobQueue#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#state BatchJobQueue#state}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getState();

    /**
     * compute_environment_order block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environment_order BatchJobQueue#compute_environment_order}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getComputeEnvironmentOrder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environments BatchJobQueue#compute_environments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getComputeEnvironments() {
        return null;
    }

    /**
     * job_state_time_limit_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#job_state_time_limit_action BatchJobQueue#job_state_time_limit_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getJobStateTimeLimitAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#scheduling_policy_arn BatchJobQueue#scheduling_policy_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchedulingPolicyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#tags BatchJobQueue#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#timeouts BatchJobQueue#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_queue.BatchJobQueueTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobQueueConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobQueueConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobQueueConfig> {
        java.lang.String name;
        java.lang.Number priority;
        java.lang.String state;
        java.lang.Object computeEnvironmentOrder;
        java.util.List<java.lang.String> computeEnvironments;
        java.lang.Object jobStateTimeLimitAction;
        java.lang.String schedulingPolicyArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.batch_job_queue.BatchJobQueueTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BatchJobQueueConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#name BatchJobQueue#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#priority BatchJobQueue#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#state BatchJobQueue#state}. This parameter is required.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getComputeEnvironmentOrder}
         * @param computeEnvironmentOrder compute_environment_order block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environment_order BatchJobQueue#compute_environment_order}
         * @return {@code this}
         */
        public Builder computeEnvironmentOrder(com.hashicorp.cdktf.IResolvable computeEnvironmentOrder) {
            this.computeEnvironmentOrder = computeEnvironmentOrder;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getComputeEnvironmentOrder}
         * @param computeEnvironmentOrder compute_environment_order block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environment_order BatchJobQueue#compute_environment_order}
         * @return {@code this}
         */
        public Builder computeEnvironmentOrder(java.util.List<? extends imports.aws.batch_job_queue.BatchJobQueueComputeEnvironmentOrder> computeEnvironmentOrder) {
            this.computeEnvironmentOrder = computeEnvironmentOrder;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getComputeEnvironments}
         * @param computeEnvironments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environments BatchJobQueue#compute_environments}.
         * @return {@code this}
         */
        public Builder computeEnvironments(java.util.List<java.lang.String> computeEnvironments) {
            this.computeEnvironments = computeEnvironments;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getJobStateTimeLimitAction}
         * @param jobStateTimeLimitAction job_state_time_limit_action block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#job_state_time_limit_action BatchJobQueue#job_state_time_limit_action}
         * @return {@code this}
         */
        public Builder jobStateTimeLimitAction(com.hashicorp.cdktf.IResolvable jobStateTimeLimitAction) {
            this.jobStateTimeLimitAction = jobStateTimeLimitAction;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getJobStateTimeLimitAction}
         * @param jobStateTimeLimitAction job_state_time_limit_action block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#job_state_time_limit_action BatchJobQueue#job_state_time_limit_action}
         * @return {@code this}
         */
        public Builder jobStateTimeLimitAction(java.util.List<? extends imports.aws.batch_job_queue.BatchJobQueueJobStateTimeLimitAction> jobStateTimeLimitAction) {
            this.jobStateTimeLimitAction = jobStateTimeLimitAction;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getSchedulingPolicyArn}
         * @param schedulingPolicyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#scheduling_policy_arn BatchJobQueue#scheduling_policy_arn}.
         * @return {@code this}
         */
        public Builder schedulingPolicyArn(java.lang.String schedulingPolicyArn) {
            this.schedulingPolicyArn = schedulingPolicyArn;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#tags BatchJobQueue#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#timeouts BatchJobQueue#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.batch_job_queue.BatchJobQueueTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getDependsOn}
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
         * Sets the value of {@link BatchJobQueueConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueConfig#getProvisioners}
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
         * @return a new instance of {@link BatchJobQueueConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobQueueConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobQueueConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobQueueConfig {
        private final java.lang.String name;
        private final java.lang.Number priority;
        private final java.lang.String state;
        private final java.lang.Object computeEnvironmentOrder;
        private final java.util.List<java.lang.String> computeEnvironments;
        private final java.lang.Object jobStateTimeLimitAction;
        private final java.lang.String schedulingPolicyArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.batch_job_queue.BatchJobQueueTimeouts timeouts;
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
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computeEnvironmentOrder = software.amazon.jsii.Kernel.get(this, "computeEnvironmentOrder", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.computeEnvironments = software.amazon.jsii.Kernel.get(this, "computeEnvironments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.jobStateTimeLimitAction = software.amazon.jsii.Kernel.get(this, "jobStateTimeLimitAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.schedulingPolicyArn = software.amazon.jsii.Kernel.get(this, "schedulingPolicyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_queue.BatchJobQueueTimeouts.class));
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
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.state = java.util.Objects.requireNonNull(builder.state, "state is required");
            this.computeEnvironmentOrder = builder.computeEnvironmentOrder;
            this.computeEnvironments = builder.computeEnvironments;
            this.jobStateTimeLimitAction = builder.jobStateTimeLimitAction;
            this.schedulingPolicyArn = builder.schedulingPolicyArn;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
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
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        public final java.lang.Object getComputeEnvironmentOrder() {
            return this.computeEnvironmentOrder;
        }

        @Override
        public final java.util.List<java.lang.String> getComputeEnvironments() {
            return this.computeEnvironments;
        }

        @Override
        public final java.lang.Object getJobStateTimeLimitAction() {
            return this.jobStateTimeLimitAction;
        }

        @Override
        public final java.lang.String getSchedulingPolicyArn() {
            return this.schedulingPolicyArn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.batch_job_queue.BatchJobQueueTimeouts getTimeouts() {
            return this.timeouts;
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
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("state", om.valueToTree(this.getState()));
            if (this.getComputeEnvironmentOrder() != null) {
                data.set("computeEnvironmentOrder", om.valueToTree(this.getComputeEnvironmentOrder()));
            }
            if (this.getComputeEnvironments() != null) {
                data.set("computeEnvironments", om.valueToTree(this.getComputeEnvironments()));
            }
            if (this.getJobStateTimeLimitAction() != null) {
                data.set("jobStateTimeLimitAction", om.valueToTree(this.getJobStateTimeLimitAction()));
            }
            if (this.getSchedulingPolicyArn() != null) {
                data.set("schedulingPolicyArn", om.valueToTree(this.getSchedulingPolicyArn()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.batchJobQueue.BatchJobQueueConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobQueueConfig.Jsii$Proxy that = (BatchJobQueueConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!priority.equals(that.priority)) return false;
            if (!state.equals(that.state)) return false;
            if (this.computeEnvironmentOrder != null ? !this.computeEnvironmentOrder.equals(that.computeEnvironmentOrder) : that.computeEnvironmentOrder != null) return false;
            if (this.computeEnvironments != null ? !this.computeEnvironments.equals(that.computeEnvironments) : that.computeEnvironments != null) return false;
            if (this.jobStateTimeLimitAction != null ? !this.jobStateTimeLimitAction.equals(that.jobStateTimeLimitAction) : that.jobStateTimeLimitAction != null) return false;
            if (this.schedulingPolicyArn != null ? !this.schedulingPolicyArn.equals(that.schedulingPolicyArn) : that.schedulingPolicyArn != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.state.hashCode());
            result = 31 * result + (this.computeEnvironmentOrder != null ? this.computeEnvironmentOrder.hashCode() : 0);
            result = 31 * result + (this.computeEnvironments != null ? this.computeEnvironments.hashCode() : 0);
            result = 31 * result + (this.jobStateTimeLimitAction != null ? this.jobStateTimeLimitAction.hashCode() : 0);
            result = 31 * result + (this.schedulingPolicyArn != null ? this.schedulingPolicyArn.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
