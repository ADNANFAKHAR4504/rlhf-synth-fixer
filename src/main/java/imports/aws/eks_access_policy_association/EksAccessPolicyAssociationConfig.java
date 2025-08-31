package imports.aws.eks_access_policy_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksAccessPolicyAssociation.EksAccessPolicyAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(EksAccessPolicyAssociationConfig.Jsii$Proxy.class)
public interface EksAccessPolicyAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * access_scope block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#access_scope EksAccessPolicyAssociation#access_scope}
     */
    @org.jetbrains.annotations.NotNull imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope getAccessScope();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#cluster_name EksAccessPolicyAssociation#cluster_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#policy_arn EksAccessPolicyAssociation#policy_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#principal_arn EksAccessPolicyAssociation#principal_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipalArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#id EksAccessPolicyAssociation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#timeouts EksAccessPolicyAssociation#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksAccessPolicyAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksAccessPolicyAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksAccessPolicyAssociationConfig> {
        imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope accessScope;
        java.lang.String clusterName;
        java.lang.String policyArn;
        java.lang.String principalArn;
        java.lang.String id;
        imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getAccessScope}
         * @param accessScope access_scope block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#access_scope EksAccessPolicyAssociation#access_scope}
         * @return {@code this}
         */
        public Builder accessScope(imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope accessScope) {
            this.accessScope = accessScope;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getClusterName}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#cluster_name EksAccessPolicyAssociation#cluster_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterName(java.lang.String clusterName) {
            this.clusterName = clusterName;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getPolicyArn}
         * @param policyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#policy_arn EksAccessPolicyAssociation#policy_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyArn(java.lang.String policyArn) {
            this.policyArn = policyArn;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getPrincipalArn}
         * @param principalArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#principal_arn EksAccessPolicyAssociation#principal_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder principalArn(java.lang.String principalArn) {
            this.principalArn = principalArn;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#id EksAccessPolicyAssociation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_access_policy_association#timeouts EksAccessPolicyAssociation#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getDependsOn}
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
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EksAccessPolicyAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link EksAccessPolicyAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksAccessPolicyAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksAccessPolicyAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksAccessPolicyAssociationConfig {
        private final imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope accessScope;
        private final java.lang.String clusterName;
        private final java.lang.String policyArn;
        private final java.lang.String principalArn;
        private final java.lang.String id;
        private final imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts timeouts;
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
            this.accessScope = software.amazon.jsii.Kernel.get(this, "accessScope", software.amazon.jsii.NativeType.forClass(imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope.class));
            this.clusterName = software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyArn = software.amazon.jsii.Kernel.get(this, "policyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.principalArn = software.amazon.jsii.Kernel.get(this, "principalArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts.class));
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
            this.accessScope = java.util.Objects.requireNonNull(builder.accessScope, "accessScope is required");
            this.clusterName = java.util.Objects.requireNonNull(builder.clusterName, "clusterName is required");
            this.policyArn = java.util.Objects.requireNonNull(builder.policyArn, "policyArn is required");
            this.principalArn = java.util.Objects.requireNonNull(builder.principalArn, "principalArn is required");
            this.id = builder.id;
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
        public final imports.aws.eks_access_policy_association.EksAccessPolicyAssociationAccessScope getAccessScope() {
            return this.accessScope;
        }

        @Override
        public final java.lang.String getClusterName() {
            return this.clusterName;
        }

        @Override
        public final java.lang.String getPolicyArn() {
            return this.policyArn;
        }

        @Override
        public final java.lang.String getPrincipalArn() {
            return this.principalArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.eks_access_policy_association.EksAccessPolicyAssociationTimeouts getTimeouts() {
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

            data.set("accessScope", om.valueToTree(this.getAccessScope()));
            data.set("clusterName", om.valueToTree(this.getClusterName()));
            data.set("policyArn", om.valueToTree(this.getPolicyArn()));
            data.set("principalArn", om.valueToTree(this.getPrincipalArn()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.eksAccessPolicyAssociation.EksAccessPolicyAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksAccessPolicyAssociationConfig.Jsii$Proxy that = (EksAccessPolicyAssociationConfig.Jsii$Proxy) o;

            if (!accessScope.equals(that.accessScope)) return false;
            if (!clusterName.equals(that.clusterName)) return false;
            if (!policyArn.equals(that.policyArn)) return false;
            if (!principalArn.equals(that.principalArn)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.accessScope.hashCode();
            result = 31 * result + (this.clusterName.hashCode());
            result = 31 * result + (this.policyArn.hashCode());
            result = 31 * result + (this.principalArn.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
