package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.468Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * application_code_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_code_configuration Kinesisanalyticsv2Application#application_code_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration getApplicationCodeConfiguration();

    /**
     * application_snapshot_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_snapshot_configuration Kinesisanalyticsv2Application#application_snapshot_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration getApplicationSnapshotConfiguration() {
        return null;
    }

    /**
     * environment_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#environment_properties Kinesisanalyticsv2Application#environment_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties getEnvironmentProperties() {
        return null;
    }

    /**
     * flink_application_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#flink_application_configuration Kinesisanalyticsv2Application#flink_application_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration getFlinkApplicationConfiguration() {
        return null;
    }

    /**
     * run_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#run_configuration Kinesisanalyticsv2Application#run_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration getRunConfiguration() {
        return null;
    }

    /**
     * sql_application_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#sql_application_configuration Kinesisanalyticsv2Application#sql_application_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration getSqlApplicationConfiguration() {
        return null;
    }

    /**
     * vpc_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#vpc_configuration Kinesisanalyticsv2Application#vpc_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration getVpcConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfiguration> {
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration applicationCodeConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration applicationSnapshotConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties environmentProperties;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration flinkApplicationConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration runConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration sqlApplicationConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration vpcConfiguration;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getApplicationCodeConfiguration}
         * @param applicationCodeConfiguration application_code_configuration block. This parameter is required.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_code_configuration Kinesisanalyticsv2Application#application_code_configuration}
         * @return {@code this}
         */
        public Builder applicationCodeConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration applicationCodeConfiguration) {
            this.applicationCodeConfiguration = applicationCodeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getApplicationSnapshotConfiguration}
         * @param applicationSnapshotConfiguration application_snapshot_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_snapshot_configuration Kinesisanalyticsv2Application#application_snapshot_configuration}
         * @return {@code this}
         */
        public Builder applicationSnapshotConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration applicationSnapshotConfiguration) {
            this.applicationSnapshotConfiguration = applicationSnapshotConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getEnvironmentProperties}
         * @param environmentProperties environment_properties block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#environment_properties Kinesisanalyticsv2Application#environment_properties}
         * @return {@code this}
         */
        public Builder environmentProperties(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties environmentProperties) {
            this.environmentProperties = environmentProperties;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getFlinkApplicationConfiguration}
         * @param flinkApplicationConfiguration flink_application_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#flink_application_configuration Kinesisanalyticsv2Application#flink_application_configuration}
         * @return {@code this}
         */
        public Builder flinkApplicationConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration flinkApplicationConfiguration) {
            this.flinkApplicationConfiguration = flinkApplicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getRunConfiguration}
         * @param runConfiguration run_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#run_configuration Kinesisanalyticsv2Application#run_configuration}
         * @return {@code this}
         */
        public Builder runConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration runConfiguration) {
            this.runConfiguration = runConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getSqlApplicationConfiguration}
         * @param sqlApplicationConfiguration sql_application_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#sql_application_configuration Kinesisanalyticsv2Application#sql_application_configuration}
         * @return {@code this}
         */
        public Builder sqlApplicationConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration sqlApplicationConfiguration) {
            this.sqlApplicationConfiguration = sqlApplicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration#getVpcConfiguration}
         * @param vpcConfiguration vpc_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#vpc_configuration Kinesisanalyticsv2Application#vpc_configuration}
         * @return {@code this}
         */
        public Builder vpcConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration vpcConfiguration) {
            this.vpcConfiguration = vpcConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfiguration {
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration applicationCodeConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration applicationSnapshotConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties environmentProperties;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration flinkApplicationConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration runConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration sqlApplicationConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration vpcConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationCodeConfiguration = software.amazon.jsii.Kernel.get(this, "applicationCodeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration.class));
            this.applicationSnapshotConfiguration = software.amazon.jsii.Kernel.get(this, "applicationSnapshotConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration.class));
            this.environmentProperties = software.amazon.jsii.Kernel.get(this, "environmentProperties", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties.class));
            this.flinkApplicationConfiguration = software.amazon.jsii.Kernel.get(this, "flinkApplicationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration.class));
            this.runConfiguration = software.amazon.jsii.Kernel.get(this, "runConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration.class));
            this.sqlApplicationConfiguration = software.amazon.jsii.Kernel.get(this, "sqlApplicationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration.class));
            this.vpcConfiguration = software.amazon.jsii.Kernel.get(this, "vpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationCodeConfiguration = java.util.Objects.requireNonNull(builder.applicationCodeConfiguration, "applicationCodeConfiguration is required");
            this.applicationSnapshotConfiguration = builder.applicationSnapshotConfiguration;
            this.environmentProperties = builder.environmentProperties;
            this.flinkApplicationConfiguration = builder.flinkApplicationConfiguration;
            this.runConfiguration = builder.runConfiguration;
            this.sqlApplicationConfiguration = builder.sqlApplicationConfiguration;
            this.vpcConfiguration = builder.vpcConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration getApplicationCodeConfiguration() {
            return this.applicationCodeConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration getApplicationSnapshotConfiguration() {
            return this.applicationSnapshotConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties getEnvironmentProperties() {
            return this.environmentProperties;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration getFlinkApplicationConfiguration() {
            return this.flinkApplicationConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfiguration getRunConfiguration() {
            return this.runConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfiguration getSqlApplicationConfiguration() {
            return this.sqlApplicationConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationVpcConfiguration getVpcConfiguration() {
            return this.vpcConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("applicationCodeConfiguration", om.valueToTree(this.getApplicationCodeConfiguration()));
            if (this.getApplicationSnapshotConfiguration() != null) {
                data.set("applicationSnapshotConfiguration", om.valueToTree(this.getApplicationSnapshotConfiguration()));
            }
            if (this.getEnvironmentProperties() != null) {
                data.set("environmentProperties", om.valueToTree(this.getEnvironmentProperties()));
            }
            if (this.getFlinkApplicationConfiguration() != null) {
                data.set("flinkApplicationConfiguration", om.valueToTree(this.getFlinkApplicationConfiguration()));
            }
            if (this.getRunConfiguration() != null) {
                data.set("runConfiguration", om.valueToTree(this.getRunConfiguration()));
            }
            if (this.getSqlApplicationConfiguration() != null) {
                data.set("sqlApplicationConfiguration", om.valueToTree(this.getSqlApplicationConfiguration()));
            }
            if (this.getVpcConfiguration() != null) {
                data.set("vpcConfiguration", om.valueToTree(this.getVpcConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfiguration.Jsii$Proxy) o;

            if (!applicationCodeConfiguration.equals(that.applicationCodeConfiguration)) return false;
            if (this.applicationSnapshotConfiguration != null ? !this.applicationSnapshotConfiguration.equals(that.applicationSnapshotConfiguration) : that.applicationSnapshotConfiguration != null) return false;
            if (this.environmentProperties != null ? !this.environmentProperties.equals(that.environmentProperties) : that.environmentProperties != null) return false;
            if (this.flinkApplicationConfiguration != null ? !this.flinkApplicationConfiguration.equals(that.flinkApplicationConfiguration) : that.flinkApplicationConfiguration != null) return false;
            if (this.runConfiguration != null ? !this.runConfiguration.equals(that.runConfiguration) : that.runConfiguration != null) return false;
            if (this.sqlApplicationConfiguration != null ? !this.sqlApplicationConfiguration.equals(that.sqlApplicationConfiguration) : that.sqlApplicationConfiguration != null) return false;
            return this.vpcConfiguration != null ? this.vpcConfiguration.equals(that.vpcConfiguration) : that.vpcConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applicationCodeConfiguration.hashCode();
            result = 31 * result + (this.applicationSnapshotConfiguration != null ? this.applicationSnapshotConfiguration.hashCode() : 0);
            result = 31 * result + (this.environmentProperties != null ? this.environmentProperties.hashCode() : 0);
            result = 31 * result + (this.flinkApplicationConfiguration != null ? this.flinkApplicationConfiguration.hashCode() : 0);
            result = 31 * result + (this.runConfiguration != null ? this.runConfiguration.hashCode() : 0);
            result = 31 * result + (this.sqlApplicationConfiguration != null ? this.sqlApplicationConfiguration.hashCode() : 0);
            result = 31 * result + (this.vpcConfiguration != null ? this.vpcConfiguration.hashCode() : 0);
            return result;
        }
    }
}
