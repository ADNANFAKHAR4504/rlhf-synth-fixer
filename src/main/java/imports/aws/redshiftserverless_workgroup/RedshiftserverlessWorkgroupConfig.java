package imports.aws.redshiftserverless_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessWorkgroup.RedshiftserverlessWorkgroupConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftserverlessWorkgroupConfig.Jsii$Proxy.class)
public interface RedshiftserverlessWorkgroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#namespace_name RedshiftserverlessWorkgroup#namespace_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespaceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#workgroup_name RedshiftserverlessWorkgroup#workgroup_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkgroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#base_capacity RedshiftserverlessWorkgroup#base_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBaseCapacity() {
        return null;
    }

    /**
     * config_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#config_parameter RedshiftserverlessWorkgroup#config_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfigParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enhanced_vpc_routing RedshiftserverlessWorkgroup#enhanced_vpc_routing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnhancedVpcRouting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#id RedshiftserverlessWorkgroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#max_capacity RedshiftserverlessWorkgroup#max_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#port RedshiftserverlessWorkgroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * price_performance_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#price_performance_target RedshiftserverlessWorkgroup#price_performance_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget getPricePerformanceTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#publicly_accessible RedshiftserverlessWorkgroup#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#security_group_ids RedshiftserverlessWorkgroup#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#subnet_ids RedshiftserverlessWorkgroup#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#tags RedshiftserverlessWorkgroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#tags_all RedshiftserverlessWorkgroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#timeouts RedshiftserverlessWorkgroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#track_name RedshiftserverlessWorkgroup#track_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrackName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftserverlessWorkgroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftserverlessWorkgroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftserverlessWorkgroupConfig> {
        java.lang.String namespaceName;
        java.lang.String workgroupName;
        java.lang.Number baseCapacity;
        java.lang.Object configParameter;
        java.lang.Object enhancedVpcRouting;
        java.lang.String id;
        java.lang.Number maxCapacity;
        java.lang.Number port;
        imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget pricePerformanceTarget;
        java.lang.Object publiclyAccessible;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnetIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts timeouts;
        java.lang.String trackName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getNamespaceName}
         * @param namespaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#namespace_name RedshiftserverlessWorkgroup#namespace_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespaceName(java.lang.String namespaceName) {
            this.namespaceName = namespaceName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getWorkgroupName}
         * @param workgroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#workgroup_name RedshiftserverlessWorkgroup#workgroup_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder workgroupName(java.lang.String workgroupName) {
            this.workgroupName = workgroupName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getBaseCapacity}
         * @param baseCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#base_capacity RedshiftserverlessWorkgroup#base_capacity}.
         * @return {@code this}
         */
        public Builder baseCapacity(java.lang.Number baseCapacity) {
            this.baseCapacity = baseCapacity;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getConfigParameter}
         * @param configParameter config_parameter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#config_parameter RedshiftserverlessWorkgroup#config_parameter}
         * @return {@code this}
         */
        public Builder configParameter(com.hashicorp.cdktf.IResolvable configParameter) {
            this.configParameter = configParameter;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getConfigParameter}
         * @param configParameter config_parameter block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#config_parameter RedshiftserverlessWorkgroup#config_parameter}
         * @return {@code this}
         */
        public Builder configParameter(java.util.List<? extends imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupConfigParameter> configParameter) {
            this.configParameter = configParameter;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getEnhancedVpcRouting}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enhanced_vpc_routing RedshiftserverlessWorkgroup#enhanced_vpc_routing}.
         * @return {@code this}
         */
        public Builder enhancedVpcRouting(java.lang.Boolean enhancedVpcRouting) {
            this.enhancedVpcRouting = enhancedVpcRouting;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getEnhancedVpcRouting}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enhanced_vpc_routing RedshiftserverlessWorkgroup#enhanced_vpc_routing}.
         * @return {@code this}
         */
        public Builder enhancedVpcRouting(com.hashicorp.cdktf.IResolvable enhancedVpcRouting) {
            this.enhancedVpcRouting = enhancedVpcRouting;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#id RedshiftserverlessWorkgroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#max_capacity RedshiftserverlessWorkgroup#max_capacity}.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#port RedshiftserverlessWorkgroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getPricePerformanceTarget}
         * @param pricePerformanceTarget price_performance_target block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#price_performance_target RedshiftserverlessWorkgroup#price_performance_target}
         * @return {@code this}
         */
        public Builder pricePerformanceTarget(imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget pricePerformanceTarget) {
            this.pricePerformanceTarget = pricePerformanceTarget;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#publicly_accessible RedshiftserverlessWorkgroup#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#publicly_accessible RedshiftserverlessWorkgroup#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#security_group_ids RedshiftserverlessWorkgroup#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#subnet_ids RedshiftserverlessWorkgroup#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#tags RedshiftserverlessWorkgroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#tags_all RedshiftserverlessWorkgroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#timeouts RedshiftserverlessWorkgroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getTrackName}
         * @param trackName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#track_name RedshiftserverlessWorkgroup#track_name}.
         * @return {@code this}
         */
        public Builder trackName(java.lang.String trackName) {
            this.trackName = trackName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftserverlessWorkgroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftserverlessWorkgroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftserverlessWorkgroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftserverlessWorkgroupConfig {
        private final java.lang.String namespaceName;
        private final java.lang.String workgroupName;
        private final java.lang.Number baseCapacity;
        private final java.lang.Object configParameter;
        private final java.lang.Object enhancedVpcRouting;
        private final java.lang.String id;
        private final java.lang.Number maxCapacity;
        private final java.lang.Number port;
        private final imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget pricePerformanceTarget;
        private final java.lang.Object publiclyAccessible;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts timeouts;
        private final java.lang.String trackName;
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
            this.namespaceName = software.amazon.jsii.Kernel.get(this, "namespaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workgroupName = software.amazon.jsii.Kernel.get(this, "workgroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.baseCapacity = software.amazon.jsii.Kernel.get(this, "baseCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.configParameter = software.amazon.jsii.Kernel.get(this, "configParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enhancedVpcRouting = software.amazon.jsii.Kernel.get(this, "enhancedVpcRouting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pricePerformanceTarget = software.amazon.jsii.Kernel.get(this, "pricePerformanceTarget", software.amazon.jsii.NativeType.forClass(imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts.class));
            this.trackName = software.amazon.jsii.Kernel.get(this, "trackName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.namespaceName = java.util.Objects.requireNonNull(builder.namespaceName, "namespaceName is required");
            this.workgroupName = java.util.Objects.requireNonNull(builder.workgroupName, "workgroupName is required");
            this.baseCapacity = builder.baseCapacity;
            this.configParameter = builder.configParameter;
            this.enhancedVpcRouting = builder.enhancedVpcRouting;
            this.id = builder.id;
            this.maxCapacity = builder.maxCapacity;
            this.port = builder.port;
            this.pricePerformanceTarget = builder.pricePerformanceTarget;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.securityGroupIds = builder.securityGroupIds;
            this.subnetIds = builder.subnetIds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.trackName = builder.trackName;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getNamespaceName() {
            return this.namespaceName;
        }

        @Override
        public final java.lang.String getWorkgroupName() {
            return this.workgroupName;
        }

        @Override
        public final java.lang.Number getBaseCapacity() {
            return this.baseCapacity;
        }

        @Override
        public final java.lang.Object getConfigParameter() {
            return this.configParameter;
        }

        @Override
        public final java.lang.Object getEnhancedVpcRouting() {
            return this.enhancedVpcRouting;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupPricePerformanceTarget getPricePerformanceTarget() {
            return this.pricePerformanceTarget;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
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
        public final imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTrackName() {
            return this.trackName;
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

            data.set("namespaceName", om.valueToTree(this.getNamespaceName()));
            data.set("workgroupName", om.valueToTree(this.getWorkgroupName()));
            if (this.getBaseCapacity() != null) {
                data.set("baseCapacity", om.valueToTree(this.getBaseCapacity()));
            }
            if (this.getConfigParameter() != null) {
                data.set("configParameter", om.valueToTree(this.getConfigParameter()));
            }
            if (this.getEnhancedVpcRouting() != null) {
                data.set("enhancedVpcRouting", om.valueToTree(this.getEnhancedVpcRouting()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxCapacity() != null) {
                data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPricePerformanceTarget() != null) {
                data.set("pricePerformanceTarget", om.valueToTree(this.getPricePerformanceTarget()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTrackName() != null) {
                data.set("trackName", om.valueToTree(this.getTrackName()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftserverlessWorkgroup.RedshiftserverlessWorkgroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftserverlessWorkgroupConfig.Jsii$Proxy that = (RedshiftserverlessWorkgroupConfig.Jsii$Proxy) o;

            if (!namespaceName.equals(that.namespaceName)) return false;
            if (!workgroupName.equals(that.workgroupName)) return false;
            if (this.baseCapacity != null ? !this.baseCapacity.equals(that.baseCapacity) : that.baseCapacity != null) return false;
            if (this.configParameter != null ? !this.configParameter.equals(that.configParameter) : that.configParameter != null) return false;
            if (this.enhancedVpcRouting != null ? !this.enhancedVpcRouting.equals(that.enhancedVpcRouting) : that.enhancedVpcRouting != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maxCapacity != null ? !this.maxCapacity.equals(that.maxCapacity) : that.maxCapacity != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.pricePerformanceTarget != null ? !this.pricePerformanceTarget.equals(that.pricePerformanceTarget) : that.pricePerformanceTarget != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.trackName != null ? !this.trackName.equals(that.trackName) : that.trackName != null) return false;
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
            int result = this.namespaceName.hashCode();
            result = 31 * result + (this.workgroupName.hashCode());
            result = 31 * result + (this.baseCapacity != null ? this.baseCapacity.hashCode() : 0);
            result = 31 * result + (this.configParameter != null ? this.configParameter.hashCode() : 0);
            result = 31 * result + (this.enhancedVpcRouting != null ? this.enhancedVpcRouting.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxCapacity != null ? this.maxCapacity.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.pricePerformanceTarget != null ? this.pricePerformanceTarget.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.trackName != null ? this.trackName.hashCode() : 0);
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
