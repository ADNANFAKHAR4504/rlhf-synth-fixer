package imports.aws.data_aws_rds_engine_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.816Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRdsEngineVersion.DataAwsRdsEngineVersionConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRdsEngineVersionConfig.Jsii$Proxy.class)
public interface DataAwsRdsEngineVersionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#engine DataAwsRdsEngineVersion#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultOnly() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#filter DataAwsRdsEngineVersion#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHasMajorTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHasMinorTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#id DataAwsRdsEngineVersion#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLatest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#parameter_group_family DataAwsRdsEngineVersion#parameter_group_family}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupFamily() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_major_targets DataAwsRdsEngineVersion#preferred_major_targets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredMajorTargets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_upgrade_targets DataAwsRdsEngineVersion#preferred_upgrade_targets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredUpgradeTargets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_versions DataAwsRdsEngineVersion#preferred_versions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredVersions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#version DataAwsRdsEngineVersion#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRdsEngineVersionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRdsEngineVersionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRdsEngineVersionConfig> {
        java.lang.String engine;
        java.lang.Object defaultOnly;
        java.lang.Object filter;
        java.lang.Object hasMajorTarget;
        java.lang.Object hasMinorTarget;
        java.lang.String id;
        java.lang.Object includeAll;
        java.lang.Object latest;
        java.lang.String parameterGroupFamily;
        java.util.List<java.lang.String> preferredMajorTargets;
        java.util.List<java.lang.String> preferredUpgradeTargets;
        java.util.List<java.lang.String> preferredVersions;
        java.lang.String version;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#engine DataAwsRdsEngineVersion#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getDefaultOnly}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}.
         * @return {@code this}
         */
        public Builder defaultOnly(java.lang.Boolean defaultOnly) {
            this.defaultOnly = defaultOnly;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getDefaultOnly}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}.
         * @return {@code this}
         */
        public Builder defaultOnly(com.hashicorp.cdktf.IResolvable defaultOnly) {
            this.defaultOnly = defaultOnly;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#filter DataAwsRdsEngineVersion#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#filter DataAwsRdsEngineVersion#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getHasMajorTarget}
         * @param hasMajorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}.
         * @return {@code this}
         */
        public Builder hasMajorTarget(java.lang.Boolean hasMajorTarget) {
            this.hasMajorTarget = hasMajorTarget;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getHasMajorTarget}
         * @param hasMajorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}.
         * @return {@code this}
         */
        public Builder hasMajorTarget(com.hashicorp.cdktf.IResolvable hasMajorTarget) {
            this.hasMajorTarget = hasMajorTarget;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getHasMinorTarget}
         * @param hasMinorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}.
         * @return {@code this}
         */
        public Builder hasMinorTarget(java.lang.Boolean hasMinorTarget) {
            this.hasMinorTarget = hasMinorTarget;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getHasMinorTarget}
         * @param hasMinorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}.
         * @return {@code this}
         */
        public Builder hasMinorTarget(com.hashicorp.cdktf.IResolvable hasMinorTarget) {
            this.hasMinorTarget = hasMinorTarget;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#id DataAwsRdsEngineVersion#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getIncludeAll}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}.
         * @return {@code this}
         */
        public Builder includeAll(java.lang.Boolean includeAll) {
            this.includeAll = includeAll;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getIncludeAll}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}.
         * @return {@code this}
         */
        public Builder includeAll(com.hashicorp.cdktf.IResolvable includeAll) {
            this.includeAll = includeAll;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getLatest}
         * @param latest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}.
         * @return {@code this}
         */
        public Builder latest(java.lang.Boolean latest) {
            this.latest = latest;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getLatest}
         * @param latest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}.
         * @return {@code this}
         */
        public Builder latest(com.hashicorp.cdktf.IResolvable latest) {
            this.latest = latest;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getParameterGroupFamily}
         * @param parameterGroupFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#parameter_group_family DataAwsRdsEngineVersion#parameter_group_family}.
         * @return {@code this}
         */
        public Builder parameterGroupFamily(java.lang.String parameterGroupFamily) {
            this.parameterGroupFamily = parameterGroupFamily;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getPreferredMajorTargets}
         * @param preferredMajorTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_major_targets DataAwsRdsEngineVersion#preferred_major_targets}.
         * @return {@code this}
         */
        public Builder preferredMajorTargets(java.util.List<java.lang.String> preferredMajorTargets) {
            this.preferredMajorTargets = preferredMajorTargets;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getPreferredUpgradeTargets}
         * @param preferredUpgradeTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_upgrade_targets DataAwsRdsEngineVersion#preferred_upgrade_targets}.
         * @return {@code this}
         */
        public Builder preferredUpgradeTargets(java.util.List<java.lang.String> preferredUpgradeTargets) {
            this.preferredUpgradeTargets = preferredUpgradeTargets;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getPreferredVersions}
         * @param preferredVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_versions DataAwsRdsEngineVersion#preferred_versions}.
         * @return {@code this}
         */
        public Builder preferredVersions(java.util.List<java.lang.String> preferredVersions) {
            this.preferredVersions = preferredVersions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#version DataAwsRdsEngineVersion#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsEngineVersionConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRdsEngineVersionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRdsEngineVersionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRdsEngineVersionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRdsEngineVersionConfig {
        private final java.lang.String engine;
        private final java.lang.Object defaultOnly;
        private final java.lang.Object filter;
        private final java.lang.Object hasMajorTarget;
        private final java.lang.Object hasMinorTarget;
        private final java.lang.String id;
        private final java.lang.Object includeAll;
        private final java.lang.Object latest;
        private final java.lang.String parameterGroupFamily;
        private final java.util.List<java.lang.String> preferredMajorTargets;
        private final java.util.List<java.lang.String> preferredUpgradeTargets;
        private final java.util.List<java.lang.String> preferredVersions;
        private final java.lang.String version;
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
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultOnly = software.amazon.jsii.Kernel.get(this, "defaultOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hasMajorTarget = software.amazon.jsii.Kernel.get(this, "hasMajorTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hasMinorTarget = software.amazon.jsii.Kernel.get(this, "hasMinorTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeAll = software.amazon.jsii.Kernel.get(this, "includeAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.latest = software.amazon.jsii.Kernel.get(this, "latest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parameterGroupFamily = software.amazon.jsii.Kernel.get(this, "parameterGroupFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredMajorTargets = software.amazon.jsii.Kernel.get(this, "preferredMajorTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.preferredUpgradeTargets = software.amazon.jsii.Kernel.get(this, "preferredUpgradeTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.preferredVersions = software.amazon.jsii.Kernel.get(this, "preferredVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.defaultOnly = builder.defaultOnly;
            this.filter = builder.filter;
            this.hasMajorTarget = builder.hasMajorTarget;
            this.hasMinorTarget = builder.hasMinorTarget;
            this.id = builder.id;
            this.includeAll = builder.includeAll;
            this.latest = builder.latest;
            this.parameterGroupFamily = builder.parameterGroupFamily;
            this.preferredMajorTargets = builder.preferredMajorTargets;
            this.preferredUpgradeTargets = builder.preferredUpgradeTargets;
            this.preferredVersions = builder.preferredVersions;
            this.version = builder.version;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.Object getDefaultOnly() {
            return this.defaultOnly;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.Object getHasMajorTarget() {
            return this.hasMajorTarget;
        }

        @Override
        public final java.lang.Object getHasMinorTarget() {
            return this.hasMinorTarget;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeAll() {
            return this.includeAll;
        }

        @Override
        public final java.lang.Object getLatest() {
            return this.latest;
        }

        @Override
        public final java.lang.String getParameterGroupFamily() {
            return this.parameterGroupFamily;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredMajorTargets() {
            return this.preferredMajorTargets;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredUpgradeTargets() {
            return this.preferredUpgradeTargets;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredVersions() {
            return this.preferredVersions;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
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

            data.set("engine", om.valueToTree(this.getEngine()));
            if (this.getDefaultOnly() != null) {
                data.set("defaultOnly", om.valueToTree(this.getDefaultOnly()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getHasMajorTarget() != null) {
                data.set("hasMajorTarget", om.valueToTree(this.getHasMajorTarget()));
            }
            if (this.getHasMinorTarget() != null) {
                data.set("hasMinorTarget", om.valueToTree(this.getHasMinorTarget()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeAll() != null) {
                data.set("includeAll", om.valueToTree(this.getIncludeAll()));
            }
            if (this.getLatest() != null) {
                data.set("latest", om.valueToTree(this.getLatest()));
            }
            if (this.getParameterGroupFamily() != null) {
                data.set("parameterGroupFamily", om.valueToTree(this.getParameterGroupFamily()));
            }
            if (this.getPreferredMajorTargets() != null) {
                data.set("preferredMajorTargets", om.valueToTree(this.getPreferredMajorTargets()));
            }
            if (this.getPreferredUpgradeTargets() != null) {
                data.set("preferredUpgradeTargets", om.valueToTree(this.getPreferredUpgradeTargets()));
            }
            if (this.getPreferredVersions() != null) {
                data.set("preferredVersions", om.valueToTree(this.getPreferredVersions()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRdsEngineVersion.DataAwsRdsEngineVersionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRdsEngineVersionConfig.Jsii$Proxy that = (DataAwsRdsEngineVersionConfig.Jsii$Proxy) o;

            if (!engine.equals(that.engine)) return false;
            if (this.defaultOnly != null ? !this.defaultOnly.equals(that.defaultOnly) : that.defaultOnly != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.hasMajorTarget != null ? !this.hasMajorTarget.equals(that.hasMajorTarget) : that.hasMajorTarget != null) return false;
            if (this.hasMinorTarget != null ? !this.hasMinorTarget.equals(that.hasMinorTarget) : that.hasMinorTarget != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeAll != null ? !this.includeAll.equals(that.includeAll) : that.includeAll != null) return false;
            if (this.latest != null ? !this.latest.equals(that.latest) : that.latest != null) return false;
            if (this.parameterGroupFamily != null ? !this.parameterGroupFamily.equals(that.parameterGroupFamily) : that.parameterGroupFamily != null) return false;
            if (this.preferredMajorTargets != null ? !this.preferredMajorTargets.equals(that.preferredMajorTargets) : that.preferredMajorTargets != null) return false;
            if (this.preferredUpgradeTargets != null ? !this.preferredUpgradeTargets.equals(that.preferredUpgradeTargets) : that.preferredUpgradeTargets != null) return false;
            if (this.preferredVersions != null ? !this.preferredVersions.equals(that.preferredVersions) : that.preferredVersions != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
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
            int result = this.engine.hashCode();
            result = 31 * result + (this.defaultOnly != null ? this.defaultOnly.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.hasMajorTarget != null ? this.hasMajorTarget.hashCode() : 0);
            result = 31 * result + (this.hasMinorTarget != null ? this.hasMinorTarget.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeAll != null ? this.includeAll.hashCode() : 0);
            result = 31 * result + (this.latest != null ? this.latest.hashCode() : 0);
            result = 31 * result + (this.parameterGroupFamily != null ? this.parameterGroupFamily.hashCode() : 0);
            result = 31 * result + (this.preferredMajorTargets != null ? this.preferredMajorTargets.hashCode() : 0);
            result = 31 * result + (this.preferredUpgradeTargets != null ? this.preferredUpgradeTargets.hashCode() : 0);
            result = 31 * result + (this.preferredVersions != null ? this.preferredVersions.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
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
