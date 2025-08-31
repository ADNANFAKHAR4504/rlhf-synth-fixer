package imports.aws.backup_selection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupSelection.BackupSelectionConfig")
@software.amazon.jsii.Jsii.Proxy(BackupSelectionConfig.Jsii$Proxy.class)
public interface BackupSelectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#iam_role_arn BackupSelection#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#name BackupSelection#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#plan_id BackupSelection#plan_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPlanId();

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#condition BackupSelection#condition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#id BackupSelection#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#not_resources BackupSelection#not_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#resources BackupSelection#resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResources() {
        return null;
    }

    /**
     * selection_tag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#selection_tag BackupSelection#selection_tag}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSelectionTag() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupSelectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupSelectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupSelectionConfig> {
        java.lang.String iamRoleArn;
        java.lang.String name;
        java.lang.String planId;
        java.lang.Object condition;
        java.lang.String id;
        java.util.List<java.lang.String> notResources;
        java.util.List<java.lang.String> resources;
        java.lang.Object selectionTag;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BackupSelectionConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#iam_role_arn BackupSelection#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#name BackupSelection#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getPlanId}
         * @param planId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#plan_id BackupSelection#plan_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder planId(java.lang.String planId) {
            this.planId = planId;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#condition BackupSelection#condition}
         * @return {@code this}
         */
        public Builder condition(com.hashicorp.cdktf.IResolvable condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#condition BackupSelection#condition}
         * @return {@code this}
         */
        public Builder condition(java.util.List<? extends imports.aws.backup_selection.BackupSelectionCondition> condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#id BackupSelection#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getNotResources}
         * @param notResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#not_resources BackupSelection#not_resources}.
         * @return {@code this}
         */
        public Builder notResources(java.util.List<java.lang.String> notResources) {
            this.notResources = notResources;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getResources}
         * @param resources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#resources BackupSelection#resources}.
         * @return {@code this}
         */
        public Builder resources(java.util.List<java.lang.String> resources) {
            this.resources = resources;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getSelectionTag}
         * @param selectionTag selection_tag block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#selection_tag BackupSelection#selection_tag}
         * @return {@code this}
         */
        public Builder selectionTag(com.hashicorp.cdktf.IResolvable selectionTag) {
            this.selectionTag = selectionTag;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getSelectionTag}
         * @param selectionTag selection_tag block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#selection_tag BackupSelection#selection_tag}
         * @return {@code this}
         */
        public Builder selectionTag(java.util.List<? extends imports.aws.backup_selection.BackupSelectionSelectionTag> selectionTag) {
            this.selectionTag = selectionTag;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getDependsOn}
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
         * Sets the value of {@link BackupSelectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionConfig#getProvisioners}
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
         * @return a new instance of {@link BackupSelectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupSelectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupSelectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupSelectionConfig {
        private final java.lang.String iamRoleArn;
        private final java.lang.String name;
        private final java.lang.String planId;
        private final java.lang.Object condition;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> notResources;
        private final java.util.List<java.lang.String> resources;
        private final java.lang.Object selectionTag;
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
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.planId = software.amazon.jsii.Kernel.get(this, "planId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notResources = software.amazon.jsii.Kernel.get(this, "notResources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resources = software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.selectionTag = software.amazon.jsii.Kernel.get(this, "selectionTag", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.iamRoleArn = java.util.Objects.requireNonNull(builder.iamRoleArn, "iamRoleArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.planId = java.util.Objects.requireNonNull(builder.planId, "planId is required");
            this.condition = builder.condition;
            this.id = builder.id;
            this.notResources = builder.notResources;
            this.resources = builder.resources;
            this.selectionTag = builder.selectionTag;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPlanId() {
            return this.planId;
        }

        @Override
        public final java.lang.Object getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getNotResources() {
            return this.notResources;
        }

        @Override
        public final java.util.List<java.lang.String> getResources() {
            return this.resources;
        }

        @Override
        public final java.lang.Object getSelectionTag() {
            return this.selectionTag;
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

            data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("planId", om.valueToTree(this.getPlanId()));
            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNotResources() != null) {
                data.set("notResources", om.valueToTree(this.getNotResources()));
            }
            if (this.getResources() != null) {
                data.set("resources", om.valueToTree(this.getResources()));
            }
            if (this.getSelectionTag() != null) {
                data.set("selectionTag", om.valueToTree(this.getSelectionTag()));
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
            struct.set("fqn", om.valueToTree("aws.backupSelection.BackupSelectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupSelectionConfig.Jsii$Proxy that = (BackupSelectionConfig.Jsii$Proxy) o;

            if (!iamRoleArn.equals(that.iamRoleArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!planId.equals(that.planId)) return false;
            if (this.condition != null ? !this.condition.equals(that.condition) : that.condition != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.notResources != null ? !this.notResources.equals(that.notResources) : that.notResources != null) return false;
            if (this.resources != null ? !this.resources.equals(that.resources) : that.resources != null) return false;
            if (this.selectionTag != null ? !this.selectionTag.equals(that.selectionTag) : that.selectionTag != null) return false;
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
            int result = this.iamRoleArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.planId.hashCode());
            result = 31 * result + (this.condition != null ? this.condition.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.notResources != null ? this.notResources.hashCode() : 0);
            result = 31 * result + (this.resources != null ? this.resources.hashCode() : 0);
            result = 31 * result + (this.selectionTag != null ? this.selectionTag.hashCode() : 0);
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
