package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_config SsmMaintenanceWindowTask#cloudwatch_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig getCloudwatchConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#comment SsmMaintenanceWindowTask#comment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_hash SsmMaintenanceWindowTask#document_hash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentHash() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_hash_type SsmMaintenanceWindowTask#document_hash_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentHashType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_version SsmMaintenanceWindowTask#document_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersion() {
        return null;
    }

    /**
     * notification_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_config SsmMaintenanceWindowTask#notification_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig getNotificationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#output_s3_bucket SsmMaintenanceWindowTask#output_s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#output_s3_key_prefix SsmMaintenanceWindowTask#output_s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputS3KeyPrefix() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#timeout_seconds SsmMaintenanceWindowTask#timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters> {
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig cloudwatchConfig;
        java.lang.String comment;
        java.lang.String documentHash;
        java.lang.String documentHashType;
        java.lang.String documentVersion;
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig notificationConfig;
        java.lang.String outputS3Bucket;
        java.lang.String outputS3KeyPrefix;
        java.lang.Object parameter;
        java.lang.String serviceRoleArn;
        java.lang.Number timeoutSeconds;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getCloudwatchConfig}
         * @param cloudwatchConfig cloudwatch_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_config SsmMaintenanceWindowTask#cloudwatch_config}
         * @return {@code this}
         */
        public Builder cloudwatchConfig(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig cloudwatchConfig) {
            this.cloudwatchConfig = cloudwatchConfig;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getComment}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#comment SsmMaintenanceWindowTask#comment}.
         * @return {@code this}
         */
        public Builder comment(java.lang.String comment) {
            this.comment = comment;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getDocumentHash}
         * @param documentHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_hash SsmMaintenanceWindowTask#document_hash}.
         * @return {@code this}
         */
        public Builder documentHash(java.lang.String documentHash) {
            this.documentHash = documentHash;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getDocumentHashType}
         * @param documentHashType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_hash_type SsmMaintenanceWindowTask#document_hash_type}.
         * @return {@code this}
         */
        public Builder documentHashType(java.lang.String documentHashType) {
            this.documentHashType = documentHashType;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getDocumentVersion}
         * @param documentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_version SsmMaintenanceWindowTask#document_version}.
         * @return {@code this}
         */
        public Builder documentVersion(java.lang.String documentVersion) {
            this.documentVersion = documentVersion;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getNotificationConfig}
         * @param notificationConfig notification_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_config SsmMaintenanceWindowTask#notification_config}
         * @return {@code this}
         */
        public Builder notificationConfig(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig notificationConfig) {
            this.notificationConfig = notificationConfig;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getOutputS3Bucket}
         * @param outputS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#output_s3_bucket SsmMaintenanceWindowTask#output_s3_bucket}.
         * @return {@code this}
         */
        public Builder outputS3Bucket(java.lang.String outputS3Bucket) {
            this.outputS3Bucket = outputS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getOutputS3KeyPrefix}
         * @param outputS3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#output_s3_key_prefix SsmMaintenanceWindowTask#output_s3_key_prefix}.
         * @return {@code this}
         */
        public Builder outputS3KeyPrefix(java.lang.String outputS3KeyPrefix) {
            this.outputS3KeyPrefix = outputS3KeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getServiceRoleArn}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}.
         * @return {@code this}
         */
        public Builder serviceRoleArn(java.lang.String serviceRoleArn) {
            this.serviceRoleArn = serviceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters#getTimeoutSeconds}
         * @param timeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#timeout_seconds SsmMaintenanceWindowTask#timeout_seconds}.
         * @return {@code this}
         */
        public Builder timeoutSeconds(java.lang.Number timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters {
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig cloudwatchConfig;
        private final java.lang.String comment;
        private final java.lang.String documentHash;
        private final java.lang.String documentHashType;
        private final java.lang.String documentVersion;
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig notificationConfig;
        private final java.lang.String outputS3Bucket;
        private final java.lang.String outputS3KeyPrefix;
        private final java.lang.Object parameter;
        private final java.lang.String serviceRoleArn;
        private final java.lang.Number timeoutSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchConfig = software.amazon.jsii.Kernel.get(this, "cloudwatchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.class));
            this.comment = software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentHash = software.amazon.jsii.Kernel.get(this, "documentHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentHashType = software.amazon.jsii.Kernel.get(this, "documentHashType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentVersion = software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationConfig = software.amazon.jsii.Kernel.get(this, "notificationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig.class));
            this.outputS3Bucket = software.amazon.jsii.Kernel.get(this, "outputS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputS3KeyPrefix = software.amazon.jsii.Kernel.get(this, "outputS3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serviceRoleArn = software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutSeconds = software.amazon.jsii.Kernel.get(this, "timeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchConfig = builder.cloudwatchConfig;
            this.comment = builder.comment;
            this.documentHash = builder.documentHash;
            this.documentHashType = builder.documentHashType;
            this.documentVersion = builder.documentVersion;
            this.notificationConfig = builder.notificationConfig;
            this.outputS3Bucket = builder.outputS3Bucket;
            this.outputS3KeyPrefix = builder.outputS3KeyPrefix;
            this.parameter = builder.parameter;
            this.serviceRoleArn = builder.serviceRoleArn;
            this.timeoutSeconds = builder.timeoutSeconds;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig getCloudwatchConfig() {
            return this.cloudwatchConfig;
        }

        @Override
        public final java.lang.String getComment() {
            return this.comment;
        }

        @Override
        public final java.lang.String getDocumentHash() {
            return this.documentHash;
        }

        @Override
        public final java.lang.String getDocumentHashType() {
            return this.documentHashType;
        }

        @Override
        public final java.lang.String getDocumentVersion() {
            return this.documentVersion;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig getNotificationConfig() {
            return this.notificationConfig;
        }

        @Override
        public final java.lang.String getOutputS3Bucket() {
            return this.outputS3Bucket;
        }

        @Override
        public final java.lang.String getOutputS3KeyPrefix() {
            return this.outputS3KeyPrefix;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        public final java.lang.String getServiceRoleArn() {
            return this.serviceRoleArn;
        }

        @Override
        public final java.lang.Number getTimeoutSeconds() {
            return this.timeoutSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchConfig() != null) {
                data.set("cloudwatchConfig", om.valueToTree(this.getCloudwatchConfig()));
            }
            if (this.getComment() != null) {
                data.set("comment", om.valueToTree(this.getComment()));
            }
            if (this.getDocumentHash() != null) {
                data.set("documentHash", om.valueToTree(this.getDocumentHash()));
            }
            if (this.getDocumentHashType() != null) {
                data.set("documentHashType", om.valueToTree(this.getDocumentHashType()));
            }
            if (this.getDocumentVersion() != null) {
                data.set("documentVersion", om.valueToTree(this.getDocumentVersion()));
            }
            if (this.getNotificationConfig() != null) {
                data.set("notificationConfig", om.valueToTree(this.getNotificationConfig()));
            }
            if (this.getOutputS3Bucket() != null) {
                data.set("outputS3Bucket", om.valueToTree(this.getOutputS3Bucket()));
            }
            if (this.getOutputS3KeyPrefix() != null) {
                data.set("outputS3KeyPrefix", om.valueToTree(this.getOutputS3KeyPrefix()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }
            if (this.getServiceRoleArn() != null) {
                data.set("serviceRoleArn", om.valueToTree(this.getServiceRoleArn()));
            }
            if (this.getTimeoutSeconds() != null) {
                data.set("timeoutSeconds", om.valueToTree(this.getTimeoutSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.Jsii$Proxy) o;

            if (this.cloudwatchConfig != null ? !this.cloudwatchConfig.equals(that.cloudwatchConfig) : that.cloudwatchConfig != null) return false;
            if (this.comment != null ? !this.comment.equals(that.comment) : that.comment != null) return false;
            if (this.documentHash != null ? !this.documentHash.equals(that.documentHash) : that.documentHash != null) return false;
            if (this.documentHashType != null ? !this.documentHashType.equals(that.documentHashType) : that.documentHashType != null) return false;
            if (this.documentVersion != null ? !this.documentVersion.equals(that.documentVersion) : that.documentVersion != null) return false;
            if (this.notificationConfig != null ? !this.notificationConfig.equals(that.notificationConfig) : that.notificationConfig != null) return false;
            if (this.outputS3Bucket != null ? !this.outputS3Bucket.equals(that.outputS3Bucket) : that.outputS3Bucket != null) return false;
            if (this.outputS3KeyPrefix != null ? !this.outputS3KeyPrefix.equals(that.outputS3KeyPrefix) : that.outputS3KeyPrefix != null) return false;
            if (this.parameter != null ? !this.parameter.equals(that.parameter) : that.parameter != null) return false;
            if (this.serviceRoleArn != null ? !this.serviceRoleArn.equals(that.serviceRoleArn) : that.serviceRoleArn != null) return false;
            return this.timeoutSeconds != null ? this.timeoutSeconds.equals(that.timeoutSeconds) : that.timeoutSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchConfig != null ? this.cloudwatchConfig.hashCode() : 0;
            result = 31 * result + (this.comment != null ? this.comment.hashCode() : 0);
            result = 31 * result + (this.documentHash != null ? this.documentHash.hashCode() : 0);
            result = 31 * result + (this.documentHashType != null ? this.documentHashType.hashCode() : 0);
            result = 31 * result + (this.documentVersion != null ? this.documentVersion.hashCode() : 0);
            result = 31 * result + (this.notificationConfig != null ? this.notificationConfig.hashCode() : 0);
            result = 31 * result + (this.outputS3Bucket != null ? this.outputS3Bucket.hashCode() : 0);
            result = 31 * result + (this.outputS3KeyPrefix != null ? this.outputS3KeyPrefix.hashCode() : 0);
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            result = 31 * result + (this.serviceRoleArn != null ? this.serviceRoleArn.hashCode() : 0);
            result = 31 * result + (this.timeoutSeconds != null ? this.timeoutSeconds.hashCode() : 0);
            return result;
        }
    }
}
