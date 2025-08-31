package imports.aws.cloudformation_stack_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.220Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSetConfig")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackSetConfig.Jsii$Proxy.class)
public interface CloudformationStackSetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#name CloudformationStackSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#administration_role_arn CloudformationStackSet#administration_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdministrationRoleArn() {
        return null;
    }

    /**
     * auto_deployment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#auto_deployment CloudformationStackSet#auto_deployment}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment getAutoDeployment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#call_as CloudformationStackSet#call_as}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCallAs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#capabilities CloudformationStackSet#capabilities}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapabilities() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#description CloudformationStackSet#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#execution_role_name CloudformationStackSet#execution_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#id CloudformationStackSet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * managed_execution block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#managed_execution CloudformationStackSet#managed_execution}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution getManagedExecution() {
        return null;
    }

    /**
     * operation_preferences block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#operation_preferences CloudformationStackSet#operation_preferences}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences getOperationPreferences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#parameters CloudformationStackSet#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#permission_model CloudformationStackSet#permission_model}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPermissionModel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags CloudformationStackSet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags_all CloudformationStackSet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_body CloudformationStackSet#template_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_url CloudformationStackSet#template_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateUrl() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#timeouts CloudformationStackSet#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackSetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackSetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackSetConfig> {
        java.lang.String name;
        java.lang.String administrationRoleArn;
        imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment autoDeployment;
        java.lang.String callAs;
        java.util.List<java.lang.String> capabilities;
        java.lang.String description;
        java.lang.String executionRoleName;
        java.lang.String id;
        imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution managedExecution;
        imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences operationPreferences;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.lang.String permissionModel;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String templateBody;
        java.lang.String templateUrl;
        imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#name CloudformationStackSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getAdministrationRoleArn}
         * @param administrationRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#administration_role_arn CloudformationStackSet#administration_role_arn}.
         * @return {@code this}
         */
        public Builder administrationRoleArn(java.lang.String administrationRoleArn) {
            this.administrationRoleArn = administrationRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getAutoDeployment}
         * @param autoDeployment auto_deployment block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#auto_deployment CloudformationStackSet#auto_deployment}
         * @return {@code this}
         */
        public Builder autoDeployment(imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment autoDeployment) {
            this.autoDeployment = autoDeployment;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getCallAs}
         * @param callAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#call_as CloudformationStackSet#call_as}.
         * @return {@code this}
         */
        public Builder callAs(java.lang.String callAs) {
            this.callAs = callAs;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getCapabilities}
         * @param capabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#capabilities CloudformationStackSet#capabilities}.
         * @return {@code this}
         */
        public Builder capabilities(java.util.List<java.lang.String> capabilities) {
            this.capabilities = capabilities;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#description CloudformationStackSet#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getExecutionRoleName}
         * @param executionRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#execution_role_name CloudformationStackSet#execution_role_name}.
         * @return {@code this}
         */
        public Builder executionRoleName(java.lang.String executionRoleName) {
            this.executionRoleName = executionRoleName;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#id CloudformationStackSet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getManagedExecution}
         * @param managedExecution managed_execution block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#managed_execution CloudformationStackSet#managed_execution}
         * @return {@code this}
         */
        public Builder managedExecution(imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution managedExecution) {
            this.managedExecution = managedExecution;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getOperationPreferences}
         * @param operationPreferences operation_preferences block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#operation_preferences CloudformationStackSet#operation_preferences}
         * @return {@code this}
         */
        public Builder operationPreferences(imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences operationPreferences) {
            this.operationPreferences = operationPreferences;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#parameters CloudformationStackSet#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getPermissionModel}
         * @param permissionModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#permission_model CloudformationStackSet#permission_model}.
         * @return {@code this}
         */
        public Builder permissionModel(java.lang.String permissionModel) {
            this.permissionModel = permissionModel;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags CloudformationStackSet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags_all CloudformationStackSet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getTemplateBody}
         * @param templateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_body CloudformationStackSet#template_body}.
         * @return {@code this}
         */
        public Builder templateBody(java.lang.String templateBody) {
            this.templateBody = templateBody;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getTemplateUrl}
         * @param templateUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_url CloudformationStackSet#template_url}.
         * @return {@code this}
         */
        public Builder templateUrl(java.lang.String templateUrl) {
            this.templateUrl = templateUrl;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#timeouts CloudformationStackSet#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getDependsOn}
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
         * Sets the value of {@link CloudformationStackSetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetConfig#getProvisioners}
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
         * @return a new instance of {@link CloudformationStackSetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackSetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackSetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackSetConfig {
        private final java.lang.String name;
        private final java.lang.String administrationRoleArn;
        private final imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment autoDeployment;
        private final java.lang.String callAs;
        private final java.util.List<java.lang.String> capabilities;
        private final java.lang.String description;
        private final java.lang.String executionRoleName;
        private final java.lang.String id;
        private final imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution managedExecution;
        private final imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences operationPreferences;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.lang.String permissionModel;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String templateBody;
        private final java.lang.String templateUrl;
        private final imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts timeouts;
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
            this.administrationRoleArn = software.amazon.jsii.Kernel.get(this, "administrationRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoDeployment = software.amazon.jsii.Kernel.get(this, "autoDeployment", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment.class));
            this.callAs = software.amazon.jsii.Kernel.get(this, "callAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capabilities = software.amazon.jsii.Kernel.get(this, "capabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionRoleName = software.amazon.jsii.Kernel.get(this, "executionRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.managedExecution = software.amazon.jsii.Kernel.get(this, "managedExecution", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution.class));
            this.operationPreferences = software.amazon.jsii.Kernel.get(this, "operationPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.permissionModel = software.amazon.jsii.Kernel.get(this, "permissionModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.templateBody = software.amazon.jsii.Kernel.get(this, "templateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateUrl = software.amazon.jsii.Kernel.get(this, "templateUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts.class));
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
            this.administrationRoleArn = builder.administrationRoleArn;
            this.autoDeployment = builder.autoDeployment;
            this.callAs = builder.callAs;
            this.capabilities = builder.capabilities;
            this.description = builder.description;
            this.executionRoleName = builder.executionRoleName;
            this.id = builder.id;
            this.managedExecution = builder.managedExecution;
            this.operationPreferences = builder.operationPreferences;
            this.parameters = builder.parameters;
            this.permissionModel = builder.permissionModel;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.templateBody = builder.templateBody;
            this.templateUrl = builder.templateUrl;
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
        public final java.lang.String getAdministrationRoleArn() {
            return this.administrationRoleArn;
        }

        @Override
        public final imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment getAutoDeployment() {
            return this.autoDeployment;
        }

        @Override
        public final java.lang.String getCallAs() {
            return this.callAs;
        }

        @Override
        public final java.util.List<java.lang.String> getCapabilities() {
            return this.capabilities;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getExecutionRoleName() {
            return this.executionRoleName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution getManagedExecution() {
            return this.managedExecution;
        }

        @Override
        public final imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences getOperationPreferences() {
            return this.operationPreferences;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getPermissionModel() {
            return this.permissionModel;
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
        public final java.lang.String getTemplateBody() {
            return this.templateBody;
        }

        @Override
        public final java.lang.String getTemplateUrl() {
            return this.templateUrl;
        }

        @Override
        public final imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts getTimeouts() {
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
            if (this.getAdministrationRoleArn() != null) {
                data.set("administrationRoleArn", om.valueToTree(this.getAdministrationRoleArn()));
            }
            if (this.getAutoDeployment() != null) {
                data.set("autoDeployment", om.valueToTree(this.getAutoDeployment()));
            }
            if (this.getCallAs() != null) {
                data.set("callAs", om.valueToTree(this.getCallAs()));
            }
            if (this.getCapabilities() != null) {
                data.set("capabilities", om.valueToTree(this.getCapabilities()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExecutionRoleName() != null) {
                data.set("executionRoleName", om.valueToTree(this.getExecutionRoleName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getManagedExecution() != null) {
                data.set("managedExecution", om.valueToTree(this.getManagedExecution()));
            }
            if (this.getOperationPreferences() != null) {
                data.set("operationPreferences", om.valueToTree(this.getOperationPreferences()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPermissionModel() != null) {
                data.set("permissionModel", om.valueToTree(this.getPermissionModel()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTemplateBody() != null) {
                data.set("templateBody", om.valueToTree(this.getTemplateBody()));
            }
            if (this.getTemplateUrl() != null) {
                data.set("templateUrl", om.valueToTree(this.getTemplateUrl()));
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
            struct.set("fqn", om.valueToTree("aws.cloudformationStackSet.CloudformationStackSetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackSetConfig.Jsii$Proxy that = (CloudformationStackSetConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.administrationRoleArn != null ? !this.administrationRoleArn.equals(that.administrationRoleArn) : that.administrationRoleArn != null) return false;
            if (this.autoDeployment != null ? !this.autoDeployment.equals(that.autoDeployment) : that.autoDeployment != null) return false;
            if (this.callAs != null ? !this.callAs.equals(that.callAs) : that.callAs != null) return false;
            if (this.capabilities != null ? !this.capabilities.equals(that.capabilities) : that.capabilities != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.executionRoleName != null ? !this.executionRoleName.equals(that.executionRoleName) : that.executionRoleName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.managedExecution != null ? !this.managedExecution.equals(that.managedExecution) : that.managedExecution != null) return false;
            if (this.operationPreferences != null ? !this.operationPreferences.equals(that.operationPreferences) : that.operationPreferences != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.permissionModel != null ? !this.permissionModel.equals(that.permissionModel) : that.permissionModel != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.templateBody != null ? !this.templateBody.equals(that.templateBody) : that.templateBody != null) return false;
            if (this.templateUrl != null ? !this.templateUrl.equals(that.templateUrl) : that.templateUrl != null) return false;
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
            result = 31 * result + (this.administrationRoleArn != null ? this.administrationRoleArn.hashCode() : 0);
            result = 31 * result + (this.autoDeployment != null ? this.autoDeployment.hashCode() : 0);
            result = 31 * result + (this.callAs != null ? this.callAs.hashCode() : 0);
            result = 31 * result + (this.capabilities != null ? this.capabilities.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.executionRoleName != null ? this.executionRoleName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.managedExecution != null ? this.managedExecution.hashCode() : 0);
            result = 31 * result + (this.operationPreferences != null ? this.operationPreferences.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.permissionModel != null ? this.permissionModel.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.templateBody != null ? this.templateBody.hashCode() : 0);
            result = 31 * result + (this.templateUrl != null ? this.templateUrl.hashCode() : 0);
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
