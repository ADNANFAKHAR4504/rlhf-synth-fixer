package imports.aws.ssm_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.495Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmAssociation.SsmAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(SsmAssociationConfig.Jsii$Proxy.class)
public interface SsmAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#name SsmAssociation#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyOnlyAtCronInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#association_name SsmAssociation#association_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAssociationName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#automation_target_parameter_name SsmAssociation#automation_target_parameter_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutomationTargetParameterName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#compliance_severity SsmAssociation#compliance_severity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComplianceSeverity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#document_version SsmAssociation#document_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#id SsmAssociation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#instance_id SsmAssociation#instance_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_concurrency SsmAssociation#max_concurrency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxConcurrency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_errors SsmAssociation#max_errors}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxErrors() {
        return null;
    }

    /**
     * output_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#output_location SsmAssociation#output_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_association.SsmAssociationOutputLocation getOutputLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#parameters SsmAssociation#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#schedule_expression SsmAssociation#schedule_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#sync_compliance SsmAssociation#sync_compliance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSyncCompliance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags SsmAssociation#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags_all SsmAssociation#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * targets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#targets SsmAssociation#targets}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#wait_for_success_timeout_seconds SsmAssociation#wait_for_success_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWaitForSuccessTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmAssociationConfig> {
        java.lang.String name;
        java.lang.Object applyOnlyAtCronInterval;
        java.lang.String associationName;
        java.lang.String automationTargetParameterName;
        java.lang.String complianceSeverity;
        java.lang.String documentVersion;
        java.lang.String id;
        java.lang.String instanceId;
        java.lang.String maxConcurrency;
        java.lang.String maxErrors;
        imports.aws.ssm_association.SsmAssociationOutputLocation outputLocation;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.lang.String scheduleExpression;
        java.lang.String syncCompliance;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object targets;
        java.lang.Number waitForSuccessTimeoutSeconds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SsmAssociationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#name SsmAssociation#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getApplyOnlyAtCronInterval}
         * @param applyOnlyAtCronInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}.
         * @return {@code this}
         */
        public Builder applyOnlyAtCronInterval(java.lang.Boolean applyOnlyAtCronInterval) {
            this.applyOnlyAtCronInterval = applyOnlyAtCronInterval;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getApplyOnlyAtCronInterval}
         * @param applyOnlyAtCronInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}.
         * @return {@code this}
         */
        public Builder applyOnlyAtCronInterval(com.hashicorp.cdktf.IResolvable applyOnlyAtCronInterval) {
            this.applyOnlyAtCronInterval = applyOnlyAtCronInterval;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getAssociationName}
         * @param associationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#association_name SsmAssociation#association_name}.
         * @return {@code this}
         */
        public Builder associationName(java.lang.String associationName) {
            this.associationName = associationName;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getAutomationTargetParameterName}
         * @param automationTargetParameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#automation_target_parameter_name SsmAssociation#automation_target_parameter_name}.
         * @return {@code this}
         */
        public Builder automationTargetParameterName(java.lang.String automationTargetParameterName) {
            this.automationTargetParameterName = automationTargetParameterName;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getComplianceSeverity}
         * @param complianceSeverity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#compliance_severity SsmAssociation#compliance_severity}.
         * @return {@code this}
         */
        public Builder complianceSeverity(java.lang.String complianceSeverity) {
            this.complianceSeverity = complianceSeverity;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getDocumentVersion}
         * @param documentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#document_version SsmAssociation#document_version}.
         * @return {@code this}
         */
        public Builder documentVersion(java.lang.String documentVersion) {
            this.documentVersion = documentVersion;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#id SsmAssociation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getInstanceId}
         * @param instanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#instance_id SsmAssociation#instance_id}.
         * @return {@code this}
         */
        public Builder instanceId(java.lang.String instanceId) {
            this.instanceId = instanceId;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getMaxConcurrency}
         * @param maxConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_concurrency SsmAssociation#max_concurrency}.
         * @return {@code this}
         */
        public Builder maxConcurrency(java.lang.String maxConcurrency) {
            this.maxConcurrency = maxConcurrency;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getMaxErrors}
         * @param maxErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_errors SsmAssociation#max_errors}.
         * @return {@code this}
         */
        public Builder maxErrors(java.lang.String maxErrors) {
            this.maxErrors = maxErrors;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getOutputLocation}
         * @param outputLocation output_location block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#output_location SsmAssociation#output_location}
         * @return {@code this}
         */
        public Builder outputLocation(imports.aws.ssm_association.SsmAssociationOutputLocation outputLocation) {
            this.outputLocation = outputLocation;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#parameters SsmAssociation#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#schedule_expression SsmAssociation#schedule_expression}.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getSyncCompliance}
         * @param syncCompliance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#sync_compliance SsmAssociation#sync_compliance}.
         * @return {@code this}
         */
        public Builder syncCompliance(java.lang.String syncCompliance) {
            this.syncCompliance = syncCompliance;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags SsmAssociation#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags_all SsmAssociation#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getTargets}
         * @param targets targets block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#targets SsmAssociation#targets}
         * @return {@code this}
         */
        public Builder targets(com.hashicorp.cdktf.IResolvable targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getTargets}
         * @param targets targets block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#targets SsmAssociation#targets}
         * @return {@code this}
         */
        public Builder targets(java.util.List<? extends imports.aws.ssm_association.SsmAssociationTargets> targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getWaitForSuccessTimeoutSeconds}
         * @param waitForSuccessTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#wait_for_success_timeout_seconds SsmAssociation#wait_for_success_timeout_seconds}.
         * @return {@code this}
         */
        public Builder waitForSuccessTimeoutSeconds(java.lang.Number waitForSuccessTimeoutSeconds) {
            this.waitForSuccessTimeoutSeconds = waitForSuccessTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getDependsOn}
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
         * Sets the value of {@link SsmAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link SsmAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmAssociationConfig {
        private final java.lang.String name;
        private final java.lang.Object applyOnlyAtCronInterval;
        private final java.lang.String associationName;
        private final java.lang.String automationTargetParameterName;
        private final java.lang.String complianceSeverity;
        private final java.lang.String documentVersion;
        private final java.lang.String id;
        private final java.lang.String instanceId;
        private final java.lang.String maxConcurrency;
        private final java.lang.String maxErrors;
        private final imports.aws.ssm_association.SsmAssociationOutputLocation outputLocation;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.lang.String scheduleExpression;
        private final java.lang.String syncCompliance;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object targets;
        private final java.lang.Number waitForSuccessTimeoutSeconds;
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
            this.applyOnlyAtCronInterval = software.amazon.jsii.Kernel.get(this, "applyOnlyAtCronInterval", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.associationName = software.amazon.jsii.Kernel.get(this, "associationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automationTargetParameterName = software.amazon.jsii.Kernel.get(this, "automationTargetParameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.complianceSeverity = software.amazon.jsii.Kernel.get(this, "complianceSeverity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentVersion = software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceId = software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxConcurrency = software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxErrors = software.amazon.jsii.Kernel.get(this, "maxErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputLocation = software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_association.SsmAssociationOutputLocation.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.syncCompliance = software.amazon.jsii.Kernel.get(this, "syncCompliance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targets = software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.waitForSuccessTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "waitForSuccessTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.applyOnlyAtCronInterval = builder.applyOnlyAtCronInterval;
            this.associationName = builder.associationName;
            this.automationTargetParameterName = builder.automationTargetParameterName;
            this.complianceSeverity = builder.complianceSeverity;
            this.documentVersion = builder.documentVersion;
            this.id = builder.id;
            this.instanceId = builder.instanceId;
            this.maxConcurrency = builder.maxConcurrency;
            this.maxErrors = builder.maxErrors;
            this.outputLocation = builder.outputLocation;
            this.parameters = builder.parameters;
            this.scheduleExpression = builder.scheduleExpression;
            this.syncCompliance = builder.syncCompliance;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.targets = builder.targets;
            this.waitForSuccessTimeoutSeconds = builder.waitForSuccessTimeoutSeconds;
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
        public final java.lang.Object getApplyOnlyAtCronInterval() {
            return this.applyOnlyAtCronInterval;
        }

        @Override
        public final java.lang.String getAssociationName() {
            return this.associationName;
        }

        @Override
        public final java.lang.String getAutomationTargetParameterName() {
            return this.automationTargetParameterName;
        }

        @Override
        public final java.lang.String getComplianceSeverity() {
            return this.complianceSeverity;
        }

        @Override
        public final java.lang.String getDocumentVersion() {
            return this.documentVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceId() {
            return this.instanceId;
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
        public final imports.aws.ssm_association.SsmAssociationOutputLocation getOutputLocation() {
            return this.outputLocation;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        public final java.lang.String getSyncCompliance() {
            return this.syncCompliance;
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
        public final java.lang.Object getTargets() {
            return this.targets;
        }

        @Override
        public final java.lang.Number getWaitForSuccessTimeoutSeconds() {
            return this.waitForSuccessTimeoutSeconds;
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
            if (this.getApplyOnlyAtCronInterval() != null) {
                data.set("applyOnlyAtCronInterval", om.valueToTree(this.getApplyOnlyAtCronInterval()));
            }
            if (this.getAssociationName() != null) {
                data.set("associationName", om.valueToTree(this.getAssociationName()));
            }
            if (this.getAutomationTargetParameterName() != null) {
                data.set("automationTargetParameterName", om.valueToTree(this.getAutomationTargetParameterName()));
            }
            if (this.getComplianceSeverity() != null) {
                data.set("complianceSeverity", om.valueToTree(this.getComplianceSeverity()));
            }
            if (this.getDocumentVersion() != null) {
                data.set("documentVersion", om.valueToTree(this.getDocumentVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceId() != null) {
                data.set("instanceId", om.valueToTree(this.getInstanceId()));
            }
            if (this.getMaxConcurrency() != null) {
                data.set("maxConcurrency", om.valueToTree(this.getMaxConcurrency()));
            }
            if (this.getMaxErrors() != null) {
                data.set("maxErrors", om.valueToTree(this.getMaxErrors()));
            }
            if (this.getOutputLocation() != null) {
                data.set("outputLocation", om.valueToTree(this.getOutputLocation()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getScheduleExpression() != null) {
                data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));
            }
            if (this.getSyncCompliance() != null) {
                data.set("syncCompliance", om.valueToTree(this.getSyncCompliance()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTargets() != null) {
                data.set("targets", om.valueToTree(this.getTargets()));
            }
            if (this.getWaitForSuccessTimeoutSeconds() != null) {
                data.set("waitForSuccessTimeoutSeconds", om.valueToTree(this.getWaitForSuccessTimeoutSeconds()));
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
            struct.set("fqn", om.valueToTree("aws.ssmAssociation.SsmAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmAssociationConfig.Jsii$Proxy that = (SsmAssociationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.applyOnlyAtCronInterval != null ? !this.applyOnlyAtCronInterval.equals(that.applyOnlyAtCronInterval) : that.applyOnlyAtCronInterval != null) return false;
            if (this.associationName != null ? !this.associationName.equals(that.associationName) : that.associationName != null) return false;
            if (this.automationTargetParameterName != null ? !this.automationTargetParameterName.equals(that.automationTargetParameterName) : that.automationTargetParameterName != null) return false;
            if (this.complianceSeverity != null ? !this.complianceSeverity.equals(that.complianceSeverity) : that.complianceSeverity != null) return false;
            if (this.documentVersion != null ? !this.documentVersion.equals(that.documentVersion) : that.documentVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceId != null ? !this.instanceId.equals(that.instanceId) : that.instanceId != null) return false;
            if (this.maxConcurrency != null ? !this.maxConcurrency.equals(that.maxConcurrency) : that.maxConcurrency != null) return false;
            if (this.maxErrors != null ? !this.maxErrors.equals(that.maxErrors) : that.maxErrors != null) return false;
            if (this.outputLocation != null ? !this.outputLocation.equals(that.outputLocation) : that.outputLocation != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.scheduleExpression != null ? !this.scheduleExpression.equals(that.scheduleExpression) : that.scheduleExpression != null) return false;
            if (this.syncCompliance != null ? !this.syncCompliance.equals(that.syncCompliance) : that.syncCompliance != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.targets != null ? !this.targets.equals(that.targets) : that.targets != null) return false;
            if (this.waitForSuccessTimeoutSeconds != null ? !this.waitForSuccessTimeoutSeconds.equals(that.waitForSuccessTimeoutSeconds) : that.waitForSuccessTimeoutSeconds != null) return false;
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
            result = 31 * result + (this.applyOnlyAtCronInterval != null ? this.applyOnlyAtCronInterval.hashCode() : 0);
            result = 31 * result + (this.associationName != null ? this.associationName.hashCode() : 0);
            result = 31 * result + (this.automationTargetParameterName != null ? this.automationTargetParameterName.hashCode() : 0);
            result = 31 * result + (this.complianceSeverity != null ? this.complianceSeverity.hashCode() : 0);
            result = 31 * result + (this.documentVersion != null ? this.documentVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceId != null ? this.instanceId.hashCode() : 0);
            result = 31 * result + (this.maxConcurrency != null ? this.maxConcurrency.hashCode() : 0);
            result = 31 * result + (this.maxErrors != null ? this.maxErrors.hashCode() : 0);
            result = 31 * result + (this.outputLocation != null ? this.outputLocation.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.scheduleExpression != null ? this.scheduleExpression.hashCode() : 0);
            result = 31 * result + (this.syncCompliance != null ? this.syncCompliance.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.targets != null ? this.targets.hashCode() : 0);
            result = 31 * result + (this.waitForSuccessTimeoutSeconds != null ? this.waitForSuccessTimeoutSeconds.hashCode() : 0);
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
