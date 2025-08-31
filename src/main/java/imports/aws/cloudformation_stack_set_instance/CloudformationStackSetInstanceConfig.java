package imports.aws.cloudformation_stack_set_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.226Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSetInstance.CloudformationStackSetInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackSetInstanceConfig.Jsii$Proxy.class)
public interface CloudformationStackSetInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#stack_set_name CloudformationStackSetInstance#stack_set_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStackSetName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#account_id CloudformationStackSetInstance#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#call_as CloudformationStackSetInstance#call_as}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCallAs() {
        return null;
    }

    /**
     * deployment_targets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#deployment_targets CloudformationStackSetInstance#deployment_targets}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets getDeploymentTargets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#id CloudformationStackSetInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * operation_preferences block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#operation_preferences CloudformationStackSetInstance#operation_preferences}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences getOperationPreferences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#parameter_overrides CloudformationStackSetInstance#parameter_overrides}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameterOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#region CloudformationStackSetInstance#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRetainStack() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#timeouts CloudformationStackSetInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackSetInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackSetInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackSetInstanceConfig> {
        java.lang.String stackSetName;
        java.lang.String accountId;
        java.lang.String callAs;
        imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets deploymentTargets;
        java.lang.String id;
        imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences operationPreferences;
        java.util.Map<java.lang.String, java.lang.String> parameterOverrides;
        java.lang.String region;
        java.lang.Object retainStack;
        imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getStackSetName}
         * @param stackSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#stack_set_name CloudformationStackSetInstance#stack_set_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder stackSetName(java.lang.String stackSetName) {
            this.stackSetName = stackSetName;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#account_id CloudformationStackSetInstance#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getCallAs}
         * @param callAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#call_as CloudformationStackSetInstance#call_as}.
         * @return {@code this}
         */
        public Builder callAs(java.lang.String callAs) {
            this.callAs = callAs;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getDeploymentTargets}
         * @param deploymentTargets deployment_targets block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#deployment_targets CloudformationStackSetInstance#deployment_targets}
         * @return {@code this}
         */
        public Builder deploymentTargets(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets deploymentTargets) {
            this.deploymentTargets = deploymentTargets;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#id CloudformationStackSetInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getOperationPreferences}
         * @param operationPreferences operation_preferences block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#operation_preferences CloudformationStackSetInstance#operation_preferences}
         * @return {@code this}
         */
        public Builder operationPreferences(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences operationPreferences) {
            this.operationPreferences = operationPreferences;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getParameterOverrides}
         * @param parameterOverrides Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#parameter_overrides CloudformationStackSetInstance#parameter_overrides}.
         * @return {@code this}
         */
        public Builder parameterOverrides(java.util.Map<java.lang.String, java.lang.String> parameterOverrides) {
            this.parameterOverrides = parameterOverrides;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#region CloudformationStackSetInstance#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getRetainStack}
         * @param retainStack Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}.
         * @return {@code this}
         */
        public Builder retainStack(java.lang.Boolean retainStack) {
            this.retainStack = retainStack;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getRetainStack}
         * @param retainStack Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#retain_stack CloudformationStackSetInstance#retain_stack}.
         * @return {@code this}
         */
        public Builder retainStack(com.hashicorp.cdktf.IResolvable retainStack) {
            this.retainStack = retainStack;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set_instance#timeouts CloudformationStackSetInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getDependsOn}
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
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link CloudformationStackSetInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackSetInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackSetInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackSetInstanceConfig {
        private final java.lang.String stackSetName;
        private final java.lang.String accountId;
        private final java.lang.String callAs;
        private final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets deploymentTargets;
        private final java.lang.String id;
        private final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences operationPreferences;
        private final java.util.Map<java.lang.String, java.lang.String> parameterOverrides;
        private final java.lang.String region;
        private final java.lang.Object retainStack;
        private final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts timeouts;
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
            this.stackSetName = software.amazon.jsii.Kernel.get(this, "stackSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.callAs = software.amazon.jsii.Kernel.get(this, "callAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentTargets = software.amazon.jsii.Kernel.get(this, "deploymentTargets", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operationPreferences = software.amazon.jsii.Kernel.get(this, "operationPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences.class));
            this.parameterOverrides = software.amazon.jsii.Kernel.get(this, "parameterOverrides", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retainStack = software.amazon.jsii.Kernel.get(this, "retainStack", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts.class));
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
            this.stackSetName = java.util.Objects.requireNonNull(builder.stackSetName, "stackSetName is required");
            this.accountId = builder.accountId;
            this.callAs = builder.callAs;
            this.deploymentTargets = builder.deploymentTargets;
            this.id = builder.id;
            this.operationPreferences = builder.operationPreferences;
            this.parameterOverrides = builder.parameterOverrides;
            this.region = builder.region;
            this.retainStack = builder.retainStack;
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
        public final java.lang.String getStackSetName() {
            return this.stackSetName;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.String getCallAs() {
            return this.callAs;
        }

        @Override
        public final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceDeploymentTargets getDeploymentTargets() {
            return this.deploymentTargets;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceOperationPreferences getOperationPreferences() {
            return this.operationPreferences;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameterOverrides() {
            return this.parameterOverrides;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.Object getRetainStack() {
            return this.retainStack;
        }

        @Override
        public final imports.aws.cloudformation_stack_set_instance.CloudformationStackSetInstanceTimeouts getTimeouts() {
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

            data.set("stackSetName", om.valueToTree(this.getStackSetName()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getCallAs() != null) {
                data.set("callAs", om.valueToTree(this.getCallAs()));
            }
            if (this.getDeploymentTargets() != null) {
                data.set("deploymentTargets", om.valueToTree(this.getDeploymentTargets()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOperationPreferences() != null) {
                data.set("operationPreferences", om.valueToTree(this.getOperationPreferences()));
            }
            if (this.getParameterOverrides() != null) {
                data.set("parameterOverrides", om.valueToTree(this.getParameterOverrides()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getRetainStack() != null) {
                data.set("retainStack", om.valueToTree(this.getRetainStack()));
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
            struct.set("fqn", om.valueToTree("aws.cloudformationStackSetInstance.CloudformationStackSetInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackSetInstanceConfig.Jsii$Proxy that = (CloudformationStackSetInstanceConfig.Jsii$Proxy) o;

            if (!stackSetName.equals(that.stackSetName)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.callAs != null ? !this.callAs.equals(that.callAs) : that.callAs != null) return false;
            if (this.deploymentTargets != null ? !this.deploymentTargets.equals(that.deploymentTargets) : that.deploymentTargets != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.operationPreferences != null ? !this.operationPreferences.equals(that.operationPreferences) : that.operationPreferences != null) return false;
            if (this.parameterOverrides != null ? !this.parameterOverrides.equals(that.parameterOverrides) : that.parameterOverrides != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.retainStack != null ? !this.retainStack.equals(that.retainStack) : that.retainStack != null) return false;
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
            int result = this.stackSetName.hashCode();
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.callAs != null ? this.callAs.hashCode() : 0);
            result = 31 * result + (this.deploymentTargets != null ? this.deploymentTargets.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.operationPreferences != null ? this.operationPreferences.hashCode() : 0);
            result = 31 * result + (this.parameterOverrides != null ? this.parameterOverrides.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.retainStack != null ? this.retainStack.hashCode() : 0);
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
