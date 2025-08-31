package imports.aws.backup_framework;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupFramework.BackupFrameworkControl")
@software.amazon.jsii.Jsii.Proxy(BackupFrameworkControl.Jsii$Proxy.class)
public interface BackupFrameworkControl extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#name BackupFramework#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * input_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#input_parameter BackupFramework#input_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputParameter() {
        return null;
    }

    /**
     * scope block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#scope BackupFramework#scope}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.backup_framework.BackupFrameworkControlScope getScope() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupFrameworkControl}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupFrameworkControl}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupFrameworkControl> {
        java.lang.String name;
        java.lang.Object inputParameter;
        imports.aws.backup_framework.BackupFrameworkControlScope scope;

        /**
         * Sets the value of {@link BackupFrameworkControl#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#name BackupFramework#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BackupFrameworkControl#getInputParameter}
         * @param inputParameter input_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#input_parameter BackupFramework#input_parameter}
         * @return {@code this}
         */
        public Builder inputParameter(com.hashicorp.cdktf.IResolvable inputParameter) {
            this.inputParameter = inputParameter;
            return this;
        }

        /**
         * Sets the value of {@link BackupFrameworkControl#getInputParameter}
         * @param inputParameter input_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#input_parameter BackupFramework#input_parameter}
         * @return {@code this}
         */
        public Builder inputParameter(java.util.List<? extends imports.aws.backup_framework.BackupFrameworkControlInputParameter> inputParameter) {
            this.inputParameter = inputParameter;
            return this;
        }

        /**
         * Sets the value of {@link BackupFrameworkControl#getScope}
         * @param scope scope block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#scope BackupFramework#scope}
         * @return {@code this}
         */
        public Builder scope(imports.aws.backup_framework.BackupFrameworkControlScope scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupFrameworkControl}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupFrameworkControl build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupFrameworkControl}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupFrameworkControl {
        private final java.lang.String name;
        private final java.lang.Object inputParameter;
        private final imports.aws.backup_framework.BackupFrameworkControlScope scope;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputParameter = software.amazon.jsii.Kernel.get(this, "inputParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(imports.aws.backup_framework.BackupFrameworkControlScope.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.inputParameter = builder.inputParameter;
            this.scope = builder.scope;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getInputParameter() {
            return this.inputParameter;
        }

        @Override
        public final imports.aws.backup_framework.BackupFrameworkControlScope getScope() {
            return this.scope;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getInputParameter() != null) {
                data.set("inputParameter", om.valueToTree(this.getInputParameter()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupFramework.BackupFrameworkControl"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupFrameworkControl.Jsii$Proxy that = (BackupFrameworkControl.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.inputParameter != null ? !this.inputParameter.equals(that.inputParameter) : that.inputParameter != null) return false;
            return this.scope != null ? this.scope.equals(that.scope) : that.scope == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.inputParameter != null ? this.inputParameter.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            return result;
        }
    }
}
