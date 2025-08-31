package imports.aws.db_option_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.972Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbOptionGroup.DbOptionGroupOption")
@software.amazon.jsii.Jsii.Proxy(DbOptionGroupOption.Jsii$Proxy.class)
public interface DbOptionGroupOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#option_name DbOptionGroup#option_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOptionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#db_security_group_memberships DbOptionGroup#db_security_group_memberships}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDbSecurityGroupMemberships() {
        return null;
    }

    /**
     * option_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#option_settings DbOptionGroup#option_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOptionSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#port DbOptionGroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#version DbOptionGroup#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#vpc_security_group_memberships DbOptionGroup#vpc_security_group_memberships}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupMemberships() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DbOptionGroupOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DbOptionGroupOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DbOptionGroupOption> {
        java.lang.String optionName;
        java.util.List<java.lang.String> dbSecurityGroupMemberships;
        java.lang.Object optionSettings;
        java.lang.Number port;
        java.lang.String version;
        java.util.List<java.lang.String> vpcSecurityGroupMemberships;

        /**
         * Sets the value of {@link DbOptionGroupOption#getOptionName}
         * @param optionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#option_name DbOptionGroup#option_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder optionName(java.lang.String optionName) {
            this.optionName = optionName;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getDbSecurityGroupMemberships}
         * @param dbSecurityGroupMemberships Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#db_security_group_memberships DbOptionGroup#db_security_group_memberships}.
         * @return {@code this}
         */
        public Builder dbSecurityGroupMemberships(java.util.List<java.lang.String> dbSecurityGroupMemberships) {
            this.dbSecurityGroupMemberships = dbSecurityGroupMemberships;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getOptionSettings}
         * @param optionSettings option_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#option_settings DbOptionGroup#option_settings}
         * @return {@code this}
         */
        public Builder optionSettings(com.hashicorp.cdktf.IResolvable optionSettings) {
            this.optionSettings = optionSettings;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getOptionSettings}
         * @param optionSettings option_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#option_settings DbOptionGroup#option_settings}
         * @return {@code this}
         */
        public Builder optionSettings(java.util.List<? extends imports.aws.db_option_group.DbOptionGroupOptionOptionSettings> optionSettings) {
            this.optionSettings = optionSettings;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#port DbOptionGroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#version DbOptionGroup#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link DbOptionGroupOption#getVpcSecurityGroupMemberships}
         * @param vpcSecurityGroupMemberships Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_option_group#vpc_security_group_memberships DbOptionGroup#vpc_security_group_memberships}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupMemberships(java.util.List<java.lang.String> vpcSecurityGroupMemberships) {
            this.vpcSecurityGroupMemberships = vpcSecurityGroupMemberships;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DbOptionGroupOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DbOptionGroupOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DbOptionGroupOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DbOptionGroupOption {
        private final java.lang.String optionName;
        private final java.util.List<java.lang.String> dbSecurityGroupMemberships;
        private final java.lang.Object optionSettings;
        private final java.lang.Number port;
        private final java.lang.String version;
        private final java.util.List<java.lang.String> vpcSecurityGroupMemberships;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.optionName = software.amazon.jsii.Kernel.get(this, "optionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbSecurityGroupMemberships = software.amazon.jsii.Kernel.get(this, "dbSecurityGroupMemberships", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.optionSettings = software.amazon.jsii.Kernel.get(this, "optionSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcSecurityGroupMemberships = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupMemberships", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.optionName = java.util.Objects.requireNonNull(builder.optionName, "optionName is required");
            this.dbSecurityGroupMemberships = builder.dbSecurityGroupMemberships;
            this.optionSettings = builder.optionSettings;
            this.port = builder.port;
            this.version = builder.version;
            this.vpcSecurityGroupMemberships = builder.vpcSecurityGroupMemberships;
        }

        @Override
        public final java.lang.String getOptionName() {
            return this.optionName;
        }

        @Override
        public final java.util.List<java.lang.String> getDbSecurityGroupMemberships() {
            return this.dbSecurityGroupMemberships;
        }

        @Override
        public final java.lang.Object getOptionSettings() {
            return this.optionSettings;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSecurityGroupMemberships() {
            return this.vpcSecurityGroupMemberships;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("optionName", om.valueToTree(this.getOptionName()));
            if (this.getDbSecurityGroupMemberships() != null) {
                data.set("dbSecurityGroupMemberships", om.valueToTree(this.getDbSecurityGroupMemberships()));
            }
            if (this.getOptionSettings() != null) {
                data.set("optionSettings", om.valueToTree(this.getOptionSettings()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
            }
            if (this.getVpcSecurityGroupMemberships() != null) {
                data.set("vpcSecurityGroupMemberships", om.valueToTree(this.getVpcSecurityGroupMemberships()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dbOptionGroup.DbOptionGroupOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DbOptionGroupOption.Jsii$Proxy that = (DbOptionGroupOption.Jsii$Proxy) o;

            if (!optionName.equals(that.optionName)) return false;
            if (this.dbSecurityGroupMemberships != null ? !this.dbSecurityGroupMemberships.equals(that.dbSecurityGroupMemberships) : that.dbSecurityGroupMemberships != null) return false;
            if (this.optionSettings != null ? !this.optionSettings.equals(that.optionSettings) : that.optionSettings != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
            return this.vpcSecurityGroupMemberships != null ? this.vpcSecurityGroupMemberships.equals(that.vpcSecurityGroupMemberships) : that.vpcSecurityGroupMemberships == null;
        }

        @Override
        public final int hashCode() {
            int result = this.optionName.hashCode();
            result = 31 * result + (this.dbSecurityGroupMemberships != null ? this.dbSecurityGroupMemberships.hashCode() : 0);
            result = 31 * result + (this.optionSettings != null ? this.optionSettings.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
            result = 31 * result + (this.vpcSecurityGroupMemberships != null ? this.vpcSecurityGroupMemberships.hashCode() : 0);
            return result;
        }
    }
}
