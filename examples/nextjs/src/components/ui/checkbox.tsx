"use client";
import clsx from "clsx";
import * as React from "react";
import { useControllableState } from "@/lib/use-controllable-state";

import styles from "./checkbox.module.css";

interface CheckboxFieldContextValue {
	name: string;
	value: Set<string>;
	setValue: React.Dispatch<React.SetStateAction<Set<string>>>;
	disabled: boolean;
	readOnly: boolean;
	invalid: boolean;
	required: boolean;
}

const CheckboxFieldContext = React.createContext<CheckboxFieldContextValue | null>(null);
CheckboxFieldContext.displayName = "CheckboxFieldContext";

interface CheckboxGroupProps {
	name: string;
	label: string;
	description?: string | null;
	visuallyHideLabel?: boolean;
	id?: string;
	defaultValue?: string[];
	value?: string[];
	invalid?: boolean;
	invalidText?: string | null;
	disabled?: boolean;
	readOnly?: boolean;
	onValueChange?: (value: string[]) => void;
	required?: boolean;
	"aria-describedby"?: string;
	"aria-label"?: string;
	ref?: React.Ref<HTMLFieldSetElement>;
	children: React.ReactNode;
}

function CheckboxGroup(props: CheckboxGroupProps) {
	const {
		name,
		label,
		description = null,
		invalidText = null,
		required = false,
		visuallyHideLabel = false,
		invalid = false,
		disabled = false,
		readOnly = false,
		"aria-describedby": ariaDescribedby,
		"aria-label": ariaLabel,
		children,
		ref: forwardedRef,
		onValueChange,
	} = props;

	const valueSet = React.useMemo(
		() => (props.value ? new Set(props.value) : undefined),
		[props.value],
	);

	const handleValueChange = React.useCallback(
		(action: Set<string>) => {
			if (onValueChange) {
				onValueChange?.(Array.from(action));
			}
		},
		[onValueChange],
	);

	const [value, setValue] = useControllableState(
		valueSet,
		new Set(props.defaultValue || []),
		handleValueChange,
	);

	const id = useId(props.id, ["form-field", name]);
	const invalidTextId = makeId(id, "invalid-text");
	const descriptionId = makeId(id, "description");

	const hasInvalidText = !!(invalid && invalidText);
	const hasDescription = !!description;

	return (
		<CheckboxFieldContext
			value={{
				value,
				setValue,
				name,
				disabled,
				readOnly,
				invalid,
				required,
			}}
		>
			<fieldset
				ref={forwardedRef}
				id={id}
				className={styles.group}
				aria-label={ariaLabel}
				aria-describedby={
					[ariaDescribedby, hasInvalidText && invalidTextId, hasDescription && descriptionId]
						.filter(Boolean)
						.join(" ") || undefined
				}
			>
				<legend className={visuallyHideLabel ? styles.legendHidden : styles.legend}>{label}</legend>
				<div className={styles.options}>{children}</div>
				{hasInvalidText && (
					<span className={styles.invalidText} color="red" id={invalidTextId}>
						{invalidText}
					</span>
				)}
				{hasDescription && (
					<span className={styles.description} id={descriptionId}>
						{description}
					</span>
				)}
			</fieldset>
		</CheckboxFieldContext>
	);
}

interface CheckboxProps {
	name?: string;
	value: string;
	checked?: boolean;
	id?: string;
	label: string | React.ReactElement;
	labelVariant?: "default" | "mono";
	defaultChecked?: boolean;
	ref?: React.Ref<HTMLInputElement>;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
	readOnly?: boolean;
	invalid?: boolean;
}

function Checkbox(props: CheckboxProps) {
	const context = React.use(CheckboxFieldContext);
	let {
		checked,
		defaultChecked,
		disabled,
		invalid,
		label,
		labelVariant = "default",
		onChange,
		readOnly,
		ref,
		value,
	} = props;
	const name = props.name ?? context?.name;
	const id = useId(props.id, ["form-field", name]);

	if (context) {
		disabled = props.disabled || context.disabled;
		readOnly = props.readOnly || context.readOnly;
		invalid = props.invalid || context.invalid;
		defaultChecked = undefined;
		checked = context.value.has(value);
		onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			props.onChange?.(event);
			if (event.defaultPrevented) {
				return;
			}
			const checked = event.target.checked;
			context.setValue((values) => {
				const next = new Set(values);
				if (checked) {
					next.add(value);
				} else {
					next.delete(value);
				}
				return next.size === values.size ? values : next;
			});
		};

		if (value === "user:read") {
			console.log({ value, checked });
		}
	}

	return (
		<div className={styles.checkbox}>
			<input
				type="checkbox"
				ref={ref}
				id={id}
				name={name}
				value={value}
				disabled={disabled || undefined}
				readOnly={readOnly || undefined}
				aria-invalid={invalid || undefined}
				checked={checked}
				defaultChecked={defaultChecked}
				onChange={onChange}
			/>
			{typeof label === "string" ? (
				<label
					htmlFor={id}
					className={clsx(
						styles.label,
						labelVariant === "mono" && styles.labelMono,
						disabled && styles.labelDisabled,
					)}
				>
					{label}
				</label>
			) : (
				label
			)}
		</div>
	);
}

function isValidId<T extends string | number | undefined | null>(
	id: T,
): id is T & (string | number) {
	return id != null && id !== "";
}

function makeId(...parts: (string | null | undefined)[]) {
	const DELIMITER = "--";
	return parts.filter(isValidId).join(DELIMITER);
}

function useId(
	userProvidedId: string | number | undefined | null,
	prefixes: (string | null | undefined)[],
) {
	const uuid = React.useId();
	if (isValidId(userProvidedId)) {
		return String(userProvidedId);
	}

	return makeId(...prefixes, uuid);
}

export { Checkbox, CheckboxGroup };
export type { CheckboxProps, CheckboxGroupProps };
