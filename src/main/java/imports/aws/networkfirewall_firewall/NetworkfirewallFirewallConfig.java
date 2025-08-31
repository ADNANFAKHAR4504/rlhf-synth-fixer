package imports.aws.networkfirewall_firewall;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.943Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewall.NetworkfirewallFirewallConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallConfig.Jsii$Proxy.class)
public interface NetworkfirewallFirewallConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#firewall_policy_arn NetworkfirewallFirewall#firewall_policy_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFirewallPolicyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#name NetworkfirewallFirewall#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * subnet_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_mapping NetworkfirewallFirewall#subnet_mapping}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSubnetMapping();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#vpc_id NetworkfirewallFirewall#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#delete_protection NetworkfirewallFirewall#delete_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#description NetworkfirewallFirewall#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#enabled_analysis_types NetworkfirewallFirewall#enabled_analysis_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledAnalysisTypes() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#encryption_configuration NetworkfirewallFirewall#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration getEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#firewall_policy_change_protection NetworkfirewallFirewall#firewall_policy_change_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFirewallPolicyChangeProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#id NetworkfirewallFirewall#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_change_protection NetworkfirewallFirewall#subnet_change_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubnetChangeProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#tags NetworkfirewallFirewall#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#tags_all NetworkfirewallFirewall#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#timeouts NetworkfirewallFirewall#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallConfig> {
        java.lang.String firewallPolicyArn;
        java.lang.String name;
        java.lang.Object subnetMapping;
        java.lang.String vpcId;
        java.lang.Object deleteProtection;
        java.lang.String description;
        java.util.List<java.lang.String> enabledAnalysisTypes;
        imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration encryptionConfiguration;
        java.lang.Object firewallPolicyChangeProtection;
        java.lang.String id;
        java.lang.Object subnetChangeProtection;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getFirewallPolicyArn}
         * @param firewallPolicyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#firewall_policy_arn NetworkfirewallFirewall#firewall_policy_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder firewallPolicyArn(java.lang.String firewallPolicyArn) {
            this.firewallPolicyArn = firewallPolicyArn;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#name NetworkfirewallFirewall#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getSubnetMapping}
         * @param subnetMapping subnet_mapping block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_mapping NetworkfirewallFirewall#subnet_mapping}
         * @return {@code this}
         */
        public Builder subnetMapping(com.hashicorp.cdktf.IResolvable subnetMapping) {
            this.subnetMapping = subnetMapping;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getSubnetMapping}
         * @param subnetMapping subnet_mapping block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_mapping NetworkfirewallFirewall#subnet_mapping}
         * @return {@code this}
         */
        public Builder subnetMapping(java.util.List<? extends imports.aws.networkfirewall_firewall.NetworkfirewallFirewallSubnetMapping> subnetMapping) {
            this.subnetMapping = subnetMapping;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#vpc_id NetworkfirewallFirewall#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getDeleteProtection}
         * @param deleteProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#delete_protection NetworkfirewallFirewall#delete_protection}.
         * @return {@code this}
         */
        public Builder deleteProtection(java.lang.Boolean deleteProtection) {
            this.deleteProtection = deleteProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getDeleteProtection}
         * @param deleteProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#delete_protection NetworkfirewallFirewall#delete_protection}.
         * @return {@code this}
         */
        public Builder deleteProtection(com.hashicorp.cdktf.IResolvable deleteProtection) {
            this.deleteProtection = deleteProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#description NetworkfirewallFirewall#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getEnabledAnalysisTypes}
         * @param enabledAnalysisTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#enabled_analysis_types NetworkfirewallFirewall#enabled_analysis_types}.
         * @return {@code this}
         */
        public Builder enabledAnalysisTypes(java.util.List<java.lang.String> enabledAnalysisTypes) {
            this.enabledAnalysisTypes = enabledAnalysisTypes;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#encryption_configuration NetworkfirewallFirewall#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getFirewallPolicyChangeProtection}
         * @param firewallPolicyChangeProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#firewall_policy_change_protection NetworkfirewallFirewall#firewall_policy_change_protection}.
         * @return {@code this}
         */
        public Builder firewallPolicyChangeProtection(java.lang.Boolean firewallPolicyChangeProtection) {
            this.firewallPolicyChangeProtection = firewallPolicyChangeProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getFirewallPolicyChangeProtection}
         * @param firewallPolicyChangeProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#firewall_policy_change_protection NetworkfirewallFirewall#firewall_policy_change_protection}.
         * @return {@code this}
         */
        public Builder firewallPolicyChangeProtection(com.hashicorp.cdktf.IResolvable firewallPolicyChangeProtection) {
            this.firewallPolicyChangeProtection = firewallPolicyChangeProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#id NetworkfirewallFirewall#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getSubnetChangeProtection}
         * @param subnetChangeProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_change_protection NetworkfirewallFirewall#subnet_change_protection}.
         * @return {@code this}
         */
        public Builder subnetChangeProtection(java.lang.Boolean subnetChangeProtection) {
            this.subnetChangeProtection = subnetChangeProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getSubnetChangeProtection}
         * @param subnetChangeProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#subnet_change_protection NetworkfirewallFirewall#subnet_change_protection}.
         * @return {@code this}
         */
        public Builder subnetChangeProtection(com.hashicorp.cdktf.IResolvable subnetChangeProtection) {
            this.subnetChangeProtection = subnetChangeProtection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#tags NetworkfirewallFirewall#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#tags_all NetworkfirewallFirewall#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall#timeouts NetworkfirewallFirewall#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getDependsOn}
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
         * Sets the value of {@link NetworkfirewallFirewallConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkfirewallFirewallConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallConfig {
        private final java.lang.String firewallPolicyArn;
        private final java.lang.String name;
        private final java.lang.Object subnetMapping;
        private final java.lang.String vpcId;
        private final java.lang.Object deleteProtection;
        private final java.lang.String description;
        private final java.util.List<java.lang.String> enabledAnalysisTypes;
        private final imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration encryptionConfiguration;
        private final java.lang.Object firewallPolicyChangeProtection;
        private final java.lang.String id;
        private final java.lang.Object subnetChangeProtection;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts timeouts;
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
            this.firewallPolicyArn = software.amazon.jsii.Kernel.get(this, "firewallPolicyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetMapping = software.amazon.jsii.Kernel.get(this, "subnetMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteProtection = software.amazon.jsii.Kernel.get(this, "deleteProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabledAnalysisTypes = software.amazon.jsii.Kernel.get(this, "enabledAnalysisTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration.class));
            this.firewallPolicyChangeProtection = software.amazon.jsii.Kernel.get(this, "firewallPolicyChangeProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetChangeProtection = software.amazon.jsii.Kernel.get(this, "subnetChangeProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts.class));
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
            this.firewallPolicyArn = java.util.Objects.requireNonNull(builder.firewallPolicyArn, "firewallPolicyArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.subnetMapping = java.util.Objects.requireNonNull(builder.subnetMapping, "subnetMapping is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.deleteProtection = builder.deleteProtection;
            this.description = builder.description;
            this.enabledAnalysisTypes = builder.enabledAnalysisTypes;
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.firewallPolicyChangeProtection = builder.firewallPolicyChangeProtection;
            this.id = builder.id;
            this.subnetChangeProtection = builder.subnetChangeProtection;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
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
        public final java.lang.String getFirewallPolicyArn() {
            return this.firewallPolicyArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getSubnetMapping() {
            return this.subnetMapping;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getDeleteProtection() {
            return this.deleteProtection;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledAnalysisTypes() {
            return this.enabledAnalysisTypes;
        }

        @Override
        public final imports.aws.networkfirewall_firewall.NetworkfirewallFirewallEncryptionConfiguration getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.lang.Object getFirewallPolicyChangeProtection() {
            return this.firewallPolicyChangeProtection;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getSubnetChangeProtection() {
            return this.subnetChangeProtection;
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
        public final imports.aws.networkfirewall_firewall.NetworkfirewallFirewallTimeouts getTimeouts() {
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

            data.set("firewallPolicyArn", om.valueToTree(this.getFirewallPolicyArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("subnetMapping", om.valueToTree(this.getSubnetMapping()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getDeleteProtection() != null) {
                data.set("deleteProtection", om.valueToTree(this.getDeleteProtection()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnabledAnalysisTypes() != null) {
                data.set("enabledAnalysisTypes", om.valueToTree(this.getEnabledAnalysisTypes()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getFirewallPolicyChangeProtection() != null) {
                data.set("firewallPolicyChangeProtection", om.valueToTree(this.getFirewallPolicyChangeProtection()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSubnetChangeProtection() != null) {
                data.set("subnetChangeProtection", om.valueToTree(this.getSubnetChangeProtection()));
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
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewall.NetworkfirewallFirewallConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallConfig.Jsii$Proxy that = (NetworkfirewallFirewallConfig.Jsii$Proxy) o;

            if (!firewallPolicyArn.equals(that.firewallPolicyArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!subnetMapping.equals(that.subnetMapping)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            if (this.deleteProtection != null ? !this.deleteProtection.equals(that.deleteProtection) : that.deleteProtection != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.enabledAnalysisTypes != null ? !this.enabledAnalysisTypes.equals(that.enabledAnalysisTypes) : that.enabledAnalysisTypes != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.firewallPolicyChangeProtection != null ? !this.firewallPolicyChangeProtection.equals(that.firewallPolicyChangeProtection) : that.firewallPolicyChangeProtection != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.subnetChangeProtection != null ? !this.subnetChangeProtection.equals(that.subnetChangeProtection) : that.subnetChangeProtection != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.firewallPolicyArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.subnetMapping.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.deleteProtection != null ? this.deleteProtection.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.enabledAnalysisTypes != null ? this.enabledAnalysisTypes.hashCode() : 0);
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.firewallPolicyChangeProtection != null ? this.firewallPolicyChangeProtection.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.subnetChangeProtection != null ? this.subnetChangeProtection.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
