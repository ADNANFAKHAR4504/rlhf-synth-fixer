package imports.aws.backup_restore_testing_selection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingSelection.BackupRestoreTestingSelectionConfig")
@software.amazon.jsii.Jsii.Proxy(BackupRestoreTestingSelectionConfig.Jsii$Proxy.class)
public interface BackupRestoreTestingSelectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#iam_role_arn BackupRestoreTestingSelection#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#name BackupRestoreTestingSelection#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_type BackupRestoreTestingSelection#protected_resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtectedResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_testing_plan_name BackupRestoreTestingSelection#restore_testing_plan_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestoreTestingPlanName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_arns BackupRestoreTestingSelection#protected_resource_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProtectedResourceArns() {
        return null;
    }

    /**
     * protected_resource_conditions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_conditions BackupRestoreTestingSelection#protected_resource_conditions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProtectedResourceConditions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_metadata_overrides BackupRestoreTestingSelection#restore_metadata_overrides}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRestoreMetadataOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#validation_window_hours BackupRestoreTestingSelection#validation_window_hours}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getValidationWindowHours() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupRestoreTestingSelectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupRestoreTestingSelectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupRestoreTestingSelectionConfig> {
        java.lang.String iamRoleArn;
        java.lang.String name;
        java.lang.String protectedResourceType;
        java.lang.String restoreTestingPlanName;
        java.util.List<java.lang.String> protectedResourceArns;
        java.lang.Object protectedResourceConditions;
        java.util.Map<java.lang.String, java.lang.String> restoreMetadataOverrides;
        java.lang.Number validationWindowHours;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#iam_role_arn BackupRestoreTestingSelection#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#name BackupRestoreTestingSelection#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProtectedResourceType}
         * @param protectedResourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_type BackupRestoreTestingSelection#protected_resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder protectedResourceType(java.lang.String protectedResourceType) {
            this.protectedResourceType = protectedResourceType;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getRestoreTestingPlanName}
         * @param restoreTestingPlanName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_testing_plan_name BackupRestoreTestingSelection#restore_testing_plan_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder restoreTestingPlanName(java.lang.String restoreTestingPlanName) {
            this.restoreTestingPlanName = restoreTestingPlanName;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProtectedResourceArns}
         * @param protectedResourceArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_arns BackupRestoreTestingSelection#protected_resource_arns}.
         * @return {@code this}
         */
        public Builder protectedResourceArns(java.util.List<java.lang.String> protectedResourceArns) {
            this.protectedResourceArns = protectedResourceArns;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProtectedResourceConditions}
         * @param protectedResourceConditions protected_resource_conditions block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_conditions BackupRestoreTestingSelection#protected_resource_conditions}
         * @return {@code this}
         */
        public Builder protectedResourceConditions(com.hashicorp.cdktf.IResolvable protectedResourceConditions) {
            this.protectedResourceConditions = protectedResourceConditions;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProtectedResourceConditions}
         * @param protectedResourceConditions protected_resource_conditions block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_conditions BackupRestoreTestingSelection#protected_resource_conditions}
         * @return {@code this}
         */
        public Builder protectedResourceConditions(java.util.List<? extends imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions> protectedResourceConditions) {
            this.protectedResourceConditions = protectedResourceConditions;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getRestoreMetadataOverrides}
         * @param restoreMetadataOverrides Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_metadata_overrides BackupRestoreTestingSelection#restore_metadata_overrides}.
         * @return {@code this}
         */
        public Builder restoreMetadataOverrides(java.util.Map<java.lang.String, java.lang.String> restoreMetadataOverrides) {
            this.restoreMetadataOverrides = restoreMetadataOverrides;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getValidationWindowHours}
         * @param validationWindowHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#validation_window_hours BackupRestoreTestingSelection#validation_window_hours}.
         * @return {@code this}
         */
        public Builder validationWindowHours(java.lang.Number validationWindowHours) {
            this.validationWindowHours = validationWindowHours;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getDependsOn}
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
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionConfig#getProvisioners}
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
         * @return a new instance of {@link BackupRestoreTestingSelectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupRestoreTestingSelectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupRestoreTestingSelectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupRestoreTestingSelectionConfig {
        private final java.lang.String iamRoleArn;
        private final java.lang.String name;
        private final java.lang.String protectedResourceType;
        private final java.lang.String restoreTestingPlanName;
        private final java.util.List<java.lang.String> protectedResourceArns;
        private final java.lang.Object protectedResourceConditions;
        private final java.util.Map<java.lang.String, java.lang.String> restoreMetadataOverrides;
        private final java.lang.Number validationWindowHours;
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
            this.protectedResourceType = software.amazon.jsii.Kernel.get(this, "protectedResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreTestingPlanName = software.amazon.jsii.Kernel.get(this, "restoreTestingPlanName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protectedResourceArns = software.amazon.jsii.Kernel.get(this, "protectedResourceArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.protectedResourceConditions = software.amazon.jsii.Kernel.get(this, "protectedResourceConditions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.restoreMetadataOverrides = software.amazon.jsii.Kernel.get(this, "restoreMetadataOverrides", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.validationWindowHours = software.amazon.jsii.Kernel.get(this, "validationWindowHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.protectedResourceType = java.util.Objects.requireNonNull(builder.protectedResourceType, "protectedResourceType is required");
            this.restoreTestingPlanName = java.util.Objects.requireNonNull(builder.restoreTestingPlanName, "restoreTestingPlanName is required");
            this.protectedResourceArns = builder.protectedResourceArns;
            this.protectedResourceConditions = builder.protectedResourceConditions;
            this.restoreMetadataOverrides = builder.restoreMetadataOverrides;
            this.validationWindowHours = builder.validationWindowHours;
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
        public final java.lang.String getProtectedResourceType() {
            return this.protectedResourceType;
        }

        @Override
        public final java.lang.String getRestoreTestingPlanName() {
            return this.restoreTestingPlanName;
        }

        @Override
        public final java.util.List<java.lang.String> getProtectedResourceArns() {
            return this.protectedResourceArns;
        }

        @Override
        public final java.lang.Object getProtectedResourceConditions() {
            return this.protectedResourceConditions;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRestoreMetadataOverrides() {
            return this.restoreMetadataOverrides;
        }

        @Override
        public final java.lang.Number getValidationWindowHours() {
            return this.validationWindowHours;
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
            data.set("protectedResourceType", om.valueToTree(this.getProtectedResourceType()));
            data.set("restoreTestingPlanName", om.valueToTree(this.getRestoreTestingPlanName()));
            if (this.getProtectedResourceArns() != null) {
                data.set("protectedResourceArns", om.valueToTree(this.getProtectedResourceArns()));
            }
            if (this.getProtectedResourceConditions() != null) {
                data.set("protectedResourceConditions", om.valueToTree(this.getProtectedResourceConditions()));
            }
            if (this.getRestoreMetadataOverrides() != null) {
                data.set("restoreMetadataOverrides", om.valueToTree(this.getRestoreMetadataOverrides()));
            }
            if (this.getValidationWindowHours() != null) {
                data.set("validationWindowHours", om.valueToTree(this.getValidationWindowHours()));
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
            struct.set("fqn", om.valueToTree("aws.backupRestoreTestingSelection.BackupRestoreTestingSelectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupRestoreTestingSelectionConfig.Jsii$Proxy that = (BackupRestoreTestingSelectionConfig.Jsii$Proxy) o;

            if (!iamRoleArn.equals(that.iamRoleArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!protectedResourceType.equals(that.protectedResourceType)) return false;
            if (!restoreTestingPlanName.equals(that.restoreTestingPlanName)) return false;
            if (this.protectedResourceArns != null ? !this.protectedResourceArns.equals(that.protectedResourceArns) : that.protectedResourceArns != null) return false;
            if (this.protectedResourceConditions != null ? !this.protectedResourceConditions.equals(that.protectedResourceConditions) : that.protectedResourceConditions != null) return false;
            if (this.restoreMetadataOverrides != null ? !this.restoreMetadataOverrides.equals(that.restoreMetadataOverrides) : that.restoreMetadataOverrides != null) return false;
            if (this.validationWindowHours != null ? !this.validationWindowHours.equals(that.validationWindowHours) : that.validationWindowHours != null) return false;
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
            result = 31 * result + (this.protectedResourceType.hashCode());
            result = 31 * result + (this.restoreTestingPlanName.hashCode());
            result = 31 * result + (this.protectedResourceArns != null ? this.protectedResourceArns.hashCode() : 0);
            result = 31 * result + (this.protectedResourceConditions != null ? this.protectedResourceConditions.hashCode() : 0);
            result = 31 * result + (this.restoreMetadataOverrides != null ? this.restoreMetadataOverrides.hashCode() : 0);
            result = 31 * result + (this.validationWindowHours != null ? this.validationWindowHours.hashCode() : 0);
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
