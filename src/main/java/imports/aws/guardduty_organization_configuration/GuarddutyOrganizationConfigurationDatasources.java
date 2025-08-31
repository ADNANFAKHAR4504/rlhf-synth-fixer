package imports.aws.guardduty_organization_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyOrganizationConfiguration.GuarddutyOrganizationConfigurationDatasources")
@software.amazon.jsii.Jsii.Proxy(GuarddutyOrganizationConfigurationDatasources.Jsii$Proxy.class)
public interface GuarddutyOrganizationConfigurationDatasources extends software.amazon.jsii.JsiiSerializable {

    /**
     * kubernetes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#kubernetes GuarddutyOrganizationConfiguration#kubernetes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes getKubernetes() {
        return null;
    }

    /**
     * malware_protection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#malware_protection GuarddutyOrganizationConfiguration#malware_protection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection getMalwareProtection() {
        return null;
    }

    /**
     * s3_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#s3_logs GuarddutyOrganizationConfiguration#s3_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs getS3Logs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GuarddutyOrganizationConfigurationDatasources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyOrganizationConfigurationDatasources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyOrganizationConfigurationDatasources> {
        imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes kubernetes;
        imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection malwareProtection;
        imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs s3Logs;

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationDatasources#getKubernetes}
         * @param kubernetes kubernetes block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#kubernetes GuarddutyOrganizationConfiguration#kubernetes}
         * @return {@code this}
         */
        public Builder kubernetes(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes kubernetes) {
            this.kubernetes = kubernetes;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationDatasources#getMalwareProtection}
         * @param malwareProtection malware_protection block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#malware_protection GuarddutyOrganizationConfiguration#malware_protection}
         * @return {@code this}
         */
        public Builder malwareProtection(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection malwareProtection) {
            this.malwareProtection = malwareProtection;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationDatasources#getS3Logs}
         * @param s3Logs s3_logs block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#s3_logs GuarddutyOrganizationConfiguration#s3_logs}
         * @return {@code this}
         */
        public Builder s3Logs(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs s3Logs) {
            this.s3Logs = s3Logs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyOrganizationConfigurationDatasources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyOrganizationConfigurationDatasources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyOrganizationConfigurationDatasources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyOrganizationConfigurationDatasources {
        private final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes kubernetes;
        private final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection malwareProtection;
        private final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs s3Logs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kubernetes = software.amazon.jsii.Kernel.get(this, "kubernetes", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes.class));
            this.malwareProtection = software.amazon.jsii.Kernel.get(this, "malwareProtection", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection.class));
            this.s3Logs = software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kubernetes = builder.kubernetes;
            this.malwareProtection = builder.malwareProtection;
            this.s3Logs = builder.s3Logs;
        }

        @Override
        public final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesKubernetes getKubernetes() {
            return this.kubernetes;
        }

        @Override
        public final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesMalwareProtection getMalwareProtection() {
            return this.malwareProtection;
        }

        @Override
        public final imports.aws.guardduty_organization_configuration.GuarddutyOrganizationConfigurationDatasourcesS3Logs getS3Logs() {
            return this.s3Logs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKubernetes() != null) {
                data.set("kubernetes", om.valueToTree(this.getKubernetes()));
            }
            if (this.getMalwareProtection() != null) {
                data.set("malwareProtection", om.valueToTree(this.getMalwareProtection()));
            }
            if (this.getS3Logs() != null) {
                data.set("s3Logs", om.valueToTree(this.getS3Logs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyOrganizationConfiguration.GuarddutyOrganizationConfigurationDatasources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyOrganizationConfigurationDatasources.Jsii$Proxy that = (GuarddutyOrganizationConfigurationDatasources.Jsii$Proxy) o;

            if (this.kubernetes != null ? !this.kubernetes.equals(that.kubernetes) : that.kubernetes != null) return false;
            if (this.malwareProtection != null ? !this.malwareProtection.equals(that.malwareProtection) : that.malwareProtection != null) return false;
            return this.s3Logs != null ? this.s3Logs.equals(that.s3Logs) : that.s3Logs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kubernetes != null ? this.kubernetes.hashCode() : 0;
            result = 31 * result + (this.malwareProtection != null ? this.malwareProtection.hashCode() : 0);
            result = 31 * result + (this.s3Logs != null ? this.s3Logs.hashCode() : 0);
            return result;
        }
    }
}
