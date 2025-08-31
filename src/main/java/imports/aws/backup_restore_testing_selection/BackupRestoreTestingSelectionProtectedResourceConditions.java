package imports.aws.backup_restore_testing_selection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingSelection.BackupRestoreTestingSelectionProtectedResourceConditions")
@software.amazon.jsii.Jsii.Proxy(BackupRestoreTestingSelectionProtectedResourceConditions.Jsii$Proxy.class)
public interface BackupRestoreTestingSelectionProtectedResourceConditions extends software.amazon.jsii.JsiiSerializable {

    /**
     * string_equals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_equals BackupRestoreTestingSelection#string_equals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringEquals() {
        return null;
    }

    /**
     * string_not_equals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_not_equals BackupRestoreTestingSelection#string_not_equals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringNotEquals() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupRestoreTestingSelectionProtectedResourceConditions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupRestoreTestingSelectionProtectedResourceConditions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupRestoreTestingSelectionProtectedResourceConditions> {
        java.lang.Object stringEquals;
        java.lang.Object stringNotEquals;

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionProtectedResourceConditions#getStringEquals}
         * @param stringEquals string_equals block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_equals BackupRestoreTestingSelection#string_equals}
         * @return {@code this}
         */
        public Builder stringEquals(com.hashicorp.cdktf.IResolvable stringEquals) {
            this.stringEquals = stringEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionProtectedResourceConditions#getStringEquals}
         * @param stringEquals string_equals block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_equals BackupRestoreTestingSelection#string_equals}
         * @return {@code this}
         */
        public Builder stringEquals(java.util.List<? extends imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditionsStringEquals> stringEquals) {
            this.stringEquals = stringEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionProtectedResourceConditions#getStringNotEquals}
         * @param stringNotEquals string_not_equals block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_not_equals BackupRestoreTestingSelection#string_not_equals}
         * @return {@code this}
         */
        public Builder stringNotEquals(com.hashicorp.cdktf.IResolvable stringNotEquals) {
            this.stringNotEquals = stringNotEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingSelectionProtectedResourceConditions#getStringNotEquals}
         * @param stringNotEquals string_not_equals block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#string_not_equals BackupRestoreTestingSelection#string_not_equals}
         * @return {@code this}
         */
        public Builder stringNotEquals(java.util.List<? extends imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditionsStringNotEquals> stringNotEquals) {
            this.stringNotEquals = stringNotEquals;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupRestoreTestingSelectionProtectedResourceConditions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupRestoreTestingSelectionProtectedResourceConditions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupRestoreTestingSelectionProtectedResourceConditions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupRestoreTestingSelectionProtectedResourceConditions {
        private final java.lang.Object stringEquals;
        private final java.lang.Object stringNotEquals;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.stringEquals = software.amazon.jsii.Kernel.get(this, "stringEquals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringNotEquals = software.amazon.jsii.Kernel.get(this, "stringNotEquals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.stringEquals = builder.stringEquals;
            this.stringNotEquals = builder.stringNotEquals;
        }

        @Override
        public final java.lang.Object getStringEquals() {
            return this.stringEquals;
        }

        @Override
        public final java.lang.Object getStringNotEquals() {
            return this.stringNotEquals;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getStringEquals() != null) {
                data.set("stringEquals", om.valueToTree(this.getStringEquals()));
            }
            if (this.getStringNotEquals() != null) {
                data.set("stringNotEquals", om.valueToTree(this.getStringNotEquals()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupRestoreTestingSelection.BackupRestoreTestingSelectionProtectedResourceConditions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupRestoreTestingSelectionProtectedResourceConditions.Jsii$Proxy that = (BackupRestoreTestingSelectionProtectedResourceConditions.Jsii$Proxy) o;

            if (this.stringEquals != null ? !this.stringEquals.equals(that.stringEquals) : that.stringEquals != null) return false;
            return this.stringNotEquals != null ? this.stringNotEquals.equals(that.stringNotEquals) : that.stringNotEquals == null;
        }

        @Override
        public final int hashCode() {
            int result = this.stringEquals != null ? this.stringEquals.hashCode() : 0;
            result = 31 * result + (this.stringNotEquals != null ? this.stringNotEquals.hashCode() : 0);
            return result;
        }
    }
}
