package imports.aws.rds_export_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.145Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsExportTask.RdsExportTaskConfig")
@software.amazon.jsii.Jsii.Proxy(RdsExportTaskConfig.Jsii$Proxy.class)
public interface RdsExportTaskConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#export_task_identifier RdsExportTask#export_task_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExportTaskIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#iam_role_arn RdsExportTask#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#kms_key_id RdsExportTask#kms_key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#s3_bucket_name RdsExportTask#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#source_arn RdsExportTask#source_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#export_only RdsExportTask#export_only}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExportOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#s3_prefix RdsExportTask#s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Prefix() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#timeouts RdsExportTask#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_export_task.RdsExportTaskTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsExportTaskConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsExportTaskConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsExportTaskConfig> {
        java.lang.String exportTaskIdentifier;
        java.lang.String iamRoleArn;
        java.lang.String kmsKeyId;
        java.lang.String s3BucketName;
        java.lang.String sourceArn;
        java.util.List<java.lang.String> exportOnly;
        java.lang.String s3Prefix;
        imports.aws.rds_export_task.RdsExportTaskTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsExportTaskConfig#getExportTaskIdentifier}
         * @param exportTaskIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#export_task_identifier RdsExportTask#export_task_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder exportTaskIdentifier(java.lang.String exportTaskIdentifier) {
            this.exportTaskIdentifier = exportTaskIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#iam_role_arn RdsExportTask#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#kms_key_id RdsExportTask#kms_key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#s3_bucket_name RdsExportTask#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getSourceArn}
         * @param sourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#source_arn RdsExportTask#source_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceArn(java.lang.String sourceArn) {
            this.sourceArn = sourceArn;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getExportOnly}
         * @param exportOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#export_only RdsExportTask#export_only}.
         * @return {@code this}
         */
        public Builder exportOnly(java.util.List<java.lang.String> exportOnly) {
            this.exportOnly = exportOnly;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#s3_prefix RdsExportTask#s3_prefix}.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_export_task#timeouts RdsExportTask#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_export_task.RdsExportTaskTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getDependsOn}
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
         * Sets the value of {@link RdsExportTaskConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsExportTaskConfig#getProvisioners}
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
         * @return a new instance of {@link RdsExportTaskConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsExportTaskConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsExportTaskConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsExportTaskConfig {
        private final java.lang.String exportTaskIdentifier;
        private final java.lang.String iamRoleArn;
        private final java.lang.String kmsKeyId;
        private final java.lang.String s3BucketName;
        private final java.lang.String sourceArn;
        private final java.util.List<java.lang.String> exportOnly;
        private final java.lang.String s3Prefix;
        private final imports.aws.rds_export_task.RdsExportTaskTimeouts timeouts;
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
            this.exportTaskIdentifier = software.amazon.jsii.Kernel.get(this, "exportTaskIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceArn = software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportOnly = software.amazon.jsii.Kernel.get(this, "exportOnly", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_export_task.RdsExportTaskTimeouts.class));
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
            this.exportTaskIdentifier = java.util.Objects.requireNonNull(builder.exportTaskIdentifier, "exportTaskIdentifier is required");
            this.iamRoleArn = java.util.Objects.requireNonNull(builder.iamRoleArn, "iamRoleArn is required");
            this.kmsKeyId = java.util.Objects.requireNonNull(builder.kmsKeyId, "kmsKeyId is required");
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.sourceArn = java.util.Objects.requireNonNull(builder.sourceArn, "sourceArn is required");
            this.exportOnly = builder.exportOnly;
            this.s3Prefix = builder.s3Prefix;
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
        public final java.lang.String getExportTaskIdentifier() {
            return this.exportTaskIdentifier;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getSourceArn() {
            return this.sourceArn;
        }

        @Override
        public final java.util.List<java.lang.String> getExportOnly() {
            return this.exportOnly;
        }

        @Override
        public final java.lang.String getS3Prefix() {
            return this.s3Prefix;
        }

        @Override
        public final imports.aws.rds_export_task.RdsExportTaskTimeouts getTimeouts() {
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

            data.set("exportTaskIdentifier", om.valueToTree(this.getExportTaskIdentifier()));
            data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            data.set("sourceArn", om.valueToTree(this.getSourceArn()));
            if (this.getExportOnly() != null) {
                data.set("exportOnly", om.valueToTree(this.getExportOnly()));
            }
            if (this.getS3Prefix() != null) {
                data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
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
            struct.set("fqn", om.valueToTree("aws.rdsExportTask.RdsExportTaskConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsExportTaskConfig.Jsii$Proxy that = (RdsExportTaskConfig.Jsii$Proxy) o;

            if (!exportTaskIdentifier.equals(that.exportTaskIdentifier)) return false;
            if (!iamRoleArn.equals(that.iamRoleArn)) return false;
            if (!kmsKeyId.equals(that.kmsKeyId)) return false;
            if (!s3BucketName.equals(that.s3BucketName)) return false;
            if (!sourceArn.equals(that.sourceArn)) return false;
            if (this.exportOnly != null ? !this.exportOnly.equals(that.exportOnly) : that.exportOnly != null) return false;
            if (this.s3Prefix != null ? !this.s3Prefix.equals(that.s3Prefix) : that.s3Prefix != null) return false;
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
            int result = this.exportTaskIdentifier.hashCode();
            result = 31 * result + (this.iamRoleArn.hashCode());
            result = 31 * result + (this.kmsKeyId.hashCode());
            result = 31 * result + (this.s3BucketName.hashCode());
            result = 31 * result + (this.sourceArn.hashCode());
            result = 31 * result + (this.exportOnly != null ? this.exportOnly.hashCode() : 0);
            result = 31 * result + (this.s3Prefix != null ? this.s3Prefix.hashCode() : 0);
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
