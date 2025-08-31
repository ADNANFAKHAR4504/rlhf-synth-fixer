package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetVdmOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetVdmOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * dashboard_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#dashboard_options Sesv2ConfigurationSet#dashboard_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions getDashboardOptions() {
        return null;
    }

    /**
     * guardian_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#guardian_options Sesv2ConfigurationSet#guardian_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions getGuardianOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetVdmOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetVdmOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetVdmOptions> {
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions dashboardOptions;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions guardianOptions;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetVdmOptions#getDashboardOptions}
         * @param dashboardOptions dashboard_options block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#dashboard_options Sesv2ConfigurationSet#dashboard_options}
         * @return {@code this}
         */
        public Builder dashboardOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions dashboardOptions) {
            this.dashboardOptions = dashboardOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetVdmOptions#getGuardianOptions}
         * @param guardianOptions guardian_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#guardian_options Sesv2ConfigurationSet#guardian_options}
         * @return {@code this}
         */
        public Builder guardianOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions guardianOptions) {
            this.guardianOptions = guardianOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetVdmOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetVdmOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetVdmOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetVdmOptions {
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions dashboardOptions;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions guardianOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dashboardOptions = software.amazon.jsii.Kernel.get(this, "dashboardOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions.class));
            this.guardianOptions = software.amazon.jsii.Kernel.get(this, "guardianOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dashboardOptions = builder.dashboardOptions;
            this.guardianOptions = builder.guardianOptions;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions getDashboardOptions() {
            return this.dashboardOptions;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions getGuardianOptions() {
            return this.guardianOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDashboardOptions() != null) {
                data.set("dashboardOptions", om.valueToTree(this.getDashboardOptions()));
            }
            if (this.getGuardianOptions() != null) {
                data.set("guardianOptions", om.valueToTree(this.getGuardianOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetVdmOptions.Jsii$Proxy that = (Sesv2ConfigurationSetVdmOptions.Jsii$Proxy) o;

            if (this.dashboardOptions != null ? !this.dashboardOptions.equals(that.dashboardOptions) : that.dashboardOptions != null) return false;
            return this.guardianOptions != null ? this.guardianOptions.equals(that.guardianOptions) : that.guardianOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dashboardOptions != null ? this.dashboardOptions.hashCode() : 0;
            result = 31 * result + (this.guardianOptions != null ? this.guardianOptions.hashCode() : 0);
            return result;
        }
    }
}
