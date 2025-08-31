package imports.aws.backup_selection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupSelection.BackupSelectionCondition")
@software.amazon.jsii.Jsii.Proxy(BackupSelectionCondition.Jsii$Proxy.class)
public interface BackupSelectionCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * string_equals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_equals BackupSelection#string_equals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringEquals() {
        return null;
    }

    /**
     * string_like block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_like BackupSelection#string_like}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringLike() {
        return null;
    }

    /**
     * string_not_equals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_equals BackupSelection#string_not_equals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringNotEquals() {
        return null;
    }

    /**
     * string_not_like block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_like BackupSelection#string_not_like}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringNotLike() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupSelectionCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupSelectionCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupSelectionCondition> {
        java.lang.Object stringEquals;
        java.lang.Object stringLike;
        java.lang.Object stringNotEquals;
        java.lang.Object stringNotLike;

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringEquals}
         * @param stringEquals string_equals block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_equals BackupSelection#string_equals}
         * @return {@code this}
         */
        public Builder stringEquals(com.hashicorp.cdktf.IResolvable stringEquals) {
            this.stringEquals = stringEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringEquals}
         * @param stringEquals string_equals block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_equals BackupSelection#string_equals}
         * @return {@code this}
         */
        public Builder stringEquals(java.util.List<? extends imports.aws.backup_selection.BackupSelectionConditionStringEquals> stringEquals) {
            this.stringEquals = stringEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringLike}
         * @param stringLike string_like block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_like BackupSelection#string_like}
         * @return {@code this}
         */
        public Builder stringLike(com.hashicorp.cdktf.IResolvable stringLike) {
            this.stringLike = stringLike;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringLike}
         * @param stringLike string_like block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_like BackupSelection#string_like}
         * @return {@code this}
         */
        public Builder stringLike(java.util.List<? extends imports.aws.backup_selection.BackupSelectionConditionStringLike> stringLike) {
            this.stringLike = stringLike;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringNotEquals}
         * @param stringNotEquals string_not_equals block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_equals BackupSelection#string_not_equals}
         * @return {@code this}
         */
        public Builder stringNotEquals(com.hashicorp.cdktf.IResolvable stringNotEquals) {
            this.stringNotEquals = stringNotEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringNotEquals}
         * @param stringNotEquals string_not_equals block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_equals BackupSelection#string_not_equals}
         * @return {@code this}
         */
        public Builder stringNotEquals(java.util.List<? extends imports.aws.backup_selection.BackupSelectionConditionStringNotEquals> stringNotEquals) {
            this.stringNotEquals = stringNotEquals;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringNotLike}
         * @param stringNotLike string_not_like block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_like BackupSelection#string_not_like}
         * @return {@code this}
         */
        public Builder stringNotLike(com.hashicorp.cdktf.IResolvable stringNotLike) {
            this.stringNotLike = stringNotLike;
            return this;
        }

        /**
         * Sets the value of {@link BackupSelectionCondition#getStringNotLike}
         * @param stringNotLike string_not_like block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_selection#string_not_like BackupSelection#string_not_like}
         * @return {@code this}
         */
        public Builder stringNotLike(java.util.List<? extends imports.aws.backup_selection.BackupSelectionConditionStringNotLike> stringNotLike) {
            this.stringNotLike = stringNotLike;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupSelectionCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupSelectionCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupSelectionCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupSelectionCondition {
        private final java.lang.Object stringEquals;
        private final java.lang.Object stringLike;
        private final java.lang.Object stringNotEquals;
        private final java.lang.Object stringNotLike;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.stringEquals = software.amazon.jsii.Kernel.get(this, "stringEquals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringLike = software.amazon.jsii.Kernel.get(this, "stringLike", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringNotEquals = software.amazon.jsii.Kernel.get(this, "stringNotEquals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringNotLike = software.amazon.jsii.Kernel.get(this, "stringNotLike", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.stringEquals = builder.stringEquals;
            this.stringLike = builder.stringLike;
            this.stringNotEquals = builder.stringNotEquals;
            this.stringNotLike = builder.stringNotLike;
        }

        @Override
        public final java.lang.Object getStringEquals() {
            return this.stringEquals;
        }

        @Override
        public final java.lang.Object getStringLike() {
            return this.stringLike;
        }

        @Override
        public final java.lang.Object getStringNotEquals() {
            return this.stringNotEquals;
        }

        @Override
        public final java.lang.Object getStringNotLike() {
            return this.stringNotLike;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getStringEquals() != null) {
                data.set("stringEquals", om.valueToTree(this.getStringEquals()));
            }
            if (this.getStringLike() != null) {
                data.set("stringLike", om.valueToTree(this.getStringLike()));
            }
            if (this.getStringNotEquals() != null) {
                data.set("stringNotEquals", om.valueToTree(this.getStringNotEquals()));
            }
            if (this.getStringNotLike() != null) {
                data.set("stringNotLike", om.valueToTree(this.getStringNotLike()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupSelection.BackupSelectionCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupSelectionCondition.Jsii$Proxy that = (BackupSelectionCondition.Jsii$Proxy) o;

            if (this.stringEquals != null ? !this.stringEquals.equals(that.stringEquals) : that.stringEquals != null) return false;
            if (this.stringLike != null ? !this.stringLike.equals(that.stringLike) : that.stringLike != null) return false;
            if (this.stringNotEquals != null ? !this.stringNotEquals.equals(that.stringNotEquals) : that.stringNotEquals != null) return false;
            return this.stringNotLike != null ? this.stringNotLike.equals(that.stringNotLike) : that.stringNotLike == null;
        }

        @Override
        public final int hashCode() {
            int result = this.stringEquals != null ? this.stringEquals.hashCode() : 0;
            result = 31 * result + (this.stringLike != null ? this.stringLike.hashCode() : 0);
            result = 31 * result + (this.stringNotEquals != null ? this.stringNotEquals.hashCode() : 0);
            result = 31 * result + (this.stringNotLike != null ? this.stringNotLike.hashCode() : 0);
            return result;
        }
    }
}
