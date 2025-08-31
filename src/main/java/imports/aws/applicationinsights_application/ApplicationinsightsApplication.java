package imports.aws.applicationinsights_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application aws_applicationinsights_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.018Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.applicationinsightsApplication.ApplicationinsightsApplication")
public class ApplicationinsightsApplication extends com.hashicorp.cdktf.TerraformResource {

    protected ApplicationinsightsApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApplicationinsightsApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.applicationinsights_application.ApplicationinsightsApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application aws_applicationinsights_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApplicationinsightsApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.applicationinsights_application.ApplicationinsightsApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApplicationinsightsApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApplicationinsightsApplication to import. This parameter is required.
     * @param importFromId The id of the existing ApplicationinsightsApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApplicationinsightsApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.applicationinsights_application.ApplicationinsightsApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApplicationinsightsApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApplicationinsightsApplication to import. This parameter is required.
     * @param importFromId The id of the existing ApplicationinsightsApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.applicationinsights_application.ApplicationinsightsApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAutoConfigEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutoConfigEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoCreate() {
        software.amazon.jsii.Kernel.call(this, "resetAutoCreate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCweMonitorEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCweMonitorEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupingType() {
        software.amazon.jsii.Kernel.call(this, "resetGroupingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpsCenterEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetOpsCenterEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpsItemSnsTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetOpsItemSnsTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoConfigEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "autoConfigEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoCreateInput() {
        return software.amazon.jsii.Kernel.get(this, "autoCreateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCweMonitorEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cweMonitorEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "groupingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOpsCenterEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "opsCenterEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOpsItemSnsTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "opsItemSnsTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoConfigEnabled() {
        return software.amazon.jsii.Kernel.get(this, "autoConfigEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoConfigEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoConfigEnabled", java.util.Objects.requireNonNull(value, "autoConfigEnabled is required"));
    }

    public void setAutoConfigEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoConfigEnabled", java.util.Objects.requireNonNull(value, "autoConfigEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoCreate() {
        return software.amazon.jsii.Kernel.get(this, "autoCreate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoCreate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoCreate", java.util.Objects.requireNonNull(value, "autoCreate is required"));
    }

    public void setAutoCreate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoCreate", java.util.Objects.requireNonNull(value, "autoCreate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCweMonitorEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cweMonitorEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCweMonitorEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cweMonitorEnabled", java.util.Objects.requireNonNull(value, "cweMonitorEnabled is required"));
    }

    public void setCweMonitorEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cweMonitorEnabled", java.util.Objects.requireNonNull(value, "cweMonitorEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupingType() {
        return software.amazon.jsii.Kernel.get(this, "groupingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupingType", java.util.Objects.requireNonNull(value, "groupingType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOpsCenterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "opsCenterEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOpsCenterEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "opsCenterEnabled", java.util.Objects.requireNonNull(value, "opsCenterEnabled is required"));
    }

    public void setOpsCenterEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "opsCenterEnabled", java.util.Objects.requireNonNull(value, "opsCenterEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOpsItemSnsTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "opsItemSnsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOpsItemSnsTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "opsItemSnsTopicArn", java.util.Objects.requireNonNull(value, "opsItemSnsTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceGroupName() {
        return software.amazon.jsii.Kernel.get(this, "resourceGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceGroupName", java.util.Objects.requireNonNull(value, "resourceGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.applicationinsights_application.ApplicationinsightsApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.applicationinsights_application.ApplicationinsightsApplication> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.applicationinsights_application.ApplicationinsightsApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.applicationinsights_application.ApplicationinsightsApplicationConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#resource_group_name ApplicationinsightsApplication#resource_group_name}.
         * <p>
         * @return {@code this}
         * @param resourceGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#resource_group_name ApplicationinsightsApplication#resource_group_name}. This parameter is required.
         */
        public Builder resourceGroupName(final java.lang.String resourceGroupName) {
            this.config.resourceGroupName(resourceGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_config_enabled ApplicationinsightsApplication#auto_config_enabled}.
         * <p>
         * @return {@code this}
         * @param autoConfigEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_config_enabled ApplicationinsightsApplication#auto_config_enabled}. This parameter is required.
         */
        public Builder autoConfigEnabled(final java.lang.Boolean autoConfigEnabled) {
            this.config.autoConfigEnabled(autoConfigEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_config_enabled ApplicationinsightsApplication#auto_config_enabled}.
         * <p>
         * @return {@code this}
         * @param autoConfigEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_config_enabled ApplicationinsightsApplication#auto_config_enabled}. This parameter is required.
         */
        public Builder autoConfigEnabled(final com.hashicorp.cdktf.IResolvable autoConfigEnabled) {
            this.config.autoConfigEnabled(autoConfigEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_create ApplicationinsightsApplication#auto_create}.
         * <p>
         * @return {@code this}
         * @param autoCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_create ApplicationinsightsApplication#auto_create}. This parameter is required.
         */
        public Builder autoCreate(final java.lang.Boolean autoCreate) {
            this.config.autoCreate(autoCreate);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_create ApplicationinsightsApplication#auto_create}.
         * <p>
         * @return {@code this}
         * @param autoCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#auto_create ApplicationinsightsApplication#auto_create}. This parameter is required.
         */
        public Builder autoCreate(final com.hashicorp.cdktf.IResolvable autoCreate) {
            this.config.autoCreate(autoCreate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#cwe_monitor_enabled ApplicationinsightsApplication#cwe_monitor_enabled}.
         * <p>
         * @return {@code this}
         * @param cweMonitorEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#cwe_monitor_enabled ApplicationinsightsApplication#cwe_monitor_enabled}. This parameter is required.
         */
        public Builder cweMonitorEnabled(final java.lang.Boolean cweMonitorEnabled) {
            this.config.cweMonitorEnabled(cweMonitorEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#cwe_monitor_enabled ApplicationinsightsApplication#cwe_monitor_enabled}.
         * <p>
         * @return {@code this}
         * @param cweMonitorEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#cwe_monitor_enabled ApplicationinsightsApplication#cwe_monitor_enabled}. This parameter is required.
         */
        public Builder cweMonitorEnabled(final com.hashicorp.cdktf.IResolvable cweMonitorEnabled) {
            this.config.cweMonitorEnabled(cweMonitorEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#grouping_type ApplicationinsightsApplication#grouping_type}.
         * <p>
         * @return {@code this}
         * @param groupingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#grouping_type ApplicationinsightsApplication#grouping_type}. This parameter is required.
         */
        public Builder groupingType(final java.lang.String groupingType) {
            this.config.groupingType(groupingType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#id ApplicationinsightsApplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#id ApplicationinsightsApplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_center_enabled ApplicationinsightsApplication#ops_center_enabled}.
         * <p>
         * @return {@code this}
         * @param opsCenterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_center_enabled ApplicationinsightsApplication#ops_center_enabled}. This parameter is required.
         */
        public Builder opsCenterEnabled(final java.lang.Boolean opsCenterEnabled) {
            this.config.opsCenterEnabled(opsCenterEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_center_enabled ApplicationinsightsApplication#ops_center_enabled}.
         * <p>
         * @return {@code this}
         * @param opsCenterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_center_enabled ApplicationinsightsApplication#ops_center_enabled}. This parameter is required.
         */
        public Builder opsCenterEnabled(final com.hashicorp.cdktf.IResolvable opsCenterEnabled) {
            this.config.opsCenterEnabled(opsCenterEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_item_sns_topic_arn ApplicationinsightsApplication#ops_item_sns_topic_arn}.
         * <p>
         * @return {@code this}
         * @param opsItemSnsTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#ops_item_sns_topic_arn ApplicationinsightsApplication#ops_item_sns_topic_arn}. This parameter is required.
         */
        public Builder opsItemSnsTopicArn(final java.lang.String opsItemSnsTopicArn) {
            this.config.opsItemSnsTopicArn(opsItemSnsTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#tags ApplicationinsightsApplication#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#tags ApplicationinsightsApplication#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#tags_all ApplicationinsightsApplication#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/applicationinsights_application#tags_all ApplicationinsightsApplication#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.applicationinsights_application.ApplicationinsightsApplication}.
         */
        @Override
        public imports.aws.applicationinsights_application.ApplicationinsightsApplication build() {
            return new imports.aws.applicationinsights_application.ApplicationinsightsApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
