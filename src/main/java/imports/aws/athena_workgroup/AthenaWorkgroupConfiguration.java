package imports.aws.athena_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaWorkgroup.AthenaWorkgroupConfiguration")
@software.amazon.jsii.Jsii.Proxy(AthenaWorkgroupConfiguration.Jsii$Proxy.class)
public interface AthenaWorkgroupConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#bytes_scanned_cutoff_per_query AthenaWorkgroup#bytes_scanned_cutoff_per_query}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBytesScannedCutoffPerQuery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#enforce_workgroup_configuration AthenaWorkgroup#enforce_workgroup_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnforceWorkgroupConfiguration() {
        return null;
    }

    /**
     * engine_version block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#engine_version AthenaWorkgroup#engine_version}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#execution_role AthenaWorkgroup#execution_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#publish_cloudwatch_metrics_enabled AthenaWorkgroup#publish_cloudwatch_metrics_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPublishCloudwatchMetricsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#requester_pays_enabled AthenaWorkgroup#requester_pays_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequesterPaysEnabled() {
        return null;
    }

    /**
     * result_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#result_configuration AthenaWorkgroup#result_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration getResultConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AthenaWorkgroupConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AthenaWorkgroupConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AthenaWorkgroupConfiguration> {
        java.lang.Number bytesScannedCutoffPerQuery;
        java.lang.Object enforceWorkgroupConfiguration;
        imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion engineVersion;
        java.lang.String executionRole;
        java.lang.Object publishCloudwatchMetricsEnabled;
        java.lang.Object requesterPaysEnabled;
        imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration resultConfiguration;

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getBytesScannedCutoffPerQuery}
         * @param bytesScannedCutoffPerQuery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#bytes_scanned_cutoff_per_query AthenaWorkgroup#bytes_scanned_cutoff_per_query}.
         * @return {@code this}
         */
        public Builder bytesScannedCutoffPerQuery(java.lang.Number bytesScannedCutoffPerQuery) {
            this.bytesScannedCutoffPerQuery = bytesScannedCutoffPerQuery;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getEnforceWorkgroupConfiguration}
         * @param enforceWorkgroupConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#enforce_workgroup_configuration AthenaWorkgroup#enforce_workgroup_configuration}.
         * @return {@code this}
         */
        public Builder enforceWorkgroupConfiguration(java.lang.Boolean enforceWorkgroupConfiguration) {
            this.enforceWorkgroupConfiguration = enforceWorkgroupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getEnforceWorkgroupConfiguration}
         * @param enforceWorkgroupConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#enforce_workgroup_configuration AthenaWorkgroup#enforce_workgroup_configuration}.
         * @return {@code this}
         */
        public Builder enforceWorkgroupConfiguration(com.hashicorp.cdktf.IResolvable enforceWorkgroupConfiguration) {
            this.enforceWorkgroupConfiguration = enforceWorkgroupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getEngineVersion}
         * @param engineVersion engine_version block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#engine_version AthenaWorkgroup#engine_version}
         * @return {@code this}
         */
        public Builder engineVersion(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#execution_role AthenaWorkgroup#execution_role}.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getPublishCloudwatchMetricsEnabled}
         * @param publishCloudwatchMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#publish_cloudwatch_metrics_enabled AthenaWorkgroup#publish_cloudwatch_metrics_enabled}.
         * @return {@code this}
         */
        public Builder publishCloudwatchMetricsEnabled(java.lang.Boolean publishCloudwatchMetricsEnabled) {
            this.publishCloudwatchMetricsEnabled = publishCloudwatchMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getPublishCloudwatchMetricsEnabled}
         * @param publishCloudwatchMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#publish_cloudwatch_metrics_enabled AthenaWorkgroup#publish_cloudwatch_metrics_enabled}.
         * @return {@code this}
         */
        public Builder publishCloudwatchMetricsEnabled(com.hashicorp.cdktf.IResolvable publishCloudwatchMetricsEnabled) {
            this.publishCloudwatchMetricsEnabled = publishCloudwatchMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getRequesterPaysEnabled}
         * @param requesterPaysEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#requester_pays_enabled AthenaWorkgroup#requester_pays_enabled}.
         * @return {@code this}
         */
        public Builder requesterPaysEnabled(java.lang.Boolean requesterPaysEnabled) {
            this.requesterPaysEnabled = requesterPaysEnabled;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getRequesterPaysEnabled}
         * @param requesterPaysEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#requester_pays_enabled AthenaWorkgroup#requester_pays_enabled}.
         * @return {@code this}
         */
        public Builder requesterPaysEnabled(com.hashicorp.cdktf.IResolvable requesterPaysEnabled) {
            this.requesterPaysEnabled = requesterPaysEnabled;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfiguration#getResultConfiguration}
         * @param resultConfiguration result_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#result_configuration AthenaWorkgroup#result_configuration}
         * @return {@code this}
         */
        public Builder resultConfiguration(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration resultConfiguration) {
            this.resultConfiguration = resultConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AthenaWorkgroupConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AthenaWorkgroupConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AthenaWorkgroupConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AthenaWorkgroupConfiguration {
        private final java.lang.Number bytesScannedCutoffPerQuery;
        private final java.lang.Object enforceWorkgroupConfiguration;
        private final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion engineVersion;
        private final java.lang.String executionRole;
        private final java.lang.Object publishCloudwatchMetricsEnabled;
        private final java.lang.Object requesterPaysEnabled;
        private final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration resultConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bytesScannedCutoffPerQuery = software.amazon.jsii.Kernel.get(this, "bytesScannedCutoffPerQuery", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enforceWorkgroupConfiguration = software.amazon.jsii.Kernel.get(this, "enforceWorkgroupConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion.class));
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publishCloudwatchMetricsEnabled = software.amazon.jsii.Kernel.get(this, "publishCloudwatchMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requesterPaysEnabled = software.amazon.jsii.Kernel.get(this, "requesterPaysEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resultConfiguration = software.amazon.jsii.Kernel.get(this, "resultConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bytesScannedCutoffPerQuery = builder.bytesScannedCutoffPerQuery;
            this.enforceWorkgroupConfiguration = builder.enforceWorkgroupConfiguration;
            this.engineVersion = builder.engineVersion;
            this.executionRole = builder.executionRole;
            this.publishCloudwatchMetricsEnabled = builder.publishCloudwatchMetricsEnabled;
            this.requesterPaysEnabled = builder.requesterPaysEnabled;
            this.resultConfiguration = builder.resultConfiguration;
        }

        @Override
        public final java.lang.Number getBytesScannedCutoffPerQuery() {
            return this.bytesScannedCutoffPerQuery;
        }

        @Override
        public final java.lang.Object getEnforceWorkgroupConfiguration() {
            return this.enforceWorkgroupConfiguration;
        }

        @Override
        public final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationEngineVersion getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.Object getPublishCloudwatchMetricsEnabled() {
            return this.publishCloudwatchMetricsEnabled;
        }

        @Override
        public final java.lang.Object getRequesterPaysEnabled() {
            return this.requesterPaysEnabled;
        }

        @Override
        public final imports.aws.athena_workgroup.AthenaWorkgroupConfigurationResultConfiguration getResultConfiguration() {
            return this.resultConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBytesScannedCutoffPerQuery() != null) {
                data.set("bytesScannedCutoffPerQuery", om.valueToTree(this.getBytesScannedCutoffPerQuery()));
            }
            if (this.getEnforceWorkgroupConfiguration() != null) {
                data.set("enforceWorkgroupConfiguration", om.valueToTree(this.getEnforceWorkgroupConfiguration()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getExecutionRole() != null) {
                data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            }
            if (this.getPublishCloudwatchMetricsEnabled() != null) {
                data.set("publishCloudwatchMetricsEnabled", om.valueToTree(this.getPublishCloudwatchMetricsEnabled()));
            }
            if (this.getRequesterPaysEnabled() != null) {
                data.set("requesterPaysEnabled", om.valueToTree(this.getRequesterPaysEnabled()));
            }
            if (this.getResultConfiguration() != null) {
                data.set("resultConfiguration", om.valueToTree(this.getResultConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.athenaWorkgroup.AthenaWorkgroupConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AthenaWorkgroupConfiguration.Jsii$Proxy that = (AthenaWorkgroupConfiguration.Jsii$Proxy) o;

            if (this.bytesScannedCutoffPerQuery != null ? !this.bytesScannedCutoffPerQuery.equals(that.bytesScannedCutoffPerQuery) : that.bytesScannedCutoffPerQuery != null) return false;
            if (this.enforceWorkgroupConfiguration != null ? !this.enforceWorkgroupConfiguration.equals(that.enforceWorkgroupConfiguration) : that.enforceWorkgroupConfiguration != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.executionRole != null ? !this.executionRole.equals(that.executionRole) : that.executionRole != null) return false;
            if (this.publishCloudwatchMetricsEnabled != null ? !this.publishCloudwatchMetricsEnabled.equals(that.publishCloudwatchMetricsEnabled) : that.publishCloudwatchMetricsEnabled != null) return false;
            if (this.requesterPaysEnabled != null ? !this.requesterPaysEnabled.equals(that.requesterPaysEnabled) : that.requesterPaysEnabled != null) return false;
            return this.resultConfiguration != null ? this.resultConfiguration.equals(that.resultConfiguration) : that.resultConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bytesScannedCutoffPerQuery != null ? this.bytesScannedCutoffPerQuery.hashCode() : 0;
            result = 31 * result + (this.enforceWorkgroupConfiguration != null ? this.enforceWorkgroupConfiguration.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.executionRole != null ? this.executionRole.hashCode() : 0);
            result = 31 * result + (this.publishCloudwatchMetricsEnabled != null ? this.publishCloudwatchMetricsEnabled.hashCode() : 0);
            result = 31 * result + (this.requesterPaysEnabled != null ? this.requesterPaysEnabled.hashCode() : 0);
            result = 31 * result + (this.resultConfiguration != null ? this.resultConfiguration.hashCode() : 0);
            return result;
        }
    }
}
